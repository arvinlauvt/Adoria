import { Suspense } from "react";
import VerifyForm from "./VerifyForm";

export const metadata = {
  title: "Two-factor verification · Cubelle",
};

export default function VerifyPage() {
  return (
    <main className="dot-texture" style={{ padding: "56px 32px 96px" }}>
      <div className="wrap" style={{ maxWidth: 460 }}>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>One more step</h1>
        <p style={{ color: "var(--text-body)", marginBottom: 32 }}>
          Your password checked out. Enter the current code from your authenticator
          app to finish signing in.
        </p>
        <Suspense fallback={null}>
          <VerifyForm />
        </Suspense>
      </div>
    </main>
  );
}
