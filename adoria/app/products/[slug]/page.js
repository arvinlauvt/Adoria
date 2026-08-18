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
        <p style={{ color: "#5a4a3c", marginBottom: 40 }}>{product.description}</p>

        <OrderForm product={product} />
      </div>
    </main>
  );
}
