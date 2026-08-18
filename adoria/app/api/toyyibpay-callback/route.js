import { getBillTransactions } from "../../../lib/toyyibpay";
import { findOrderByBillCode, updateOrder } from "../../../lib/airtable";

// ToyyibPay posts this as application/x-www-form-urlencoded.
// We never trust the POST body's status field alone — always re-check
// against ToyyibPay's own getBillTransactions before marking an order Paid.
export async function POST(req) {
  try {
    const form = await req.formData();
    const billCode = form.get("billcode");
    if (!billCode) return new Response("missing billcode", { status: 400 });

    const order = await findOrderByBillCode(billCode);
    if (!order) return new Response("order not found", { status: 404 });

    const txn = await getBillTransactions(billCode);
    const paid = txn && txn.billpaymentStatus === "1";

    await updateOrder(order.id, {
      "Payment Status": paid ? "Paid" : "Failed",
    });

    return new Response("ok");
  } catch (err) {
    console.error(err);
    return new Response("error", { status: 500 });
  }
}
