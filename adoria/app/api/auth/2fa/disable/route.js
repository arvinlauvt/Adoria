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
          error: "Enter your password to turn two-factor off.",
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
          error: `Too many attempts. Two-factor is still on. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
          code: "rate_limited",
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const record = await getUserById(session.userId);
    if (!record || !(await verifyPassword(password, record.fields["Password Hash"] || ""))) {
      return Response.json(
        {
          error: "That password isn't right. Two-factor is still on.",
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
    // Kept: assuming it's off and wiping the authenticator entry would lock
    // them out.
    note: "Assume it's still on — keep your authenticator app.",
  }
);
