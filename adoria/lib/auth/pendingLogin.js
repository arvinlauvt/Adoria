import { randomBytes } from "crypto";
import { getRedis } from "../redis";

// Bridges the two steps of a 2FA login: password verified, but the code
// hasn't been entered yet. Short-lived so this "half-open" state can't be
// left open or replayed long after the fact.
const PENDING_TTL_SECONDS = 5 * 60;

// A 6-digit code is only a million possibilities, and the pending window
// allows repeated guesses against one token. Capping attempts is what keeps
// that from being a practical brute-force path; the TTL alone would not.
const MAX_ATTEMPTS = 5;

function pendingKey(token) {
  return `pending-login:${token}`;
}

function attemptsKey(token) {
  return `pending-login-attempts:${token}`;
}

export async function createPendingLogin(userId) {
  const token = randomBytes(24).toString("base64url");
  await getRedis().set(pendingKey(token), userId, { ex: PENDING_TTL_SECONDS });
  return token;
}

// Reads without consuming, so a mistyped code doesn't cost the user their
// password step. Returns null once the token is spent, expired, or has had
// too many wrong codes against it.
export async function readPendingLogin(token) {
  if (!token) return null;
  return getRedis().get(pendingKey(token));
}

// Called after each wrong code. Returns the number of attempts remaining;
// at zero the pending token is destroyed and the user starts over.
export async function recordFailedAttempt(token) {
  const redis = getRedis();
  const key = attemptsKey(token);
  const used = await redis.incr(key);
  if (used === 1) await redis.expire(key, PENDING_TTL_SECONDS);

  if (used >= MAX_ATTEMPTS) {
    await redis.del(pendingKey(token));
    await redis.del(key);
    return 0;
  }
  return MAX_ATTEMPTS - used;
}

// Consumed only on success, so a valid code can't be replayed.
export async function consumePendingLogin(token) {
  if (!token) return null;
  const redis = getRedis();
  const userId = await redis.get(pendingKey(token));
  if (!userId) return null;
  await redis.del(pendingKey(token));
  await redis.del(attemptsKey(token));
  return userId;
}
