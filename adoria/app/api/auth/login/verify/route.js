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

export const POST = withErrorHandling(
  "login-verify",
  async (req) => {
    const body = await readJsonBody(req);

    const pendingToken = String(body?.pendingToken || "");
    // Forgiving: authenticator apps show "123 456", and people paste it that
    // way. Strip anything that isn't a digit or letter before checking, so
    // spaces and dashes don't cause a spurious failure.
    const code = String(body?.code || "").replace(/[^0-9a-zA-Z]/g, "");

    if (!pendingToken || !code) {
      return Response.json(
        {
          error:
            "Enter the 6-digit code from your authenticator app. " +
            "Your password was accepted, but this account has two-factor turned on, so the code is the second step.",
          code: "missing_code",
          field: "code",
        },
        { status: 400 }
      );
    }

    const userId = await readPendingLogin(pendingToken);
    if (!userId) {
      return Response.json(
        {
          error:
            "This sign-in attempt has expired. " +
            "The window between entering your password and your code only stays open a few minutes. " +
            "Enter your email and password again to get a fresh one.",
          code: "attempt_expired",
          restart: true,
        },
        { status: 400 }
      );
    }

    const record = await getUserById(userId);
    if (!record) {
      return Response.json(
        {
          error:
            "This sign-in attempt is no longer valid. " +
            "The account it belonged to can't be found, which can happen if it was removed mid-sign-in. " +
            "Start again, and message us on WhatsApp if it keeps happening.",
          code: "account_gone",
          restart: true,
        },
        { status: 400 }
      );
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
          {
            error:
              "Too many incorrect codes, so this sign-in attempt has been cancelled. " +
              "That limit exists to stop someone guessing their way past two-factor. " +
              "Enter your email and password again to start over — if your phone's codes keep being rejected, " +
              "check its clock is set to update automatically, or use one of your backup codes.",
            code: "too_many_codes",
            restart: true,
          },
          { status: 429 }
        );
      }
      return Response.json(
        {
          error:
            `That code isn't right — ${remaining} attempt${remaining === 1 ? "" : "s"} left before this sign-in is cancelled. ` +
            `Codes change every 30 seconds, so enter the one showing now. ` +
            `If none of them work, use one of your backup codes.`,
          code: "bad_code",
          field: "code",
          remaining,
        },
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
  },
  {
    what: "We couldn't finish signing you in.",
    note:
      "Your code wasn't wrong — this failed before we got as far as checking it, and you're not signed in.",
  }
);

function parseBackupCodes(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
