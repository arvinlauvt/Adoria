import { requireSession } from "../../../../../lib/auth/requireSession";
import { generateTotpEnrollment } from "../../../../../lib/auth/totp";
import { stashPendingSecret } from "../../../../../lib/auth/totpSetup";
import { withErrorHandling } from "../../../../../lib/errors";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(
  "2fa-setup",
  async () => {
    const session = await requireSession();

    const { secretBase32, qrDataUrl } = await generateTotpEnrollment(session.email);
    await stashPendingSecret(session.userId, secretBase32);

    // The QR encodes the secret, which is the point of it — shown once, to
    // the signed-in owner of the account, and never persisted client-side.
    return Response.json({ qrDataUrl, secretBase32 });
  },
  {
    what: "We couldn't start two-factor setup.",
    dependency: "the service that stores accounts",
    note: "Two-factor is still off and your account is unchanged.",
  }
);
