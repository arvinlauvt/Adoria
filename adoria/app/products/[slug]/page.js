import { notFound } from "next/navigation";
import { PRODUCTS, getProduct } from "../../../lib/products";
import OrderForm from "./OrderForm";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export default function ProductPage({ params }) {
  const product = getProduct(params.slug);
  if (!product) notFound();

  return (
    <main style={{ padding: "56px 0 96px" }}>
      <div className="wrap" style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 30, marginBottom: 6 }}>{product.name}</h1>
        <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--gold)", marginBottom: 20 }}>
          {product.tagline}
        </p>
        <p style={{ color: "#5a4a3c", marginBottom: 32 }}>{product.description}</p>

        <div className="card" style={{ padding: "22px 24px", marginBottom: 40, boxShadow: "none" }}>
          <div style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 12 }}>
            What's inside
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#5a4a3c", fontSize: 14, lineHeight: 1.8 }}>
            <li>Hand-baked cookie cubes — Dark, Milk, or White, mix freely across your boxes</li>
            <li>Matte black 15×15cm box</li>
            <li>Black-stock card, handwritten in gold ink — short message or full letter</li>
            {product.addon?.type === "flowers" && <li>Optional pressed-flower add-on, in your choice of color</li>}
            {product.addon?.type === "achievementToken" && <li>Optional engraved Achievement Token add-on</li>}
          </ul>
        </div>

        {product.comingSoon ? (
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--coffee)" }}>
              Coming soon.
            </p>
            <p style={{ color: "#5a4a3c", fontSize: 14 }}>
              This edition isn't open for orders yet — check back soon.
            </p>
          </div>
        ) : (
          <OrderForm product={product} />
        )}
      </div>
    </main>
  );
}
