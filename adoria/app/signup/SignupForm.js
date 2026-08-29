"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { EASE_PREMIUM } from "../../lib/motion";
import FormField from "../../components/FormField";
import FormError from "../../components/FormError";
import PasswordStrength from "../../components/PasswordStrength";
import { validateEmail } from "../../lib/validation";
import { checkPasswordStrength } from "../../lib/auth/passwordStrength";
import { Spinner } from "../../components/Skeleton";

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [existing, setExisting] = useState(false);

  const strength = useMemo(
    () => checkPasswordStrength(password, email ? [email] : []),
    [password, email]
  );

  const fieldErrors = {
    email: validateEmail(email),
    password: strength.ok ? null : strength.reason,
  };
  const isValid = !fieldErrors.email && !fieldErrors.password;

  const missing = [
    fieldErrors.email ? "a valid email" : null,
    fieldErrors.password ? "a stronger password" : null,
  ].filter(Boolean);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setExisting(false);
    if (!isValid) {
      setTouched({ email: true, password: true });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.what ? data : data.error || "Could not create your account.");
        setExisting(Boolean(data.existing));
        return;
      }
      router.push("/track");
      router.refresh();
    } catch {
      setFormError({
        what: "We couldn't reach the site's server.",
        why: "The request didn't get a reply, which usually means the connection dropped part-way.",
        action: "Check you're online and try again. Your account was not created.",
      });
    } finally {
      setSubmitting(false);
    }
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
          hint="We'll use this for order updates."
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={fieldErrors.email}
          touched={touched.email}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          error={fieldErrors.password}
          touched={touched.password}
        >
          <PasswordStrength password={password} inputs={email ? [email] : []} />
        </FormField>

        {formError && (
          <div style={{ marginBottom: 18 }}>
            <FormError error={formError} style={{ marginBottom: existing ? 6 : 0 }} />
            {existing && (
              <a href={`/login?email=${encodeURIComponent(email.trim())}`} style={{ color: "var(--accent-text)" }}>
                Go to sign in
              </a>
            )}
          </div>
        )}

        <button
          type="submit"
          className="btn"
          disabled={submitting}
          onMouseDown={(e) => e.preventDefault()}
          style={{ opacity: isValid ? 1 : 0.55, display: "inline-flex", alignItems: "center", gap: 10 }}
          title={isValid ? undefined : `Still needed: ${missing.join(" and ")}`}
        >
          {submitting && <Spinner size={16} label="Creating account" />}
          {submitting ? "Creating your account…" : "Create account"}
        </button>

        {!isValid && (touched.email || touched.password) && (
          <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            Still needed: {missing.join(" and ")}.
          </p>
        )}
      </form>

      <p style={{ margin: "28px 0 0", fontSize: 14, color: "var(--text-muted)" }}>
        Already have an account?{" "}
        <a href="/login" style={{ color: "var(--accent-text)" }}>
          Sign in
        </a>
        .
      </p>
    </motion.div>
  );
}
