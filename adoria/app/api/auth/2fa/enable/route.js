import { requireSession } from "../../../../../lib/auth/requireSession";
import { updateUser } from "../../../../../lib/users";
import {
  verifyTotpCode,
  generateBackupCodes,
  hashBackupCodes,
} from "../../../../../lib/auth/totp";
import { encryptSecret } from "../../../../../lib/auth/crypto";
import { readPendingSecret, clearPendingSecret } from "../../../../../lib/auth/totpSetup";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    const code = String(body?.code || "").replace(/\D/g, "");

    if (!code) {
      return Response.json({ error: "Enter the code from your authenticator app." }, { status: 400 });
    }

    const secretBase32 = await readPendingSecret(session.userId);
    if (!secretBase32) {
      return Response.json(
        { error: "Setup timed out. Start again to get a fresh QR code." },
        { status: 400 }
      );
    }

    // Requiring a working code before enabling is what stops a mis-scan from
    // locking the account out of its own second factor.
    if (!verifyTotpCode(secretBase32, code)) {
      return Response.json({ error: "That code isn't right. Try the current one." }, { status: 401 });
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
  } catch (err) {
    if (err.status) return Response.json({ error: err.message }, { status: err.status });
    console.error("2FA enable failed:", err);
    return Response.json({ error: "Could not turn on two-factor right now." }, { status: 503 });
  }
}
