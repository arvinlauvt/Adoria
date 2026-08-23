"use client";

import { useState } from "react";
import { PRICE_CARD, PRICE_LETTER, PRICE_ADDON, FLOWER_OPTIONS, computeTotalRM } from "../../../lib/products";
import Reveal from "../../../components/Reveal";

const FLAVORS = ["Dark", "Milk", "White"];
const MAX_CARD_MESSAGE = 200;
const MAX_LETTER = 1300;

function StepHeader({ index, total, title, subtitle }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          height: 2,
          background: "var(--cream-deep)",
          borderRadius: 2,
          marginBottom: 22,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${((index + 1) / total) * 100}%`,
            background: "var(--gold)",
            borderRadius: 2,
            transition: "width 0.4s var(--ease-premium)",
          }}
        />
      </div>
      <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>
        Step {index + 1} of {total}
      </div>
      <h2 style={{ fontSize: 24, marginBottom: subtitle ? 6 : 0 }}>{title}</h2>
      {subtitle && <p style={{ color: "#8a7a68", fontSize: 14, margin: 0 }}>{subtitle}</p>}
    </div>
  );
}

export default function OrderForm({ product }) {
  const steps = ["details", "boxes", "message", ...(product.addon ? ["addon"] : []), "delivery", "review"];
  const [step, setStep] = useState(0);

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

  function validateStep(key) {
    if (key === "details") {
      if (!name || !phone || !email) return "Please fill in your name, phone, and email.";
    }
    if (key === "boxes") {
      // always at least one flavor per box by construction
    }
    if (key === "delivery") {
      const missingOccasionDate = product.occasionDateRequired && !occasionDate;
      if (missingOccasionDate) return `Please add the ${product.occasionDateLabel.toLowerCase()}.`;
      if (!recipientName) return "Please add the recipient's name.";
      if (!street || !city || !state || !postcode) return "Please complete the delivery address.";
    }
    return null;
  }

  function goNext() {
    const err = validateStep(steps[step]);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function goBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      const breakdown = boxes.map((flavors, i) => `Box ${i + 1}: ${flavors.join(" + ")}`).join("; ");

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

  const key = steps[step];

  return (
    <Reveal>
      <div className="card" style={{ padding: "40px 36px" }}>
        <StepHeader
          index={step}
          total={steps.length}
          title={
            {
              details: "Your details",
              boxes: "Your boxes",
              message: "Your message",
              addon: `Add ${product.addon?.label || "an extra gift"}?`,
              delivery: "Recipient & delivery",
              review: "Review & pay",
            }[key]
          }
          subtitle={
            {
              details: "So we can reach you about your order.",
              boxes: "Each box can hold more than one flavor, like a mixed tray.",
              message: "A short line, or a full letter — your call.",
              addon: "A small extra, tucked in beside the card.",
              delivery: "Who it's for, and where it's going.",
              review: "Everything before you pay.",
            }[key]
          }
        />

        {key === "details" && (
          <>
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
          </>
        )}

        {key === "boxes" && (
          <div className="field">
            {boxes.map((flavors, i) => (
              <div key={i} className="card" style={{ padding: 14, marginBottom: 10, boxShadow: "none" }}>
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
            <button type="button" className="btn-outline btn" onClick={addBox} style={{ padding: "8px 14px" }}>
              + Add another box
            </button>
          </div>
        )}

        {key === "message" && (
          <div className="field">
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
                Short card message (RM{PRICE_CARD}/box)
              </label>
              <label className="checkbox-row">
                <input
                  type="radio"
                  name="messageMode"
                  checked={messageMode === "letter"}
                  onChange={() => setMessageMode("letter")}
                />
                Full letter (RM{PRICE_LETTER}/box)
              </label>
            </div>
            <span className="hint">
              {(messageMode === "card" ? MAX_CARD_MESSAGE : MAX_LETTER) - cardMessage.length} characters left
              {messageMode === "card"
                ? " — the small details are what make it land."
                : " — this replaces the card entirely, so write as much as the moment deserves."}
            </span>
            <textarea
              rows={messageMode === "card" ? 4 : 10}
              maxLength={messageMode === "card" ? MAX_CARD_MESSAGE : MAX_LETTER}
              value={cardMessage}
              onChange={(e) => setCardMessage(e.target.value)}
            />
          </div>
        )}

        {key === "addon" && product.addon && (
          <div className="field">
            <label className="checkbox-row" style={{ marginBottom: 16 }}>
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
                      boxShadow: "none",
                      border: flowerChoice === f.name ? "2px solid var(--gold)" : "1px solid var(--cream-deep)",
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
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        borderRadius: 8,
                        marginBottom: 6,
                        background: f.color,
                        border: "1px solid rgba(43,28,20,0.1)",
                      }}
                    />
                    <span style={{ fontSize: 12 }}>{f.name}</span>
                  </label>
                ))}
              </div>
            )}

            {addonSelected && product.addon.type === "achievementToken" && (
              <p className="hint">A small engraved token marking the achievement, tucked in beside the card.</p>
            )}
          </div>
        )}

        {key === "delivery" && (
          <>
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
          </>
        )}

        {key === "review" && (
          <div>
            <dl style={{ fontSize: 14, color: "var(--coffee-soft)", display: "grid", gap: 12, marginBottom: 24 }}>
              <div>
                <dt style={{ fontWeight: 600 }}>Boxes</dt>
                <dd style={{ margin: "2px 0 0" }}>
                  {boxes.map((f, i) => `Box ${i + 1}: ${f.join(" + ")}`).join(" · ")}
                </dd>
              </div>
              <div>
                <dt style={{ fontWeight: 600 }}>Message</dt>
                <dd style={{ margin: "2px 0 0" }}>{messageMode === "letter" ? "Full letter" : "Short card message"}</dd>
              </div>
              {product.addon && (
                <div>
                  <dt style={{ fontWeight: 600 }}>Extra gift</dt>
                  <dd style={{ margin: "2px 0 0" }}>
                    {addonSelected ? `${product.addon.label}${flowerChoice && product.addon.type === "flowers" ? ` — ${flowerChoice}` : ""}` : "None"}
                  </dd>
                </div>
              )}
              <div>
                <dt style={{ fontWeight: 600 }}>Recipient</dt>
                <dd style={{ margin: "2px 0 0" }}>{recipientName}</dd>
              </div>
              <div>
                <dt style={{ fontWeight: 600 }}>Delivering to</dt>
                <dd style={{ margin: "2px 0 0" }}>
                  {street}, {city}, {state} {postcode}
                </dd>
              </div>
            </dl>

            <div style={{ padding: "16px 0", borderTop: "1px solid var(--cream-deep)", marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#8a7a68", marginBottom: 4 }}>
                <span>RM{perBox} per box × {boxes.length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--serif)", fontSize: 22 }}>
                <span>Total</span>
                <span>RM{total}</span>
              </div>
            </div>
          </div>
        )}

        {error && <p className="error-text" style={{ marginTop: 16 }}>{error}</p>}

        <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
          {step > 0 && (
            <button type="button" className="btn-outline btn" onClick={goBack} style={{ flex: "none" }}>
              Back
            </button>
          )}
          {key !== "review" ? (
            <button type="button" className="btn" onClick={goNext} style={{ flex: 1, justifyContent: "center" }}>
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="btn"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ flex: 1, justifyContent: "center" }}
            >
              {submitting ? "Preparing your payment…" : `Pay — RM${total}`}
            </button>
          )}
        </div>
      </div>
    </Reveal>
  );
}
