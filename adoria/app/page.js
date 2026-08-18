import Link from "next/link";
import { PRODUCTS } from "../lib/products";

function Monogram({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <text x="20" y="27" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="18" fill="currentColor">
        A
      </text>
    </svg>
  );
}

function BoxArt({ accent }) {
  // Placeholder packaging art until real product photography is in —
  // matte box + copper ribbon, tinted per edition.
  return (
    <svg viewBox="0 0 200 200" style={{ width: "100%", height: "auto" }} aria-hidden="true">
      <rect x="20" y="20" width="160" height="160" rx="4" fill="#171012" />
      <rect x="20" y="92" width="160" height="16" fill={accent} />
      <rect x="92" y="20" width="16" height="160" fill={accent} />
      <circle cx="100" cy="100" r="14" fill="none" stroke={accent} strokeWidth="2" />
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      {/* Hero — tells them what Adoria is before anything else */}
      <section style={{ background: "var(--coffee)", color: "var(--cream)", padding: "80px 0 64px" }}>
        <div className="wrap" style={{ textAlign: "center" }}>
          <div style={{ color: "var(--gold-bright)", marginBottom: 20 }}>
            <Monogram size={44} />
          </div>
          <h1 style={{ color: "var(--cream)", fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            Luxury chocolate gifting,<br />for the moment you're marking
          </h1>
          <p style={{ fontSize: 17, color: "var(--cream-deep)", maxWidth: 520, margin: "18px auto 0" }}>
            Hand-molded Malaysian chocolate, boxed in matte black and copper, with a
            message written in gold ink. Anniversaries, promotions, new homes, or simply
            visiting someone well — pick the box built for your occasion below.
          </p>
        </div>
      </section>

      {/* Catalog — image + name only, no prices */}
      <section style={{ padding: "64px 0 88px" }}>
        <div className="wrap" style={{ maxWidth: 920 }}>
          <h2 style={{ textAlign: "center", fontSize: 24, marginBottom: 40 }}>Choose your box</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 28 }}>
            {PRODUCTS.map((p) => (
              <Link
                key={p.slug}
                href={`/products/${p.slug}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="card" style={{ padding: 20 }}>
                  <BoxArt accent={p.accent} />
                  <h3 style={{ fontSize: 17, textAlign: "center", marginTop: 16 }}>{p.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ background: "var(--coffee)", color: "var(--cream-deep)", padding: "40px 0", textAlign: "center" }}>
        <div className="wrap">
          <div style={{ color: "var(--gold)", marginBottom: 12 }}>
            <Monogram size={28} />
          </div>
          <div style={{ fontSize: 13, display: "flex", gap: 20, justifyContent: "center" }}>
            <Link href="/track">Track your order</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
