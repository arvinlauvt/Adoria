import { createOrder } from "../../../lib/airtable";
import { computeTotalRM, getProductByEdition } from "../../../lib/products";

function makeOrderId() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ADR-${stamp}-${rand}`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      recipientName,
      occasionDate,
      productEdition,
      quantity,
      chocolateBreakdown,
      cardMessage,
      messageType,
      addonType,
      addonDetail,
      street,
      city,
      state,
      postcode,
    } = body;

    if (!name || !phone || !email || !recipientName || !productEdition || !street || !city || !state || !postcode) {
      return Response.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Never trust a client-supplied price — recompute from the same rules
    // the form used to display it, and charge that instead. The add-on
    // *type* (and therefore its price) comes from the product's own config
    // via productEdition, not from the client-supplied addonType label, so
    // a tampered request can't pick a cheaper add-on's price.
    const messageMode = messageType === "Full Letter" ? "letter" : "card";
    const addonSelected = !!addonType && addonType !== "None";
    const product = getProductByEdition(productEdition);
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
      "Card Message": cardMessage || "",
      "Add-on": addonSelected ? addonType : "None",
      "Add-on Detail": addonSelected ? addonDetail || "" : "",
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
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not save your order. Please try again." }, { status: 500 });
  }
}
