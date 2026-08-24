"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PRODUCTS, CUBE_CAP, LEAD_TIME_DAYS, PRICE_CARD } from "../lib/products";
import Reveal from "../components/Reveal";

const FILTERS = ["All occasions", "Romance", "Career", "Visiting"];

export default function Home() {
  const [filter, setFilter] = useState("All occasions");
  const visible = filter === "All occasions" ? PRODUCTS : PRODUCTS.filter((p) => p.occasionTag === filter);

  return (
    <main>
      {/* Hero — type-led, no product photo needed up front */}
      <section
        style={{
          position: "relative",
          backgroundColor: "var(--coffee)",
          backgroundImage: "radial-gradient(rgba(217, 171, 92, 0.22) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          overflow: "hidden",
          padding: "104px 32px 88px",
          minHeight: "88vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Image
          src="/logo-icon.png"
          alt=""
          width={1390}
          height={922}
          aria-hidden="true"
          className="float"
          style={{ position: "absolute", right: "-4vw", top: "41%", transform: "translateY(-50%)", width: "64vw", maxWidth: 1150, minWidth: 500, height: "auto", opacity: 0.16 }}
        />
        <div className="wrap" style={{ maxWidth: 900, position: "relative", width: "100%" }}>
          <div
            className="animate-in"
            style={{ fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 34 }}
          >
            Hand-baked in Malaysia · Written in gold ink
          </div>
          <h1
            className="animate-in"
            style={{ margin: 0, fontWeight: 300, fontSize: "clamp(2.625rem, 7.2vw, 5.75rem)", lineHeight: 0.98, letterSpacing: "-0.02em", color: "var(--cream)" }}
          >
            For the moments<br />
            worth <em style={{ fontStyle: "italic", fontWeight: 400, color: "var(--gold-bright)" }}>archiving</em>.
          </h1>
          <p
            className="animate-in"
            style={{ margin: "38px 0 0", maxWidth: 470, fontWeight: 300, fontSize: 17, lineHeight: 1.7, color: "rgba(247,240,228,.72)" }}
          >
            Hand-baked cookie cubes in a matte black box, with your message written by hand in
            real gold ink. One considered gift, timed to land on the date that matters.
          </p>
          <div className="animate-in" style={{ display: "flex", gap: 14, marginTop: 44, flexWrap: "wrap" }}>
            <a href="#catalog" className="btn" style={{ padding: "16px 34px", fontSize: 14, background: "var(--gold-bright)", color: "var(--coffee)" }}>
              Choose your box
            </a>
            <Link href="/about" className="btn-outline btn" style={{ padding: "16px 34px", fontSize: 14, borderColor: "rgba(247,240,228,.34)", color: "var(--cream)" }}>
              What is Cubelle?
            </Link>
          </div>
        </div>
      </section>

      {/* Stat strip — desktop only; the mobile home skips straight from hero to catalog */}
      <div className="stat-strip" style={{ display: "flex", flexWrap: "wrap", background: "var(--coffee-soft)", color: "rgba(247,240,228,.8)" }}>
        {["Small-batch baked", "Your words, on real paper", "Delivered on the date", "Kuantan delivery"].map((t) => (
          <div
            key={t}
            style={{
              flex: "1 1 200px",
              padding: "20px 20px",
              textAlign: "center",
              borderRight: "1px solid rgba(247,240,228,.1)",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {/* The box — stats grid. Desktop only; the mobile home goes straight from hero to catalog. */}
      <section id="the-box" className="the-box-section" style={{ padding: "96px 32px" }}>
        <div className="wrap" style={{ maxWidth: 1100 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.05fr)", gap: 72, alignItems: "center" }} className="responsive-two-col">
            <Reveal>
              <div
                style={{
                  aspectRatio: "4/5",
                  borderRadius: 6,
                  background: "repeating-linear-gradient(135deg,#e9dcc2 0 11px,#e1d1b2 11px 22px)",
                  border: "1px solid rgba(43,28,20,.14)",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: 20,
                }}
              >
                <span style={{ fontSize: 11, color: "#7a6448", background: "var(--cream)", padding: "6px 10px", borderRadius: 3 }}>
                  open box, overhead — cubes in the tray
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 22 }}>
                  The box
                </div>
                <h2 style={{ margin: 0, fontWeight: 400, fontSize: 44, lineHeight: 1.1, letterSpacing: "-0.01em", color: "var(--coffee)" }}>
                  Twenty-five cubes,<br />one card, zero shortcuts.
                </h2>
                <p style={{ margin: "26px 0 0", fontWeight: 300, fontSize: 16, lineHeight: 1.75, color: "#5a4a3c", maxWidth: 440 }}>
                  Every box is 15×15cm, matte black, and packed by hand: up to {CUBE_CAP} cubes in
                  Dark, Milk or White — as many as you want, mixed however you like — over a
                  black-stock card written in gold ink while the order is being packed.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginTop: 38, background: "rgba(43,28,20,.12)" }}>
                  {[
                    [`up to ${CUBE_CAP}`, "cubes per box, mixed freely"],
                    ["1,300", "characters in a full letter, or 200 on the card"],
                    [`RM${PRICE_CARD}`, "per box, before add-ons"],
                    [`${LEAD_TIME_DAYS} day`, "lead time, date-locked delivery"],
                  ].map(([big, small]) => (
                    <div key={big} style={{ background: "var(--cream)", padding: "20px 22px" }}>
                      <div style={{ fontFamily: "var(--serif)", fontSize: 30, color: "var(--coffee)" }}>{big}</div>
                      <div style={{ fontSize: 12, color: "#8a7a68", marginTop: 4 }}>{small}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Catalog — list rows with filter pills */}
      <section id="catalog" style={{ padding: "72px 32px 96px", background: "#fff" }}>
        <div className="wrap" style={{ maxWidth: 1100 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 20 }}>
            The catalog
          </div>
          <h2 style={{ margin: 0, fontWeight: 300, fontSize: "clamp(1.8rem, 4.6vw, 3.25rem)", lineHeight: 1.06, letterSpacing: "-0.02em", color: "var(--coffee)" }}>
            Three boxes.<br />Same craft, different occasion.
          </h2>
          <div style={{ display: "flex", gap: 10, marginTop: 32, flexWrap: "wrap" }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="btn"
                style={{
                  padding: "10px 20px",
                  fontSize: 12,
                  boxShadow: "none",
                  background: filter === f ? "var(--coffee)" : "transparent",
                  color: filter === f ? "var(--cream)" : "#5a4a3c",
                  border: filter === f ? "none" : "1px solid rgba(43,28,20,.24)",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 44 }}>
          {visible.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.06}>
              <Link
                href={`/products/${p.slug}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "230px minmax(0,1fr)",
                  gap: 40,
                  padding: "40px 0",
                  borderTop: "1px solid rgba(43,28,20,.12)",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "inherit",
                }}
                className="catalog-row"
              >
                <div
                  style={{
                    aspectRatio: "1/1",
                    borderRadius: 6,
                    background: "repeating-linear-gradient(135deg,#241812 0 11px,#1c130d 11px 22px)",
                  }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 170px", gap: 36, alignItems: "center" }} className="catalog-row-inner">
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--gold)" }}>
                      {p.edition}
                    </div>
                    <h3 style={{ margin: "11px 0 8px", fontWeight: 400, fontSize: 29, color: "var(--coffee)" }}>{p.name}</h3>
                    <p style={{ margin: "0 0 12px", fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 16, color: "var(--gold)" }}>
                      {p.tagline}
                    </p>
                    <p style={{ margin: 0, fontWeight: 300, fontSize: 14, lineHeight: 1.7, color: "#5a4a3c" }}>{p.shortDescription}</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
                      {p.badges.map((b) => (
                        <span key={b} style={{ padding: "6px 12px", borderRadius: 4, background: "#f2e8d4", fontSize: 11, color: "#7a6448" }}>
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div>
                      <div style={{ fontFamily: "var(--serif)", fontSize: 27, color: "var(--coffee)" }}>RM{PRICE_CARD}</div>
                      <div style={{ fontSize: 12, color: "#8a7a68", marginBottom: 16 }}>per box</div>
                    </div>
                    <span className="btn" style={{ padding: "13px 24px", fontSize: 13 }}>Build this box</span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
          </div>
        </div>
      </section>

      {/* Quote line — desktop only, per the mobile home spec */}
      <section className="quote-line" style={{ padding: "0 32px 88px", textAlign: "center", background: "#fff" }}>
        <Reveal>
          <p style={{ fontFamily: "Parisienne, cursive", fontSize: 34, lineHeight: 1.5, color: "var(--gold)", maxWidth: 480, margin: "0 auto" }}>
            Some things deserve more than a text message.
          </p>
        </Reveal>
      </section>
    </main>
  );
}
