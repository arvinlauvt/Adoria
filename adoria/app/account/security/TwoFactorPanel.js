"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { EASE_PREMIUM } from "../../../lib/motion";
import FormField from "../../../components/FormField";
import { Spinner } from "../../../components/Skeleton";

export default function TwoFactorPanel({ initiallyEnabled }) {
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [stage, setStage] = useState("idle"); // idle | scanning | codes | disabling
  const [qr, setQr] = useState(null);
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Turning two-factor off only changed a heading from "Turned on" to "Not
  // turned on" — easy to miss entirely, which is the worst outcome for a
  // security setting: you walk away unsure whether it happened. Both
  // outcomes now announce themselves.
  const [flash, setFlash] = useState(null);

  async function startSetup() {
    setBusy(true);
    setError("");
    setFlash(null);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not start setup.");
      setQr(data.qrDataUrl);
      setSecret(data.secretBase32);
      setStage("scanning");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not turn on two-factor.");
      setBackupCodes(data.backupCodes);
      setEnabled(true);
      setStage("codes");
      setCode("");
      setFlash({ tone: "on", text: "Two-factor is now on. You'll be asked for a code next time you sign in." });
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not turn off two-factor.");
      setEnabled(false);
      setStage("idle");
      setPassword("");
      setFlash({
        tone: "off",
        text:
          "Two-factor is now OFF. Your password is the only thing protecting this account. " +
          "You can delete the Cubelle entry from your authenticator app — the old codes no longer work.",
      });
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_PREMIUM }}
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border-panel)",
        borderRadius: 10,
        boxShadow: "var(--shadow-card)",
        padding: "34px 32px 36px",
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--accent-text)" }}>
        Two-factor authentication
      </div>
      <h2 style={{ margin: "12px 0 6px", fontWeight: 400, fontSize: 24, color: "var(--text-heading)" }}>
        {enabled ? "Turned on" : "Not turned on"}
      </h2>
      <p style={{ margin: "0 0 26px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
        {enabled
          ? "Signing in asks for a code from your authenticator app as well as your password."
          : "Add a code from an authenticator app on top of your password, so a stolen password isn't enough on its own."}
      </p>

      {flash && (
        <div
          role="status"
          style={{
            marginBottom: 22,
            padding: "13px 16px",
            borderRadius: 8,
            fontSize: 14,
            lineHeight: 1.6,
            // Turning it OFF is the one worth colouring like a warning: it's a
            // downgrade, and someone who did it by accident needs to notice.
            background: flash.tone === "off" ? "rgba(190,90,60,.12)" : "rgba(90,150,90,.12)",
            border: `1px solid ${flash.tone === "off" ? "rgba(190,90,60,.4)" : "rgba(90,150,90,.4)"}`,
            color: "var(--text-body)",
          }}
        >
          <strong style={{ display: "block", marginBottom: 3 }}>
            {flash.tone === "off" ? "Two-factor turned off" : "Two-factor turned on"}
          </strong>
          {flash.text}
        </div>
      )}

      {error && (
        <p className="error-text form-error" role="alert" style={{ marginBottom: 18 }}>
          {error}
        </p>
      )}

      {stage === "idle" && !enabled && (
        <button className="btn" onClick={startSetup} disabled={busy} onMouseDown={(e) => e.preventDefault()}
          style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          {busy && <Spinner size={16} label="Preparing" />}
          {busy ? "Preparing…" : "Turn on two-factor"}
        </button>
      )}

      {stage === "idle" && enabled && (
        <button className="btn-outline btn" onClick={() => setStage("disabling")}>
          Turn off two-factor
        </button>
      )}

      {stage === "scanning" && (
        <div>
          <p style={{ margin: "0 0 6px", fontSize: 14, color: "var(--text-body)" }}>
            Scan this with an authenticator app, then enter the six-digit code it shows.
          </p>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Don&rsquo;t have one? <strong>Google Authenticator</strong>, <strong>Microsoft
            Authenticator</strong> and <strong>Authy</strong> are all free on iPhone and
            Android, and any of them works here. Install one, open it, and choose to add an
            account by scanning a code.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt="QR code for setting up two-factor authentication"
            width={190}
            height={190}
            style={{ borderRadius: 8, background: "#fff", padding: 10, marginBottom: 16 }}
          />
          <details style={{ marginBottom: 22 }}>
            <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>
              Can&rsquo;t scan it?
            </summary>
            <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--text-body)", wordBreak: "break-all" }}>
              Enter this key by hand: <strong>{secret}</strong>
            </p>
          </details>

          <form onSubmit={confirmCode} noValidate>
            <FormField
              id="totp-code"
              label="Six-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button type="submit" className="btn" disabled={busy} onMouseDown={(e) => e.preventDefault()}
                style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                {busy && <Spinner size={16} label="Confirming" />}
                {busy ? "Confirming…" : "Confirm and turn on"}
              </button>
              <button type="button" className="btn-outline btn" onClick={() => { setStage("idle"); setError(""); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {stage === "codes" && (
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text-body)", fontWeight: 600 }}>
            Save these backup codes somewhere safe.
          </p>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Each one signs you in once if you lose your phone. This is the only time
            they&rsquo;re shown — they aren&rsquo;t stored anywhere we can read them back.
          </p>
          <ul
            style={{
              listStyle: "none", margin: "0 0 22px", padding: 18,
              background: "var(--bg-deep)", borderRadius: 8,
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: 10, fontFamily: "monospace", fontSize: 15, letterSpacing: "0.05em",
              // --bg-deep is dark in both themes, so this needs a colour that
              // doesn't invert. --text-heading would be dark-on-dark in light
              // mode and render the codes invisible.
              color: "var(--cream)",
            }}
          >
            {backupCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <button className="btn" onClick={() => setStage("idle")}>
            I&rsquo;ve saved them
          </button>
        </div>
      )}

      {stage === "disabling" && (
        <form onSubmit={confirmDisable} noValidate>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--text-body)" }}>
            Confirm your password to turn two-factor off.
          </p>
          <FormField
            id="disable-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="submit" className="btn" disabled={busy} onMouseDown={(e) => e.preventDefault()}
              style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              {busy && <Spinner size={16} label="Confirming" />}
              {busy ? "Confirming…" : "Turn off two-factor"}
            </button>
            <button type="button" className="btn-outline btn" onClick={() => { setStage("idle"); setError(""); setPassword(""); }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
