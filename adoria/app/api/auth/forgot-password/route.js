import { findUserByEmail } from "../../../../lib/users";
import { createPasswordResetToken } from "../../../../lib/auth/passwordReset";
import { checkPasswordResetRateLimit } from "../../../../lib/auth/rateLimit";
import { sendPasswordResetEmail } from "../../../../lib/resend";

// Always the same reply, whether or not the address has an account. Saying
// "no account with that email" would let anyone test addresses against the
// customer list one at a time.
const ALWAYS = {
  ok: true,
  message: "If that email has an account, a reset link is on its way.",
};

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const email = String(body?.email || "").trim().toLowerCase();
  if (!email) {
    return Response.json({ error: "Enter your email address." }, { status: 400 });
  }

  try {
    const limit = await checkPasswordResetRateLimit(email);
    if (!limit.allowed) {
      // Deliberately still generic: a distinct "rate limited" reply for a
      // real address and a generic one for an unknown address would leak
      // exactly what the uniform response is meant to hide.
      return Response.json(ALWAYS);
    }

    const record = await findUserByEmail(email);
    if (record) {
      const token = await createPasswordResetToken(record.id);
      const base = process.env.SITE_URL || "";
      const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;
      await sendPasswordResetEmail(record.fields.Email, resetUrl);
    }

    return Response.json(ALWAYS);
  } catch (err) {
    // Logged for us, invisible to the caller — an error here would otherwise
    // reveal that the address exists (only real addresses reach the send).
    console.error("Password reset request failed:", err);
    return Response.json(ALWAYS);
  }
}
