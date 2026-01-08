"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

const SERVICE_OPTIONS = [
  "Cleaning & Household Tasks",
  "Social & Community Participation",
  "Assistance with Appointments & Shopping",
  "Transport",
  "Family Visits",
];

export default function Contact() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const [nameValue, setNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [addressValue, setAddressValue] = useState("");
  const [messageValue, setMessageValue] = useState("");

  // spam honeypots (hidden fields). Humans leave them empty.
  const [websiteValue, setWebsiteValue] = useState("");
  const [companyValue, setCompanyValue] = useState("");

  const statusRef = useRef(null);

  const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileEnabled = Boolean(SITE_KEY);

  // Turnstile widget management
  const turnstileContainerRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);
  const [turnstileScriptLoaded, setTurnstileScriptLoaded] = useState(false);

  // Auto-scroll to success/error message (nice on mobile)
  useEffect(() => {
    if (status === "success" || status === "error") {
      statusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [status]);

  // Auto-clear success state after ~7 seconds
  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => setStatus("idle"), 7000);
    return () => clearTimeout(t);
  }, [status]);

  function resetTurnstile() {
    // Clear token state immediately
    setToken("");

    // If Turnstile is enabled, reset widget so a NEW token can be generated
    try {
      if (
        turnstileEnabled &&
        window.turnstile &&
        typeof window.turnstile.reset === "function" &&
        turnstileWidgetIdRef.current !== null
      ) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
      }
    } catch {
      // ignore
    }
  }

  function resetFormUI(formEl) {
    formEl.reset();
    setNameValue("");
    setEmailValue("");
    setAddressValue("");
    setMessageValue("");
    setWebsiteValue("");
    setCompanyValue("");
    resetTurnstile();
  }

  // Render Turnstile explicitly so we can reset it reliably
  useEffect(() => {
    if (!turnstileEnabled) return;
    if (!turnstileScriptLoaded) return;
    if (!turnstileContainerRef.current) return;
    if (!window.turnstile || typeof window.turnstile.render !== "function") return;

    // Prevent double-render
    if (turnstileWidgetIdRef.current !== null) return;

    // Clear anything inside container before rendering
    turnstileContainerRef.current.innerHTML = "";

    const widgetId = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: SITE_KEY,
      callback: (t) => setToken(t || ""),
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
      theme: "light",
    });

    turnstileWidgetIdRef.current = widgetId;

    return () => {
      // Cleanup if component unmounts
      try {
        if (window.turnstile && typeof window.turnstile.remove === "function") {
          window.turnstile.remove(widgetId);
        }
      } catch {
        // ignore
      }
      turnstileWidgetIdRef.current = null;
    };
  }, [turnstileEnabled, turnstileScriptLoaded, SITE_KEY]);

  async function onSubmit(e) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setErrorMsg("");

    const form = new FormData(formEl);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const service = String(form.get("service") || "").trim();
    const address = String(form.get("address") || "").trim();
    const message = String(form.get("message") || "").trim();

    const website = String(form.get("website") || "").trim(); // honeypot
    const company = String(form.get("company") || "").trim(); // honeypot

    // ✅ If a bot fills hidden fields, pretend success and do nothing
    if (website || company) {
      setStatus("success");
      resetFormUI(formEl);
      return;
    }

    if (!name || !email || !service || !address || !message) {
      setErrorMsg("Please fill out name, email, service, address, and message.");
      setStatus("error");
      return;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    // Prefer state token; fallback to hidden input if Turnstile uses it
    const tokenFromHiddenInput =
      document.querySelector('[name="cf-turnstile-response"]')?.value || "";

    const effectiveToken = token || tokenFromHiddenInput;

    if (turnstileEnabled && !effectiveToken) {
      setErrorMsg("Please complete the CAPTCHA.");
      setStatus("error");
      return;
    }

    try {
      setStatus("sending");

      const payload = turnstileEnabled
        ? {
            name,
            email,
            service,
            address,
            message,
            website,
            company,
            turnstileToken: effectiveToken,
          }
        : { name, email, service, address, message, website, company };

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");

      // ✅ Success UI
      setStatus("success");
      resetFormUI(formEl);

      // ✅ Step 3E-4: Track a “lead” event in Google Analytics (if GA is installed)
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", "generate_lead", {
          event_category: "contact",
          event_label: "contact_form",
        });
      }
    } catch (err) {
      // ✅ IMPORTANT: reset turnstile FIRST so the next attempt generates a fresh token
      resetTurnstile();

      setStatus("error");
      setErrorMsg(err?.message || "Could not send message.");
    }
  }

  return (
    <section className="section">
      <h1>Contact us</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 12,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 14,
            background: "var(--card)",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700, marginBottom: 6 }}>
            Phone
          </div>
          <a href="tel:0478762814" style={{ fontWeight: 800, textDecoration: "none" }}>
            0478 762 814
          </a>
        </div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 14,
            background: "var(--card)",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700, marginBottom: 6 }}>
            Email
          </div>
          <a
            href="mailto:ExecutiveProCleaning9@gmail.com"
            style={{ fontWeight: 800, textDecoration: "none" }}
          >
            ExecutiveProCleaning9@gmail.com
          </a>
        </div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 14,
            background: "var(--card)",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700, marginBottom: 6 }}>
            Hours
          </div>
          <div style={{ fontWeight: 800 }}>Monday to Friday, 8am–5pm</div>
          <div style={{ color: "var(--muted)", marginTop: 4 }}>(no overnight services)</div>
        </div>
      </div>

      <div className="card">
        <div className="cardInner">
          {turnstileEnabled && (
            <Script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
              strategy="afterInteractive"
              onLoad={() => setTurnstileScriptLoaded(true)}
            />
          )}

          <form onSubmit={onSubmit}>
            <label>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <strong>Name *</strong>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{nameValue.length}/50</span>
              </div>

              <input
                name="name"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                maxLength={50}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  marginTop: 6,
                }}
              />
            </label>

            <div style={{ height: 14 }} />

            <label>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <strong>Email *</strong>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{emailValue.length}/100</span>
              </div>

              <input
                name="email"
                type="email"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                maxLength={100}
                placeholder="name@example.com"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  marginTop: 6,
                }}
              />
            </label>

            <div style={{ height: 14 }} />

            <label>
              <strong>Service *</strong>
              <br />
              <select
                name="service"
                defaultValue=""
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  marginTop: 6,
                }}
              >
                <option value="" disabled>
                  Select a service
                </option>
                {SERVICE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ height: 14 }} />

            <label>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <strong>Address *</strong>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{addressValue.length}/100</span>
              </div>

              <input
                name="address"
                placeholder="Suburb + street (or as much as you’re comfortable sharing)"
                value={addressValue}
                onChange={(e) => setAddressValue(e.target.value)}
                maxLength={100}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  marginTop: 6,
                }}
              />
            </label>

            <div style={{ height: 14 }} />

            <label>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <strong>Message *</strong>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{messageValue.length}/500</span>
              </div>

              <textarea
                name="message"
                value={messageValue}
                onChange={(e) => setMessageValue(e.target.value)}
                maxLength={500}
                rows={5}
                placeholder="Tell us what you need, preferred day/time, and anything important (pets, access, etc.)"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  marginTop: 6,
                  resize: "vertical",
                }}
              />
            </label>

            {/* Honeypot fields (hidden from humans) */}
            <div
              style={{
                position: "absolute",
                left: "-9999px",
                top: "auto",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
              aria-hidden="true"
            >
              <label>
                Website
                <input
                  name="website"
                  type="text"
                  value={websiteValue}
                  onChange={(e) => setWebsiteValue(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>

              <label>
                Company
                <input
                  name="company"
                  type="text"
                  value={companyValue}
                  onChange={(e) => setCompanyValue(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </div>

            <div style={{ height: 16 }} />

            {turnstileEnabled ? (
              <div ref={turnstileContainerRef} />
            ) : (
              <p style={{ color: "var(--muted)", marginTop: 0 }}>
                CAPTCHA not set up yet (testing mode).
              </p>
            )}

            <div style={{ height: 14 }} />

            <div ref={statusRef}>
              {errorMsg && <p style={{ color: "crimson", marginTop: 0 }}>{errorMsg}</p>}
              {status === "success" && (
                <p style={{ color: "green", marginTop: 0 }}>
                  Thanks — we’ve received your request. We’ll respond during business hours.
                </p>
              )}
            </div>

            <button
              className={`btn btnPrimary ${status === "sending" ? "isLoading" : ""}`}
              type="submit"
              disabled={status === "sending"}
              aria-busy={status === "sending"}
            >
              {status === "sending" ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Sending...
                </>
              ) : (
                "Send"
              )}
            </button>
          </form>

          <p style={{ marginTop: 12, color: "var(--muted)" }}>
            We collect name, email, service, address, and message to respond to your enquiry. Additional
            details can be provided after initial contact.
          </p>
        </div>
      </div>
    </section>
  );
}