import { cookies } from "next/headers";
import { destroySession, SESSION_COOKIE } from "../../../../lib/auth/session";
import { clearedSessionCookie } from "../../../../lib/auth/cookie";
import { newErrorReference } from "../../../../lib/errors";

export async function POST() {
  const token = cookies().get(SESSION_COOKIE)?.value;

  // Delete server-side first. Clearing the cookie only stops the browser
  // sending it; deleting the Redis entry is what actually makes the token
  // useless, including for anyone who already copied it.
  let revoked = true;
  let reference = null;
  try {
    await destroySession(token);
  } catch (err) {
    revoked = false;
    reference = newErrorReference();
    console.error(
      `[logout] ${reference} revoke_failed — cookie cleared but session still live:`,
      err && err.stack ? err.stack : err
    );
  }

  // The cookie is cleared either way: that's strictly better than leaving it,
  // and it's the half we can always do. But reporting ok:true when the token
  // is still live would be the worst kind of silent failure — someone on a
  // shared computer would walk away believing they'd signed out.
  const response = revoked
    ? Response.json({ ok: true })
    : Response.json(
        {
          ok: false,
          code: "revoke_failed",
          what: "You're signed out on this device, but we couldn't end the session everywhere.",
          why: "Clearing the browser is done, but the server that tracks active sessions didn't respond, so the old session may still be usable for a while.",
          action: `If you're on a shared or public computer, close the whole browser now, then change your password from a device you trust. Quote ${reference} if you message us.`,
          reference,
        },
        // 200, not an error status: the sign-out did partly succeed, and the
        // client must still treat the user as signed out locally.
        { status: 200 }
      );

  response.headers.set("Set-Cookie", clearedSessionCookie());
  return response;
}
