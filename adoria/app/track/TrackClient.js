"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { OrderCardSkeleton, Spinner } from "../../components/Skeleton";

// If the search is still going after this long, swap the skeleton for a
// spinner — a skeleton promises "this exact shape, imminently"; past a
// few seconds that promise reads as broken, and an indefinite spinner is
// the more honest signal that something unusual is taking a while.
const SKELETON_TIMEOUT_MS = 4000;

const STAGES = [
  { key: "Order Confirmed", label: "Order confirmed", note: "payment received" },
  { key: "Baked & Packed", label: "Baked & packed" },
  { key: "Card Written", label: "Card written in gold ink" },
  { key: "Out for Delivery", label: "Out for delivery" },
  { key: "Delivered", label: "Delivered" },
];

function estimateArrival(orderDate, leadDays = 7) {
  if (!orderDate) return null;
  const d = new Date(orderDate);
  d.setDate(d.getDate() + leadDays);
  return d.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" });
}

function Timeline({ status }) {
  const idx = Math.max(0, STAGES.findIndex((s) => s.key === status));
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {STAGES.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <div key={s.key} style={{ display: "grid", gridTemplateColumns: "26px minmax(0,1fr)", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 999,
                  marginTop: 5,
                  background: done || current ? "var(--gold)" : "var(--bg-panel)",
                  border: done || current ? "none" : "2px solid var(--border-panel-strong)",
                }}
              />
              {i < STAGES.length - 1 && (
                <span style={{ flex: 1, width: 1, background: done ? "var(--gold)" : "var(--border-panel)" }} />
              )}
            </div>
            <div style={{ paddingBottom: 26 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: done || current ? "var(--text-heading)" : "var(--text-muted)" }}>{s.label}</div>
              {current && s.note && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>In progress</div>}
              {done && s.note && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{s.note}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }) {
  const arrival = estimateArrival(order.orderDate);
  return (
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-panel)", borderRadius: 10, boxShadow: "var(--shadow-card)", padding: "44px 40px 48px", marginBottom: 24, transition: "background-color 0.25s var(--ease-premium)" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--accent-text)" }}>
        Order {order.orderId}
      </div>
      <h1 style={{ margin: "14px 0 6px", fontWeight: 400, fontSize: 30, color: "var(--text-heading)" }}>
        {order.fulfillmentStatus === "Delivered" ? "Delivered" : arrival ? `Landing ${arrival}` : "On its way"}
      </h1>
      <p style={{ margin: "0 0 30px", fontSize: 14, color: "var(--text-muted)" }}>
        {order.chocolateBreakdown}
        {order.addonType && order.addonType !== "None" ? ` · ${order.addonType}${order.addonDetail ? `, ${order.addonDetail}` : ""}` : ""}
        {" · to "}
        {order.recipientName}
      </p>

      <Timeline status={order.fulfillmentStatus} />

      {order.trackingNumber && (
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
          {order.courier} — {order.trackingNumber}
        </p>
      )}

      <div style={{ marginTop: 34, paddingTop: 22, borderTop: "1px solid var(--border-panel)", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a
          href="https://wa.me/60106509189?text=Hi%20Cubelle%2C%20I%27d%20like%20to%20change%20the%20date%20on%20an%20order."
          target="_blank"
          rel="noreferrer"
          className="btn-outline btn"
          style={{ flex: 1, justifyContent: "center", minWidth: 160 }}
        >
          Change the date
        </a>
        <Link href="/#catalog" className="btn" style={{ flex: 1, justifyContent: "center", minWidth: 160 }}>
          Send another box
        </Link>
      </div>
    </div>
  );
}

export default function TrackClient({ signedInEmail = "" }) {
  const [email, setEmail] = useState(signedInEmail);
  const [orderId, setOrderId] = useState("");
  const [orders, setOrders] = useState(null);
  // A signed-in customer shouldn't have to type the address they signed in
  // with — their orders load straight away.
  const [loading, setLoading] = useState(Boolean(signedInEmail));
  const [error, setError] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShowSpinner(false);
      return;
    }
    const t = setTimeout(() => setShowSpinner(true), SKELETON_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [loading]);

  const runSearch = useCallback(async (searchEmail, searchOrderId) => {
    setLoading(true);
    setError("");
    setOrders(null);
    try {
      const params = new URLSearchParams({ email: searchEmail });
      if (searchOrderId) params.set("orderId", searchOrderId);
      const res = await fetch(`/api/track?${params}`);
      const data = await res.json();
      if (!res.ok) {
        // The server sends what happened, why, and what to do about it.
        // Passing the whole thing through beats collapsing it to "not found".
        throw new Error(data.error || "We couldn't complete that search. Try again in a moment.");
      }
      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (signedInEmail) runSearch(signedInEmail, "");
  }, [signedInEmail, runSearch]);

  function handleSearch(e) {
    e.preventDefault();
    runSearch(email, orderId);
  }

  return (
    <main className="dot-texture" style={{ padding: "56px 32px 96px" }}>
      <div className="wrap" style={{ maxWidth: 620 }}>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>
          {signedInEmail ? "Your orders" : "Track your order"}
        </h1>
        <p style={{ color: "var(--text-body)", marginBottom: 32 }}>
          {signedInEmail
            ? `Everything sent under ${signedInEmail}.`
            : "Enter the email you ordered with to see your card message, shipping details, and progress."}
        </p>

        {/* Signed in: the lookup form would just be asking for an address we
            already know. Signed out: it's the only way in. */}
        {!signedInEmail && (
          <form onSubmit={handleSearch} style={{ marginBottom: 36 }}>
            <div className="field">
              <label htmlFor="track-email">Email</label>
              <input id="track-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="track-order">Order ID</label>
              {/* Required for guests on purpose: an email address alone is
                  often public, so asking for something only the real customer
                  has stops anyone reading someone else's order. */}
              <span className="hint">
                It looks like ADR-20260901-123456, at the top of your confirmation email.
                Signed-in customers don&rsquo;t need this.
              </span>
              <input id="track-order" value={orderId} onChange={(e) => setOrderId(e.target.value)} required />
            </div>
            <button type="submit" className="btn" disabled={loading} onMouseDown={(e) => e.preventDefault()}>
              {loading ? "Looking…" : "Find my orders"}
            </button>
          </form>
        )}

        {error && <p className="error-text">{error}</p>}

        {loading && !showSpinner && <OrderCardSkeleton />}
        {loading && showSpinner && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 0", color: "var(--text-muted)", fontSize: 14 }}>
            <Spinner />
            Still looking — this is taking longer than usual.
          </div>
        )}

        {!loading && orders && orders.length === 0 && (
          <p>
            {signedInEmail
              ? "No orders yet. Your first box will show up here."
              : "No orders found under that email."}
          </p>
        )}
        {!loading && orders && orders.map((o) => <OrderCard key={o.orderId} order={o} />)}

        {signedInEmail && (
          <p style={{ marginTop: 36, fontSize: 14, color: "var(--text-muted)" }}>
            <a href="/account/security" style={{ color: "var(--accent-text)" }}>
              Account security
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
