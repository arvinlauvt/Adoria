import { getCurrentSession } from "../../../../lib/auth/requireSession";
import { withErrorHandling } from "../../../../lib/errors";

// Never prerendered and never cached: the answer is per-request and depends
// entirely on the caller's session cookie. Without this Next tries to
// evaluate it at build time, and a cached response here would mean handing
// one visitor another visitor's identity.
export const dynamic = "force-dynamic";

// Who is signed in, resolved entirely server-side from the session store.
// The client can't assert its own identity or role — it can only ask.
export const GET = withErrorHandling(
  "me",
  async () => {
    const session = await getCurrentSession();
    if (!session) {
      return Response.json(
        {
          error: "You're not signed in. Sign in to see your account.",
          code: "not_signed_in",
        },
        { status: 401 }
      );
    }
    return Response.json({
      email: session.email,
      role: session.role,
    });
  },
  {
    what: "We couldn't check whether you're signed in.",
    note: "Your account is fine — this is only the check failing.",
  }
);
