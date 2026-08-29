import { findUserByEmail } from "../../../../lib/users";
import { createPasswordResetToken } from "../../../../lib/auth/passwordReset";
import { checkPasswordResetRateLimit } from "../../../../lib/auth/rateLimit";
import { sendPasswordResetEmail } from "../../../../lib/resend";
import { readJsonBody } from "../../../../lib/sanitize";
import { withErrorHandling, newErrorReference } from "../../../../lib/errors";

// Always the same reply, whether or not the address has an account. Saying
// "no account with that email" would let anyone test addresses against the
// customer list one at a time.
//
// It still has to be actionable, because this reply is also what someone sees
// when the send genuinely failed (see below) — so it tells them how long to
// wait, where else to look, and what to do if nothing arrives.
const ALWAYS = {
  ok: true,
  message:
    "If that email has an account, a reset link is on its way. " +
    "It usually arrives within a minute or two — check your spam folder if you don't see it. " +
    "If nothing has arrived after five minutes, message us on WhatsApp and we'll reset it for you by hand.",
};

export const POST = withErrorHandling(
  "forgot-password",
  async (req) => {
    const body = await readJsonBody(req);

    const email = String(body?.email || "").trim().toLowerCase();
    if (!email) {
      return Response.json(
        {
          error: "Enter your email address so we know which account to send the reset link to.",
          code: "missing_email",
          field: "email",
        },
        { status: 400 }
      );
    }

    // These two run for every caller, existing account or not, so letting them
    // throw to the wrapper leaks nothing: the failure is identical either way.
    const limit = await checkPasswordResetRateLimit(email);
    if (!limit.allowed) {
      // Deliberately still the uniform reply: a distinct "rate limited" answer
      // for a real address and a generic one for an unknown address would leak
      // exactly what this response exists to hide.
      return Response.json(ALWAYS);
    }

    const record = await findUserByEmail(email);

    if (record) {
      // Everything from here only happens for addresses that DO have an
      // account, so a visible error would answer the question the uniform
      // reply refuses to answer. That forces a real trade-off, and this is the
      // one place in the app where a failure is not surfaced to the user.
      //
      // It is not silent, though: it's logged at error level with a reference,
      // and the reply above tells the user what to do when no email arrives.
      // The alternative — a truthful "sending failed" — would turn this
      // endpoint into the account-enumeration oracle the whole design avoids.
      try {
        const token = await createPasswordResetToken(record.id);
        const base = process.env.SITE_URL || "";
        if (!base) {
          throw new Error("SITE_URL is not set, so the reset link would point nowhere.");
        }
        const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;
        await sendPasswordResetEmail(record.fields.Email, resetUrl);
      } catch (err) {
        const reference = newErrorReference();
        console.error(
          `[forgot-password] ${reference} send_failed for an existing account:`,
          err && err.stack ? err.stack : err
        );
      }
    }

    return Response.json(ALWAYS);
  },
  {
    what: "We couldn't start the password reset.",
    note: "Nothing has changed on your account and your current password still works.",
  }
);
