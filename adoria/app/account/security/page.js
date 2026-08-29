import { redirect } from "next/navigation";
import { getCurrentSession } from "../../../lib/auth/requireSession";
import { getUserById } from "../../../lib/users";
import TwoFactorPanel from "./TwoFactorPanel";

export const metadata = {
  title: "Security · Cubelle",
};

// Rendered per-request: the whole page depends on who is asking.
export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  // Resolved on the server from the session cookie. A signed-out visitor
  // never receives this page's contents at all, rather than being shown it
  // and hidden with client-side code.
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login?next=/account/security");
  }

  const record = await getUserById(session.userId);
  const enabled = Boolean(record?.fields?.["TOTP Enabled"]);

  return (
    <main className="dot-texture" style={{ padding: "56px 32px 96px" }}>
      <div className="wrap" style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Security</h1>
        <p style={{ color: "var(--text-body)", marginBottom: 32 }}>
          Signed in as {session.email}.
        </p>
        <TwoFactorPanel initiallyEnabled={enabled} />
      </div>
    </main>
  );
}
