import { cookies } from "next/headers";
import { destroySession, SESSION_COOKIE } from "../../../../lib/auth/session";
import { clearedSessionCookie } from "../../../../lib/auth/cookie";

export async function POST() {
  const token = cookies().get(SESSION_COOKIE)?.value;

  // Delete server-side first. Clearing the cookie only stops the browser
  // sending it; deleting the Redis entry is what actually makes the token
  // useless, including for anyone who already copied it.
  try {
    await destroySession(token);
  } catch (err) {
    console.error("Session teardown failed:", err);
  }

  const response = Response.json({ ok: true });
  response.headers.set("Set-Cookie", clearedSessionCookie());
  return response;
}
