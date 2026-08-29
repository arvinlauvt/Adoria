// Hashing only, server-side. Strength checking lives in passwordStrength.js
// (imported by both server and client) so bcrypt never ships to the browser.
import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export { checkPasswordStrength, MIN_LENGTH, MIN_SCORE } from "./passwordStrength.js";
