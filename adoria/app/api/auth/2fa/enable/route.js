import { requireSession } from "../../../../../lib/auth/requireSession";
import { updateUser } from "../../../../../lib/users";
import {
  verifyTotpCode,
  generateBackupCodes,
  hashBackupCodes,
} from "../../../../../lib/auth/totp";
import { encryptSecret } from "../../../../../lib/auth/crypto";
import { readPendingSecret, clearPendingSecret } from "../../../../../lib/auth/totpSetup";
import { readJsonBody } from "../../../../../lib/sanitize";
import { withErrorHandling } from "../../../../../lib/errors";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(
  "2fa-enable",
  async (req) => {
    const session = await requireSession();
    const body = await readJsonBody(req);
    const code = String(body?.code || "").replace(/\D/g, "");

    if (!code) {
      return Response.json(
        {
          error:
            "Enter the 6-digit code from your authenticator app. " +
            "It's needed to prove the app scanned the QR correctly before we switch two-factor on.",
          code: "missing_code",
          field: "code",
        },
        { status: 400 }
      );
    }

    const secretBase32 = await readPendingSecret(session.userId);
    if (!secretBase32) {
      return Response.json(
        {
          error:
            "Setup timed out. " +
            "The QR code is only held for a few minutes, and this one has expired. " +
            "Start setup again to get a fresh QR code, and remove the old Cubelle entry from your authenticator app.",
          code: "setup_expired",
        },
        { status: 400 }
      );
    }

    // Requiring a working code before enabling is what stops a mis-scan from
    // locking the account out of its own second factor.
    if (!verifyTotpCode(secretBase32, code)) {
      return Response.json(
        {
          error:
            "That code isn't right. " +
            "Codes change every 30 seconds, so an old one won't work, and the phone's clock has to be accurate. " +
            "Enter the code showing right now.",
          code: "bad_code",
          field: "code",
        },
        { status: 401 }
      );
    }

    // Shown once, here, and stored only as hashes — the same treatment as a
    // password, since either one alone gets you past this step.
    const backupCodes = generateBackupCodes(10);
    const hashed = await hashBackupCodes(backupCodes);

    await updateUser(session.userId, {
      "TOTP Secret": encryptSecret(secretBase32),
      "TOTP Enabled": true,
      "Backup Codes": JSON.stringify(hashed),
    });
    await clearPendingSecret(session.userId);

    return Response.json({ ok: true, backupCodes });
  },
  {
    what: "We couldn't turn on two-factor.",
    dependency: "the service that stores accounts",
    // The write and the confirmation are separate, so on failure the user
    // can't assume either state — tell them how to check rather than guess.
    note:
      "Don't assume it's on or off: sign out and back in, then check your account page before running setup again.",
  }
);
