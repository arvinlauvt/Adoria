import { requireSession } from "../../../../../lib/auth/requireSession";
import { generateTotpEnrollment } from "../../../../../lib/auth/totp";
import { stashPendingSecret } from "../../../../../lib/auth/totpSetup";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await requireSession();

    const { secretBase32, qrDataUrl } = await generateTotpEnrollment(session.email);
    await stashPendingSecret(session.userId, secretBase32);

    // The QR encodes the secret, which is the point of it — shown once, to
    // the signed-in owner of the account, and never persisted client-side.
    return Response.json({ qrDataUrl, secretBase32 });
  } catch (err) {
    if (err.status) return Response.json({ error: err.message }, { status: err.status });
    console.error("2FA setup failed:", err);
    return Response.json({ error: "Could not start setup right now." }, { status: 503 });
  }
}
