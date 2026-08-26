import Image from "next/image";
import Link from "next/link";
import { CUBE_CAP } from "../../lib/products";

export default function AboutPage() {
  return (
    <main>
      <section
        style={{
          backgroundColor: "var(--coffee)",
          backgroundImage: "radial-gradient(rgba(217, 171, 92, 0.2) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          padding: "80px 32px 64px",
          textAlign: "center",
        }}
      >
        <Image
          src="/logo-icon.png"
          alt=""
          width={96}
          height={64}
          className="animate-in"
          style={{ objectFit: "contain", opacity: 0.9, marginBottom: 26 }}
        />
        <h1 className="animate-in" style={{ margin: 0, fontWeight: 300, fontSize: "clamp(2.125rem, 7vw, 3rem)", color: "var(--cream)" }}>
          What is Cubelle?
        </h1>
        <p className="animate-in" style={{ margin: "16px 0 0", fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 18, color: "var(--gold-bright)" }}>
          For the moments worth archiving.
        </p>
      </section>

      <section
        style={{
          padding: "68px 32px 84px",
          backgroundImage: "radial-gradient(rgba(185, 138, 61, 0.3) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div className="wrap animate-in" style={{ maxWidth: 560 }}>
          <p style={{ margin: "0 0 34px", fontFamily: "var(--serif)", fontWeight: 300, fontSize: 21, lineHeight: 1.55, color: "var(--coffee-soft)" }}>
            Cubelle started as a way to never forget an anniversary. It grew into something
            broader: one considered gift for the moments that deserve marking properly.
          </p>
          <div style={{ height: 1, background: "rgba(43,28,20,.15)", margin: "0 0 34px" }} />

          <h2 style={{ margin: "0 0 12px", fontWeight: 400, fontSize: 24, color: "var(--coffee)" }}>The box</h2>
          <p style={{ margin: "0 0 32px", fontWeight: 300, fontSize: 16, lineHeight: 1.8, color: "#5a4a3c" }}>
            Every edition shares the same craft: up to {CUBE_CAP} Cubelles hand-baked in
            Malaysia — Noir Cubes or Cacao Sepia — set in a 15×15cm matte black box. Inside, a card
            in black stock and gold ink carries whatever you want said. A short line, or a full
            letter.
          </p>

          <h2 style={{ margin: "0 0 12px", fontWeight: 400, fontSize: 24, color: "var(--coffee)" }}>Made for the moment</h2>
          <p style={{ margin: "0 0 32px", fontWeight: 300, fontSize: 16, lineHeight: 1.8, color: "#5a4a3c" }}>
            The box doesn't change — the occasion does. Each edition adapts its tone and card
            style to what it's actually for: romantic for anniversaries, sleek for career wins,
            an upgrade on fruit and flowers when visiting someone.
          </p>

          <h2 id="delivery-and-dates" style={{ margin: "0 0 12px", fontWeight: 400, fontSize: 24, color: "var(--coffee)" }}>Why the date matters</h2>
          <p style={{ margin: "0 0 40px", fontWeight: 300, fontSize: 16, lineHeight: 1.8, color: "#5a4a3c" }}>
            Most gifts arrive whenever the courier gets round to it. We take the date first and
            work backwards — baking, writing, and dispatch are all scheduled against the day it
            needs to land.
          </p>

          <h2 style={{ margin: "0 0 16px", fontWeight: 400, fontSize: 24, color: "var(--coffee)" }}>From the founder</h2>
          <div
            style={{
              margin: "0 0 40px",
              padding: "28px 26px",
              background: "#fffaf0",
              border: "1px solid var(--cream-deep)",
              borderRadius: 12,
              boxShadow: "0 10px 30px rgba(43, 28, 20, 0.06)",
            }}
          >
            <p style={{ margin: "0 0 18px", fontWeight: 300, fontSize: 16, lineHeight: 1.8, color: "#5a4a3c" }}>
              Most gifting feels transactional — too loud, too generic, built to be forgotten by
              tomorrow. I started Cubelle simply because I wanted something better: a tactile
              experience that feels intentional. From the Cubelles themselves to hand-tied letters
              and custom brass keepsakes, every detail is designed to slow things down and make
              someone feel genuinely remembered.
            </p>
            <p style={{ margin: "0 0 18px", fontWeight: 300, fontSize: 16, lineHeight: 1.8, color: "#5a4a3c" }}>
              Growing up, I didn&apos;t receive many gifts — and the ones I did were never really
              thought through. Part of why I&apos;m building this is so more people get the chance
              to feel what a properly considered gift feels like, not just the ones who already do.
            </p>
            <p style={{ margin: "0 0 20px", fontWeight: 300, fontSize: 16, lineHeight: 1.8, color: "#5a4a3c" }}>
              Being remembered is the greatest gift of all. Welcome to Cubelle.
            </p>
            <p style={{ margin: 0, fontFamily: "var(--script)", fontSize: 30, color: "var(--gold)" }}>
              Arvin
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a7a68" }}>
              Founder, Cubelle — Kuantan, Pahang
            </p>
          </div>

          <div style={{ textAlign: "center" }}>
            <Link href="/#catalog" className="btn">
              Browse the catalog
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
