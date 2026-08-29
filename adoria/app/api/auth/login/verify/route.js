import { getUserById, updateUser } from "../../../../../lib/users";
import {
  readPendingLogin,
  consumePendingLogin,
  recordFailedAttempt,
} from "../../../../../lib/auth/pendingLogin";
import { verifyTotpCode, findMatchingBackupCodeIndex } from "../../../../../lib/auth/totp";
import { decryptSecret } from "../../../../../lib/auth/crypto";
import { createSession } from "../../../../../lib/auth/session";
import { sessionCookie } from "../../../../../lib/auth/cookie";
import { readJsonBody } from "../../../../../lib/sanitize";
import { withErrorHandling } from "../../../../../lib/errors";

export const POST = withErrorHandling("login-verify", async (req) => {
  const body = await readJsonBody(req);

  const pendingToken = String(body?.pendingToken || "");
  // Forgiving: authenticator apps show "123 456", and people paste it that
  // way. Strip anything that isn't a digit or letter before checking, so
  // spaces and dashes don't cause a spurious failure.
  const code = String(body?.code || "").replace(/[^0-9a-zA-Z]/g, "");

  if (!pendingToken || !code) {
    return Response.json({ error: "Enter the code from your authenticator app." }, { status: 400 });
  }

  try {
    const userId = await readPendingLogin(pendingToken);
    if (!userId) {
      return Response.json(
        { error: "This sign-in attempt expired. Start again.", restart: true },
        { status: 400 }
      );
    }

    const record = await getUserById(userId);
    if (!record) {
      return Response.json({ error: "This sign-in attempt is no longer valid.", restart: true }, { status: 400 });
    }

    const secret = record.fields["TOTP Secret"];
    let ok = secret ? verifyTotpCode(decryptSecret(secret), code) : false;

    // Backup codes are the way back in when the phone is gone, so they're
    // accepted here too — each one only once.
    if (!ok) {
      const stored = parseBackupCodes(record.fields["Backup Codes"]);
      const index = await findMatchingBackupCodeIndex(code.toLowerCase(), stored);
      if (index !== -1) {
        stored.splice(index, 1);
        await updateUser(userId, { "Backup Codes": JSON.stringify(stored) });
        ok = true;
      }
    }

    if (!ok) {
      const remaining = await recordFailedAttempt(pendingToken);
      if (remaining === 0) {
        return Response.json(
          { error: "Too many incorrect codes. Sign in again to restart.", restart: true },
          { status: 429 }
        );
      }
      return Response.json(
        { error: `That code isn't right. ${remaining} attempt${remaining === 1 ? "" : "s"} left.` },
        { status: 401 }
      );
    }

    // Only now is the pending token spent and a real session issued.
    await consumePendingLogin(pendingToken);
    const token = await createSession({
      userId: record.id,
      email: record.fields.Email,
      role: record.fields.Role || "Customer",
    });

    const response = Response.json({ ok: true, role: record.fields.Role || "Customer" });
    response.headers.set("Set-Cookie", sessionCookie(token));
    return response;
  } catch (err) {
    console.error("Two-factor verification failed:", err);
    return Response.json({ error: "Sign-in is unavailable right now." }, { status: 503 });
  }
});

function parseBackupCodes(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
