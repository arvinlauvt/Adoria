"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { EASE_PREMIUM } from "../../lib/motion";
import { SkeletonBlock, Spinner } from "../../components/Skeleton";

const STAGES = [
  "Order Confirmed",
  "Baked & Packed",
  "Card Written",
  "Out for Delivery",
  "Delivered",
];

const COURIERS = ["", "J&T Express", "Pos Laju", "DHL eCommerce", "Ninja Van", "Collected in person"];

const SKELETON_TIMEOUT_MS = 4000;

export default function OrdersTable() {
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [filter, setFilter] = useState("open");

  useEffect(() => {
    if (!loading) {
      setShowSpinner(false);
      return;
    }
    const t = setTimeout(() => setShowSpinner(true), SKELETON_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/orders");
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) setError(data.error || "Could not load orders.");
        else setOrders(data.orders);
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(id, changes) {
    setSavingId(id);
    setError("");
    // Optimistic: the select should feel immediate. Rolled back below if the
    // save fails, so the screen never keeps a value the server rejected.
    const previous = orders;
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, ...changes } : o)));
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...changes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrders(previous);
        setError(data.error || "Could not save that change.");
        return;
      }
      setOrders((list) => list.map((o) => (o.id === id ? data.order : o)));
      setSavedId(id);
      setTimeout(() => setSavedId((cur) => (cur === id ? null : cur)), 1800);
    } catch {
      setOrders(previous);
      setError("Could not reach the server.");
    } finally {
      setSavingId(null);
    }
  }

  const visible = useMemo(() => {
    if (!orders) return [];
    if (filter === "all") return orders;
    return orders.filter((o) => o.fulfillmentStatus !== "Delivered");
  }, [orders, filter]);

  if (loading && !showSpinner) return <OrdersSkeleton />;

  if (loading && showSpinner) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 0", color: "var(--text-muted)", fontSize: 14 }}>
        <Spinner />
        Still loading orders — this is taking longer than usual.
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p className="error-text form-error" role="alert" style={{ marginBottom: 18 }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 22, alignItems: "center", flexWrap: "wrap" }}>
        <FilterButton active={filter === "open"} onClick={() => setFilter("open")}>
          Still to fulfil
        </FilterButton>
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          All orders
        </FilterButton>
        <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: "auto" }}>
          {visible.length} {visible.length === 1 ? "order" : "orders"}
        </span>
      </div>

      {visible.length === 0 && (
        <p style={{ color: "var(--text-muted)" }}>
          {filter === "open" ? "Nothing outstanding. Every order is delivered." : "No orders yet."}
        </p>
      )}

      {visible.map((order, i) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_PREMIUM, delay: Math.min(i * 0.03, 0.3) }}
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border-panel)",
            borderRadius: 10,
            boxShadow: "var(--shadow-card)",
            padding: "26px 28px 28px",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--accent-text)" }}>
              {order.orderId}
            </div>
            <div style={{ fontSize: 12, color: order.paymentStatus === "Paid" ? "var(--text-muted)" : "var(--danger)" }}>
              {order.paymentStatus || "Unpaid"}
            </div>
          </div>

          <h2 style={{ margin: "10px 0 4px", fontWeight: 400, fontSize: 21, color: "var(--text-heading)" }}>
            {order.productEdition}
            {order.quantity > 1 ? ` × ${order.quantity}` : ""} for {order.recipientName}
          </h2>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {order.cubeBreakdown}
          </p>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {order.address || "No address on file"}
            {order.occasionDate ? ` · wanted ${order.occasionDate}` : ""}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor={`status-${order.id}`}>Fulfilment stage</label>
              <select
                id={`status-${order.id}`}
                value={order.fulfillmentStatus}
                onChange={(e) => save(order.id, { fulfillmentStatus: e.target.value })}
                disabled={savingId === order.id}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor={`courier-${order.id}`}>Courier</label>
              <select
                id={`courier-${order.id}`}
                value={order.courier}
                onChange={(e) => save(order.id, { courier: e.target.value })}
                disabled={savingId === order.id}
              >
                {COURIERS.map((c) => (
                  <option key={c || "none"} value={c}>{c || "Not set"}</option>
                ))}
              </select>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor={`tracking-${order.id}`}>Tracking number</label>
              <input
                id={`tracking-${order.id}`}
                defaultValue={order.trackingNumber}
                placeholder="Paste when you have it"
                disabled={savingId === order.id}
                // Saved on blur rather than per keystroke: one write when
                // they're done, not one per character.
                onBlur={(e) => {
                  const next = e.target.value.trim();
                  if (next !== order.trackingNumber) save(order.id, { trackingNumber: next });
                }}
              />
            </div>
          </div>

          <div style={{ minHeight: 20, marginTop: 10, fontSize: 13, color: "var(--text-muted)" }}>
            {savingId === order.id && "Saving…"}
            {savedId === order.id && savingId !== order.id && "Saved."}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid ${active ? "var(--gold)" : "var(--border-panel-strong)"}`,
        background: active ? "var(--gold)" : "transparent",
        color: active ? "#fff" : "var(--text-body)",
        borderRadius: 999,
        padding: "7px 16px",
        fontSize: 13,
        fontFamily: "var(--sans)",
        cursor: "pointer",
        transition: "background-color 0.2s var(--ease-premium), border-color 0.2s var(--ease-premium)",
      }}
    >
      {children}
    </button>
  );
}

// Same footprint as a real order card above: eyebrow, two-line heading area,
// two detail lines, and the three-control row.
function OrdersSkeleton() {
  return (
    <div aria-hidden="true">
      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        <SkeletonBlock width={120} height={32} style={{ borderRadius: 999 }} />
        <SkeletonBlock width={100} height={32} style={{ borderRadius: 999 }} />
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border-panel)",
            borderRadius: 10,
            boxShadow: "var(--shadow-card)",
            padding: "26px 28px 28px",
            marginBottom: 16,
          }}
        >
          <SkeletonBlock width={150} height={11} />
          <SkeletonBlock width="70%" height={21} style={{ margin: "12px 0 8px" }} />
          <SkeletonBlock width="90%" height={13} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="60%" height={13} style={{ marginBottom: 24 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
            {[0, 1, 2].map((j) => (
              <div key={j}>
                <SkeletonBlock width={100} height={12} style={{ marginBottom: 8 }} />
                <SkeletonBlock width="100%" height={44} style={{ borderRadius: 8 }} />
              </div>
            ))}
          </div>
          <div style={{ minHeight: 20, marginTop: 10 }} />
        </div>
      ))}
    </div>
  );
}
