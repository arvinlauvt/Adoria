"use client";

import { useState } from "react";
import Image from "next/image";
import { PRICE_CARD, PRICE_LETTER, PRICE_ADDON, FLOWER_OPTIONS, computeTotalRM } from "../../../lib/products";
import Reveal from "../../../components/Reveal";

const FLAVORS = ["Dark", "Milk", "White"];
const MAX_CARD_MESSAGE = 200;
const MAX_LETTER = 1300;

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: "var(--serif)",
        fontStyle: "italic",
        color: "var(--gold)",
        fontSize: 14,
        letterSpacing: "0.03em",
        marginTop: 8,
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: "1px solid var(--cream-deep)",
      }}
    >
      {children}
    </div>
  );
}

export default function OrderForm({ product }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [occasionDate, setOccasionDate] = useState("");
  const [boxes, setBoxes] = useState([["Dark"]]);
  const [messageMode, setMessageMode] = useState("card"); // "card" | "letter"
  const [cardMessage, setCardMessage] = useState("");
  const [addonSelected, setAddonSelected] = useState(false);
  const [flowerChoice, setFlowerChoice] = useState(FLOWER_OPTIONS[0].name);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const total = computeTotalRM({ messageMode, addonSelected, quantity: boxes.length });
  const perBox = (messageMode === "letter" ? PRICE_LETTER : PRICE_CARD) + (addonSelected ? PRICE_ADDON : 0);

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
          messageType: messageMode === "letter" ? "Full Letter" : "Card Message",
          addonType: product.addon && addonSelected ? product.addon.label : "None",
          addonDetail: product.addon?.type === "flowers" && addonSelected ? flowerChoice : "",
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
    <Reveal>
      <div className="clipboard">
        <div className="clipboard-sheet">
          <form onSubmit={handleSubmit}>
          <SectionLabel>Your details</SectionLabel>
          <div className="field-row">
            <div className="field">
              <label htmlFor="name">Your full name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone number</label>
              <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <span className="hint">Your receipt and order tracking go here.</span>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <SectionLabel>Recipient & occasion</SectionLabel>
          <div className="field-row">
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
          </div>

          <SectionLabel>Your boxes</SectionLabel>
          <div className="field">
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
                    <input type="checkbox" checked={flavors.includes(f)} onChange={() => toggleBoxFlavor(i, f)} />
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

          <SectionLabel>Card message</SectionLabel>
          <div className="field">
            <label htmlFor="msg">{messageMode === "card" ? "Card message" : "Full letter"}</label>
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
                Short card message (RM{PRICE_CARD})
              </label>
              <label className="checkbox-row">
                <input
                  type="radio"
                  name="messageMode"
                  checked={messageMode === "letter"}
                  onChange={() => setMessageMode("letter")}
                />
                Full letter (RM{PRICE_LETTER})
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

          {product.addon && (
            <>
              <SectionLabel>Extra gifts</SectionLabel>
              <div className="field">
                <label className="checkbox-row" style={{ marginBottom: 12 }}>
                  <input type="checkbox" checked={addonSelected} onChange={(e) => setAddonSelected(e.target.checked)} />
                  Add {product.addon.label} (+RM{PRICE_ADDON} per box)
                </label>

                {addonSelected && product.addon.type === "flowers" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
                    {FLOWER_OPTIONS.map((f) => (
                      <label
                        key={f.name}
                        className="card"
                        style={{
                          padding: 8,
                          cursor: "pointer",
                          textAlign: "center",
                          border:
                            flowerChoice === f.name ? "2px solid var(--gold)" : "1px solid var(--cream-deep)",
                        }}
                      >
                        <input
                          type="radio"
                          name="flowerChoice"
                          value={f.name}
                          checked={flowerChoice === f.name}
                          onChange={() => setFlowerChoice(f.name)}
                          style={{ display: "none" }}
                        />
                        <div style={{ position: "relative", width: "100%", aspectRatio: "1", borderRadius: 8, overflow: "hidden", marginBottom: 6 }}>
                          <Image src={f.swatch} alt={f.name} fill sizes="(max-width: 480px) 45vw, 140px" style={{ objectFit: "cover" }} />
                        </div>
                        <span style={{ fontSize: 12 }}>{f.name}</span>
                      </label>
                    ))}
                  </div>
                )}

                {addonSelected && product.addon.type === "achievementToken" && (
                  <p className="hint">A small engraved token marking the achievement, tucked in beside the card.</p>
                )}
              </div>
            </>
          )}

          <SectionLabel>Delivery</SectionLabel>
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
              padding: "16px 0",
              borderTop: "1px solid var(--cream-deep)",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#8a7a68", marginBottom: 4 }}>
              <span>RM{perBox} per box × {boxes.length}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--serif)", fontSize: 20 }}>
              <span>Total</span>
              <span>RM{total}</span>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn" disabled={submitting} style={{ width: "100%", justifyContent: "center" }}>
            {submitting ? "Preparing your payment…" : `Continue to payment — RM${total}`}
          </button>
          </form>
        </div>
      </div>
    </Reveal>
  );
}
