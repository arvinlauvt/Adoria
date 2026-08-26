"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cubelle-theme";

export default function ThemeToggle({ style }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(stored === "dark" || (stored !== "light" && systemDark));
  }, []);

  function toggle() {
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
    setIsDark(!isDark);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 32,
        height: 32,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        border: "1px solid rgba(217,171,92,.4)",
        background: "transparent",
        color: "var(--gold-bright)",
        fontSize: 14,
        lineHeight: 1,
        cursor: "pointer",
        transition: "border-color 0.2s var(--ease-premium), color 0.2s var(--ease-premium)",
        ...style,
      }}
    >
      <span suppressHydrationWarning>{isDark ? "☀" : "☾"}</span>
    </button>
  );
}
