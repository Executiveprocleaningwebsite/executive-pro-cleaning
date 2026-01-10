import nodemailer from "nodemailer";

const memoryStore = globalThis.__QUOTE_RL__ || new Map();
globalThis.__QUOTE_RL__ = memoryStore;

// Upload limits (match your UI)
const MAX_FILES = 3;
const MAX_MB_EACH = 5;
const MAX_BYTES_EACH = MAX_MB_EACH * 1024 * 1024;

// ✅ New: total upload cap across all photos (combined)
const MAX_TOTAL_MB = 12;
const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;

// ✅ New: magic-bytes detection (don’t trust file.type)
function detectImageType(buf) {
  // JPEG: FF D8 FF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "image/png";

  // GIF: "GIF87a" or "GIF89a"
  if (buf.length >= 6) {
    const h = buf.subarray(0, 6).toString("ascii");
    if (h === "GIF87a" || h === "GIF89a") return "image/gif";
  }

  // WebP: "RIFF....WEBP"
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "image/webp";

  return null;
}

function getIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip.trim();
  return "unknown";
}

function rateLimit(ip, windowMs = 10 * 60 * 1000, max = 6) {
  const now = Date.now();
  const key = `${ip}`;
  const entry = memoryStore.get(key) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  memoryStore.set(key, entry);
  return entry.count <= max;
}

function safeStr(v, max) {
  if (v == null) return "";
  return String(v).replace(/\s+/g, " ").trim().slice(0, max);
}

function safeFilename(name) {
  const raw = safeStr(name, 120) || "photo";
  // keep letters, numbers, dot, dash, underscore
  const cleaned = raw.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned || "photo";
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new Error("TURNSTILE_SECRET_KEY not set");

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip && ip !== "unknown") formData.append("remoteip", ip);

  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  const data = await r.json();
  return !!data.success;
}

function parseNonce(serverNonce) {
  const raw = safeStr(serverNonce, 80);
  const [tsStr] = raw.split("_");
  const ts = Number(tsStr);
  return Number.isFinite(ts) ? ts : 0;
}

function isFile(v) {
  return v && typeof v === "object" && typeof v.arrayBuffer === "function" && typeof v.type === "string";
}

export async function POST(req) {
  const ip = getIp(req);

  try {
    if (!rateLimit(ip)) {
      return Response.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
    }

    // ✅ FormData (supports files)
    const fd = await req.formData();

    // honeypot
    const website = safeStr(fd.get("website"), 80);
    if (website) {
      // pretend success to waste bot time
      return Response.json({ ok: true }, { status: 200 });
    }

    const serverNonce = safeStr(fd.get("serverNonce"), 80);
    const nonceTs = parseNonce(serverNonce);
    const ageMs = Date.now() - nonceTs;
    if (!nonceTs || ageMs < 0 || ageMs > 30 * 60 * 1000) {
      return Response.json({ error: "Invalid request. Please refresh and try again." }, { status: 400 });
    }

    const turnstileToken = safeStr(fd.get("turnstileToken"), 2048);
    if (!turnstileToken) {
      return Response.json({ error: "Verification required. Please try again." }, { status: 400 });
    }

    const ok = await verifyTurnstile(turnstileToken, ip);
    if (!ok) {
      return Response.json({ error: "Verification failed. Please try again." }, { status: 400 });
    }

    // Fields
    const name = safeStr(fd.get("name"), 60);
    const email = safeStr(fd.get("email"), 120);
    const phone = safeStr(fd.get("phone"), 30);
    const suburb = safeStr(fd.get("suburb"), 60);
    const service = safeStr(fd.get("service"), 60);
    const property = safeStr(fd.get("property"), 60);
    const frequency = safeStr(fd.get("frequency"), 40);
    const preferredTime = safeStr(fd.get("preferredTime"), 80);
    const details = safeStr(fd.get("details"), 800);

    if (name.length < 2) return Response.json({ error: "Name is required." }, { status: 400 });
    if (!email.includes("@") || email.length < 6)
      return Response.json({ error: "Valid email is required." }, { status: 400 });
    if (details.length < 10)
      return Response.json({ error: "Please include more details (at least 10 characters)." }, { status: 400 });

    // ✅ Photos (optional)
    const rawPhotos = fd.getAll("photos") || [];
    const photoFiles = rawPhotos.filter(isFile).slice(0, MAX_FILES);

    // validate + convert to attachments
    const attachments = [];
    let totalBytes = 0;

    for (const file of photoFiles) {
      const type = safeStr(file.type, 80);
      const size = Number(file.size || 0);

      // Basic checks
      if (!type.startsWith("image/")) {
        return Response.json({ error: "Only image uploads are allowed." }, { status: 400 });
      }

      // ✅ Block SVG specifically (can contain scripts)
      if (type === "image/svg+xml") {
        return Response.json({ error: "SVG uploads are not allowed." }, { status: 400 });
      }

      if (size <= 0) continue;

      // Per-file limit
      if (size > MAX_BYTES_EACH) {
        return Response.json({ error: `Each photo must be under ${MAX_MB_EACH}MB.` }, { status: 400 });
      }

      // ✅ Total size limit (all files combined)
      totalBytes += size;
      if (totalBytes > MAX_TOTAL_BYTES) {
        return Response.json({ error: `Total photos must be under ${MAX_TOTAL_MB}MB.` }, { status: 400 });
      }

      const ab = await file.arrayBuffer();
      const buf = Buffer.from(ab);

      // ✅ Magic-bytes validation (real image type)
      const detected = detectImageType(buf);
      if (!detected) {
        return Response.json(
          { error: "Unsupported image format. Use JPG, PNG, WebP, or GIF." },
          { status: 400 }
        );
      }

      // Ensure filename extension matches detected type (optional but recommended)
      const ext =
        detected === "image/jpeg"
          ? "jpg"
          : detected === "image/png"
          ? "png"
          : detected === "image/webp"
          ? "webp"
          : detected === "image/gif"
          ? "gif"
          : "img";

      let safeName = safeFilename(file.name);
      if (!safeName.toLowerCase().endsWith(`.${ext}`)) safeName = `${safeName}.${ext}`;

      attachments.push({
        filename: safeName,
        content: buf,
        // ✅ Use detected type (don’t trust file.type)
        contentType: detected,
      });
    }

    // Email config
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const to = process.env.QUOTE_TO || process.env.CONTACT_TO;
    const from = process.env.CONTACT_FROM || process.env.SMTP_USER;

    if (!host || !user || !pass || !to || !from) {
      return Response.json({ error: "Email is not configured yet (missing SMTP env vars)." }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const subject = `New quote request — ${service || "Quote"} — ${name}`;

    const text = [
      "New quote request received:",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "-"}`,
      `Suburb/Area: ${suburb || "-"}`,
      "",
      `Service: ${service || "-"}`,
      `Property: ${property || "-"}`,
      `Frequency: ${frequency || "-"}`,
      `Preferred time: ${preferredTime || "-"}`,
      "",
      `Photos attached: ${attachments.length ? attachments.map((a) => a.filename).join(", ") : "-"}`,
      "",
      "Details:",
      details || "-",
      "",
      `IP: ${ip}`,
    ].join("\n");

    await transporter.sendMail({
      from,
      to,
      replyTo: email,
      subject,
      text,
      attachments: attachments.length ? attachments : undefined,
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (err) {
    // ✅ Log server-side, but don’t leak internals to the browser
    console.error("QUOTE API ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}