import { randomInt } from "crypto";
import { createOrder, getCommittedBoxesForDate } from "../../../lib/airtable";
import {
  computeTotalRM,
  getProductByEdition,
  MAX_BOXES_PER_ORDER,
  MAX_BOXES_PER_DAY,
  PRODUCTS,
} from "../../../lib/products";
import { withErrorHandling, badRequest } from "../../../lib/errors";
import {
  readJsonBody,
  requiredString,
  optionalString,
  emailField,
  phoneField,
  postcodeField,
  integerField,
  dateOnlyField,
  enumField,
  LIMITS,
} from "../../../lib/sanitize";

const EDITIONS = PRODUCTS.map((p) => p.edition);

// randomInt, not Math.random: order IDs shouldn't be guessable from a known
// one. Math.random is seeded predictably and is not meant for anything an
// attacker might try to enumerate.
function makeOrderId() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return `ADR-${stamp}-${randomInt(100000, 1000000)}`;
}

export const POST = withErrorHandling("create-order", async (req) => {
  const body = await readJsonBody(req);

  // Everything is validated and normalised before a single field is written.
  // Nothing below this point is client-controlled in an unchecked form.
  const name = requiredString(body.name, { field: "name", label: "Your name", max: LIMITS.name });
  const email = emailField(body.email);
  const phone = phoneField(body.phone);
  const recipientName = requiredString(body.recipientName, {
    field: "recipientName",
    label: "Recipient name",
    max: LIMITS.recipientName,
  });
  const street = requiredString(body.street, { field: "street", label: "Street address", max: LIMITS.street });
  const city = requiredString(body.city, { field: "city", label: "City", max: LIMITS.city });
  const state = requiredString(body.state, { field: "state", label: "State", max: LIMITS.state });
  const postcode = postcodeField(body.postcode);

  const productEdition = enumField(body.productEdition, EDITIONS, {
    field: "productEdition",
    label: "The box",
  });
  const quantity = integerField(body.quantity, {
    field: "quantity",
    label: "Number of boxes",
    min: 1,
    max: MAX_BOXES_PER_ORDER,
  });

  const chocolateBreakdown = optionalString(body.chocolateBreakdown, {
    field: "chocolateBreakdown",
    label: "Cube selection",
    max: LIMITS.chocolateBreakdown,
  });
  const cardMessage = optionalString(body.cardMessage, {
    field: "cardMessage",
    label: "Card message",
    max: LIMITS.cardMessage,
  });
  const addonDetail = optionalString(body.addonDetail, {
    field: "addonDetail",
    label: "Add-on detail",
    max: LIMITS.addonDetail,
  });

  const occasionDate = body.occasionDate ? dateOnlyField(body.occasionDate) : null;

  // The delivery-date calendar already hides fully-booked dates, but that
  // list can go stale between page-load and submit (another order could fill
  // the last slot in between) — re-check here, right before writing.
  if (occasionDate) {
    const committed = await getCommittedBoxesForDate(occasionDate);
    if (committed + quantity > MAX_BOXES_PER_DAY) {
      throw badRequest({
        status: 409,
        field: "occasionDate",
        code: "date_full",
        what: "That delivery date just filled up.",
        why: `Someone else took the last slots while you were filling this in — we only bake ${MAX_BOXES_PER_DAY} boxes a day.`,
        action: "Go back to the calendar and pick another date. Nothing has been charged.",
      });
    }
  }

  // Never trust a client-supplied price — recompute from the same rules the
  // form used to display it. The add-on type (and therefore its price) comes
  // from the product's own config, not the client-supplied label, so a
  // tampered request can't pick a cheaper add-on's price.
  const messageMode = body.messageType === "Full Letter" ? "letter" : "card";
  const product = getProductByEdition(productEdition);
  const addonSelected = Boolean(body.addonType) && body.addonType !== "None";
  const resolvedAddonType = addonSelected ? product?.addon?.type : null;
  const amountRM = computeTotalRM({ messageMode, addonType: resolvedAddonType, quantity });

  const orderId = makeOrderId();

  const fields = {
    "Order ID": orderId,
    "Customer Name": name,
    "Customer Email": email,
    "Customer Phone": phone,
    "Recipient Name": recipientName,
    "Product Edition": productEdition,
    "Chocolate Breakdown": chocolateBreakdown,
    Quantity: quantity,
    "Message Type": messageMode === "letter" ? "Full Letter" : "Card Message",
    "Card Message": cardMessage,
    // Stored from the product config, not the request, so the label always
    // matches the add-on actually priced above.
    "Add-on": resolvedAddonType || "None",
    "Add-on Detail": addonSelected ? addonDetail : "",
    "Street Address": street,
    City: city,
    State: state,
    Postcode: postcode,
    "Order Total": amountRM,
    "Payment Status": "Pending",
    "Fulfillment Status": "Order Confirmed",
    "Order Date": new Date().toISOString(),
  };
  if (occasionDate) fields["Occasion Date"] = occasionDate;

  const record = await createOrder(fields);

  return Response.json({ orderId, recordId: record.id, amountRM });
});
