import Link from "next/link";

export default function AboutPage() {
  return (
    <main style={{ padding: "72px 0 96px" }}>
      <div className="wrap animate-in" style={{ maxWidth: 620 }}>
        <h1 style={{ fontSize: 32, marginBottom: 6 }}>What is Cubelle?</h1>
        <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--gold)", marginBottom: 28 }}>
          For the moments worth archiving.
        </p>

        <p style={{ color: "#5a4a3c", marginBottom: 20 }}>
          Cubelle started as a way to never forget an anniversary. It's grown into
          something broader: a single, considered gift for the moments worth marking
          properly — a promotion, a new home, visiting someone well, or the quiet
          private dates only two people keep track of.
        </p>

        <h2 style={{ fontSize: 20, marginTop: 40, marginBottom: 12 }}>The box</h2>
        <p style={{ color: "#5a4a3c", marginBottom: 20 }}>
          Every edition shares the same craftsmanship: The Cubelles, hand-baked in Malaysia,
          in Dark, Milk, or White, set in a 15×15cm matte black box finished with a
          copper ribbon. Inside, a card in black stock and gold ink carries whatever
          you want said — a short line, or a full letter, depending on what the moment
          calls for.
        </p>

        <h2 style={{ fontSize: 20, marginTop: 40, marginBottom: 12 }}>Made for the moment</h2>
        <p style={{ color: "#5a4a3c", marginBottom: 20 }}>
          The box doesn't change — the occasion does. Each edition adapts its tone and
          card style to what it's actually for: romantic and personal for anniversaries,
          sleek and congratulatory for career wins, a thoughtful alternative to bringing
          fruit or flowers when visiting someone, or a limited seasonal drop timed to
          Malaysia's year-end holiday season.
        </p>

        <div style={{ marginTop: 48, textAlign: "center" }}>
          <Link href="/#catalog" className="btn">
            Browse the catalog
          </Link>
        </div>
      </div>
    </main>
  );
}
