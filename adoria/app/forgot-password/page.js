import { Suspense } from "react";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata = {
  title: "Reset your password · Cubelle",
};

export default function ForgotPasswordPage() {
  return (
    <main className="dot-texture" style={{ padding: "56px 32px 96px" }}>
      <div className="wrap" style={{ maxWidth: 460 }}>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Reset your password</h1>
        <p style={{ color: "var(--text-body)", marginBottom: 32 }}>
          Enter your email and we&rsquo;ll send you a link to set a new password. The
          link works once and expires in 30 minutes.
        </p>
        <Suspense fallback={null}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
