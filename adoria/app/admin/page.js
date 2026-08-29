import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth/requireSession";
import OrdersTable from "./OrdersTable";
import SignOutButton from "../../components/SignOutButton";

export const metadata = {
  title: "Fulfilment · Cubelle",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getCurrentSession();

  // Both checks happen here, on the server, before any of this page's markup
  // is produced. A non-admin never receives the dashboard and then has it
  // hidden — they never receive it. The API routes re-check independently,
  // so this gate is about not shipping the UI, not about protecting the data.
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "Admin") redirect("/track");

  return (
    <main className="dot-texture" style={{ padding: "56px 32px 96px" }}>
      <div className="wrap" style={{ maxWidth: 820 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
          <h1 style={{ fontSize: 30, margin: 0 }}>Fulfilment</h1>
          <SignOutButton />
        </div>
        <p style={{ color: "var(--text-body)", marginBottom: 32 }}>
          Signed in as {session.email}. Changes save as you make them, and show up
          on the customer&rsquo;s tracking page straight away.
        </p>
        <OrdersTable />
      </div>
    </main>
  );
}
