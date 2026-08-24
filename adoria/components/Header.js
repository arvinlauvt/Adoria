"use client";

import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 32px",
        background: "var(--coffee)",
        borderBottom: "1px solid rgba(217,171,92,.18)",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
        <Image src="/logo-icon.png" alt="" width={30} height={30} style={{ objectFit: "contain" }} />
        <span
          style={{
            fontFamily: "var(--serif)",
            fontSize: 21,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--cream)",
          }}
        >
          Cubelle
        </span>
      </Link>

      <nav
        style={{
          display: "flex",
          gap: 30,
          fontSize: 12,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(247,240,228,.72)",
        }}
      >
        <Link href="/#catalog" style={{ color: "inherit", textDecoration: "none" }}>
          The Catalog
        </Link>
        <Link href="/about" style={{ color: "inherit", textDecoration: "none" }}>
          What is Cubelle
        </Link>
        <Link href="/allergens" style={{ color: "inherit", textDecoration: "none" }}>
          Ingredients
        </Link>
        <Link href="/track" style={{ color: "inherit", textDecoration: "none" }}>
          Track order
        </Link>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <span style={{ fontSize: 12, letterSpacing: "0.1em", color: "rgba(247,240,228,.6)" }}>MYR</span>
        <Link
          href="/#catalog"
          className="btn"
          style={{
            padding: "9px 18px",
            fontSize: 12,
            background: "transparent",
            border: "1px solid rgba(217,171,92,.55)",
            color: "var(--gold-bright)",
            boxShadow: "none",
          }}
        >
          Start a box
        </Link>
      </div>
    </header>
  );
}
