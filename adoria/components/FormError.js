"use client";

/**
 * Renders the structured half of an API error — what happened, why, and what
 * to do — as three distinct lines instead of one long red paragraph.
 *
 * The API returns `what` / `why` / `action` separately precisely so this can
 * be laid out; run together they read as a wall of text and people skim past
 * the part that tells them what to do. `error` is the same content joined
 * into one string, so it stays the fallback for older responses and for
 * validation errors that only ever set that field.
 */
export default function FormError({ error, style }) {
  if (!error) return null;

  // A plain string, or a response that only carried the joined `error`.
  if (typeof error === "string") {
    return (
      <p className="error-text form-error" role="alert" style={{ marginBottom: 18, ...style }}>
        {error}
      </p>
    );
  }

  const { what, why, action, reference } = error;
  if (!what) {
    return (
      <p className="error-text form-error" role="alert" style={{ marginBottom: 18, ...style }}>
        {error.error || "Something went wrong."}
      </p>
    );
  }

  return (
    <div className="error-text form-error" role="alert" style={{ marginBottom: 18, ...style }}>
      <p style={{ margin: 0, fontWeight: 600 }}>{what}</p>
      {why && <p style={{ margin: "6px 0 0", opacity: 0.85 }}>{why}</p>}
      {action && <p style={{ margin: "6px 0 0" }}>{action}</p>}
      {reference && (
        // A reference code on its own is a dead end — it tells someone they
        // have a ticket number without telling them where to take it. The
        // wrapper appends "message us on WhatsApp" to the joined string, but
        // this component renders the fields separately, so that instruction
        // has to be here too, and as a real link rather than a suggestion.
        <p style={{ margin: "9px 0 0", fontSize: 13 }}>
          <a
            href={`https://wa.me/60106509189?text=${encodeURIComponent(
              `Hi Cubelle, I hit an error on the site. Reference ${reference}.`
            )}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent-text)" }}
          >
            Message us on WhatsApp
          </a>{" "}
          <span style={{ opacity: 0.7 }}>
            and quote <code>{reference}</code>
          </span>
        </p>
      )}
    </div>
  );
}
