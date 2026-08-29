import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth/requireSession";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign in · Cubelle",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Already signed in: showing a sign-in form would be a dead end. Send them
  // where they were going instead — this is also what lets one "Sign in"
  // link in the header work for signed-in customers too.
  const session = await getCurrentSession().catch(() => null);
  if (session) redirect(session.role === "Admin" ? "/admin" : "/track");

  return (
    <main className="dot-texture" style={{ padding: "56px 32px 96px" }}>
      <div className="wrap" style={{ maxWidth: 460 }}>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Sign in</h1>
        <p style={{ color: "var(--text-body)", marginBottom: 32 }}>
          Your orders, your saved details, and your card messages, all in one place.
        </p>
        {/* useSearchParams needs a Suspense boundary to prerender. */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <p style={{ margin: "28px 0 0", fontSize: 14, color: "var(--text-muted)" }}>
          New here?{" "}
          <a href="/signup" style={{ color: "var(--accent-text)" }}>
            Create an account
          </a>
          .
        </p>
      </div>
    </main>
  );
}
