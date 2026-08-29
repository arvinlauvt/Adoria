import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata = {
  title: "Set a new password · Cubelle",
};

export default function ResetPasswordPage() {
  return (
    <main className="dot-texture" style={{ padding: "56px 32px 96px" }}>
      <div className="wrap" style={{ maxWidth: 460 }}>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Set a new password</h1>
        <p style={{ color: "var(--text-body)", marginBottom: 32 }}>
          Choose something long and hard to guess. A short phrase you&rsquo;ll remember
          beats a short password full of symbols.
        </p>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
