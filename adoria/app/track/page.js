import { getCurrentSession } from "../../lib/auth/requireSession";
import SignOutButton from "../../components/SignOutButton";
import TrackClient from "./TrackClient";

export const metadata = {
  title: "Your orders · Cubelle",
};

// Depends on the session cookie, so it's resolved per request.
export const dynamic = "force-dynamic";

export default async function TrackPage() {
  // Signing in isn't required here — the email lookup still works for
  // guests, since most orders are placed without an account. A session just
  // means we already know which address to look up.
  // Unlike /api/track, a failure here degrades to the guest form rather than
  // throwing: this is a page, so an unhandled error replaces the whole screen
  // with Next's error page. The guest path still works, and if the session
  // store really is down the API call behind the form says so plainly.
  const session = await getCurrentSession().catch(() => null);

  return (
    <>
      {session && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 14,
            flexWrap: "wrap",
            padding: "14px 32px 0",
            fontSize: 13,
            color: "var(--text-muted)",
          }}
        >
          <span>
            Signed in as <strong style={{ color: "var(--text-body)" }}>{session.email}</strong>
          </span>
          <SignOutButton redirectTo="/track" />
        </div>
      )}
      <TrackClient signedInEmail={session?.email || ""} />
    </>
  );
}
