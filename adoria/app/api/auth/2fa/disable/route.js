import { requireSession } from "../../../../../lib/auth/requireSession";
import { getUserById, updateUser } from "../../../../../lib/users";
import { verifyPassword } from "../../../../../lib/auth/password";
import { checkLoginRateLimit } from "../../../../../lib/auth/rateLimit";
import { getRequestIp } from "../../../../../lib/auth/requestIp";
import { readJsonBody } from "../../../../../lib/sanitize";
import { withErrorHandling } from "../../../../../lib/errors";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(
  "2fa-disable",
  async (req) => {
    const session = await requireSession();
    const body = await readJsonBody(req);
    const password = String(body?.password || "");

    if (!password) {
      return Response.json(
        {
          error:
            "Enter your password to turn this off. " +
            "Removing two-factor makes the account easier to break into, so we confirm it's really you first.",
          code: "missing_password",
          field: "password",
        },
        { status: 400 }
      );
    }

    // Turning off a second factor is a downgrade in account security, so it
    // asks for the password again — an unattended open tab shouldn't be
    // enough to strip 2FA off an account. Rate limited for the same reason
    // login is: this is a password check like any other.
    const limit = await checkLoginRateLimit(getRequestIp(req), session.email);
    if (!limit.allowed) {
      const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
      return Response.json(
        {
          error:
            `Too many attempts. ` +
            `Password checks are limited to stop guessing, and this account has hit that limit. ` +
            `Two-factor is still on. Wait about ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`,
          code: "rate_limited",
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const record = await getUserById(session.userId);
    if (!record || !(await verifyPassword(password, record.fields["Password Hash"] || ""))) {
      return Response.json(
        {
          error:
            "That password isn't right. " +
            "Two-factor is still on and nothing has changed. " +
            "Try again, or reset your password if you've forgotten it.",
          code: "bad_password",
          field: "password",
        },
        { status: 401 }
      );
    }

    await updateUser(session.userId, {
      "TOTP Secret": "",
      "TOTP Enabled": false,
      "Backup Codes": "",
    });

    return Response.json({ ok: true });
  },
  {
    what: "We couldn't turn off two-factor.",
    dependency: "the service that stores accounts",
    note:
      "Assume it's still on and keep your authenticator app to hand — reload your account page to see where it actually stands.",
  }
);
