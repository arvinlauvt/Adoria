"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      style={{
        border: "1px solid var(--border-panel-strong)",
        background: "transparent",
        color: "var(--text-body)",
        borderRadius: 999,
        padding: "7px 16px",
        fontSize: 13,
        fontFamily: "var(--sans)",
        cursor: "pointer",
      }}
    >
      Sign out
    </button>
  );
}
