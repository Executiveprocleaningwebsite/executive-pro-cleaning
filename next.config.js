/** @type {import('next').NextConfig} */

const ContentSecurityPolicy = `
  default-src 'self';
  base-uri 'self';
  object-src 'none';
  frame-ancestors 'none';
  form-action 'self';

  img-src 'self' data: https:;
  font-src 'self' data: https:;
  style-src 'self' 'unsafe-inline';

  script-src 'self'
    https://challenges.cloudflare.com
    'unsafe-inline';

  frame-src https://challenges.cloudflare.com;
  connect-src 'self' https://challenges.cloudflare.com;

  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  // ✅ CSP (Turnstile-compatible)
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },

  // Clickjacking protection
  { key: "X-Frame-Options", value: "DENY" },

  // Stop MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Safer referrer behaviour
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Basic permissions hardening
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },

  // Optional extra hardening (safe defaults)
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Download-Options", value: "noopen" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;