// Shared shell for the policy pages so they read as one document set rather
// than three pages that drifted apart. `updated` is shown because a policy
// with no date tells a reader nothing about whether it still describes what
// the business does.
export default function LegalPage({ title, updated, children }) {
  return (
    <main className="dot-texture" style={{ padding: "64px 32px 96px" }}>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <h1
          style={{
            margin: 0,
            fontWeight: 400,
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            letterSpacing: "-0.01em",
            color: "var(--text-heading)",
          }}
        >
          {title}
        </h1>
        <p style={{ margin: "12px 0 40px", fontSize: 13, color: "var(--text-muted)" }}>
          Last updated {updated}
        </p>
        <div className="legal-body">{children}</div>
      </div>
    </main>
  );
}

export function Section({ heading, children }) {
  return (
    <section style={{ marginBottom: 34 }}>
      <h2
        style={{
          margin: "0 0 12px",
          fontWeight: 500,
          fontSize: 17,
          color: "var(--text-heading)",
        }}
      >
        {heading}
      </h2>
      <div
        style={{
          fontSize: 15,
          lineHeight: 1.75,
          fontWeight: 300,
          color: "var(--text-body)",
        }}
      >
        {children}
      </div>
    </section>
  );
}
