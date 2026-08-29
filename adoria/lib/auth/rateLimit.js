import { getRedis } from "../redis";

// Fixed-window counter in Redis. INCR is atomic on its own; the EXPIRE right
// after it is a separate call, so a crash in that narrow gap could in theory
// leave a key with no TTL — that fails *closed* (the key just keeps counting
// forever until manually cleared), never open, so it's an acceptable risk at
// this scale rather than reaching for a Lua script.
async function hit(key, windowSeconds) {
  const redis = getRedis();
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return count;
}

// Generic limiter. `key` should already be scoped (e.g. "login:ip:1.2.3.4").
// Returns { allowed, retryAfterSeconds } — never throws for "over limit",
// only for actual Redis/config failures.
export async function checkRateLimit(key, { limit, windowSeconds }) {
  const fullKey = `ratelimit:${key}`;
  const count = await hit(fullKey, windowSeconds);
  if (count <= limit) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  const ttl = await getRedis().ttl(fullKey);
  return { allowed: false, retryAfterSeconds: ttl > 0 ? ttl : windowSeconds };
}

// Two limiters stacked per login attempt: a tight one on the specific
// (IP, email) pair, and a looser per-IP one so someone can't dodge the first
// by spraying different email addresses from the same IP.
export async function checkLoginRateLimit(ip, email) {
  const perAccount = await checkRateLimit(`login:acct:${ip}:${email.toLowerCase()}`, {
    limit: 5,
    windowSeconds: 15 * 60,
  });
  if (!perAccount.allowed) return perAccount;
  return checkRateLimit(`login:ip:${ip}`, { limit: 20, windowSeconds: 15 * 60 });
}

// Per IP only — there's no account to bucket by yet. Generous enough for a
// household or office on one address, tight enough that nobody scripts a
// few thousand accounts into the Users table.
export async function checkSignupRateLimit(ip) {
  return checkRateLimit(`signup:${ip}`, { limit: 5, windowSeconds: 60 * 60 });
}

export async function checkPasswordResetRateLimit(email) {
  return checkRateLimit(`reset:${email.toLowerCase()}`, {
    limit: 3,
    windowSeconds: 60 * 60,
  });
}
