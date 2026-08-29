"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { EASE_PREMIUM } from "../../../lib/motion";
import {
  PRICE_CARD,
  PRICE_LETTER,
  ADDON_PRICES,
  FLOWER_OPTIONS,
  FLAVORS,
  CUBE_CAP,
  LEAD_TIME_DAYS,
  MAX_BOXES_PER_ORDER,
  computeTotalRM,
} from "../../../lib/products";
import Reveal from "../../../components/Reveal";

const MAX_CARD_MESSAGE = 200;
const MAX_LETTER = 1300;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
// "Noir Cubes" uses --coffee-soft rather than the near-black --coffee — on
// the dark theme's near-black panels, --coffee's own value is barely
// distinguishable from the background, making the swatch and the cube-fill
// grid below it look unfilled even when selected.
const FLAVOR_SWATCH = { "Noir Cubes": "var(--coffee-soft)", "Cacao Sepia": "#8a5a34" };

function emptyBox() {
  return Object.fromEntries(FLAVORS.map((f) => [f, 0]));
}
function boxTotal(box) {
  return FLAVORS.reduce((sum, f) => sum + box[f], 0);
}

// Local YYYY-MM-DD, not toISOString() — toISOString() shifts to UTC first,
// which rolls a local-midnight date back a day for any timezone ahead of
// UTC (Malaysia is UTC+8), so it would misreport the date the customer
// actually clicked. Used both for the calendar's per-cell key and for what
// gets sent to the server as the delivery date.
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildCalendar(minDate, monthOffset) {
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const month = base.getMonth();
  const year = base.getFullYear();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = first.getDay();
  const monthLabel = base.toLocaleDateString("en-MY", { month: "long", year: "numeric" });
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
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-text)" }}>
          Step {index + 1} of {total}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{name}</div>
      </div>
      <h2 style={{ margin: "10px 0 6px", fontWeight: 400, fontSize: 28, color: "var(--text-heading)" }}>{title}</h2>
      <p style={{ margin: "0 0 28px", fontWeight: 300, fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)" }}>{subtitle}</p>
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

  const activeAddonType = addonSelected && product.addon ? product.addon.type : null;
  const total = computeTotalRM({ messageMode, addonType: activeAddonType, quantity: boxes.length });
  const perBox = (messageMode === "letter" ? PRICE_LETTER : PRICE_CARD) + (activeAddonType ? ADDON_PRICES[activeAddonType] || 0 : 0);
  const maxChars = messageMode === "letter" ? MAX_LETTER : MAX_CARD_MESSAGE;

  const minDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + LEAD_TIME_DAYS);
    return d;
  }, []);
  const [monthOffset, setMonthOffset] = useState(0);
  const calendar = useMemo(() => buildCalendar(minDate, monthOffset), [minDate, monthOffset]);

  const [fullDates, setFullDates] = useState([]);
  useEffect(() => {
    const anyCell = calendar.cells.find(Boolean);
    if (!anyCell) return;
    const y = anyCell.date.getFullYear();
    const m = String(anyCell.date.getMonth() + 1).padStart(2, "0");
    let cancelled = false;
    fetch(`/api/availability?month=${y}-${m}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setFullDates(data.full || []);
      })
      .catch(() => {
        if (!cancelled) setFullDates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [calendar]);

  function addBox() {
    if (boxes.length >= MAX_BOXES_PER_ORDER) return;
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

      const occasionDateStr = occasionDate ? toDateKey(occasionDate) : null;

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
  const previewText = cardMessage || (messageMode === "card" ? "Your message will appear here." : "Your letter will appear here. Write as much as the moment deserves.");
  const previewDate = occasionDate
    ? occasionDate.toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })
    : calendar.monthLabel;

  return (
    <Reveal>
      <div className="card" style={{ padding: "36px 32px", boxShadow: "none", border: "none", background: "transparent" }}>
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_PREMIUM }}
        >
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
              boxes: `Up to ${CUBE_CAP} cubes per box. Mix flavors however you like.`,
              message: "A short line, or a full letter: your call.",
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
                <div key={i} style={{ border: "1px solid var(--cream-deep)", borderRadius: 10, padding: 20, marginBottom: 14, background: "var(--bg-panel)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <strong style={{ fontSize: 14, color: "var(--text-heading)" }}>Box {i + 1}</strong>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 12, color: remaining === 0 ? "var(--accent-text)" : "var(--text-muted)" }}>
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
                    <div key={f} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border-panel)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 22, height: 22, borderRadius: 4, background: FLAVOR_SWATCH[f], border: "1px solid var(--border-panel-strong)" }} />
                        <span style={{ fontSize: 14, color: "var(--text-label)" }}>{f}</span>
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
                            color: "var(--text-heading)",
                            background: "transparent",
                            border: "none",
                            borderBottom: "1px solid var(--border-panel-strong)",
                            outline: "none",
                          }}
                        />
                        <button type="button" onClick={() => setFlavorQty(i, f, 1)} disabled={remaining <= 0} className="stepper-btn">+</button>
                      </div>
                    </div>
                  ))}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5, marginTop: 16, maxWidth: 180 }}>
                    {Array.from({ length: CUBE_CAP }).map((_, ci) => {
                      let color = "var(--border-panel)";
                      let runningEnd = 0;
                      for (const f of FLAVORS) {
                        runningEnd += box[f];
                        if (ci < runningEnd) {
                          color = FLAVOR_SWATCH[f];
                          break;
                        }
                      }
                      return <span key={ci} style={{ aspectRatio: "1/1", borderRadius: 3, background: color, border: "1px solid var(--border-panel)" }} />;
                    })}
                  </div>
                </div>
              );
            })}
            {boxes.length < MAX_BOXES_PER_ORDER ? (
              <button type="button" onClick={addBox} className="btn-outline btn" style={{ width: "100%", justifyContent: "center", border: "1px dashed var(--border-panel-strong)" }}>
                + Add another box
              </button>
            ) : (
              <p className="hint" style={{ textAlign: "center" }}>
                {MAX_BOXES_PER_ORDER} boxes is the limit per order. Place a second order for more.
              </p>
            )}
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
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-heading)" }}>Short card message</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>RM{PRICE_CARD} / box · 200 characters</div>
              </button>
              <button
                type="button"
                onClick={() => setMessageMode("letter")}
                className="card"
                style={{ padding: "14px 16px", textAlign: "left", boxShadow: "none", border: messageMode === "letter" ? "2px solid var(--gold)" : "1px solid var(--cream-deep)" }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-heading)" }}>Full letter</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>RM{PRICE_LETTER} / box · 1,300 characters</div>
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
                <p style={{ margin: 0, fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontWeight: 500, fontSize: 22, lineHeight: 1.5, color: "var(--gold-bright)", whiteSpace: "pre-wrap", overflowWrap: "break-word", wordBreak: "break-word" }}>{previewText}</p>
              </div>
            ) : (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--accent-text)", marginBottom: 10 }}>
                  Letter preview · {product.letterFrame === "ornate" ? "Milestone frame" : "Plain frame"}
                </div>
                <div style={{ position: "relative", background: "var(--surface-letter)", border: "1px solid rgba(185,138,61,.35)", borderRadius: 3, padding: "30px 40px 26px", boxShadow: "0 10px 26px rgba(43,28,20,.1)", overflow: "hidden", transition: "background-color 0.25s var(--ease-premium)" }}>
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
                    <span style={{ fontFamily: "var(--serif)", fontSize: 27, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-heading)" }}>Cubelle</span>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.22em", color: "var(--gold)" }}>BOUTIQUE GIFTING ATELIER</div>
                  </div>
                  <div style={{ position: "relative", padding: "18px 30px", minHeight: 110 }}>
                    <p style={{ margin: 0, fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 15, lineHeight: 1.7, color: "var(--text-body)", whiteSpace: "pre-wrap", overflowWrap: "break-word", wordBreak: "break-word" }}>
                      {previewText}
                    </p>
                  </div>
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 16 }}>
                    <span style={{ width: 150, height: 1, background: "rgba(185,138,61,.7)" }} />
                    <span style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 13, color: "var(--gold)" }}>{previewDate}</span>
                  </div>
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
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
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-heading)" }}>Yes, add {product.addon.label.toLowerCase()}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>+RM{ADDON_PRICES[product.addon.type]} per box</div>
              </button>
              <button
                type="button"
                onClick={() => setAddonSelected(false)}
                className="card"
                style={{ padding: "14px 16px", textAlign: "left", boxShadow: "none", border: !addonSelected ? "2px solid var(--gold)" : "1px solid var(--cream-deep)" }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-heading)" }}>No {product.addon.label.toLowerCase()}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Just the box and card</div>
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
                    <div style={{ width: "100%", aspectRatio: "1", borderRadius: 8, marginBottom: 6, background: f.color, border: "1px solid var(--border-panel)" }} />
                    <span style={{ fontSize: 11, color: "var(--text-label)" }}>{f.name}</span>
                  </button>
                ))}
              </div>
            )}

            {addonSelected && product.addon.type === "brassBookmark" && (
              <p className="hint">Engraved metal, sealed separately from the tray: a small keepsake beside the card.</p>
            )}
          </div>
        )}

        {key === "delivery" && (
          <>
            <div className="field">
              <label htmlFor="recipient">Recipient's name</label>
              <input id="recipient" placeholder="Who it's for" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
            </div>

            <div style={{ border: "1px solid var(--cream-deep)", borderRadius: 10, background: "var(--bg-panel)", padding: 18, marginBottom: 18, transition: "background-color 0.25s var(--ease-premium)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                <span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-label)" }}>{product.occasionDateLabel}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{LEAD_TIME_DAYS}-day lead time · crossed-out dates are fully booked</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <button
                  type="button"
                  className="stepper-btn"
                  disabled={monthOffset <= 0}
                  onClick={() => setMonthOffset((m) => m - 1)}
                  aria-label="Previous month"
                >
                  ‹
                </button>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-heading)" }}>{calendar.monthLabel}</span>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setMonthOffset((m) => m + 1)}
                  aria-label="Next month"
                >
                  ›
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, marginBottom: 12 }}>
                {WEEKDAYS.map((w, i) => (
                  <span key={i} style={{ textAlign: "center", fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                    {w}
                  </span>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
                {calendar.cells.map((c, i) => {
                  if (c === null) return <span key={i} />;
                  const isFull = !c.disabled && fullDates.includes(toDateKey(c.date));
                  const disabled = c.disabled || isFull;
                  const selected = occasionDate && occasionDate.toDateString() === c.date.toDateString();
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={disabled}
                      title={isFull ? "Fully booked. Please pick another date." : undefined}
                      onClick={() => setOccasionDate(c.date)}
                      style={{
                        aspectRatio: "1/1",
                        borderRadius: 999,
                        border: "none",
                        fontSize: 13,
                        fontFamily: "var(--sans)",
                        cursor: disabled ? "not-allowed" : "pointer",
                        textDecoration: isFull ? "line-through" : "none",
                        background: selected ? "var(--btn-primary-bg)" : "transparent",
                        color: disabled ? "var(--text-muted)" : selected ? "var(--btn-primary-text)" : "var(--text-label)",
                      }}
                    >
                      {c.n}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-body)" }}>
                {occasionDate ? `Landing ${previewDate}` : "Pick a date"}. Need it{" "}
                <a
                  href={`https://wa.me/60106509189?text=${encodeURIComponent(
                    occasionDate
                      ? `Hi Cubelle, can you rush my order to land by ${previewDate}? That's earlier than the site's earliest available date.`
                      : "Hi Cubelle, I need a box sooner than the earliest available date. Can you help?"
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--text-body)", textDecoration: "underline" }}
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
            <div style={{ border: "1px solid var(--cream-deep)", borderRadius: 10, background: "var(--bg-panel)", padding: "22px 22px 18px", transition: "background-color 0.25s var(--ease-premium)" }}>
              {[
                ["Boxes", boxes.map((b, i) => `Box ${i + 1}: ${FLAVORS.filter((f) => b[f] > 0).map((f) => `${b[f]} ${f}`).join(", ")}`).join(" · ")],
                ["Message", messageMode === "letter" ? "Full letter" : "Short card message"],
                ...(product.addon ? [["Extra gift", addonSelected ? `${product.addon.label}${product.addon.type === "flowers" ? ` — ${flowerChoice}` : ""}` : "None"]] : []),
                ["Recipient", recipientName],
                ["Delivering to", `${street}, ${city}, ${state} ${postcode}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 20, padding: "11px 0", borderBottom: "1px solid var(--border-panel)" }}>
                  <span style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 14, color: "var(--text-heading)", textAlign: "right" }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingTop: 18 }}>
                <div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 24, color: "var(--text-heading)" }}>Total</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>RM{perBox} × {boxes.length} box{boxes.length > 1 ? "es" : ""}</div>
                </div>
                <div style={{ fontFamily: "var(--serif)", fontSize: 32, color: "var(--text-heading)" }}>RM{total}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>
              Secured by ToyyibPay · FPX &amp; cards
            </div>
          </div>
        )}
        </motion.div>

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
                background: i === step ? "var(--gold)" : "var(--border-panel-strong)",
                transition: "width 0.3s var(--ease-premium)",
              }}
            />
          ))}
        </div>
      </div>
    </Reveal>
  );
}
