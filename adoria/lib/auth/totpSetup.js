import { getRedis } from "../redis";

// A secret being enrolled lives here, keyed to the session, until the user
// proves they scanned it correctly. Keeping it server-side rather than
// round-tripping it through the browser means the enable step can't be
// talked into enrolling a secret the caller supplied.
const SETUP_TTL_SECONDS = 10 * 60;

function setupKey(userId) {
  return `totp-setup:${userId}`;
}

export async function stashPendingSecret(userId, secretBase32) {
  await getRedis().set(setupKey(userId), secretBase32, { ex: SETUP_TTL_SECONDS });
}

export async function readPendingSecret(userId) {
  return getRedis().get(setupKey(userId));
}

export async function clearPendingSecret(userId) {
  await getRedis().del(setupKey(userId));
}
