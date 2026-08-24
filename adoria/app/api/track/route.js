import { findOrdersByEmail } from "../../../lib/airtable";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const orderId = searchParams.get("orderId");

  if (!email) {
    return Response.json({ error: "Enter the email you used to order." }, { status: 400 });
  }

  try {
    let records = await findOrdersByEmail(email);
    if (orderId) {
      records = records.filter((r) => r.fields["Order ID"] === orderId);
    }
    const orders = records.map((r) => ({
      orderId: r.fields["Order ID"],
      productEdition: r.fields["Product Edition"],
      recipientName: r.fields["Recipient Name"],
      occasionDate: r.fields["Occasion Date"],
      chocolateBreakdown: r.fields["Chocolate Breakdown"],
      cardMessage: r.fields["Card Message"],
      addonType: r.fields["Add-on"],
      addonDetail: r.fields["Add-on Detail"],
      address: [r.fields["Street Address"], r.fields["City"], r.fields["State"], r.fields["Postcode"]]
        .filter(Boolean)
        .join(", "),
      paymentStatus: r.fields["Payment Status"],
      fulfillmentStatus: r.fields["Fulfillment Status"] || "Order Confirmed",
      courier: r.fields["Courier"],
      trackingNumber: r.fields["Tracking Number"],
      orderDate: r.fields["Order Date"],
    }));
    return Response.json({ orders });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not look up your orders right now." }, { status: 500 });
  }
}
