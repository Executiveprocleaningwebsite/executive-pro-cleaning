export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import nodemailer from "nodemailer";
import crypto from "crypto";

// --------------------
// Hard caps
// --------------------
const MAX_BODY_BYTES = 30 * 1024; // 30KB max JSON payload

// --------------------
// Rate limiting (best-effort on serverless)
// --------------------
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5; // 5 requests per IP per window

// Persist maps best-effort across hot reloads / reused runtimes
const rateMap = globalThis.__CONTACT_RL__ || new Map(); // ip -> { count, resetAt }
globalThis.__CONTACT_RL__ = rateMap;

// Per-email protection (stops “same email, different IP” spam)
const EMAIL_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const EMAIL_MAX_PER_WINDOW = 3; // max 3 per email per window
const EMAIL_COOLDOWN_MS = 60 * 1000; // min 60s between submissions per email

const emailMap = globalThis.__CONTACT_EMAIL_RL__ || new Map(); // email -> { count, resetAt, lastAt }
globalThis.__CONTACT_EMAIL_RL__ = emailMap;

// Must match the Contact page options (prevents random/bot values)
const ALLOWED_SERVICES = new Set([
  "Cleaning & Household Tasks",
  "Social & Community Participation",
  "Assistance with Appointments & Shopping",
  "Transport",
  "Family Visits",
]);

function getClientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  const xri = req.headers.get("x-real-ip");

  const ipFromXff = xff ? xff.split(",")[0].trim() : "";
  const ip = ipFromXff || (xri ? String(xri).trim() : "");

  return ip || "local";
}

function isTruthy(v) {
  return String(v || "").trim().length > 0;
}

