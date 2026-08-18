"use client";

import { useState } from "react";

const STEPS = ["Processing", "Shipped", "Delivered"];

function estimateArrival(orderDate) {
  if (!orderDate) return null;
  const d = new Date(orderDate);
  d.setDate(d.getDate() + 7);
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });
}

function ProgressBar({ status }) {
  const idx = STEPS.indexOf(status);
  return (
    <div style={{ display: "flex", alignItems: "center", margin: "18px 0" }}>
      {STEPS.map((step, i) => (
        <div key={step} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: i <= idx ? "var(--gold)" : "var(--cream-deep)",
              flexShrink: 0,
            }}
            title={step}
          />
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < idx ? "var(--gold)" : "var(--cream-deep)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h3 style={{ fontSize: 17, marginBottom: 2 }}>{order.orderId}</h3>
          <span style={{ fontSize: 13, color: "var(--gold)" }}>{order.productEdition}</span>
        </div>
        <span style={{ fontSize: 13, color: "#8a7a68" }}>
          {order.paymentStatus === "Paid" ? "Paid" : order.paymentStatus}
        </span>
      </div>

      <ProgressBar status={order.fulfillmentStatus} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8a7a68", marginBottom: 20 }}>
        {STEPS.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>

      <dl style={{ fontSize: 14, color: "var(--coffee-soft)", display: "grid", gap: 8 }}>
        <div>
          <dt style={{ fontWeight: 600, display: "inline" }}>For: </dt>
          <dd style={{ display: "inline", margin: 0 }}>{order.recipientName}</dd>
        </div>
        <div>
          <dt style={{ fontWeight: 600, display: "inline" }}>Boxes: </dt>
          <dd style={{ display: "inline", margin: 0 }}>{order.chocolateBreakdown}</dd>
        </div>
        {order.cardMessage && (
          <div>
            <dt style={{ fontWeight: 600 }}>Card message</dt>
            <dd style={{ margin: "4px 0 0", fontFamily: "var(--script)", fontSize: 20, color: "var(--gold)" }}>
              {order.cardMessage}
            </dd>
          </div>
        )}
        <div>
          <dt style={{ fontWeight: 600, display: "inline" }}>Shipping to: </dt>
          <dd style={{ display: "inline", margin: 0 }}>{order.address}</dd>
        </div>
        {order.trackingNumber && (
          <div>
            <dt style={{ fontWeight: 600, display: "inline" }}>Tracking: </dt>
            <dd style={{ display: "inline", margin: 0 }}>
              {order.courier} — {order.trackingNumber}
            </dd>
          </div>
        )}
        <div>
          <dt style={{ fontWeight: 600, display: "inline" }}>Estimated arrival: </dt>
          <dd style={{ display: "inline", margin: 0 }}>{estimateArrival(order.orderDate) || "—"}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function TrackPage() {
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrders(null);
    try {
      const params = new URLSearchParams({ email });
      if (orderId) params.set("orderId", orderId);
      const res = await fetch(`/api/track?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "56px 0 96px" }}>
      <div className="wrap" style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Your Orders</h1>
        <p style={{ color: "#5a4a3c", marginBottom: 32 }}>
          Enter the email you ordered with to see your card message, shipping details, and
          progress.
        </p>

        <form onSubmit={handleSearch} style={{ marginBottom: 36 }}>
          <div className="field">
            <label htmlFor="track-email">Email</label>
            <input id="track-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="track-order">Order ID (optional)</label>
            <span className="hint">Leave blank to see every order under this email.</span>
            <input id="track-order" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Looking…" : "Find my orders"}
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}

        {orders && orders.length === 0 && <p>No orders found under that email.</p>}
        {orders && orders.map((o) => <OrderCard key={o.orderId} order={o} />)}
      </div>
    </main>
  );
}
