"use client";

import { useRouter } from "next/navigation";

// `redirectTo` differs by where this is used: signing out of /admin drops you
// at the sign-in page, since there's nothing left to see. Signing out of
// /track leaves you on /track, which still works as a guest — bouncing
// someone to a login form they didn't ask for reads as being thrown out.
export default function SignOutButton({ redirectTo = "/login" }) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(redirectTo);
    // Server components cache the session; without this the page can still
    // render as though you were signed in.
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
