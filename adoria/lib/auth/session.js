import { randomBytes, createHash } from "crypto";
import { getRedis } from "../redis";

// Deliberately an opaque random token, not a JWT: the only way to read a
// session's role/userId is to look it up in Redis, which means logout,
// password changes, and admin revocation all just delete the Redis entry —
// no signature-based token can be "revoked" that cheaply.
export const SESSION_COOKIE = "cubelle_session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function hashToken(token) {
  // The cookie value is never written to Redis verbatim, so a Redis dump
  // or log line alone can't be replayed as a live session.
  return createHash("sha256").update(token).digest("hex");
}

function sessionKey(token) {
  return `session:${hashToken(token)}`;
}

// Returns the raw token — caller sets it as the httpOnly cookie. Never put
// this in a response body or a client-readable field.
export async function createSession({ userId, email, role }) {
  const token = randomBytes(32).toString("base64url");
  const redis = getRedis();
  await redis.set(
    sessionKey(token),
    JSON.stringify({ userId, email, role, issuedAt: Date.now() }),
    { ex: SESSION_TTL_SECONDS }
  );
  return token;
}

// Server-only lookup: role/userId come from here, never from a client
// payload. Used by lib/auth/requireSession.js and API routes directly.
export async function getSession(token) {
  if (!token) return null;
  const raw = await getRedis().get(sessionKey(token));
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function destroySession(token) {
  if (!token) return;
  await getRedis().del(sessionKey(token));
}

// Sliding expiration — call on authenticated activity if you want sessions
// to stay alive under regular use instead of hard-expiring after 7 days.
export async function touchSession(token) {
  if (!token) return;
  await getRedis().expire(sessionKey(token), SESSION_TTL_SECONDS);
}
