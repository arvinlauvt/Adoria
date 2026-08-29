import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth/requireSession";
import SignupForm from "./SignupForm";

export const metadata = {
  title: "Create an account · Cubelle",
};

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  // Already signed in — offering to create a second account here is just a
  // way to lose track of the one they have.
  const session = await getCurrentSession().catch(() => null);
  if (session) redirect(session.role === "Admin" ? "/admin" : "/track");

  return (
    <main className="dot-texture" style={{ padding: "56px 32px 96px" }}>
      <div className="wrap" style={{ maxWidth: 460 }}>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Create an account</h1>
        <p style={{ color: "var(--text-body)", marginBottom: 32 }}>
          Keep every box you&rsquo;ve sent in one place, and skip retyping your details
          next time.
        </p>
        <Suspense fallback={null}>
          <SignupForm />
        </Suspense>
      </div>
    </main>
  );
}
