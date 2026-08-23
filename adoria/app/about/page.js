import Link from "next/link";

export default function AboutPage() {
  return (
    <main>
      <section
        style={{
          backgroundColor: "var(--coffee)",
          backgroundImage: "radial-gradient(rgba(217, 171, 92, 0.25) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          color: "var(--cream)",
          padding: "96px 0 88px",
          textAlign: "center",
        }}
      >
        <div className="wrap animate-in" style={{ maxWidth: 620 }}>
          <h1 style={{ color: "var(--cream)", fontSize: 36, marginBottom: 10 }}>What is Cubelle?</h1>
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--gold-bright)", fontSize: 18 }}>
            For the moments worth archiving.
          </p>
        </div>
      </section>

      <section style={{ padding: "72px 0 96px" }}>
        <div className="wrap" style={{ maxWidth: 620 }}>
          <div className="card animate-in" style={{ padding: "44px 40px" }}>
            <p style={{ color: "#5a4a3c", marginBottom: 20 }}>
              Cubelle started as a way to never forget an anniversary. It's grown into
              something broader: a single, considered gift for the moments worth marking
              properly — a promotion, a new home, visiting someone well, or the quiet
              private dates only two people keep track of.
            </p>

            <h2 style={{ fontSize: 20, marginTop: 40, marginBottom: 12 }}>The box</h2>
            <p style={{ color: "#5a4a3c", marginBottom: 20 }}>
              Every edition shares the same craftsmanship: The Cubelles, hand-baked in Malaysia,
              in Dark, Milk, or White, set in a 15×15cm matte black box. Inside, a card in
              black stock and gold ink carries whatever you want said — a short line, or a
              full letter, depending on what the moment calls for.
            </p>

            <h2 style={{ fontSize: 20, marginTop: 40, marginBottom: 12 }}>Made for the moment</h2>
            <p style={{ color: "#5a4a3c", marginBottom: 0 }}>
              The box doesn't change — the occasion does. Each edition adapts its tone and
              card style to what it's actually for: romantic and personal for anniversaries,
              sleek and congratulatory for career wins, a thoughtful alternative to bringing
              fruit or flowers when visiting someone, or a limited seasonal drop timed to
              Malaysia's year-end holiday season.
            </p>
          </div>

          <div style={{ marginTop: 40, textAlign: "center" }}>
            <Link href="/#catalog" className="btn">
              Browse the catalog
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
