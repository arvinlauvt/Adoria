"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { EASE_PREMIUM } from "../../lib/motion";
import FormField from "../../components/FormField";
import FormError from "../../components/FormError";
import PasswordStrength from "../../components/PasswordStrength";
import { checkPasswordStrength } from "../../lib/auth/passwordStrength";
import { Spinner } from "../../components/Skeleton";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);

  const strength = useMemo(() => checkPasswordStrength(password), [password]);

  const fieldErrors = {
    password: strength.ok ? null : strength.reason,
    confirm: !confirm
      ? "Confirm your new password."
      : confirm !== password
      ? "The two passwords don't match."
      : null,
  };
  const isValid = !fieldErrors.password && !fieldErrors.confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!isValid) {
      setTouched({ password: true, confirm: true });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.what ? data : data.error || "Could not reset your password.");
        return;
      }
      setDone(true);
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <p className="error-text">
        This reset link is incomplete. Request a new one from the{" "}
        <a href="/forgot-password" style={{ color: "var(--accent-text)" }}>
          reset page
        </a>
        .
      </p>
    );
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_PREMIUM }}
      >
        <p style={{ color: "var(--text-body)", marginBottom: 24 }}>
          Your password is updated. You can sign in with it now.
        </p>
        <button className="btn" onClick={() => router.push("/login")}>
          Go to sign in
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_PREMIUM }}
    >
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          error={fieldErrors.password}
          touched={touched.password}
        >
          <PasswordStrength password={password} />
        </FormField>

        <FormField
          id="confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
          error={fieldErrors.confirm}
          touched={touched.confirm}
        />

        {formError && (
          <FormError error={formError} style={{ marginBottom: 18 }} />
        )}

        <button
          type="submit"
          className="btn"
          disabled={submitting}
          onMouseDown={(e) => e.preventDefault()}
          style={{ opacity: isValid ? 1 : 0.55, display: "inline-flex", alignItems: "center", gap: 10 }}
          title={isValid ? undefined : "The password doesn't meet the requirements yet"}
        >
          {submitting && <Spinner size={16} label="Saving" />}
          {submitting ? "Saving…" : "Set new password"}
        </button>
      </form>
    </motion.div>
  );
}
