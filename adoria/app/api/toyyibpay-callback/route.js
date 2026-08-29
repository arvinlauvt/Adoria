import { getBillTransactions } from "../../../lib/toyyibpay";
import { findOrderByBillCode, updateOrder } from "../../../lib/airtable";
import { stripControl, LIMITS } from "../../../lib/sanitize";

// ToyyibPay posts this as application/x-www-form-urlencoded. We never trust
// the POST body's status field alone — always re-check against ToyyibPay's
// own getBillTransactions before marking an order Paid.
//
// Nothing here is silent. This endpoint is how money becomes a confirmed
// order, so every failure path logs loudly and with the bill code attached:
// if reconciliation breaks, the log is the only way anyone finds out before
// a customer complains that they paid and heard nothing.
export async function POST(req) {
  let billCode = "(unread)";
  try {
    let form;
    try {
      form = await req.formData();
    } catch (err) {
      console.error("[toyyibpay-callback] body was not readable form data:", err);
      return new Response("bad request", { status: 400 });
    }

    billCode = stripControl(form.get("billcode") || "").trim();
    if (!billCode || billCode.length > LIMITS.billCode) {
      console.error(
        `[toyyibpay-callback] rejected: billcode missing or implausible (length ${billCode.length}).`
      );
      return new Response("missing billcode", { status: 400 });
    }

    const order = await findOrderByBillCode(billCode);
    if (!order) {
      // Worth shouting about: a real payment whose order we can't find means
      // someone has paid and will get nothing until a human intervenes.
      console.error(
        `[toyyibpay-callback] NO MATCHING ORDER for bill code ${billCode}. ` +
          `If this bill was really paid, that payment is unreconciled and needs manual attention.`
      );
      return new Response("order not found", { status: 404 });
    }

    const txn = await getBillTransactions(billCode);
    const paid = txn && txn.billpaymentStatus === "1";

    await updateOrder(order.id, { "Payment Status": paid ? "Paid" : "Failed" });

    console.log(
      `[toyyibpay-callback] order ${order.fields?.["Order ID"] || order.id} marked ${
        paid ? "Paid" : "Failed"
      } (bill ${billCode}).`
    );
    return new Response("ok");
  } catch (err) {
    // A throw here means the payment may have succeeded while the order stays
    // Pending. Returning 500 asks ToyyibPay to retry; the log is what makes
    // it recoverable by hand if the retries also fail.
    console.error(
      `[toyyibpay-callback] FAILED to reconcile bill ${billCode}. The payment may have ` +
        `succeeded while the order is still Pending — check this order by hand.`,
      err && err.stack ? err.stack : err
    );
    return new Response("error", { status: 500 });
  }
}
