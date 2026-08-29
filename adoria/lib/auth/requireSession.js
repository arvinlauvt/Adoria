import { cookies } from "next/headers";
import { getSession, SESSION_COOKIE } from "./session";

// The single choke point every admin route and /admin page must call.
// Reads the httpOnly cookie server-side and resolves role from Redis —
// there is no other path to "role", so nothing client-supplied (a prop, a
// request body field, a query param) can ever grant admin access.
export async function getCurrentSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return getSession(token);
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) {
    const err = new Error("Not signed in.");
    err.status = 401;
    throw err;
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.role !== "Admin") {
    const err = new Error("Admin access required.");
    err.status = 403;
    throw err;
  }
  return session;
}