function sanitizeText(v) {
  return String(v || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// Safe logging (no secrets, no full message content)
function hashForLogs(value) {
  // Optional salt (recommended): set LOG_SALT in Vercel env vars
  const salt = process.env.LOG_SALT || "";
  return crypto.createHash("sha256").update(`${salt}:${String(value || "")}`).digest("hex").slice(0, 16);
}

function safeLog(event, meta = {}) {
  const payload = {
    event,
    time: new Date().toISOString(),
    ...meta,
  };
  console.log(JSON.stringify(payload));
}

function rateLimitOrThrow(ip) {
  const now = Date.now();
  const existing = rateMap.get(ip);

  if (!existing || now > existing.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  existing.count += 1;
  rateMap.set(ip, existing);

  if (existing.count > RATE_LIMIT_MAX) {
    const waitMs = existing.resetAt - now;
    const waitMin = Math.ceil(waitMs / 60000);
    const err = new Error(`Too many requests. Please try again in ~${waitMin} minute(s).`);
    err.status = 429;
    throw err;
  }
}

// Email-based limiter: cooldown + window cap
function emailLimitOrThrow(email) {
  const now = Date.now();
  const key = normalizeEmail(email);
  if (!key) return;

  const existing = emailMap.get(key);

  // cooldown check
  if (existing?.lastAt && now - existing.lastAt < EMAIL_COOLDOWN_MS) {
    const waitSec = Math.ceil((EMAIL_COOLDOWN_MS - (now - existing.lastAt)) / 1000);
    const err = new Error(`Please wait ~${waitSec}s before sending another message.`);
    err.status = 429;
    throw err;
  }

  // window reset
  if (!existing || now > existing.resetAt) {
    emailMap.set(key, { count: 1, resetAt: now + EMAIL_WINDOW_MS, lastAt: now });
    return;
  }

  existing.count += 1;
  existing.lastAt = now;
  emailMap.set(key, existing);

  if (existing.count > EMAIL_MAX_PER_WINDOW) {
    const waitMin = Math.ceil((existing.resetAt - now) / 60000);
    const err = new Error(`This email has sent too many requests. Try again in ~${waitMin} minute(s).`);
    err.status = 429;
    throw err;
  }
} // ✅ <-- THIS was the missing brace in your file

/**
 * Same-origin protection:
 * - If Origin header exists, require it matches Host.
 * - Optionally allow extra origins via ALLOWED_ORIGINS env (comma-separated).
 */
function enforceSameOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return;

  const host = req.headers.get("host");
  if (!host) return;

  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    const err = new Error("Invalid origin.");
    err.status = 403;
    throw err;
  }

  if (originHost === host) return;

  const extrasRaw = process.env.ALLOWED_ORIGINS || "";
  const extras = extrasRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (extras.includes(origin)) return;

  const err = new Error("Forbidden.");
  err.status = 403;
  throw err;
}

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(req) {
  const ip = getClientIp(req);

  try {
    enforceSameOrigin(req);

    // Body size cap (cheap protection vs huge spam payloads)
    const cl = Number(req.headers.get("content-length") || "0");
    if (cl && cl > MAX_BODY_BYTES) {
      return Response.json({ error: "Payload too large." }, { status: 413, headers: NO_STORE });
    }

    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("application/json")) {
      return Response.json({ error: "Unsupported content type." }, { status: 415, headers: NO_STORE });
    }

    rateLimitOrThrow(ip);

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid request." }, { status: 400, headers: NO_STORE });
    }

    const name = sanitizeText(body?.name);
    const email = sanitizeText(body?.email);
    const service = sanitizeText(body?.service);
    const address = sanitizeText(body?.address);
    const message = sanitizeText(body?.message);

    // honeypots
    const website = sanitizeText(body?.website);
    const company = sanitizeText(body?.company);

    const turnstileToken = sanitizeText(body?.turnstileToken);

    // Honeypot triggered => silently pretend success
    if (website || company) {
      safeLog("contact_honeypot", { ip, host: req.headers.get("host") || "" });
      return Response.json({ ok: true }, { status: 200, headers: NO_STORE });
    }

    if (!name || !email || !service || !address || !message) {
      return Response.json(
        { error: "Please fill out name, email, service, address, and message." },
        { status: 400, headers: NO_STORE }
      );
    }

    if (name.length > 50) {
      return Response.json({ error: "Name is too long (max 50 characters)." }, { status: 400, headers: NO_STORE });
    }
    if (email.length > 100) {
      return Response.json({ error: "Email is too long (max 100 characters)." }, { status: 400, headers: NO_STORE });
    }
    if (address.length > 100) {
      return Response.json({ error: "Address is too long (max 100 characters)." }, { status: 400, headers: NO_STORE });
    }
    if (message.length > 500) {
      return Response.json({ error: "Message is too long (max 500 characters)." }, { status: 400, headers: NO_STORE });
    }

    if (!ALLOWED_SERVICES.has(service)) {
      return Response.json({ error: "Service value is invalid." }, { status: 400, headers: NO_STORE });
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return Response.json({ error: "Please enter a valid email address." }, { status: 400, headers: NO_STORE });
    }

    // Email cooldown/window cap
    emailLimitOrThrow(email);

    // Turnstile (only enforce if secret exists)
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (isTruthy(secret)) {
      if (!turnstileToken) {
        return Response.json({ error: "Please complete the CAPTCHA." }, { status: 400, headers: NO_STORE });
      }

      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: turnstileToken,
          remoteip: ip === "local" ? "" : ip,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData?.success) {
        safeLog("contact_turnstile_fail", { ip, emailHash: hashForLogs(email) });
        return Response.json({ error: "CAPTCHA failed. Please try again." }, { status: 400, headers: NO_STORE });
      }
    }

    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, CONTACT_TO, CONTACT_FROM } = process.env;

    // Safe metadata for logs
    const safeMeta = {
      ip,
      host: req.headers.get("host") || "",
      emailHash: hashForLogs(email),
      service,
      msgLen: message.length,
    };

    // If SMTP isn't configured yet, log and return OK
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !CONTACT_TO) {
      safeLog("contact_received_no_smtp", safeMeta);

      return Response.json(
        { ok: true, devNote: "Email not configured yet. Enquiry logged on server." },
        { status: 200, headers: NO_STORE }
      );
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(SMTP_SECURE).toLowerCase() === "true",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    // More collision-proof enquiry ID: timestamp + random
    const ts = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    const rand = crypto.randomBytes(3).toString("hex");
    const enquiryId = `${ts}-${rand}`;

    const subject = `New website enquiry [${enquiryId}]: ${service}`;

    const text = [
      "New enquiry received from the website:",
      "",
      `Enquiry ID: ${enquiryId}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Service: ${service}`,
      `Address: ${address}`,
      "",
      "Message:",
      message,
      "",
      "— Sent from Executive Pro Cleaning website contact form",
    ].join("\n");

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.4;">
        <h2 style="margin: 0 0 10px;">New website enquiry</h2>
        <p style="margin: 0 0 12px;"><strong>Enquiry ID:</strong> ${escapeHtml(enquiryId)}</p>

        <table style="border-collapse: collapse; width: 100%; max-width: 700px;">
          <tr>
            <td style="padding: 6px 0; width: 120px;"><strong>Name</strong></td>
            <td style="padding: 6px 0;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Email</strong></td>
            <td style="padding: 6px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Service</strong></td>
            <td style="padding: 6px 0;">${escapeHtml(service)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Address</strong></td>
            <td style="padding: 6px 0;">${escapeHtml(address)}</td>
          </tr>
        </table>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 14px 0;" />

        <p style="margin: 0 0 6px;"><strong>Message</strong></p>
        <div style="white-space: pre-wrap; background: #f7f7f7; padding: 10px; border-radius: 8px;">
          ${escapeHtml(message)}
        </div>

        <p style="margin: 14px 0 0; color: #666; font-size: 12px;">
          Sent from Executive Pro Cleaning website contact form.
        </p>
      </div>
    `;

    const fromValue = CONTACT_FROM || `"Executive Pro Cleaning Website" <${SMTP_USER}>`;

    await transporter.sendMail({
      from: fromValue,
      to: CONTACT_TO,
      subject,
      text,
      html,
      replyTo: email,
      headers: { "X-Enquiry-ID": enquiryId },
    });

    safeLog("contact_sent", { ...safeMeta, enquiryId });

    return Response.json({ ok: true }, { status: 200, headers: NO_STORE });
  } catch (err) {
    const status = err?.status || 500;

    safeLog("contact_error", {
      ip,
      host: req.headers.get("host") || "",
      status,
      code: err?.code || "",
      message: status === 500 ? "server_error" : String(err?.message || "request_failed").slice(0, 120),
    });

    if (status === 500) {
      console.error("Contact API error:", err);
      return Response.json({ error: "Server error." }, { status: 500, headers: NO_STORE });
    }

    return Response.json({ error: err?.message || "Request failed." }, { status, headers: NO_STORE });
  }
}