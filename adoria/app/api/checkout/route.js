import { createBill } from "../../../lib/toyyibpay";
import { updateOrder, getOrder } from "../../../lib/airtable";

export async function POST(req) {
  try {
    const { orderId, recordId, name, email, phone } = await req.json();
    if (!orderId || !recordId) {
      return Response.json({ error: "Missing order details." }, { status: 400 });
    }

    // Charge exactly what was committed to Airtable at order creation —
    // never a number the browser sends at this step.
    const order = await getOrder(recordId);
    const amountRM = order?.fields?.["Order Total"];
    if (!amountRM || amountRM <= 0) {
      return Response.json({ error: "Could not verify the order amount." }, { status: 400 });
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
