import { listOrders, updateOrder } from "../../../../lib/airtable";
import { requireAdmin } from "../../../../lib/auth/requireSession";
import { readJsonBody } from "../../../../lib/sanitize";
import { withErrorHandling } from "../../../../lib/errors";

export const dynamic = "force-dynamic";

// Only these three are editable from the dashboard. An allowlist rather than
// passing the request body through means a crafted request can't rewrite the
// price, the payment status, or the customer's address.
const EDITABLE = {
  fulfillmentStatus: "Fulfillment Status",
  courier: "Courier",
  trackingNumber: "Tracking Number",
};

const FULFILLMENT_STAGES = [
  "Order Confirmed",
  "Baked & Packed",
  "Card Written",
  "Out for Delivery",
  "Delivered",
];

function serialize(record) {
  const f = record.fields;
  return {
    id: record.id,
    orderId: f["Order ID"],
    orderDate: f["Order Date"],
    customerEmail: f["Customer Email"],
    recipientName: f["Recipient Name"],
    productEdition: f["Product Edition"],
    quantity: f["Quantity"],
    occasionDate: f["Occasion Date"],
    chocolateBreakdown: f["Chocolate Breakdown"],
    address: [f["Street Address"], f["City"], f["State"], f["Postcode"]].filter(Boolean).join(", "),
    paymentStatus: f["Payment Status"],
    fulfillmentStatus: f["Fulfillment Status"] || "Order Confirmed",
    courier: f["Courier"] || "",
    trackingNumber: f["Tracking Number"] || "",
  };
}

export const GET = withErrorHandling("admin-orders", async () => {
  try {
    // Re-checked here, not inherited from the page that rendered the UI —
    // this endpoint is reachable directly.
    await requireAdmin();
    const records = await listOrders();
    return Response.json({ orders: records.map(serialize) });
  } catch (err) {
    if (err.status) return Response.json({ error: err.message }, { status: err.status });
    console.error("Admin order list failed:", err);
    return Response.json({ error: "Could not load orders." }, { status: 503 });
  }
});

export const PATCH = withErrorHandling("admin-orders", async (req) => {
  try {
    await requireAdmin();

    const body = await readJsonBody(req);
    const id = String(body?.id || "");
    if (!id) return Response.json({ error: "Which order?" }, { status: 400 });

    const fields = {};
    for (const [key, column] of Object.entries(EDITABLE)) {
      if (body[key] === undefined) continue;
      const value = String(body[key]).trim();
      if (key === "fulfillmentStatus" && !FULFILLMENT_STAGES.includes(value)) {
        return Response.json({ error: "That isn't a fulfilment stage." }, { status: 400 });
      }
      fields[column] = value;
    }

    if (Object.keys(fields).length === 0) {
      return Response.json({ error: "Nothing to change." }, { status: 400 });
    }

    const updated = await updateOrder(id, fields);
    return Response.json({ ok: true, order: serialize(updated) });
  } catch (err) {
    if (err.status) return Response.json({ error: err.message }, { status: err.status });
    console.error("Admin order update failed:", err);
    return Response.json({ error: "Could not save that change." }, { status: 503 });
  }
});
