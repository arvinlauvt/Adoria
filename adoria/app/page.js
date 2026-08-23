import Image from "next/image";
import Link from "next/link";
import { PRODUCTS } from "../lib/products";
import Reveal from "../components/Reveal";

function Logo({ size = 60 }) {
  return (
    <Image
      src="/logo-icon.png"
      alt="Cubelle"
      width={size}
      height={size}
      priority
      style={{ width: size, height: "auto", objectFit: "contain" }}
    />
  );
}

function BoxArt() {
  // Placeholder packaging art until real product photography is in —
  // plain matte black box, no ribbon (there isn't one on the real box).
  return (
    <svg viewBox="0 0 200 200" style={{ width: "100%", height: "auto" }} aria-hidden="true">
      <rect x="18" y="18" width="164" height="164" rx="10" fill="#171012" stroke="rgba(217,171,92,0.35)" strokeWidth="1" />
      <circle cx="100" cy="100" r="26" fill="none" stroke="rgba(217,171,92,0.3)" strokeWidth="1.2" />
      <text
        x="100"
        y="109"
        textAnchor="middle"
        fontFamily="Fraunces, serif"
        fontSize="24"
        fill="rgba(217,171,92,0.5)"
      >
        C
      </text>
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      {/* Hero — tells them what Cubelle is before anything else */}
      <section
        style={{
          backgroundColor: "var(--coffee)",
          backgroundImage: "radial-gradient(rgba(217, 171, 92, 0.25) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          color: "var(--cream)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          padding: "64px 0",
        }}
      >
        <div className="wrap" style={{ textAlign: "center" }}>
          <div className="float animate-in" style={{ marginBottom: 8 }}>
            <Image
              src="/logo.png"
              alt="Cubelle"
              width={280}
              height={396}
              priority
              style={{ width: "clamp(180px, 32vw, 280px)", height: "auto", margin: "0 auto" }}
            />
          </div>
          <h1
            className="animate-in"
            style={{ color: "var(--cream)", fontSize: "clamp(2rem, 5vw, 3rem)", marginTop: 8 }}
          >
            Luxury gifting,<br />for the moment you're marking
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
            A luxury gift box — hand-baked Malaysian cookie cubes we call
            The Cubelles — set in a matte black box, with a message written
            in gold ink. Anniversaries, promotions, new homes, or simply
            visiting someone well — pick the box built for your occasion below.
          </p>
          <div
            className="animate-in"
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: 36,
              animationDelay: "0.2s",
            }}
          >
            <Link href="/about" className="btn-outline btn" style={{ borderColor: "var(--cream-deep)", color: "var(--cream)" }}>
              What is Cubelle?
            </Link>
            <a href="#catalog" className="btn" style={{ background: "var(--gold-bright)", color: "var(--coffee)" }}>
              Browse the catalog
            </a>
          </div>
        </div>
      </section>

      {/* Catalog — image + name only, no prices */}
      {/* Why Cubelle — three quiet value props to break up the flat scroll */}
      <section style={{ padding: "72px 0" }}>
        <div className="wrap" style={{ maxWidth: 860 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
            {[
              { title: "Hand-baked, not mass-produced", body: "Every Cubelle is baked in small batches — no factory line, no shortcuts." },
              { title: "Written, not printed", body: "Your message goes on in real gold ink, by hand, every time." },
              { title: "Timed, not guessed", body: "We build in time to land on the date that actually matters, not just \"a few days.\"" },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      margin: "0 auto 16px",
                      borderRadius: "50%",
                      border: "1px solid var(--gold)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--serif)",
                      color: "var(--gold)",
                      fontSize: 16,
                    }}
                  >
                    {i + 1}
                  </div>
                  <h3 style={{ fontSize: 16, marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: "#8a7a68", margin: 0 }}>{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — three-step process, so the page has real substance, not just a CTA */}
      <section style={{ padding: "8px 0 72px" }}>
        <div className="wrap" style={{ maxWidth: 900 }}>
          <h2 style={{ textAlign: "center", fontSize: 24, marginBottom: 40 }}>How it works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 28 }}>
            {[
              { step: "01", title: "Tell us the occasion", body: "Pick the box, the flavors, and whether it's a short note or a full letter." },
              { step: "02", title: "We hand-finish it", body: "Baked, boxed in matte black, message written in gold ink — by hand, every order." },
              { step: "03", title: "It arrives on time", body: "Timed delivery, tracked from your own Cubelle account, right up to your door." },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 0.08}>
                <div className="card" style={{ padding: 26 }}>
                  <div style={{ fontFamily: "var(--serif)", color: "var(--gold)", fontSize: 22, marginBottom: 10 }}>
                    {s.step}
                  </div>
                  <h3 style={{ fontSize: 16, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: "#8a7a68", margin: 0 }}>{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="catalog" style={{ padding: "64px 0 88px" }}>
        <div className="wrap" style={{ maxWidth: 920 }}>
          <h2 style={{ textAlign: "center", fontSize: 24, marginBottom: 40 }}>Choose your box</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 28 }}>
            {PRODUCTS.map((p, i) => {
              const card = (
                <Reveal delay={i * 0.08}>
                  <div
                    className="card"
                    style={{
                      padding: 0,
                      overflow: "hidden",
                      opacity: p.comingSoon ? 0.65 : 1,
                      position: "relative",
                    }}
                  >
                    <div style={{ height: 6, background: p.accent }} />
                    <div style={{ padding: 20 }}>
                      <BoxArt />
                      <h3 style={{ fontSize: 17, textAlign: "center", marginTop: 16 }}>{p.name}</h3>
                      {p.comingSoon && (
                        <div
                          style={{
                            textAlign: "center",
                            marginTop: 8,
                            fontSize: 12,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--gold)",
                            fontWeight: 600,
                          }}
                        >
                          Coming Soon
                        </div>
                      )}
                    </div>
                  </div>
                </Reveal>
              );
              return p.comingSoon ? (
                <div key={p.slug} style={{ cursor: "default" }}>
                  {card}
                </div>
              ) : (
                <Link key={p.slug} href={`/products/${p.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  {card}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 0 80px", textAlign: "center" }}>
        <Reveal>
          <p
            style={{
              fontFamily: "var(--script)",
              fontSize: 32,
              color: "var(--gold)",
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.3,
            }}
          >
            Some things deserve more than a text message.
          </p>
        </Reveal>
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
            <Logo size={64} />
          </div>
          <div style={{ fontSize: 13, display: "flex", gap: 20, justifyContent: "center" }}>
            <Link href="/track">Track your order</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
