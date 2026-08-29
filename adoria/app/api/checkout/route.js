import { createBill } from "../../../lib/toyyibpay";
import { updateOrder, getOrder } from "../../../lib/airtable";
import { requirePaymentConfig } from "../../../lib/config";
import { withErrorHandling, badRequest } from "../../../lib/errors";
import { readJsonBody, requiredString, LIMITS } from "../../../lib/sanitize";

export const POST = withErrorHandling("checkout", async (req) => {
  // Fails here, with a precise message in the logs, rather than halfway
  // through creating a bill with an undefined callback URL.
  requirePaymentConfig();

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
      why: "The reference doesn't match anything in our system, which usually means the page was left open long enough for the order to be cleared.",
      action: "Start the order again from the product page. Nothing has been charged.",
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
      why: "The two identifiers sent with the request belong to different orders, so we've stopped rather than charging for the wrong one.",
      action: "Start the order again from the product page. Nothing has been charged.",
    });
  }

  if (fields["Payment Status"] === "Paid") {
    throw badRequest({
      status: 409,
      code: "already_paid",
      what: "This order is already paid.",
      why: "We've received payment for it, so there's nothing left to charge.",
      action: "Check your email for the receipt, or look it up on the order tracking page.",
    });
  }

  // Charge exactly what was committed to Airtable at order creation — never
  // a number the browser sends at this step.
  const amountRM = fields["Order Total"];
  if (typeof amountRM !== "number" || !Number.isFinite(amountRM) || amountRM <= 0) {
    throw badRequest({
      status: 422,
      code: "amount_unverifiable",
      what: "We couldn't confirm what this order should cost.",
      why: "The saved total is missing or unreadable, and we won't guess at a price to charge you.",
      action: "Start the order again from the product page, or message us on WhatsApp and we'll take it manually. Nothing has been charged.",
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
      what: "We created your payment but couldn't finish linking it to your order.",
      why: "Our order database didn't accept the update, so paying now would leave your order unconfirmed.",
      action: "Don't pay yet. Try again in a moment, or message us on WhatsApp with your order reference and we'll finish it by hand.",
    });
  }

  return Response.json({ paymentUrl });
});
