"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/#catalog", label: "The Catalog" },
  { href: "/about", label: "What is Cubelle" },
  { href: "/allergens", label: "Ingredients" },
  { href: "/track", label: "Track order" },
  // Reads as "Sign in" to a guest and lands a signed-in customer on their
  // own orders, so one link serves both without the header needing to know
  // who's looking (it's a static component; the page it points at resolves
  // the session server-side).
  { href: "/login", label: "Sign in" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header
      style={{
        position: "relative",
        background: "var(--bg-deep)",
        borderBottom: "1px solid rgba(217,171,92,.18)",
        transition: "background-color 0.25s var(--ease-premium)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 32px",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 2, textDecoration: "none" }} onClick={() => setOpen(false)}>
          {/* No nudge needed any more — the source image used to sit off-centre
              on a much larger canvas, and this offset compensated for it. */}
          <Image src="/logo-icon.png" alt="" width={44} height={44} style={{ objectFit: "contain" }} />
          <span
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 400,
              fontSize: 27,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--cream)",
            }}
          >
            Cubelle
          </span>
        </Link>

        <nav
          className="desktop-nav"
          style={{
            display: "flex",
            gap: 34,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(247,240,228,.72)",
          }}
        >
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} style={{ color: "inherit", textDecoration: "none" }}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontSize: 12, letterSpacing: "0.1em", color: "rgba(247,240,228,.6)" }}>MYR</span>
          <ThemeToggle />
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

        <div className="mobile-menu-btn" style={{ display: "none", alignItems: "center", gap: 16 }}>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              font: "600 11px/1 Manrope, sans-serif",
              letterSpacing: "0.14em",
              color: "var(--gold-bright)",
              cursor: "pointer",
            }}
          >
            {open ? "CLOSE" : "MENU"}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="mobile-menu-drawer"
          style={{
            display: "none",
            flexDirection: "column",
            padding: "8px 32px 28px",
            background: "var(--bg-deep)",
            borderTop: "1px solid rgba(217,171,92,.14)",
          }}
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                padding: "14px 0",
                borderBottom: "1px solid rgba(247,240,228,.1)",
                fontSize: 13,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(247,240,228,.85)",
                textDecoration: "none",
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/#catalog"
            onClick={() => setOpen(false)}
            className="btn"
            style={{
              marginTop: 20,
              justifyContent: "center",
              background: "var(--gold-bright)",
              color: "var(--btn-primary-text)",
            }}
          >
            Start a box
          </Link>
        </div>
      )}
    </header>
  );
}
