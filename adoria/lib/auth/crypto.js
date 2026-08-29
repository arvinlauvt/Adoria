import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

// Encrypts TOTP secrets before they're stored in Airtable. Password hashes
// don't need this (bcrypt is a one-way hash — nothing to decrypt), but a
// TOTP secret has to be readable again to verify codes, so it can't just be
// hashed. Airtable itself isn't a vault, so the secret is encrypted with a
// key that only ever lives in this app's environment, not in Airtable.
const ALGORITHM = "aes-256-gcm";

function getKey() {
  const raw = process.env.AUTH_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("AUTH_ENCRYPTION_KEY is not set — see .env.example.");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "AUTH_ENCRYPTION_KEY must decode to exactly 32 bytes — generate one with " +
        "`node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"`."
    );
  }
  return key;
}

// Returns a single opaque base64 string (iv + authTag + ciphertext) so it's
// one Airtable field, not three.
export function encryptSecret(plaintext) {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decryptSecret(encoded) {
  const key = getKey();
  const raw = Buffer.from(encoded, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
