import { cookies } from "next/headers";
import { getSession, SESSION_COOKIE } from "./session";

// The single choke point every admin route and /admin page must call.
// Reads the httpOnly cookie server-side and resolves role from Redis —
// there is no other path to "role", so nothing client-supplied (a prop, a
// request body field, a query param) can ever grant admin access.
// `await cookies()` rather than `cookies()`: Next 15 made it return a Promise,
// and awaiting a non-Promise is a no-op, so this one spelling works on both 14
// (what production builds) and 16 (what a fresh `npm install` currently gets).
// Without the await, every session lookup on 15+ throws — which is exactly
// what the next@16 upgrade would have hit.
export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
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
