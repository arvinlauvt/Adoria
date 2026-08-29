import { getUserById, updateUser } from "../../../../lib/users";
import { consumePasswordResetToken } from "../../../../lib/auth/passwordReset";
import { hashPassword, checkPasswordStrength } from "../../../../lib/auth/password";
import { readJsonBody } from "../../../../lib/sanitize";
import { withErrorHandling } from "../../../../lib/errors";

export const POST = withErrorHandling(
  "reset-password",
  async (req) => {
    const body = await readJsonBody(req);

    const token = String(body?.token || "");
    const password = String(body?.password || "");

    if (!token) {
      return Response.json(
        {
          error: "This reset link is incomplete. Open it straight from the email, or request a new one.",
          code: "missing_token",
        },
        { status: 400 }
      );
    }

    // Consumed first: the token is single-use, so even a request that fails
    // the strength check below burns it. That's the safe direction to err —
    // requesting a fresh link is cheap, replaying a token isn't.
    const userId = await consumePasswordResetToken(token);
    if (!userId) {
      return Response.json(
        {
          error: "This reset link has expired or was already used. Request a new one.",
          code: "token_expired",
        },
        { status: 400 }
      );
    }

    const record = await getUserById(userId);
    if (!record) {
      return Response.json(
        {
          error: "This reset link is no longer valid. Message us on WhatsApp.",
          code: "account_gone",
        },
        { status: 400 }
      );
    }

    // Re-checked server-side. The meter in the browser is guidance; this is
    // the rule, and it runs whatever the client did or didn't do.
    const strength = checkPasswordStrength(password, [record.fields.Email || ""]);
    if (!strength.ok) {
      // The token is already spent by this point, so say so — otherwise the
      // user fixes their password, resubmits, and hits "link expired" with no
      // idea why.
      return Response.json(
        {
          error: `${strength.reason} This link is now used up — request a fresh one.`,
          code: "weak_password",
          field: "password",
        },
        { status: 400 }
      );
    }

    await updateUser(userId, { "Password Hash": await hashPassword(password) });

    return Response.json({ ok: true });
  },
  {
    what: "We couldn't change your password.",
    // Kept: without it they'd reasonably fear being locked out of the account.
    note: "Your old password still works. Request a fresh reset link.",
  }
);
