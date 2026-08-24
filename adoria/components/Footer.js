export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "var(--coffee)",
        backgroundImage: "radial-gradient(rgba(217, 171, 92, 0.18) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        padding: "64px 32px 40px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
          gap: 40,
          maxWidth: 1100,
          margin: "0 auto",
        }}
        className="footer-grid"
      >
        <div>
          <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 26, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--gold-bright)" }}>
            Cubelle
          </div>
          <div style={{ marginTop: 8, fontSize: 9, letterSpacing: "0.28em", color: "rgba(217,171,92,.62)" }}>
            BOUTIQUE GIFTING ATELIER
          </div>
          <p style={{ margin: "20px 0 0", fontSize: 13, lineHeight: 1.7, color: "rgba(247,240,228,.55)", maxWidth: 250 }}>
            Baked, packed and delivered in Kuantan, Pahang.
          </p>
        </div>

        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>
            Shop
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: "rgba(247,240,228,.7)" }}>
            <a href="/products/anniversary" style={{ color: "inherit", textDecoration: "none" }}>Anniversary</a>
            <a href="/products/congratulations" style={{ color: "inherit", textDecoration: "none" }}>Congratulations</a>
            <a href="/products/hostess" style={{ color: "inherit", textDecoration: "none" }}>Hostess</a>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>
            Help
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: "rgba(247,240,228,.7)" }}>
            <a href="/track" style={{ color: "inherit", textDecoration: "none" }}>Track your order</a>
            <a href="/allergens" style={{ color: "inherit", textDecoration: "none" }}>Delivery &amp; dates</a>
            <a href="/allergens" style={{ color: "inherit", textDecoration: "none" }}>Allergens</a>
            <a href="https://wa.me/60106509189" target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>Contact</a>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>
            Letters
          </div>
          <p style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.6, color: "rgba(247,240,228,.6)" }}>
            Seasonal drops, once or twice a year.
          </p>
          <div style={{ display: "flex", borderBottom: "1px solid rgba(247,240,228,.28)", paddingBottom: 8, fontSize: 13, color: "rgba(247,240,228,.45)" }}>
            your@email.com
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: "44px auto 0",
          paddingTop: 22,
          borderTop: "1px solid rgba(247,240,228,.14)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "rgba(247,240,228,.4)",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span>© 2026 Cubelle</span>
        <span>Terms · Privacy · Refunds</span>
      </div>
    </footer>
  );
}
