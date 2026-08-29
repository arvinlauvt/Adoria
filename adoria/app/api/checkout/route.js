import { createBill } from "../../../lib/toyyibpay";
import { updateOrder, getOrder } from "../../../lib/airtable";
import { requirePaymentConfig } from "../../../lib/config";
import { withErrorHandling, badRequest } from "../../../lib/errors";
import { readJsonBody, requiredString, LIMITS } from "../../../lib/sanitize";
import { checkOrderRateLimit } from "../../../lib/auth/rateLimit";
import { getRequestIp } from "../../../lib/auth/requestIp";

export const POST = withErrorHandling("checkout", async (req) => {
  // Fails here, with a precise message in the logs, rather than halfway
  // through creating a bill with an undefined callback URL.
  requirePaymentConfig();

  const limit = await checkOrderRateLimit(getRequestIp(req));
  if (!limit.allowed) {
    throw badRequest({
      status: 429,
      code: "rate_limited",
      what: "Too many payment attempts.",
      action: `Wait about ${Math.ceil(limit.retryAfterSeconds / 60)} minutes, or message us on WhatsApp.`,
    });
  }

  const body = await readJsonBody(req);
  const orderId = requiredString(body.orderId, { field: "orderId", label: "Order reference", max: LIMITS.orderId });
  const recordId = requiredString(body.recordId, { field: "recordId", label: "Order reference", max: LIMITS.recordId });

  const order = await getOrder(recordId);
  const fields = order?.fields;

  if (!fields) {
    throw badRequest({
      status: 404,
      code: "order_not_found",
      what: "We couldn't find that order.",
      action: "Start again from the product page. Nothing has been charged.",
    });
  }

  // The record ID alone used to be enough to act on an order. It's returned
  // to the browser at order creation, so anyone holding one could start a
  // payment against someone else's order and overwrite its bill code —
  // detaching the real customer's payment from their record. Requiring the
  // order ID to match as well means a bare record ID is no longer a key to
  // the order.
  if (fields["Order ID"] !== orderId) {
    throw badRequest({
      status: 403,
      code: "order_mismatch",
      what: "That order reference doesn't match.",
      action: "Start again from the product page. Nothing has been charged.",
    });
  }

  if (fields["Payment Status"] === "Paid") {
    throw badRequest({
      status: 409,
      code: "already_paid",
      what: "This order is already paid.",
      action: "Check your email for the receipt, or look it up on the tracking page.",
    });
  }

  // Charge exactly what was committed to Airtable at order creation — never
  // a number the browser sends at this step.
  const amountRM = fields["Order Total (RM)"];
  if (typeof amountRM !== "number" || !Number.isFinite(amountRM) || amountRM <= 0) {
    throw badRequest({
      status: 422,
      code: "amount_unverifiable",
      what: "We couldn't confirm the price, so we've stopped rather than guess.",
      action: "Start again, or message us on WhatsApp. Nothing has been charged.",
    });
  }

  const { siteUrl } = requirePaymentConfig();
  const { billCode, paymentUrl } = await createBill({
    orderId,
    name: fields["Customer Name"],
    email: fields["Customer Email"],
    phone: fields["Customer Phone"],
    amountRM,
    returnUrl: `${siteUrl}/thank-you`,
    callbackUrl: `${siteUrl}/api/toyyibpay-callback`,
  });

  // If this write fails the bill exists but nothing links it back to the
  // order, so the payment callback would never find it. Surfaced rather than
  // swallowed: better to send the customer back than to let them pay for an
  // order we can't reconcile.
  try {
    await updateOrder(recordId, { "ToyyibPay Bill Code": billCode });
  } catch (err) {
    console.error(
      `[checkout] created bill ${billCode} for order ${orderId} but failed to store the bill code:`,
      err && err.stack ? err.stack : err
    );
    throw badRequest({
      status: 503,
      code: "bill_link_failed",
      what: "Don't pay yet — we couldn't link that payment to your order.",
      action: "Message us on WhatsApp with your order reference and we'll finish it by hand.",
    });
  }

  return Response.json({ paymentUrl });
}, {
  what: "We couldn't start your payment.",
  // Kept: "did I just get charged?" is the only question that matters here.
  note: "Your order is saved and nothing has been charged.",
});
