"use client";

import { useState } from "react";

const FLAVORS = ["Dark", "Milk", "White"];
const PRICE_PER_BOX = 25;
const MAX_CARD_MESSAGE = 200;
const MAX_LETTER = 1200;

export default function OrderForm({ product }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [occasionDate, setOccasionDate] = useState("");
  const [boxes, setBoxes] = useState([["Dark"]]);
  const [messageMode, setMessageMode] = useState("card"); // "card" | "letter"
  const [cardMessage, setCardMessage] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const total = boxes.length * PRICE_PER_BOX;

  function addBox() {
    if (boxes.length >= 12) return;
    setBoxes([...boxes, ["Dark"]]);
  }
  function removeBox(i) {
    if (boxes.length <= 1) return;
    setBoxes(boxes.filter((_, idx) => idx !== i));
  }
  function toggleBoxFlavor(i, flavor) {
    setBoxes(
      boxes.map((flavors, idx) => {
        if (idx !== i) return flavors;
        const has = flavors.includes(flavor);
        if (has) {
          // Keep at least one flavor selected per box.
          return flavors.length === 1 ? flavors : flavors.filter((f) => f !== flavor);
        }
        return [...flavors, flavor];
      })
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const missingOccasionDate = product.occasionDateRequired && !occasionDate;
    if (!name || !phone || !email || !recipientName || missingOccasionDate || !street || !city || !state || !postcode) {
      setError("Please fill in every field before continuing.");
      return;
    }

    setSubmitting(true);
    try {
      const breakdown = boxes
        .map((flavors, i) => `Box ${i + 1}: ${flavors.join(" + ")}`)
        .join("; ");

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          recipientName,
          occasionDate: occasionDate || null,
          productEdition: product.edition,
          quantity: boxes.length,
          chocolateBreakdown: breakdown,
          cardMessage,
          messageType: messageMode === "letter" ? "Full letter" : "Card message",
          street,
          city,
          state,
          postcode,
          amountRM: total,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Could not save your order.");

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          recordId: orderData.recordId,
          name,
          email,
          phone,
          amountRM: total,
        }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutData.error || "Could not start payment.");

      window.location.href = checkoutData.paymentUrl;
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="clipboard">
      <div className="clipboard-sheet">
        <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="name">Your full name</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="field">
        <label htmlFor="phone">Phone number</label>
        <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <span className="hint">Your receipt and order tracking go here.</span>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div className="field">
        <label htmlFor="recipient">Recipient's name</label>
        <input id="recipient" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
      </div>

      <div className="field">
        <label htmlFor="date">
          {product.occasionDateLabel}
          {product.occasionDateRequired ? "" : " (optional)"}
        </label>
        <input
          id="date"
          type="date"
          value={occasionDate}
          onChange={(e) => setOccasionDate(e.target.value)}
          required={product.occasionDateRequired}
        />
      </div>

      <div className="field">
        <label>Your boxes</label>
        <span className="hint">Each box can hold more than one flavor, like a mixed tray.</span>
        {boxes.map((flavors, i) => (
          <div key={i} className="card" style={{ padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <strong style={{ fontSize: 13, color: "var(--coffee-soft)" }}>Box {i + 1}</strong>
              <button
                type="button"
                className="btn-outline btn"
                onClick={() => removeBox(i)}
                disabled={boxes.length <= 1}
                aria-label={`Remove box ${i + 1}`}
                style={{ padding: "4px 12px", fontSize: 13 }}
              >
                Remove
              </button>
            </div>
            {FLAVORS.map((f) => (
              <label key={f} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={flavors.includes(f)}
                  onChange={() => toggleBoxFlavor(i, f)}
                />
                {f} Chocolate
              </label>
            ))}
          </div>
        ))}
        <button
          type="button"
          className="btn-outline btn"
          onClick={addBox}
          style={{ padding: "8px 14px", alignSelf: "start", width: "fit-content" }}
        >
          + Add another box
        </button>
      </div>

      <div className="field">
        <label htmlFor="msg">
          {messageMode === "card" ? "Card message" : "Full letter"}
        </label>
        <div style={{ display: "flex", gap: 18, marginBottom: 4 }}>
          <label className="checkbox-row">
            <input
              type="radio"
              name="messageMode"
              checked={messageMode === "card"}
              onChange={() => {
                setMessageMode("card");
                setCardMessage((m) => m.slice(0, MAX_CARD_MESSAGE));
              }}
            />
            Short card message
          </label>
          <label className="checkbox-row">
            <input
              type="radio"
              name="messageMode"
              checked={messageMode === "letter"}
              onChange={() => setMessageMode("letter")}
            />
            Full letter
          </label>
        </div>
        <span className="hint">
          {(messageMode === "card" ? MAX_CARD_MESSAGE : MAX_LETTER) - cardMessage.length} characters left
          {messageMode === "card"
            ? " — the small details are what make it land."
            : " — this replaces the card entirely, so write as much as the moment deserves."}
        </span>
        <textarea
          id="msg"
          rows={messageMode === "card" ? 4 : 10}
          maxLength={messageMode === "card" ? MAX_CARD_MESSAGE : MAX_LETTER}
          value={cardMessage}
          onChange={(e) => setCardMessage(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="street">Street address / house unit number</label>
        <input id="street" value={street} onChange={(e) => setStreet(e.target.value)} required />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" placeholder="e.g., Kuantan" value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="state">State</label>
          <input id="state" placeholder="e.g., Pahang" value={state} onChange={(e) => setState(e.target.value)} required />
        </div>
      </div>

      <div className="field">
        <label htmlFor="postcode">Postcode</label>
        <input id="postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} required />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "16px 0",
          borderTop: "1px solid var(--cream-deep)",
          marginBottom: 20,
          fontFamily: "var(--serif)",
          fontSize: 18,
        }}
      >
        <span>{boxes.length} box{boxes.length > 1 ? "es" : ""}</span>
        <span>RM{total}</span>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn" disabled={submitting} style={{ width: "100%", justifyContent: "center" }}>
        {submitting ? "Preparing your payment…" : `Continue to payment — RM${total}`}
      </button>
        </form>
      </div>
    </div>
  );
}
