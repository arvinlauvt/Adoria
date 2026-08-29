import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign in · Cubelle",
};

export default function LoginPage() {
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
      </div>
    </main>
  );
}
