"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  PRICE_CARD,
  PRICE_LETTER,
  PRICE_ADDON,
  FLOWER_OPTIONS,
  FLAVORS,
  CUBE_CAP,
  LEAD_TIME_DAYS,
  computeTotalRM,
} from "../../../lib/products";
import Reveal from "../../../components/Reveal";

const MAX_CARD_MESSAGE = 200;
const MAX_LETTER = 1300;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const FLAVOR_SWATCH = { Dark: "#2b1c14", Milk: "#8a5a34", White: "#efe3cd" };

function emptyBox() {
  return { Dark: 0, Milk: 0, White: 0 };
}
function boxTotal(box) {
  return box.Dark + box.Milk + box.White;
}

function buildCalendar(minDate) {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = first.getDay();
  const monthLabel = today.toLocaleDateString("en-MY", { month: "long", year: "numeric" });
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ n: d, date, disabled: date < minDate });
  }
  return { cells, monthLabel };
}

function StepHeader({ index, total, name, title, subtitle }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ height: 3, background: "var(--cream-deep)", borderRadius: 2, overflow: "hidden", marginBottom: 26 }}>
        <div
          style={{
            height: "100%",
            width: `${((index + 1) / total) * 100}%`,
            background: "var(--gold)",
            transition: "width 0.4s var(--ease-premium)",
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)" }}>
          Step {index + 1} of {total}
        </div>
        <div style={{ fontSize: 12, color: "#8a7a68" }}>{name}</div>
      </div>
      <h2 style={{ margin: "10px 0 6px", fontWeight: 400, fontSize: 28, color: "var(--coffee)" }}>{title}</h2>
      <p style={{ margin: "0 0 28px", fontWeight: 300, fontSize: 14, lineHeight: 1.6, color: "#8a7a68" }}>{subtitle}</p>
    </div>
  );
}

