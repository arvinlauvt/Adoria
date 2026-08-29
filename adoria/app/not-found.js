import Link from "next/link";

export const metadata = {
  title: "Page not found · Cubelle",
};

// Next renders this for any unmatched route, and for any page that calls
// notFound() — the product pages do, for an unknown slug.
//
// The links matter more than the apology: someone who mistyped a URL or
// followed a stale link needs a way back to the thing they wanted, not a
// dead end with a number on it.
export default function NotFound() {
  return (
    <main
      className="dot-texture"
      style={{
        minHeight: "62vh",
        display: "flex",
        alignItems: "center",
        padding: "80px 32px",
      }}
    >
      <div className="wrap" style={{ maxWidth: 520 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--accent-text)",
            marginBottom: 20,
          }}
        >
          Page not found
        </div>

        <h1
          style={{
            margin: 0,
            fontWeight: 400,
            fontSize: "clamp(1.9rem, 4vw, 2.6rem)",
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            color: "var(--text-heading)",
          }}
        >
          This page isn&rsquo;t here.
        </h1>

        <p
          style={{
            margin: "20px 0 0",
            fontWeight: 300,
            fontSize: 16,
            lineHeight: 1.75,
            color: "var(--text-body)",
          }}
        >
          Either the address has a typo in it, or something we used to have has
          moved. Nothing is wrong with your order or your account.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 34 }}>
          <Link href="/#catalog" className="btn">
            See the boxes
          </Link>
          <Link href="/track" className="btn-outline btn">
            Track an order
          </Link>
        </div>

        <p
          style={{
            margin: "30px 0 0",
            fontSize: 14,
            color: "var(--text-muted)",
            lineHeight: 1.7,
          }}
        >
          Looking for something specific?{" "}
          <a
            href="https://wa.me/60106509189?text=Hi%20Cubelle%2C%20I%20was%20looking%20for%20something%20on%20your%20site."
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent-text)" }}
          >
            Message us on WhatsApp
          </a>{" "}
          and we&rsquo;ll point you at it.
        </p>
      </div>
    </main>
  );
}
