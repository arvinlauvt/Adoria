import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth/requireSession";
import { getUserById } from "../../lib/users";
import { findOrdersByEmail } from "../../lib/airtable";
import SignOutButton from "../../components/SignOutButton";

export const metadata = {
  title: "Your account · Cubelle",
};

// Everything here depends on who is asking, so it's resolved per request.
export const dynamic = "force-dynamic";

function Row({ label, value, muted }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 20,
        padding: "13px 0",
        borderBottom: "1px solid var(--border-panel)",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
      <span
        style={{
          fontSize: 14,
          color: muted ? "var(--text-muted)" : "var(--text-body)",
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default async function AccountPage() {
  // Resolved server-side. A signed-out visitor is redirected rather than
  // served the page and hidden with client-side code.
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/account");

  const record = await getUserById(session.userId);
  const fields = record?.fields || {};
  const twoFactorOn = Boolean(fields["TOTP Enabled"]);

  // The order count is the one genuinely useful number here. A failure to
  // read it shouldn't take the whole page down — the account details above
  // are still worth showing — so it degrades to "couldn't load" rather than
  // throwing, and says so instead of quietly showing zero.
  let orderCount = null;
  try {
    const orders = await findOrdersByEmail(session.email);
    orderCount = orders.length;
  } catch {
    orderCount = null;
  }

  const created = fields["Created At"];
  const memberSince = created
    ? new Date(created).toLocaleDateString("en-MY", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <main className="dot-texture" style={{ padding: "56px 32px 96px" }}>
      <div className="wrap" style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 30, margin: "0 0 6px" }}>Your account</h1>
        <p style={{ color: "var(--text-muted)", margin: "0 0 32px", fontSize: 14 }}>
          {session.email}
        </p>

        <div
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border-panel)",
            borderRadius: 10,
            boxShadow: "var(--shadow-card)",
            padding: "8px 26px 22px",
            marginBottom: 26,
          }}
        >
          <Row label="Email" value={session.email} />
          <Row label="Member since" value={memberSince} />
          <Row
            label="Orders"
            value={
              orderCount === null
                ? "Couldn't load just now"
                : orderCount === 0
                  ? "None yet"
                  : `${orderCount} order${orderCount === 1 ? "" : "s"}`
            }
            muted={orderCount === null}
          />
          <Row
            label="Two-factor"
            value={twoFactorOn ? "On" : "Off"}
            muted={!twoFactorOn}
          />
          {session.role === "Admin" && <Row label="Role" value="Admin" />}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/track" className="btn">
            Your orders
          </Link>
          <Link href="/account/security" className="btn-outline btn">
            Security
          </Link>
          {session.role === "Admin" && (
            <Link href="/admin" className="btn-outline btn">
              Admin
            </Link>
          )}
          <SignOutButton redirectTo="/" />
        </div>

        {!twoFactorOn && (
          <p
            style={{
              marginTop: 28,
              padding: "14px 18px",
              background: "var(--bg-panel)",
              border: "1px solid var(--border-panel)",
              borderRadius: 8,
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--text-body)",
            }}
          >
            Two-factor is off. Turning it on means a stolen password alone can&rsquo;t get
            into your account.{" "}
            <Link href="/account/security" style={{ color: "var(--accent-text)" }}>
              Set it up
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
