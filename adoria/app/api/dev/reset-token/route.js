import { findUserByEmail } from "../../../../lib/users";
import { createPasswordResetToken } from "../../../../lib/auth/passwordReset";
import { inMemoryStoreAllowed } from "../../../../lib/devStore";

// Test-only: returns a reset token directly instead of emailing it, so the
// reset flow can be exercised without a mail provider. Gated on the same
// opt-in flag as the dev store, so it 404s in any real deployment — handing
// out reset tokens on request would otherwise be a full account takeover.
export async function POST(req) {
  if (!inMemoryStoreAllowed()) {
    return new Response("Not found", { status: 404 });
  }

  const { email } = await req.json();
  const record = await findUserByEmail(String(email || "").trim().toLowerCase());
  if (!record) {
    return Response.json({ error: "no such user" }, { status: 404 });
  }

  return Response.json({ token: await createPasswordResetToken(record.id) });
}
