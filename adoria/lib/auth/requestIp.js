// Best-effort client IP for rate-limit bucketing. Netlify sets
// x-nf-client-connection-ip; the x-forwarded-for fallback takes the first
// entry, which is the original client when the header is set by the edge
// rather than by the client itself.
//
// A spoofed value can only ever split an attacker's own bucket, never widen
// someone else's limit, and the per-account (IP + email) limiter still
// catches credential stuffing against a single account regardless.
export function getRequestIp(req) {
  const netlifyIp = req.headers.get("x-nf-client-connection-ip");
  if (netlifyIp) return netlifyIp;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}
