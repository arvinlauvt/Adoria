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
          error: "Enter the 6-digit code from your authenticator app.",
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
            "Setup timed out. Start again for a fresh QR code, and delete the old Cubelle entry from your app.",
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
          error: "That code isn't right. Codes change every 30 seconds — use the one showing now.",
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
    // Kept: the write and the confirmation are separate, so neither state is
    // safe to assume.
    note: "Sign out and back in, then check your account page before trying again.",
  }
);
