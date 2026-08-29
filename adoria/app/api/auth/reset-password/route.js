import { getUserById, updateUser } from "../../../../lib/users";
import { consumePasswordResetToken } from "../../../../lib/auth/passwordReset";
import { hashPassword, checkPasswordStrength } from "../../../../lib/auth/password";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const token = String(body?.token || "");
  const password = String(body?.password || "");

  if (!token) {
    return Response.json({ error: "This reset link is incomplete." }, { status: 400 });
  }

  try {
    // Consumed first: the token is single-use, so even a request that fails
    // the strength check below burns it. That's the safe direction to err —
    // requesting a fresh link is cheap, replaying a token isn't.
    const userId = await consumePasswordResetToken(token);
    if (!userId) {
      return Response.json(
        { error: "This reset link has expired or has already been used. Request a new one." },
        { status: 400 }
      );
    }

    const record = await getUserById(userId);
    if (!record) {
      return Response.json({ error: "This reset link is no longer valid." }, { status: 400 });
    }

    // Re-checked server-side. The meter in the browser is guidance; this is
    // the rule, and it runs whatever the client did or didn't do.
    const strength = checkPasswordStrength(password, [record.fields.Email || ""]);
    if (!strength.ok) {
      return Response.json({ error: strength.reason }, { status: 400 });
    }

    await updateUser(userId, { "Password Hash": await hashPassword(password) });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Password reset failed:", err);
    return Response.json({ error: "Could not reset your password right now." }, { status: 503 });
  }
}
