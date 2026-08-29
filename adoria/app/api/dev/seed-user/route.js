import { createUser, findUserByEmail } from "../../../../lib/users";
import { hashPassword } from "../../../../lib/auth/password";
import { inMemoryStoreAllowed } from "../../../../lib/devStore";

// Test-only: creates a user in the in-memory dev store so the login flow can
// be exercised without Airtable. Gated on the same opt-in flag as the dev
// store itself, so it 404s in any real deployment — an unguarded endpoint
// that mints accounts (and could mint an Admin) is exactly the kind of thing
// that must not be reachable in production.
export async function POST(req) {
  if (!inMemoryStoreAllowed()) {
    return new Response("Not found", { status: 404 });
  }

  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = body.role === "Admin" ? "Admin" : "Customer";

  if (!email || !password) {
    return Response.json({ error: "email and password required" }, { status: 400 });
  }
  if (await findUserByEmail(email)) {
    return Response.json({ error: "already exists" }, { status: 409 });
  }

  const record = await createUser({
    Email: email,
    "Password Hash": await hashPassword(password),
    Role: role,
    "TOTP Enabled": false,
    "Created At": new Date().toISOString(),
  });

  return Response.json({ ok: true, id: record.id, role });
}
