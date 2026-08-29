"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { EASE_PREMIUM } from "../../lib/motion";
import FormField from "../../components/FormField";
import { validateEmail } from "../../lib/validation";
import { Spinner } from "../../components/Skeleton";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Prefill from ?email= so a redirect back to sign-in (or a link from an
  // email) doesn't make the user retype what we already know.
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Computed regardless of touched state — the button dims from the very
  // first render, so it's clear there's more to do before anything is typed.
  const fieldErrors = useMemo(
    () => ({
      email: validateEmail(email),
      password: password ? null : "Password is required.",
    }),
    [email, password]
  );

  const isValid = !fieldErrors.email && !fieldErrors.password;

  function markTouched(field) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    // Blocked submit reveals every outstanding problem at once, rather than
    // making the user discover them one at a time.
    if (!isValid) {
      setTouched({ email: true, password: true });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Sign-in failed.");
        return;
      }

      if (data.twoFactorRequired) {
        // Password was right but no session exists yet — the code step
        // finishes the login. Carried in the URL, not stored anywhere.
        router.push(`/login/verify?pending=${encodeURIComponent(data.pendingToken)}`);
        return;
      }

      const next = searchParams.get("next");
      // Only same-origin relative paths, so ?next= can't be used to bounce a
      // freshly signed-in user to an attacker's site.
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(safeNext || (data.role === "Admin" ? "/admin" : "/track"));
      router.refresh();
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const missing = [
    fieldErrors.email ? "email" : null,
    fieldErrors.password ? "password" : null,
  ].filter(Boolean);

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
          onBlur={() => markTouched("email")}
          error={fieldErrors.email}
          touched={touched.email}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => markTouched("password")}
          error={fieldErrors.password}
          touched={touched.password}
        />

        {formError && (
          <p className="error-text form-error" role="alert" style={{ marginBottom: 18 }}>
            {formError}
          </p>
        )}

        <button
          type="submit"
          className="btn"
          disabled={submitting}
          // Keeps focus where it is, so clicking here doesn't blur the field
          // above and insert its error message mid-click. Without this the
          // button shifts down between mousedown and mouseup, the browser
          // fires no click at all, and the first press of "Sign in" silently
          // does nothing.
          onMouseDown={(e) => e.preventDefault()}
          // Stays clickable while invalid on purpose: clicking is what
          // surfaces the inline errors. Dimming signals "not ready" without
          // the dead-end of a disabled button that explains nothing.
          style={{ opacity: isValid ? 1 : 0.55, display: "inline-flex", alignItems: "center", gap: 10 }}
          title={isValid ? undefined : `Still needed: ${missing.join(" and ")}`}
        >
          {submitting && <Spinner size={16} label="Signing in" />}
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        {!isValid && (touched.email || touched.password) && (
          <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            Still needed: {missing.join(" and ")}.
          </p>
        )}
      </form>

      <p style={{ margin: "28px 0 0", fontSize: 14, color: "var(--text-muted)" }}>
        <a href="/forgot-password" style={{ color: "var(--accent-text)" }}>
          Forgot your password?
        </a>
      </p>
    </motion.div>
  );
}
