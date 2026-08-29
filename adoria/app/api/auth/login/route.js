import bcrypt from "bcryptjs";
import { findUserByEmail } from "../../../../lib/users";
import { verifyPassword } from "../../../../lib/auth/password";
import { createSession } from "../../../../lib/auth/session";
import { sessionCookie } from "../../../../lib/auth/cookie";
import { createPendingLogin } from "../../../../lib/auth/pendingLogin";
import { checkLoginRateLimit } from "../../../../lib/auth/rateLimit";
import { getRequestIp } from "../../../../lib/auth/requestIp";
import { readJsonBody } from "../../../../lib/sanitize";
import { withErrorHandling } from "../../../../lib/errors";

// One message for every failure mode below, so a wrong password and a
// non-existent account are indistinguishable. Anything more specific
// ("no such account") turns this endpoint into an account-enumeration oracle.
const GENERIC_FAILURE = "That email and password don't match.";

// Compared against when no account exists, purely so the response takes
// roughly as long as a real bcrypt check would. Without it, a fast rejection
// reliably signals "this email has no account" via response time alone.
const DUMMY_HASH = bcrypt.hashSync("timing-equalizer-not-a-real-password", 12);

export const POST = withErrorHandling("login", async (req) => {
  const body = await readJsonBody(req);

  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!email || !password) {
    return Response.json({ error: "Enter your email and password." }, { status: 400 });
  }

  // Rate limit before touching Airtable or bcrypt, so a flood costs the
  // attacker a Redis INCR and costs us nothing else.
  const ip = getRequestIp(req);
  let limit;
  try {
    limit = await checkLoginRateLimit(ip, email);
  } catch (err) {
    console.error("Rate limit check failed:", err);
    // Fail closed: if the limiter is unavailable we can't police brute force,
    // so we decline rather than run unlimited login attempts.
    return Response.json({ error: "Sign-in is unavailable right now." }, { status: 503 });
  }

  if (!limit.allowed) {
    return Response.json(
      { error: "Too many sign-in attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const record = await findUserByEmail(email);
    const hash = record?.fields?.["Password Hash"] || DUMMY_HASH;
    const passwordOk = await verifyPassword(password, hash);

    if (!record || !passwordOk) {
      return Response.json({ error: GENERIC_FAILURE }, { status: 401 });
    }

    // 2FA enrolled: stop here. No session cookie is issued until the code is
    // verified, so a stolen password alone gets an attacker nothing.
    if (record.fields["TOTP Enabled"]) {
      const pendingToken = await createPendingLogin(record.id);
      return Response.json({ twoFactorRequired: true, pendingToken });
    }

    const token = await createSession({
      userId: record.id,
      email: record.fields.Email,
      role: record.fields.Role || "Customer",
    });

    const response = Response.json({
      ok: true,
      role: record.fields.Role || "Customer",
    });
    response.headers.set("Set-Cookie", sessionCookie(token));
    return response;
  } catch (err) {
    console.error("Login failed:", err);
    return Response.json({ error: "Sign-in is unavailable right now." }, { status: 503 });
  }
});
