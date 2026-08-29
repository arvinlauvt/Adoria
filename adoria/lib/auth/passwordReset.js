import { randomBytes, createHash } from "crypto";
import { getRedis } from "../redis";

const RESET_TTL_SECONDS = 30 * 60;

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function resetKey(hashedToken) {
  return `pw-reset:${hashedToken}`;
}

// Returns the raw token — only this raw value goes into the emailed link.
// Only its hash is ever stored, so a Redis dump can't be used to reset
// anyone's password (same reasoning as session tokens).
export async function createPasswordResetToken(userId) {
  const token = randomBytes(32).toString("base64url");
  await getRedis().set(resetKey(hashToken(token)), userId, { ex: RESET_TTL_SECONDS });
  return token;
}

// Single-use: deletes the token as soon as it's read, so a reset link can't
// be replayed even within its 30-minute window.
export async function consumePasswordResetToken(token) {
  if (!token) return null;
  const redis = getRedis();
  const key = resetKey(hashToken(token));
  const userId = await redis.get(key);
  if (!userId) return null;
  await redis.del(key);
  return userId;
}
