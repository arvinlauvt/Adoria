import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const ISSUER = "Cubelle";

// Generates a fresh secret and its enrollment QR — called once, when a user
// starts turning on 2FA. The secret isn't stored yet at this point; it's
// only committed (encrypted) after they prove they scanned it correctly by
// submitting one valid code, so a botched scan can't silently brick 2FA.
export async function generateTotpEnrollment(email) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
  const qrDataUrl = await QRCode.toDataURL(totp.toString());
  return { secretBase32: secret.base32, qrDataUrl };
}

// `window: 1` tolerates the previous/next 30s step for clock drift, per
// RFC 6238 guidance — anything wider starts trading real security for
// convenience.
export function verifyTotpCode(secretBase32, code) {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
  const delta = totp.validate({ token: String(code).trim(), window: 1 });
  return delta !== null;
}

// Backup codes are shown once at enrollment and stored as bcrypt hashes,
// same treatment as passwords — if the Users table were ever read directly,
// none of it should be usable to log in.
export function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(randomBytes(5).toString("hex")); // e.g. "a3f9c1e08b"
  }
  return codes;
}

export async function hashBackupCodes(codes) {
  return Promise.all(codes.map((c) => bcrypt.hash(c, 10)));
}

// One-shot check across all remaining hashes; caller is responsible for
// removing the matched hash from storage so each code works only once.
export async function findMatchingBackupCodeIndex(code, hashes) {
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(code, hashes[i])) return i;
  }
  return -1;
}
