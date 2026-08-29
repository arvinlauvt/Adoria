/** @type {import('next').NextConfig} */

// Applied to every response. Each of these closes a class of attack that
// doesn't need a bug in our own code to work.
// React's development build calls eval() for debugging features (rebuilding
// call stacks, hot reload). Production React never does, so 'unsafe-eval' is
// added for `next dev` only — the deployed CSP stays strict, which is the
// whole point of having one. Without this, dev fills the console with CSP
// violations that look like application errors and aren't.
const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  // Stops the site being framed by another page, which is what makes
  // clickjacking possible — an invisible overlay of our admin dashboard
  // sitting under someone else's buttons.
  { key: "X-Frame-Options", value: "DENY" },

  // Stops the browser second-guessing a Content-Type and executing something
  // we served as data.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Don't leak the full URL (which can carry an order ID or a reset token)
  // in the Referer header when a visitor clicks an outbound link.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // We ask for none of these; saying so explicitly means a compromised
  // script can't either.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },

  // Once a browser has seen this, it refuses to talk to the site over plain
  // HTTP at all, which closes the downgrade window on the session cookie.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },

  // Defence in depth behind React's own escaping: even if something did get
  // injected into the page, this restricts what it could load or call out to.
  // 'unsafe-inline' for scripts is needed by the pre-paint theme script in
  // layout.js and by Next's inlined bootstrap; styles are inline throughout
  // the app. Everything else is locked to this origin plus the two hosts we
  // genuinely use.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      // Payment redirects leave the site entirely, so they don't need to be
      // listed here; this is only what the page itself may fetch.
      "connect-src 'self'",
      "form-action 'self' https://toyyibpay.com https://dev.toyyibpay.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig = {
  // Don't advertise the framework version; it's free reconnaissance.
  poweredByHeader: false,

  // Responses are compressed. Netlify also gzips at the edge, but this makes
  // it true wherever the app runs.
  compress: true,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Nothing under /api should ever be cached — by the browser, by a
        // CDN, or by anything in between. These responses are per-customer.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
