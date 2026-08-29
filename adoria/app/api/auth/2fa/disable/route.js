import { requireSession } from "../../../../../lib/auth/requireSession";
import { getUserById, updateUser } from "../../../../../lib/users";
import { verifyPassword } from "../../../../../lib/auth/password";
import { checkLoginRateLimit } from "../../../../../lib/auth/rateLimit";
import { getRequestIp } from "../../../../../lib/auth/requestIp";
import { readJsonBody } from "../../../../../lib/sanitize";
import { withErrorHandling } from "../../../../../lib/errors";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling("2fa-disable", async (req) => {
  try {
    const session = await requireSession();
    const body = await readJsonBody(req);
    const password = String(body?.password || "");

    if (!password) {
      return Response.json({ error: "Enter your password to turn this off." }, { status: 400 });
    }

    // Turning off a second factor is a downgrade in account security, so it
    // asks for the password again — an unattended open tab shouldn't be
    // enough to strip 2FA off an account. Rate limited for the same reason
    // login is: this is a password check like any other.
    const limit = await checkLoginRateLimit(getRequestIp(req), session.email);
    if (!limit.allowed) {
      return Response.json(
        { error: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const record = await getUserById(session.userId);
    if (!record || !(await verifyPassword(password, record.fields["Password Hash"] || ""))) {
      return Response.json({ error: "That password isn't right." }, { status: 401 });
    }

    await updateUser(session.userId, {
      "TOTP Secret": "",
      "TOTP Enabled": false,
      "Backup Codes": "",
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err.status) return Response.json({ error: err.message }, { status: err.status });
    console.error("2FA disable failed:", err);
    return Response.json({ error: "Could not turn off two-factor right now." }, { status: 503 });
  }
});
