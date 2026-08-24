"use client";

import Link from "next/link";
import { useState } from "react";

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
                  background: done || current ? "var(--gold)" : "var(--cream)",
                  border: done || current ? "none" : "2px solid rgba(43,28,20,.22)",
                }}
              />
              {i < STAGES.length - 1 && (
                <span style={{ flex: 1, width: 1, background: done ? "var(--gold)" : "rgba(43,28,20,.16)" }} />
              )}
            </div>
            <div style={{ paddingBottom: 26 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: done || current ? "var(--coffee)" : "#8a7a68" }}>{s.label}</div>
              {current && s.note && <div style={{ fontSize: 13, color: "#8a7a68", marginTop: 4 }}>In progress</div>}
              {done && s.note && <div style={{ fontSize: 13, color: "#8a7a68", marginTop: 4 }}>{s.note}</div>}
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
    <div style={{ background: "#fffaf0", border: "1px solid rgba(43,28,20,.12)", borderRadius: 10, boxShadow: "0 2px 6px rgba(43,28,20,.08)", padding: "44px 40px 48px", marginBottom: 24 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--gold)" }}>
        Order {order.orderId}
      </div>
      <h1 style={{ margin: "14px 0 6px", fontWeight: 400, fontSize: 30, color: "var(--coffee)" }}>
        {order.fulfillmentStatus === "Delivered" ? "Delivered" : arrival ? `Landing ${arrival}` : "On its way"}
      </h1>
      <p style={{ margin: "0 0 30px", fontSize: 14, color: "#8a7a68" }}>
        {order.chocolateBreakdown}
        {order.addonType && order.addonType !== "None" ? ` · ${order.addonType}${order.addonDetail ? `, ${order.addonDetail}` : ""}` : ""}
        {" · to "}
        {order.recipientName}
      </p>

      <Timeline status={order.fulfillmentStatus} />

      {order.trackingNumber && (
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#8a7a68" }}>
          {order.courier} — {order.trackingNumber}
        </p>
      )}

      <div style={{ marginTop: 34, paddingTop: 22, borderTop: "1px solid rgba(43,28,20,.12)", display: "flex", gap: 12, flexWrap: "wrap" }}>
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
    <main style={{ padding: "56px 32px 96px", backgroundImage: "radial-gradient(rgba(185,138,61,.3) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
      <div className="wrap" style={{ maxWidth: 620 }}>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Track your order</h1>
        <p style={{ color: "#5a4a3c", marginBottom: 32 }}>
          Enter the email you ordered with to see your card message, shipping details, and progress.
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
