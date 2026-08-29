import { getCurrentSession } from "../../../../lib/auth/requireSession";

// Never prerendered and never cached: the answer is per-request and depends
// entirely on the caller's session cookie. Without this Next tries to
// evaluate it at build time, and a cached response here would mean handing
// one visitor another visitor's identity.
export const dynamic = "force-dynamic";

// Who is signed in, resolved entirely server-side from the session store.
// The client can't assert its own identity or role — it can only ask.
export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return Response.json({ error: "Not signed in." }, { status: 401 });
    }
    return Response.json({
      email: session.email,
      role: session.role,
    });
  } catch (err) {
    console.error("Session lookup failed:", err);
    return Response.json({ error: "Unavailable." }, { status: 503 });
  }
}
