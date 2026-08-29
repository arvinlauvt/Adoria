import { randomBytes } from "crypto";
import { getRedis } from "../redis";

// Bridges the two steps of a 2FA login: password verified, but the code
// hasn't been entered yet. Short-lived and single-use, so this "half-open"
// state can't be replayed against a different login or left open for long.
const PENDING_TTL_SECONDS = 5 * 60;

function pendingKey(token) {
  return `pending-login:${token}`;
}

export async function createPendingLogin(userId) {
  const token = randomBytes(24).toString("base64url");
  await getRedis().set(pendingKey(token), userId, { ex: PENDING_TTL_SECONDS });
  return token;
}

// Consumes the token — a second call with the same token returns null, so a
// leaked/replayed pending-login token can't be used twice.
export async function consumePendingLogin(token) {
  if (!token) return null;
  const redis = getRedis();
  const userId = await redis.get(pendingKey(token));
  if (!userId) return null;
  await redis.del(pendingKey(token));
  return userId;
}
