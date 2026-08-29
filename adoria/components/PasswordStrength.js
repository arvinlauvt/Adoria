"use client";

import { useMemo } from "react";
// Imported directly (not via lib/auth/password.js) so bcrypt never gets
// pulled into the browser bundle alongside it.
import { checkPasswordStrength, MIN_LENGTH } from "../lib/auth/passwordStrength";

// Requirements are shown as they're typed, and each one ticks off the moment
// it's met, so the rules are never a surprise revealed at submit time. The
// server re-runs the identical check — this is feedback, not enforcement.
const LEVELS = [
  { label: "Too weak", color: "var(--danger)" },
  { label: "Too weak", color: "var(--danger)" },
  { label: "Still guessable", color: "#b8791f" },
  { label: "Good", color: "#5f7d4f" },
  { label: "Excellent", color: "#4a7a3a" },
];

export default function PasswordStrength({ password, inputs = [], id = "password-strength" }) {
  const result = useMemo(
    () => checkPasswordStrength(password, inputs),
    [password, inputs]
  );

  const longEnough = password.length >= MIN_LENGTH;
  const notGuessable = result.score >= 3;

  // Nothing typed yet: show the requirements, but no score bar or verdict —
  // an empty field isn't "too weak", it's just empty.
  const started = password.length > 0;
  const level = LEVELS[result.score] || LEVELS[0];

  return (
    <div id={id} style={{ marginTop: 10 }} aria-live="polite">
      {started && (
        <>
          <div
            style={{ display: "flex", gap: 4, marginBottom: 8 }}
            role="img"
            aria-label={`Password strength: ${level.label}`}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 999,
                  background: i <= result.score ? level.color : "var(--border-panel)",
                  transition: "background-color 0.25s var(--ease-premium)",
                }}
              />
            ))}
          </div>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: level.color, fontWeight: 600 }}>
            {level.label}
          </p>
        </>
      )}

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <Requirement met={longEnough}>At least {MIN_LENGTH} characters</Requirement>
        <Requirement met={notGuessable}>
          Not a common or easily guessed password
        </Requirement>
      </ul>

      {/* zxcvbn's own suggestion, only once it has something specific to say
          beyond the two rules above. */}
      {started && !result.ok && result.reason && !/at least \d+ characters/i.test(result.reason) && (
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-muted)" }}>{result.reason}</p>
      )}
    </div>
  );
}

function Requirement({ met, children }) {
  return (
    <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: met ? "var(--text-body)" : "var(--text-muted)" }}>
      <span
        aria-hidden="true"
        style={{
          width: 14,
          height: 14,
          flexShrink: 0,
          borderRadius: 999,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          lineHeight: 1,
          color: met ? "#fff" : "transparent",
          background: met ? "#5f7d4f" : "transparent",
          border: met ? "none" : "1.5px solid var(--border-panel-strong)",
          transition: "background-color 0.2s var(--ease-premium)",
        }}
      >
        ✓
      </span>
      {/* The visible tick is decorative; this carries the state to screen
          readers, which can't infer it from colour and a glyph. */}
      <span className="sr-only">{met ? "Requirement met:" : "Requirement not met:"}</span>
      {children}
    </li>
  );
}
