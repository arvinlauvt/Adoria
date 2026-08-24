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
          width={54}
          height={54}
          className="animate-in"
          style={{ opacity: 0.9, marginBottom: 26 }}
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
            Malaysia — Dark, Milk, or White — set in a 15×15cm matte black box. Inside, a card
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