export default function OrderForm({ product }) {
  const steps = ["details", "boxes", "message", ...(product.addon ? ["addon"] : []), "delivery", "review"];
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [boxes, setBoxes] = useState([emptyBox()]);
  const [messageMode, setMessageMode] = useState("card");
  const [cardMessage, setCardMessage] = useState("");
  const [addonSelected, setAddonSelected] = useState(false);
  const [flowerChoice, setFlowerChoice] = useState(FLOWER_OPTIONS[0].name);
  const [recipientName, setRecipientName] = useState("");
  const [occasionDate, setOccasionDate] = useState(null);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const total = computeTotalRM({ messageMode, addonSelected, quantity: boxes.length });
  const perBox = (messageMode === "letter" ? PRICE_LETTER : PRICE_CARD) + (addonSelected ? PRICE_ADDON : 0);
  const maxChars = messageMode === "letter" ? MAX_LETTER : MAX_CARD_MESSAGE;

  const minDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + LEAD_TIME_DAYS);
    return d;
  }, []);
  const calendar = useMemo(() => buildCalendar(minDate), [minDate]);

  function addBox() {
    if (boxes.length >= 12) return;
    setBoxes([...boxes, emptyBox()]);
  }
  function removeBox(i) {
    if (boxes.length <= 1) return;
    setBoxes(boxes.filter((_, idx) => idx !== i));
  }
  function setFlavorQty(i, flavor, delta) {
    setBoxes(
      boxes.map((box, idx) => {
        if (idx !== i) return box;
        const nextVal = Math.max(0, box[flavor] + delta);
        const others = boxTotal(box) - box[flavor];
        const clamped = Math.min(nextVal, CUBE_CAP - others);
        return { ...box, [flavor]: clamped };
      })
    );
  }
  function setFlavorQtyAbsolute(i, flavor, rawValue) {
    const parsed = parseInt(rawValue, 10);
    const value = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    setBoxes(
      boxes.map((box, idx) => {
        if (idx !== i) return box;
        const others = boxTotal(box) - box[flavor];
        const clamped = Math.min(value, CUBE_CAP - others);
        return { ...box, [flavor]: clamped };
      })
    );
  }

  function validateStep(key) {
    if (key === "details" && (!name || !phone || !email)) return "Please fill in your name, phone, and email.";
    if (key === "boxes") {
      const empty = boxes.some((b) => boxTotal(b) === 0);
      if (empty) return "Every box needs at least one cube.";
    }
    if (key === "delivery") {
      if (product.occasionDateRequired && !occasionDate) return `Please pick the ${product.occasionDateLabel.toLowerCase()}.`;
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
      const breakdown = boxes
        .map((b, i) => {
          const parts = FLAVORS.filter((f) => b[f] > 0).map((f) => `${b[f]} ${f}`);
          return `Box ${i + 1}: ${parts.join(", ")} (${boxTotal(b)}/${CUBE_CAP})`;
        })
        .join("; ");

      const occasionDateStr = occasionDate ? occasionDate.toISOString().slice(0, 10) : null;

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          recipientName,
          occasionDate: occasionDateStr,
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
        body: JSON.stringify({ orderId: orderData.orderId, recordId: orderData.recordId, name, email, phone }),
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
  const previewText = cardMessage || (messageMode === "card" ? "Your message will appear here." : "Your letter will appear here — write as much as the moment deserves.");
  const previewDate = occasionDate
    ? occasionDate.toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })
    : calendar.monthLabel;

  return (
    <Reveal>
      <div className="card" style={{ padding: "36px 32px", boxShadow: "none", border: "none", background: "transparent" }}>
        <StepHeader
          index={step}
          total={steps.length}
          name={
            {
              details: "Your details",
              boxes: "Your boxes",
              message: "Your message",
              addon: `Add ${product.addon?.label || "an extra gift"}`,
              delivery: "Recipient & delivery",
              review: "Review & pay",
            }[key]
          }
          title={
            {
              details: "Who's sending",
              boxes: "Build the tray",
              message: "What it should say",
              addon: `${product.addon?.label || "An extra gift"}?`,
              delivery: "Where it lands",
              review: "Before you pay",
            }[key]
          }
          subtitle={
            {
              details: "So we can reach you about your order.",
              boxes: `Up to ${CUBE_CAP} cubes per box — mix flavors however you like.`,
              message: "A short line, or a full letter — your call.",
              addon: "Dried and pressed in-house, tucked in beside the card.",
              delivery: "Pick the date; we work the lead time backwards.",
              review: "Everything as it will be made.",
            }[key]
          }
        />

        {key === "details" && (
          <>
            <div className="field-row">
              <div className="field">
                <label htmlFor="name">Your full name</label>
                <input id="name" placeholder="Arvin Lau" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone number</label>
                <input id="phone" placeholder="+60 12 345 6789" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <span className="hint">Your receipt and order tracking go here.</span>
              <input id="email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </>
        )}

        {key === "boxes" && (
          <div className="field">
            {boxes.map((box, i) => {
              const remaining = CUBE_CAP - boxTotal(box);
              return (
                <div key={i} style={{ border: "1px solid var(--cream-deep)", borderRadius: 10, padding: 20, marginBottom: 14, background: "var(--cream)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <strong style={{ fontSize: 14, color: "var(--coffee)" }}>Box {i + 1}</strong>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 12, color: remaining === 0 ? "var(--gold)" : "#8a7a68" }}>
                        {remaining === 0 ? "Full" : `${remaining} of ${CUBE_CAP} left`}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeBox(i)}
                        disabled={boxes.length <= 1}
                        className="btn-outline btn"
                        style={{ padding: "7px 14px", fontSize: 12 }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {FLAVORS.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(43,28,20,.07)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 22, height: 22, borderRadius: 4, background: FLAVOR_SWATCH[f], border: "1px solid rgba(43,28,20,.18)" }} />
                        <span style={{ fontSize: 14, color: "var(--coffee-soft)" }}>{f}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button type="button" onClick={() => setFlavorQty(i, f, -1)} className="stepper-btn">−</button>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={box[f]}
                          onChange={(e) => setFlavorQtyAbsolute(i, f, e.target.value.replace(/[^0-9]/g, ""))}
                          onFocus={(e) => e.target.select()}
                          style={{
                            width: 34,
                            padding: "3px 0",
                            textAlign: "center",
                            fontFamily: "var(--serif)",
                            fontSize: 17,
                            color: "var(--coffee)",
                            background: "transparent",
                            border: "none",
                            borderBottom: "1px solid rgba(43,28,20,.22)",
                            outline: "none",
                          }}
                        />
                        <button type="button" onClick={() => setFlavorQty(i, f, 1)} disabled={remaining <= 0} className="stepper-btn">+</button>
                      </div>
                    </div>
                  ))}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5, marginTop: 16, maxWidth: 180 }}>
                    {Array.from({ length: CUBE_CAP }).map((_, ci) => {
                      const filled = ci < boxTotal(box);
                      let color = "rgba(43,28,20,.08)";
                      if (filled) {
                        const darkEnd = box.Dark;
                        const milkEnd = darkEnd + box.Milk;
                        color = ci < darkEnd ? "#3b2417" : ci < milkEnd ? "#8a5a34" : "#f0e2c8";
                      }
                      return <span key={ci} style={{ aspectRatio: "1/1", borderRadius: 3, background: color, border: "1px solid rgba(43,28,20,.12)" }} />;
                    })}
                  </div>
                </div>
              );
            })}
            <button type="button" onClick={addBox} className="btn-outline btn" style={{ width: "100%", justifyContent: "center", border: "1px dashed rgba(43,28,20,.3)" }}>
              + Add another box
            </button>
          </div>
        )}

        {key === "message" && (
          <div className="field">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => {
                  setMessageMode("card");
                  setCardMessage((m) => m.slice(0, MAX_CARD_MESSAGE));
                }}
                className="card"
                style={{ padding: "14px 16px", textAlign: "left", boxShadow: "none", border: messageMode === "card" ? "2px solid var(--gold)" : "1px solid var(--cream-deep)" }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--coffee)" }}>Short card message</div>
                <div style={{ fontSize: 12, color: "#8a7a68" }}>RM{PRICE_CARD} / box · 200 characters</div>
              </button>
              <button
                type="button"
                onClick={() => setMessageMode("letter")}
                className="card"
                style={{ padding: "14px 16px", textAlign: "left", boxShadow: "none", border: messageMode === "letter" ? "2px solid var(--gold)" : "1px solid var(--cream-deep)" }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--coffee)" }}>Full letter</div>
                <div style={{ fontSize: 12, color: "#8a7a68" }}>RM{PRICE_LETTER} / box · 1,300 characters</div>
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <label htmlFor="msg" style={{ margin: 0 }}>Your message</label>
              <span className="hint">{maxChars - cardMessage.length} left</span>
            </div>
            <textarea
              id="msg"
              rows={messageMode === "card" ? 4 : 8}
              maxLength={maxChars}
              placeholder="Write it the way you'd say it."
              value={cardMessage}
              onChange={(e) => setCardMessage(e.target.value)}
            />

            {messageMode === "card" ? (
              <div style={{ marginTop: 20, background: "#100b08", border: "1px solid rgba(217,171,92,.3)", borderRadius: 6, padding: "26px 24px", minHeight: 120 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(217,171,92,.6)", marginBottom: 14 }}>
                  Card preview · gold ink on black stock
                </div>
                <p style={{ margin: 0, fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontWeight: 500, fontSize: 22, lineHeight: 1.5, color: "var(--gold-bright)", overflowWrap: "break-word", wordBreak: "break-word" }}>{previewText}</p>
              </div>
            ) : (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 10 }}>
                  Letter preview · {product.letterFrame === "ornate" ? "Milestone frame" : "Plain frame"}
                </div>
                <div style={{ position: "relative", background: "#fffdf7", border: "1px solid rgba(185,138,61,.35)", borderRadius: 3, padding: "30px 40px 26px", boxShadow: "0 10px 26px rgba(43,28,20,.1)", overflow: "hidden" }}>
                  {product.letterFrame === "ornate" && (
                    <>
                      <Image src="/letter-corner.png" alt="" width={62} height={62} style={{ position: "absolute", top: 8, left: 8, width: 62, opacity: 0.95 }} />
                      <Image src="/letter-corner.png" alt="" width={62} height={62} style={{ position: "absolute", top: 8, right: 8, width: 62, opacity: 0.95, transform: "scaleX(-1)" }} />
                      <Image src="/letter-corner.png" alt="" width={62} height={62} style={{ position: "absolute", bottom: 8, left: 8, width: 62, opacity: 0.95, transform: "scaleY(-1)" }} />
                      <Image src="/letter-corner.png" alt="" width={62} height={62} style={{ position: "absolute", bottom: 8, right: 8, width: 62, opacity: 0.95, transform: "scale(-1,-1)" }} />
                      <span style={{ position: "absolute", left: 18, top: 76, bottom: 76, width: 1, background: "rgba(185,138,61,.7)" }} />
                      <span style={{ position: "absolute", right: 18, top: 76, bottom: 76, width: 1, background: "rgba(185,138,61,.7)" }} />
                      <span style={{ position: "absolute", top: 14, left: 72, right: 72, height: 1, background: "rgba(185,138,61,.7)" }} />
                      <span style={{ position: "absolute", bottom: 14, left: 72, right: 72, height: 0, borderTop: "1px solid rgba(185,138,61,.7)", transform: "translateY(-0.5px)" }} />
                    </>
                  )}
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, paddingBottom: 14 }}>
                    <Image src="/logo-icon.png" alt="" width={38} height={38} style={{ objectFit: "contain" }} />
                    <span style={{ fontFamily: "var(--serif)", fontSize: 27, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--coffee)" }}>Cubelle</span>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.22em", color: "var(--gold)" }}>BOUTIQUE GIFTING ATELIER</div>
                  </div>
                  <div style={{ position: "relative", padding: "18px 30px", minHeight: 110 }}>
                    <p style={{ margin: 0, fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 15, lineHeight: 1.7, color: "var(--coffee-soft)", whiteSpace: "pre-wrap", overflowWrap: "break-word", wordBreak: "break-word" }}>
                      {previewText}
                    </p>
                  </div>
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 16 }}>
                    <span style={{ width: 150, height: 1, background: "rgba(185,138,61,.7)" }} />
                    <span style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 13, color: "var(--gold)" }}>{previewDate}</span>
                  </div>
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 12, color: "#8a7a68" }}>
                  Anniversary and Hostess letters use the ornate frame. Congratulations letters use the plain rule frame.
                </p>
              </div>
            )}
          </div>
        )}

        {key === "addon" && product.addon && (
          <div className="field">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setAddonSelected(true)}
                className="card"
                style={{ padding: "14px 16px", textAlign: "left", boxShadow: "none", border: addonSelected ? "2px solid var(--gold)" : "1px solid var(--cream-deep)" }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--coffee)" }}>Yes, add {product.addon.label.toLowerCase()}</div>
                <div style={{ fontSize: 12, color: "#8a7a68" }}>+RM{PRICE_ADDON} per box</div>
              </button>
              <button
                type="button"
                onClick={() => setAddonSelected(false)}
                className="card"
                style={{ padding: "14px 16px", textAlign: "left", boxShadow: "none", border: !addonSelected ? "2px solid var(--gold)" : "1px solid var(--cream-deep)" }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--coffee)" }}>No {product.addon.label.toLowerCase()}</div>
                <div style={{ fontSize: 12, color: "#8a7a68" }}>Just the box and card</div>
              </button>
            </div>

            {addonSelected && product.addon.type === "flowers" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12 }}>
                {FLOWER_OPTIONS.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setFlowerChoice(f.name)}
                    className="card"
                    style={{ padding: 8, textAlign: "center", boxShadow: "none", border: flowerChoice === f.name ? "2px solid var(--gold)" : "1px solid var(--cream-deep)" }}
                  >
                    <div style={{ width: "100%", aspectRatio: "1", borderRadius: 8, marginBottom: 6, background: f.color, border: "1px solid rgba(43,28,20,.1)" }} />
                    <span style={{ fontSize: 11, color: "var(--coffee-soft)" }}>{f.name}</span>
                  </button>
                ))}
              </div>
            )}

            {addonSelected && product.addon.type === "achievementToken" && (
              <p className="hint">Engraved metal, sealed separately from the tray — a small keepsake beside the card.</p>
            )}
          </div>
        )}

        {key === "delivery" && (
          <>
            <div className="field">
              <label htmlFor="recipient">Recipient's name</label>
              <input id="recipient" placeholder="Who it's for" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
            </div>

            <div style={{ border: "1px solid var(--cream-deep)", borderRadius: 10, background: "var(--cream)", padding: 18, marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                <span style={{ fontWeight: 600, fontSize: 12, color: "var(--coffee-soft)" }}>{product.occasionDateLabel}</span>
                <span style={{ fontSize: 11, color: "#8a7a68" }}>{calendar.monthLabel} · {LEAD_TIME_DAYS}-day lead time</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, marginBottom: 12 }}>
                {WEEKDAYS.map((w, i) => (
                  <span key={i} style={{ textAlign: "center", fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", color: "#8a7a68" }}>
                    {w}
                  </span>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
                {calendar.cells.map((c, i) =>
                  c === null ? (
                    <span key={i} />
                  ) : (
                    <button
                      key={i}
                      type="button"
                      disabled={c.disabled}
                      onClick={() => setOccasionDate(c.date)}
                      style={{
                        aspectRatio: "1/1",
                        borderRadius: 999,
                        border: "none",
                        fontSize: 13,
                        fontFamily: "var(--sans)",
                        cursor: c.disabled ? "not-allowed" : "pointer",
                        background:
                          occasionDate && occasionDate.toDateString() === c.date.toDateString() ? "var(--coffee)" : "transparent",
                        color: c.disabled ? "#c9bfae" : occasionDate && occasionDate.toDateString() === c.date.toDateString() ? "var(--cream)" : "var(--coffee-soft)",
                      }}
                    >
                      {c.n}
                    </button>
                  )
                )}
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: "#5a4a3c" }}>
                {occasionDate ? `Landing ${previewDate}` : "Pick a date"} — need it{" "}
                <a
                  href={`https://wa.me/60106509189?text=${encodeURIComponent(
                    occasionDate
                      ? `Hi Cubelle, can you rush my order to land by ${previewDate}? That's earlier than the site's earliest available date.`
                      : "Hi Cubelle, I need a box sooner than the earliest available date — can you help?"
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#5a4a3c", textDecoration: "underline" }}
                >
                  sooner
                </a>
                ?
              </div>
            </div>

            <div className="field">
              <label htmlFor="street">Street address / unit</label>
              <input id="street" placeholder="8, Lorong SKD 7/1" value={street} onChange={(e) => setStreet(e.target.value)} required />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="city">City</label>
                <input id="city" placeholder="Kuantan" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="state">State</label>
                <input id="state" placeholder="Pahang" value={state} onChange={(e) => setState(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="postcode">Postcode</label>
                <input id="postcode" placeholder="26100" value={postcode} onChange={(e) => setPostcode(e.target.value)} required />
              </div>
            </div>
          </>
        )}

        {key === "review" && (
          <div>
            <div style={{ border: "1px solid var(--cream-deep)", borderRadius: 10, background: "var(--cream)", padding: "22px 22px 18px" }}>
              {[
                ["Boxes", boxes.map((b, i) => `Box ${i + 1}: ${FLAVORS.filter((f) => b[f] > 0).map((f) => `${b[f]} ${f}`).join(", ")}`).join(" · ")],
                ["Message", messageMode === "letter" ? "Full letter" : "Short card message"],
                ...(product.addon ? [["Extra gift", addonSelected ? `${product.addon.label}${product.addon.type === "flowers" ? ` — ${flowerChoice}` : ""}` : "None"]] : []),
                ["Recipient", recipientName],
                ["Delivering to", `${street}, ${city}, ${state} ${postcode}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 20, padding: "11px 0", borderBottom: "1px solid rgba(43,28,20,.08)" }}>
                  <span style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8a7a68", flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 14, color: "var(--coffee)", textAlign: "right" }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingTop: 18 }}>
                <div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 24, color: "var(--coffee)" }}>Total</div>
                  <div style={{ fontSize: 12, color: "#8a7a68", marginTop: 4 }}>RM{perBox} × {boxes.length} box{boxes.length > 1 ? "es" : ""}</div>
                </div>
                <div style={{ fontFamily: "var(--serif)", fontSize: 32, color: "var(--coffee)" }}>RM{total}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, fontSize: 12, color: "#8a7a68" }}>
              Secured by ToyyibPay · FPX &amp; cards
            </div>
          </div>
        )}

        {error && <p className="error-text" style={{ marginTop: 16 }}>{error}</p>}

        <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
          {step > 0 && (
            <button type="button" onClick={goBack} className="btn-outline btn">
              Back
            </button>
          )}
          {key !== "review" ? (
            <button type="button" onClick={goNext} className="btn" style={{ flex: 1, justifyContent: "center" }}>
              Continue
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting} className="btn" style={{ flex: 1, justifyContent: "center" }}>
              {submitting ? "Preparing your payment…" : `Pay — RM${total}`}
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, marginTop: 22, justifyContent: "center" }}>
          {steps.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === step ? 18 : 6,
                height: 6,
                borderRadius: 999,
                background: i === step ? "var(--gold)" : "var(--cream-deep)",
                transition: "width 0.3s var(--ease-premium)",
              }}
            />
          ))}
        </div>
      </div>
    </Reveal>
  );
}
