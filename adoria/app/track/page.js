import { getCurrentSession } from "../../lib/auth/requireSession";
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
  const session = await getCurrentSession().catch(() => null);
  return <TrackClient signedInEmail={session?.email || ""} />;
}
