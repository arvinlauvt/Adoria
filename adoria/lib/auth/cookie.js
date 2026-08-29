import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "./session";

// httpOnly is the whole point: the session token is unreadable from
// JavaScript, so an XSS bug can't exfiltrate it the way it could a value
// kept in localStorage. SameSite=Lax stops the cookie riding along on
// cross-site POSTs, which covers CSRF for the state-changing routes.
//
// Secure is set whenever we're not in a dev build. Browsers treat
// http://localhost as a trustworthy origin, so this still works when
// testing a production build locally.
function serialize(value, maxAge) {
  return [
    `${SESSION_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : null,
    `Max-Age=${maxAge}`,
  ]
    .filter(Boolean)
    .join("; ");
}

export function sessionCookie(token) {
  return serialize(token, SESSION_TTL_SECONDS);
}

// Max-Age=0 tells the browser to drop it immediately. The server-side
// session is deleted separately — that deletion, not this header, is what
// actually revokes access.
export function clearedSessionCookie() {
  return serialize("", 0);
}
