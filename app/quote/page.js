"use client";

import { useEffect, useMemo, useState } from "react";

const SERVICE_OPTIONS = [
  "Home cleaning",
  "Deep / spring clean",
  "End of lease cleaning",
  "NDIS / day-to-day support",
  "Shopping / errands",
  "Appointments / transport",
  "Other",
];

const PROPERTY_OPTIONS = ["Studio / 1 bedroom", "2 bedroom", "3 bedroom", "4+ bedroom", "Other / not sure"];

const FREQ_OPTIONS = ["Once-off", "Weekly", "Fortnightly", "Monthly", "Other"];

function clampStr(v, max) {
  if (!v) return "";
  return String(v).slice(0, max);
}

export default function QuotePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [suburb, setSuburb] = useState("");
  const [service, setService] = useState(SERVICE_OPTIONS[0]);
  const [property, setProperty] = useState(PROPERTY_OPTIONS[0]);
  const [frequency, setFrequency] = useState(FREQ_OPTIONS[0]);
  const [preferredTime, setPreferredTime] = useState("");
  const [details, setDetails] = useState("");

  // honeypot (bots fill it)
  const [website, setWebsite] = useState("");

  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);

  const [serverNonce, setServerNonce] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const maxDetails = 800;

  const isValid = useMemo(() => {
    const n = name.trim();
    const e = email.trim();
    return n.length >= 2 && e.includes("@") && e.length <= 120 && details.trim().length >= 10 && !!turnstileToken;
  }, [name, email, details, turnstileToken]);

  useEffect(() => {
    // nonce to help basic replay protection (server also checks age)
    const rand = Math.random().toString(36).slice(2);
    setServerNonce(`${Date.now()}_${rand}`);
  }, []);

  useEffect(() => {
    // Load Turnstile script (same style as your contact page)
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      // Still allow page to render; API will reject without token
      return;
    }

    const existing = document.querySelector('script[data-turnstile="true"]');
    if (existing) return;

    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.dataset.turnstile = "true";
    s.onload = () => setTurnstileReady(true);
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (!turnstileReady) return;

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return;

    const el = document.getElementById("turnstile-quote");
    if (!el) return;

    // Avoid double render
    if (el.dataset.rendered === "true") return;

    if (window.turnstile && typeof window.turnstile.render === "function") {
      window.turnstile.render(el, {
        sitekey: siteKey,
        theme: "light",
        callback: (token) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
      });
      el.dataset.rendered = "true";
    }
  }, [turnstileReady]);

  async function onSubmit(e) {
    e.preventDefault();
    setOkMsg("");
    setErrMsg("");

    if (!isValid) {
      setErrMsg("Please fill out all required fields and complete the verification.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clampStr(name, 60),
          email: clampStr(email, 120),
          phone: clampStr(phone, 30),
          suburb: clampStr(suburb, 60),
          service: clampStr(service, 60),
          property: clampStr(property, 60),
          frequency: clampStr(frequency, 40),
          preferredTime: clampStr(preferredTime, 80),
          details: clampStr(details, maxDetails),
          website: clampStr(website, 80),
          turnstileToken,
          serverNonce,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }

      setOkMsg("Thanks! Your quote request has been sent. We’ll get back to you shortly.");
      setName("");
      setEmail("");
      setPhone("");
      setSuburb("");
      setService(SERVICE_OPTIONS[0]);
      setProperty(PROPERTY_OPTIONS[0]);
      setFrequency(FREQ_OPTIONS[0]);
      setPreferredTime("");
      setDetails("");
      setTurnstileToken("");
      // refresh nonce
      const rand = Math.random().toString(36).slice(2);
      setServerNonce(`${Date.now()}_${rand}`);
    } catch (err) {
      setErrMsg(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section">
      <h1>Get a quote</h1>
      <p className="lead" style={{ maxWidth: 860 }}>
        Tell us what you need and we’ll send a quote. If you’re unsure, just explain the situation in the details box.
      </p>

      <form className="contactForm" onSubmit={onSubmit} noValidate>
        {/* Honeypot */}
        <div style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
          <label>
            Website
            <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div className="field">
          <div className="labelRow">
            <label htmlFor="q-name">Full name *</label>
            <span className="counter">{name.length}/60</span>
          </div>
          <input
            id="q-name"
            className="input"
            value={name}
            onChange={(e) => setName(clampStr(e.target.value, 60))}
            placeholder="Your name"
            required
          />
        </div>

        <div className="field">
          <div className="labelRow">
            <label htmlFor="q-email">Email *</label>
            <span className="counter">{email.length}/120</span>
          </div>
          <input
            id="q-email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(clampStr(e.target.value, 120))}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="field">
          <div className="labelRow">
            <label htmlFor="q-phone">Phone (optional)</label>
            <span className="counter">{phone.length}/30</span>
          </div>
          <input
            id="q-phone"
            className="input"
            value={phone}
            onChange={(e) => setPhone(clampStr(e.target.value, 30))}
            placeholder="04xx xxx xxx"
          />
        </div>

        <div className="field">
          <div className="labelRow">
            <label htmlFor="q-suburb">Suburb / area (optional)</label>
            <span className="counter">{suburb.length}/60</span>
          </div>
          <input
            id="q-suburb"
            className="input"
            value={suburb}
            onChange={(e) => setSuburb(clampStr(e.target.value, 60))}
            placeholder="e.g. Gungahlin, Queanbeyan, Tuggeranong"
          />
        </div>

        <div className="field">
          <label htmlFor="q-service" style={{ fontWeight: 700 }}>
            Service type *
          </label>
          <select id="q-service" className="input" value={service} onChange={(e) => setService(e.target.value)}>
            {SERVICE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="grid2" style={{ margin: 0 }}>
          <div className="field">
            <label htmlFor="q-property" style={{ fontWeight: 700 }}>
              Property size
            </label>
            <select id="q-property" className="input" value={property} onChange={(e) => setProperty(e.target.value)}>
              {PROPERTY_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="q-frequency" style={{ fontWeight: 700 }}>
              Frequency
            </label>
            <select id="q-frequency" className="input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              {FREQ_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <div className="labelRow">
            <label htmlFor="q-preferred">Preferred day/time (optional)</label>
            <span className="counter">{preferredTime.length}/80</span>
          </div>
          <input
            id="q-preferred"
            className="input"
            value={preferredTime}
            onChange={(e) => setPreferredTime(clampStr(e.target.value, 80))}
            placeholder="e.g. Weekdays after 2pm"
          />
        </div>

        <div className="field">
          <div className="labelRow">
            <label htmlFor="q-details">Details *</label>
            <span className="counter">{details.length}/{maxDetails}</span>
          </div>
          <textarea
            id="q-details"
            className="textarea"
            rows={6}
            value={details}
            onChange={(e) => setDetails(clampStr(e.target.value, maxDetails))}
            placeholder="Tell us what you need (rooms, tasks, any special requests, access notes, etc.)"
            required
          />
        </div>

        {/* Turnstile */}
        <div className="turnstileWrap">
          <div id="turnstile-quote" />
          {!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
            <p className="mutedText" style={{ marginTop: 10 }}>
              Turnstile site key not set yet. Add <strong>NEXT_PUBLIC_TURNSTILE_SITE_KEY</strong> in Vercel env vars.
            </p>
          ) : null}
        </div>

        <button className={`btn btnPrimary ${isSubmitting ? "isLoading" : ""}`} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="spinner" />
              Sending…
            </>
          ) : (
            "Request quote"
          )}
        </button>

        {okMsg ? <p className="formOk">{okMsg}</p> : null}
        {errMsg ? <p className="formError">{errMsg}</p> : null}
      </form>
    </section>
  );
}