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

  async function startSetup() {
    setBusy(true);
    setError("");
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
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--text-body)" }}>
            Scan this with your authenticator app, then enter the six-digit code it shows.
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
