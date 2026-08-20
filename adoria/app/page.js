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
  // matte black box with a copper ribbon bow, like the physical box.
  return (
    <svg viewBox="0 0 200 200" style={{ width: "100%", height: "auto" }} aria-hidden="true">
      <rect x="18" y="18" width="164" height="164" rx="10" fill="#171012" />
      <rect x="18" y="90" width="164" height="14" fill={accent} />
      <path d="M100 90 C 78 68, 60 68, 60 90 C 60 100, 80 100, 100 90 Z" fill={accent} />
      <path d="M100 90 C 122 68, 140 68, 140 90 C 140 100, 120 100, 100 90 Z" fill={accent} />
      <path d="M100 90 L 90 112 L 100 106 L 110 112 Z" fill={accent} />
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      {/* Hero — tells them what Adoria is before anything else */}
      <section
        style={{
          backgroundColor: "var(--coffee)",
          backgroundImage: "radial-gradient(rgba(217, 171, 92, 0.25) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          color: "var(--cream)",
          padding: "80px 0 64px",
        }}
      >
        <div className="wrap" style={{ textAlign: "center" }}>
          <div className="float" style={{ color: "var(--gold-bright)", marginBottom: 20 }}>
            <Monogram size={44} />
          </div>
          <h1
            className="animate-in"
            style={{ color: "var(--cream)", fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            Luxury chocolate gifting,<br />for the moment you're marking
          </h1>
          <div
            className="animate-in"
            style={{
              width: 64,
              height: 3,
              background: "var(--gold-bright)",
              borderRadius: 2,
              margin: "18px auto",
              animationDelay: "0.1s",
            }}
          />
          <p
            className="animate-in"
            style={{ fontSize: 17, color: "var(--cream-deep)", maxWidth: 520, margin: "0 auto", animationDelay: "0.15s" }}
          >
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
            {PRODUCTS.map((p, i) => (
              <Link
                key={p.slug}
                href={`/products/${p.slug}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  className="card animate-in"
                  style={{ padding: 0, overflow: "hidden", animationDelay: `${0.1 + i * 0.08}s` }}
                >
                  <div style={{ height: 6, background: p.accent }} />
                  <div style={{ padding: 20 }}>
                    <BoxArt accent={p.accent} />
                    <h3 style={{ fontSize: 17, textAlign: "center", marginTop: 16 }}>{p.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer
        style={{
          backgroundColor: "var(--coffee)",
          backgroundImage: "radial-gradient(rgba(217, 171, 92, 0.25) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          color: "var(--cream-deep)",
          padding: "40px 0",
          textAlign: "center",
        }}
      >
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
