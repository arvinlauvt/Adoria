// A skeleton is a promise about the layout that's about to arrive — these
// shapes are sized to match the real content precisely (see OrderCard in
// app/track/page.js) so nothing jumps or reflows once the real content
// swaps in.

export function SkeletonBlock({ width, height, style, ...rest }) {
  return <span className="skeleton" style={{ width, height, ...style }} {...rest} />;
}

export function Spinner({ size = 28, style, label = "Loading" }) {
  return (
    <span
      className="spinner"
      role="status"
      aria-label={label}
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 9)), ...style }}
    />
  );
}

// Mirrors OrderCard's exact dimensions (same padding, same heading size,
// same 5-stage timeline, same button row) so the swap from skeleton to
// real card has zero layout shift.
export function OrderCardSkeleton() {
  return (
    <div
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border-panel)",
        borderRadius: 10,
        boxShadow: "var(--shadow-card)",
        padding: "44px 40px 48px",
        marginBottom: 24,
      }}
      aria-hidden="true"
    >
      <SkeletonBlock width={130} height={11} />
      {/* Two lines, not one — the real heading ("Landing [full weekday,
          day, month]") commonly wraps to two lines, so a single-line
          skeleton would visibly shrink the card when real content lands. */}
      <SkeletonBlock width="85%" height={30} style={{ margin: "14px 0 6px" }} />
      <SkeletonBlock width="45%" height={30} style={{ margin: "0 0 12px" }} />
      <SkeletonBlock width="85%" height={14} style={{ margin: "0 0 30px" }} />

      <div style={{ display: "flex", flexDirection: "column" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "26px minmax(0,1fr)", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <SkeletonBlock width={11} height={11} style={{ marginTop: 5, borderRadius: 999 }} />
              {i < 4 && <span style={{ flex: 1, width: 1, background: "var(--border-panel)" }} />}
            </div>
            <div style={{ paddingBottom: 26 }}>
              <SkeletonBlock width={150 - i * 8} height={14} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 34, paddingTop: 22, borderTop: "1px solid var(--border-panel)", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <SkeletonBlock width={160} height={48} style={{ flex: 1, borderRadius: 999 }} />
        <SkeletonBlock width={160} height={48} style={{ flex: 1, borderRadius: 999 }} />
      </div>
    </div>
  );
}
