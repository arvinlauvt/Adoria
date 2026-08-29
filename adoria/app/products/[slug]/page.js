import { notFound } from "next/navigation";
import { PRODUCTS, getProduct, CUBE_CAP } from "../../../lib/products";
import OrderForm from "./OrderForm";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export default function ProductPage({ params }) {
  const product = getProduct(params.slug);
  if (!product) notFound();

  return (
    <main>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 520px", maxWidth: 1440, margin: "0 auto" }} className="product-grid">
        <div
          className="dot-texture"
          style={{
            padding: "56px 32px 72px",
          }}
        >
          <div style={{ position: "sticky", top: 20 }}>
            <div
              style={{
                aspectRatio: "1/1",
                borderRadius: 6,
                background: "repeating-linear-gradient(135deg,#241812 0 11px,#1c130d 11px 22px)",
                marginBottom: 14,
              }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 34 }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1/1",
                    borderRadius: 4,
                    background: "repeating-linear-gradient(135deg,#2f2118 0 8px,#241812 8px 16px)",
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--accent-text)" }}>
              {product.edition}
            </div>
            <h1 style={{ margin: "14px 0 10px", fontWeight: 400, fontSize: "clamp(1.875rem, 6vw, 2.625rem)", lineHeight: 1.08, color: "var(--text-heading)" }}>
              {product.name}
            </h1>
            <p style={{ margin: "0 0 22px", fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 18, color: "var(--accent-text)" }}>
              {product.tagline}
            </p>
            <p style={{ margin: 0, maxWidth: 460, fontWeight: 300, fontSize: 15, lineHeight: 1.75, color: "var(--text-body)" }}>
              {product.description}
            </p>

            <div style={{ marginTop: 30, borderTop: "1px solid var(--border-panel)", paddingTop: 22 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent-text)", marginBottom: 14 }}>
                What's inside
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, fontWeight: 300, fontSize: 14, color: "var(--text-body)" }}>
                <span>Up to {CUBE_CAP} cubes: Noir Cubes, Cacao Sepia, mixed as you like</span>
                <span>Matte black 15×15cm box</span>
                <span>Your choice: black-stock card, or a full letter</span>
                {product.addon?.type === "flowers" && <span>Optional Flower Frame Kit, four colourways</span>}
                {product.addon?.type === "brassBookmark" && <span>Optional engraved Custom Brass Bookmark</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="dot-texture">
          <div style={{ marginTop: 56, padding: "40px 32px 56px", background: "var(--bg-panel)", borderRadius: "28px 28px 0 0", minHeight: 700, transition: "background-color 0.25s var(--ease-premium)" }}>
            {product.comingSoon ? (
              <div className="card" style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--text-heading)" }}>Coming soon.</p>
                <p style={{ color: "var(--text-body)", fontSize: 14 }}>This edition isn't open for orders yet. Check back soon.</p>
              </div>
            ) : (
              <OrderForm product={product} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
