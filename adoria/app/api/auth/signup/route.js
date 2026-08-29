import { createUser, findUserByEmail } from "../../../../lib/users";
import { hashPassword, checkPasswordStrength } from "../../../../lib/auth/password";
import { createSession } from "../../../../lib/auth/session";
import { sessionCookie } from "../../../../lib/auth/cookie";
import { checkSignupRateLimit } from "../../../../lib/auth/rateLimit";
import { getRequestIp } from "../../../../lib/auth/requestIp";
import { validateEmail } from "../../../../lib/validation";
import { readJsonBody } from "../../../../lib/sanitize";
import { withErrorHandling } from "../../../../lib/errors";

export const POST = withErrorHandling(
  "signup",
  async (req) => {
    const body = await readJsonBody(req);

    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    const emailError = validateEmail(email);
    if (emailError) return Response.json({ error: emailError }, { status: 400 });

    const limit = await checkSignupRateLimit(getRequestIp(req));
    if (!limit.allowed) {
      const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
      return Response.json(
        {
          error:
            `We've paused new signups from your connection. ` +
            `Several accounts were just created from the same place, and that limit exists to stop bulk signups. ` +
            `Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}, or message us on WhatsApp if you need an account now.`,
          code: "rate_limited",
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    // Checked server-side regardless of what the browser did.
    const strength = checkPasswordStrength(password, [email]);
    if (!strength.ok) {
      return Response.json({ error: strength.reason, field: "password" }, { status: 400 });
    }

    // Deliberately explicit, unlike login and password reset. Those two stay
    // generic because a vague answer costs the user nothing — they carry on
    // the same either way. Here a generic "check your email" would strand
    // someone who simply forgot they'd already signed up, with no way to
    // find out why nothing works. Confirming the address exists is a real
    // enumeration trade, taken knowingly: the alternative is a dead end for
    // a legitimate customer. Closing it properly needs verified-email
    // signup, which is a bigger change than this.
    if (await findUserByEmail(email)) {
      return Response.json(
        {
          error:
            "There's already an account with this email. " +
            "You may have signed up before and forgotten. " +
            "Sign in instead, or reset your password if you don't remember it.",
          code: "email_taken",
          field: "email",
          existing: true,
        },
        { status: 409 }
      );
    }

    // Role is set here, never taken from the request. Nothing a caller sends
    // can make them an Admin.
    const record = await createUser({
      Email: email,
      "Password Hash": await hashPassword(password),
      Role: "Customer",
      "TOTP Enabled": false,
      "Created At": new Date().toISOString(),
    });

    const token = await createSession({
      userId: record.id,
      email,
      role: "Customer",
    });

    const response = Response.json({ ok: true });
    response.headers.set("Set-Cookie", sessionCookie(token));
    return response;
  },
  {
    what: "We couldn't finish creating your account.",
    // The account row and the session are two separate writes, so a failure
    // between them can leave the account real but the user not signed in.
    // They can't tell from the outside, so this says how to find out.
    note:
      "If you later try again and it says the email is already registered, your account did get created — sign in instead of signing up.",
  }
);
