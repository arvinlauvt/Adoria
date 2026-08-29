"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { EASE_PREMIUM } from "../../lib/motion";
import FormField from "../../components/FormField";
import { validateEmail } from "../../lib/validation";
import { Spinner } from "../../components/Skeleton";

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState("");

  const error = useMemo(() => validateEmail(email), [email]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (error) {
      setTouched(true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      setSent(data.message || "If that email has an account, a reset link is on its way.");
    } catch {
      setSent("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_PREMIUM }}
        style={{ color: "var(--text-body)" }}
      >
        {sent}
      </motion.p>
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
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          error={error}
          touched={touched}
        />
        <button
          type="submit"
          className="btn"
          disabled={submitting}
          onMouseDown={(e) => e.preventDefault()}
          style={{ opacity: error ? 0.55 : 1, display: "inline-flex", alignItems: "center", gap: 10 }}
          title={error ? "Enter your email address first" : undefined}
        >
          {submitting && <Spinner size={16} label="Sending" />}
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </motion.div>
  );
}
