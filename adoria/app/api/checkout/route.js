import { createBill } from "../../../lib/toyyibpay";
import { updateOrder } from "../../../lib/airtable";

export async function POST(req) {
  try {
    const { orderId, recordId, name, email, phone, amountRM } = await req.json();
    if (!orderId || !recordId || !amountRM) {
      return Response.json({ error: "Missing order details." }, { status: 400 });
    }

    const site = process.env.SITE_URL;
    const { billCode, paymentUrl } = await createBill({
      orderId,
      name,
      email,
      phone,
      amountRM,
      returnUrl: `${site}/thank-you`,
      callbackUrl: `${site}/api/toyyibpay-callback`,
    });

    await updateOrder(recordId, { "ToyyibPay Bill Code": billCode });

    return Response.json({ paymentUrl });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not start payment. Please try again." }, { status: 500 });
  }
}
