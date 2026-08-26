import Reveal from "../../components/Reveal";

const FLAVOR_COLUMNS = ["Noir Cubes", "Cacao Sepia"];

const ALWAYS_PRESENT = [
  ["Wheat", "Plain flour base"],
  ["Egg", "Whole egg in the dough"],
  ["Milk & dairy", "Butter, milk solids in the chocolate"],
  ["Soy", "Soy lecithin in the couverture"],
];

const BY_FLAVOUR = [
  ["Wheat / gluten", "Yes", "Yes"],
  ["Egg", "Yes", "Yes"],
  ["Milk / dairy", "Yes", "Yes"],
  ["Soy", "Yes", "Yes"],
  ["Tree nuts (almond, hazelnut)", "May contain", "May contain"],
  ["Peanuts", "May contain", "May contain"],
  ["Sesame", "May contain", "May contain"],
  ["Sulphites (dried fruit)", "May contain", "No"],
];

function cellColor(value) {
  if (value === "No") return "#a39684";
  if (value === "May contain") return "#8a7a68";
  return "#8a5a34";
}

export default function AllergensPage() {
  return (
    <main>
      <section
        style={{
          backgroundColor: "var(--coffee)",
          backgroundImage: "radial-gradient(rgba(217, 171, 92, 0.2) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          padding: "64px 32px 52px",
        }}
      >
        <div className="wrap" style={{ maxWidth: 900 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 20 }}>
            Ingredients &amp; allergens
          </div>
          <h1 style={{ margin: 0, fontWeight: 300, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", lineHeight: 1.06, color: "var(--cream)" }}>
            What&apos;s in the box,<br />and what to watch for.
          </h1>
          <p style={{ margin: "20px 0 0", maxWidth: 480, fontWeight: 300, fontSize: 15, lineHeight: 1.7, color: "rgba(247,240,228,.68)" }}>
            Every Cubelle is baked by hand in one small kitchen. That&apos;s the whole point — and it
            also means we can&apos;t promise separation between batches. Read this before you send a
            box to someone with a serious allergy.
          </p>
        </div>
      </section>

      <section
        style={{
          padding: "52px 32px 0",
          backgroundImage: "radial-gradient(rgba(185, 138, 61, 0.3) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div className="wrap" style={{ maxWidth: 900, paddingBottom: 96 }}>
          <Reveal>
          <h2 style={{ margin: "0 0 8px", fontWeight: 400, fontSize: 22, color: "var(--coffee)" }}>Always present</h2>
          <p style={{ margin: "0 0 22px", fontWeight: 300, fontSize: 14, lineHeight: 1.7, color: "#5a4a3c" }}>
            In every cube, every flavour, every box.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0,1fr))",
              gap: 1,
              background: "rgba(43,28,20,.12)",
              border: "1px solid rgba(43,28,20,.12)",
              borderRadius: 8,
              overflow: "hidden",
              marginBottom: 44,
            }}
            className="allergen-always-grid"
          >
            {ALWAYS_PRESENT.map(([name, note]) => (
              <div key={name} style={{ background: "#fffaf0", padding: "18px 20px" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--coffee)" }}>{name}</div>
                <div style={{ fontWeight: 300, fontSize: 13, color: "#8a7a68", marginTop: 5 }}>{note}</div>
              </div>
            ))}
          </div>
          </Reveal>

          <Reveal delay={0.05}>
          <h2 style={{ margin: "0 0 8px", fontWeight: 400, fontSize: 22, color: "var(--coffee)" }}>By flavour</h2>
          <p style={{ margin: "0 0 22px", fontWeight: 300, fontSize: 14, lineHeight: 1.7, color: "#5a4a3c" }}>
            Mix cubes freely — but the box travels as one tray, so treat the strictest column as
            the whole box.
          </p>
          <div style={{ border: "1px solid rgba(43,28,20,.12)", borderRadius: 8, overflow: "hidden", background: "#fffaf0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) repeat(2,minmax(0,1fr))", background: "var(--coffee)" }}>
              <div style={{ padding: "13px 18px", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(247,240,228,.6)" }}>
                Allergen
              </div>
              {FLAVOR_COLUMNS.map((f) => (
                <div key={f} style={{ padding: "13px 12px", textAlign: "center", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold-bright)" }}>
                  {f}
                </div>
              ))}
            </div>
            {BY_FLAVOUR.map(([allergen, ...values], i) => (
              <div
                key={allergen}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1.5fr) repeat(2,minmax(0,1fr))",
                  borderBottom: i < BY_FLAVOUR.length - 1 ? "1px solid rgba(43,28,20,.08)" : "none",
                  background: i % 2 ? "var(--cream)" : "transparent",
                }}
              >
                <div style={{ padding: "14px 18px", fontSize: 14, color: "var(--coffee-soft)" }}>{allergen}</div>
                {values.map((v, vi) => (
                  <div key={vi} style={{ padding: "14px 12px", textAlign: "center", fontSize: v === "May contain" ? 13 : 13, fontWeight: v === "May contain" ? 400 : 600, color: cellColor(v) }}>
                    {v}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ margin: "36px 0 0", padding: "24px 26px", border: "1px solid var(--gold)", borderRadius: 8, background: "#fdf6e6" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a5a34", marginBottom: 12 }}>
              Cross-contact
            </div>
            <p style={{ margin: 0, fontWeight: 300, fontSize: 14, lineHeight: 1.7, color: "#5a4a3c" }}>
              One kitchen, shared equipment. Nuts, peanuts and sesame are handled on the same
              surfaces as every batch, so we cannot call any Cubelle nut-free. If the recipient has
              a severe or anaphylactic allergy, please don&apos;t send a box.
            </p>
          </div>
          </Reveal>

          <Reveal delay={0.05}>
          <h2 style={{ margin: "44px 0 8px", fontWeight: 400, fontSize: 22, color: "var(--coffee)" }}>Add-ons &amp; packaging</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 6 }}>
            {[
              ["Flower Frame Kit", "Decorative only — not food grade, not for eating."],
              ["Custom Brass Bookmark", "Engraved metal, sealed separately from the tray."],
              ["Card & gold ink", "Non-toxic ink on black stock; keep the card out of the tray if storing."],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(43,28,20,.1)" }}>
                <span style={{ minWidth: 160, fontWeight: 600, fontSize: 13, color: "var(--coffee)" }}>{k}</span>
                <span style={{ fontWeight: 300, fontSize: 14, color: "#5a4a3c" }}>{v}</span>
              </div>
            ))}
          </div>
          </Reveal>

          <Reveal delay={0.05}>
          <h2 style={{ margin: "44px 0 8px", fontWeight: 400, fontSize: 22, color: "var(--coffee)" }}>Keeping them</h2>
          <p style={{ margin: 0, fontWeight: 300, fontSize: 15, lineHeight: 1.8, color: "#5a4a3c" }}>
            Best within 7 days of delivery. Store sealed, cool and dry, out of direct sun —
            Malaysian humidity will soften a cube faster than anything else. Do not refrigerate;
            the chocolate will bloom.
          </p>
          </Reveal>
        </div>
      </section>

      <div style={{ padding: "34px 32px 40px", background: "#fffaf0", borderTop: "1px solid rgba(43,28,20,.1)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <p style={{ margin: 0, maxWidth: 440, fontWeight: 300, fontSize: 13, lineHeight: 1.6, color: "#8a7a68" }}>
          Unsure about an ingredient? Message us before ordering — we&apos;ll check the batch that
          would be baked for your date.
        </p>
        <a
          href="https://wa.me/60106509189?text=Hi%20Cubelle%2C%20I%20have%20a%20question%20about%20allergens."
          target="_blank"
          rel="noreferrer"
          className="btn"
        >
          Ask about allergens
        </a>
      </div>
    </main>
  );
}
