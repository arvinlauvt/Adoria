"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { EASE_PREMIUM } from "../../../lib/motion";
import FormField from "../../../components/FormField";
import FormError from "../../../components/FormError";
import { Spinner } from "../../../components/Skeleton";

export default function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingToken = searchParams.get("pending") || "";

  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Forgiving: accept "123 456", "123-456", or a backup code, and only
  // insist there's something substantial there.
  const cleaned = code.replace(/[^0-9a-zA-Z]/g, "");
  const error = !cleaned ? "Enter the code from your authenticator app." : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (error) {
      setTouched(true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, code: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.what ? data : data.error || "That code didn't work.");
        // The pending window is gone; sending them back to the start is the
        // only way forward, so don't leave them typing into a dead form.
        if (data.restart) setTimeout(() => router.push("/login"), 2200);
        return;
      }
      router.push(data.role === "Admin" ? "/admin" : "/track");
      router.refresh();
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!pendingToken) {
    return (
      <p className="error-text">
        This page needs a sign-in already in progress.{" "}
        <a href="/login" style={{ color: "var(--accent-text)" }}>
          Start from sign in
        </a>
        .
      </p>
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
          id="code"
          label="Authentication code"
          hint="Six digits from your authenticator app, or one of your backup codes."
          inputMode="text"
          autoComplete="one-time-code"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onBlur={() => setTouched(true)}
          error={error}
          touched={touched}
        />

        {formError && (
          <FormError error={formError} style={{ marginBottom: 18 }} />
        )}

        <button
          type="submit"
          className="btn"
          disabled={submitting}
          onMouseDown={(e) => e.preventDefault()}
          style={{ opacity: error ? 0.55 : 1, display: "inline-flex", alignItems: "center", gap: 10 }}
          title={error ? "Enter your authentication code first" : undefined}
        >
          {submitting && <Spinner size={16} label="Verifying" />}
          {submitting ? "Verifying…" : "Verify"}
        </button>
      </form>
    </motion.div>
  );
}
