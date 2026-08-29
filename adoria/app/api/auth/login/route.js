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
// It still tells the user what to do, which is the part that costs nothing.
const GENERIC_FAILURE =
  "That email and password don't match. " +
  "Either the address isn't registered or the password is wrong — for your safety we don't say which. " +
  "Check for typos, or reset your password if you're not sure of it.";

// Compared against when no account exists, purely so the response takes
// roughly as long as a real bcrypt check would. Without it, a fast rejection
// reliably signals "this email has no account" via response time alone.
const DUMMY_HASH = bcrypt.hashSync("timing-equalizer-not-a-real-password", 12);

export const POST = withErrorHandling(
  "login",
  async (req) => {
    const body = await readJsonBody(req);

    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return Response.json(
        {
          error: "Enter your email and password. Both are needed to sign in.",
          code: "missing_credentials",
        },
        { status: 400 }
      );
    }

    // Rate limit before touching Airtable or bcrypt, so a flood costs the
    // attacker a Redis INCR and costs us nothing else.
    //
    // If the limiter itself is down this throws, and the wrapper turns it into
    // a 503 without ever reaching the password check. That IS the fail-closed
    // behaviour we want: unable to police brute force, we decline rather than
    // run unlimited attempts.
    const ip = getRequestIp(req);
    const limit = await checkLoginRateLimit(ip, email);

    if (!limit.allowed) {
      const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
      return Response.json(
        {
          error:
            `Too many sign-in attempts. ` +
            `We've temporarily locked sign-in for this account to stop someone guessing the password. ` +
            `Wait about ${minutes} minute${minutes === 1 ? "" : "s"} and try again — ` +
            `if it wasn't you, reset your password before you do.`,
          code: "rate_limited",
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const record = await findUserByEmail(email);
    const hash = record?.fields?.["Password Hash"] || DUMMY_HASH;
    const passwordOk = await verifyPassword(password, hash);

    if (!record || !passwordOk) {
      return Response.json({ error: GENERIC_FAILURE, code: "bad_credentials" }, { status: 401 });
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
  },
  {
    what: "We couldn't sign you in.",
    dependency: "the service that stores accounts",
    note: "Your password wasn't wrong — this failed before we got as far as checking it.",
  }
);
