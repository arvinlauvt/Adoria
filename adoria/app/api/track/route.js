import { findOrdersByEmail } from "../../../lib/airtable";
import { getCurrentSession } from "../../../lib/auth/requireSession";
import { checkTrackRateLimit } from "../../../lib/auth/rateLimit";
import { getRequestIp } from "../../../lib/auth/requestIp";
import { withErrorHandling, badRequest } from "../../../lib/errors";
import { emailField, requiredString, LIMITS } from "../../../lib/sanitize";

export const dynamic = "force-dynamic";

// Deliberately narrower than the Airtable record. The tracking UI shows
// progress, what's in the box, and who it's going to — it never shows the
// delivery address or the card message, so neither is sent. They were being
// returned before purely because the record had them, which meant an email
// address was enough to pull back someone's home address and the private
// message written on their gift.
function serializeForCustomer(record) {
  const f = record.fields;
  return {
    orderId: f["Order ID"],
    productEdition: f["Product Edition"],
    recipientName: f["Recipient Name"],
    occasionDate: f["Occasion Date"],
    cubeBreakdown: f["Cube Breakdown"],
    addonType: f["Add-on"],
    addonDetail: f["Add-on Detail"],
    paymentStatus: f["Payment Status"],
    fulfillmentStatus: f["Fulfillment Status"] || "Order Confirmed",
    courier: f["Courier"],
    trackingNumber: f["Tracking Number"],
    orderDate: f["Order Date"],
  };
}

export const GET = withErrorHandling("track", async (req) => {
  const { searchParams } = new URL(req.url);

  const limit = await checkTrackRateLimit(getRequestIp(req));
  if (!limit.allowed) {
    throw badRequest({
      status: 429,
      code: "rate_limited",
      what: "You've looked up too many orders in a short time.",
      why: "We cap how often this can be searched, so nobody can work through customer emails one at a time.",
      action: `Wait about ${Math.ceil(limit.retryAfterSeconds / 60)} minutes and try again, or sign in to see all your orders at once.`,
    });
  }

  // A signed-in customer has already proved this address is theirs, so they
  // get their own orders with nothing else to supply.
  //
  // Deliberately not wrapped in .catch(() => null): a missing cookie already
  // resolves to null without throwing, so the only thing a catch here would
  // swallow is the session store being down — and that would silently demote
  // a signed-in customer to the guest path, asking them for an order ID they
  // shouldn't need. Letting it throw gives them the real reason instead.
  const session = await getCurrentSession();
  if (session) {
    const records = await findOrdersByEmail(session.email);
    return Response.json({ orders: records.map(serializeForCustomer) });
  }

  const email = emailField(searchParams.get("email"));

  // Guests must know the order ID as well. An email address on its own is
  // guessable and often public; the order ID is only in the confirmation, so
  // together they're evidence the person actually placed the order. Without
  // this, anyone who knows a customer's email could read their order history.
  const rawOrderId = (searchParams.get("orderId") || "").trim();
  if (!rawOrderId) {
    throw badRequest({
      field: "orderId",
      code: "order_id_required",
      what: "We need your order ID as well as your email.",
      why: "An email address on its own isn't proof the order is yours, and these show a recipient's details.",
      action: "Copy the order ID from your confirmation email, or sign in and we'll show all your orders without it.",
    });
  }
  const orderId = requiredString(rawOrderId, {
    field: "orderId",
    label: "Order ID",
    max: LIMITS.orderId,
  });

  const records = await findOrdersByEmail(email);
  const match = records.filter((r) => r.fields["Order ID"] === orderId);

  // One message whether the email is unknown or the order ID doesn't match,
  // so this can't be used to test which addresses have ordered.
  if (match.length === 0) {
    throw badRequest({
      status: 404,
      code: "order_not_found",
      what: "We couldn't find an order with those details.",
      why: "Either the email or the order ID doesn't match what we have. They both need to be exactly as they appear in your confirmation email.",
      action: "Check the confirmation email and try again, or sign in if you have an account and we'll show all your orders without the order ID.",
    });
  }

  return Response.json({ orders: match.map(serializeForCustomer) });
}, {
  what: "We couldn't look up your order.",
  dependency: "our order database",
  note: "Your order itself is fine — this is only the lookup failing.",
});
