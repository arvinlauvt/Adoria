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
    quantity: f["Boxes"],
    occasionDate: f["Occasion Date"],
    cubeBreakdown: f["Cube Breakdown"],
    address: [f["Street Address"], f["City"], f["State"], f["Postcode"]].filter(Boolean).join(", "),
    paymentStatus: f["Payment Status"],
    fulfillmentStatus: f["Fulfillment Status"] || "Order Confirmed",
    courier: f["Courier"] || "",
    trackingNumber: f["Tracking Number"] || "",
  };
}

export const GET = withErrorHandling(
  "admin-orders-list",
  async () => {
    // Re-checked here, not inherited from the page that rendered the UI —
    // this endpoint is reachable directly.
    await requireAdmin();
    const records = await listOrders();
    return Response.json({ orders: records.map(serialize) });
  },
  {
    what: "We couldn't load the orders.",
    dependency: "our order database",
    note: "No order data is lost — this is only the list failing to load.",
  }
);

export const PATCH = withErrorHandling(
  "admin-orders-update",
  async (req) => {
    await requireAdmin();

    const body = await readJsonBody(req);
    const id = String(body?.id || "");
    if (!id) {
      return Response.json(
        {
          error:
            "No order was specified, so there's nothing to update. " +
            "This usually means the page is out of date — reload it and try the change again.",
          code: "missing_order_id",
        },
        { status: 400 }
      );
    }

    const fields = {};
    for (const [key, column] of Object.entries(EDITABLE)) {
      if (body[key] === undefined) continue;
      const value = String(body[key]).trim();
      if (key === "fulfillmentStatus" && !FULFILLMENT_STAGES.includes(value)) {
        return Response.json(
          {
            error:
              `"${value}" isn't a fulfilment stage, so the order wasn't changed. ` +
              `Pick one of: ${FULFILLMENT_STAGES.join(", ")}.`,
            code: "bad_stage",
            field: "fulfillmentStatus",
          },
          { status: 400 }
        );
      }
      fields[column] = value;
    }

    if (Object.keys(fields).length === 0) {
      return Response.json(
        {
          error:
            "Nothing was changed, so there's nothing to save. " +
            "Only the fulfilment stage, courier, and tracking number can be edited here. " +
            "Edit one of those first.",
          code: "no_changes",
        },
        { status: 400 }
      );
    }

    const updated = await updateOrder(id, fields);
    return Response.json({ ok: true, order: serialize(updated) });
  },
  {
    what: "We couldn't save that change.",
    dependency: "our order database",
    note: "The order still shows its previous details — reload the page to confirm what actually saved.",
  }
);
