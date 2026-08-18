import { createOrder } from "../../../lib/airtable";

function makeOrderId() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ADR-${stamp}-${rand}`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      recipientName,
      occasionDate,
      productEdition,
      quantity,
      chocolateBreakdown,
      cardMessage,
      street,
      city,
      state,
      postcode,
      amountRM,
    } = body;

    if (!name || !phone || !email || !recipientName || !productEdition || !street || !city || !state || !postcode) {
      return Response.json({ error: "Missing required fields." }, { status: 400 });
    }

    const orderId = makeOrderId();

    const fields = {
      "Order ID": orderId,
      "Customer Name": name,
      "Customer Email": email,
      "Customer Phone": phone,
      "Recipient Name": recipientName,
      "Product Edition": productEdition,
      "Chocolate Breakdown": chocolateBreakdown,
      Quantity: quantity,
      "Card Message": cardMessage || "",
      "Street Address": street,
      City: city,
      State: state,
      Postcode: postcode,
      "Order Total": amountRM,
      "Payment Status": "Pending",
      "Fulfillment Status": "Processing",
      "Order Date": new Date().toISOString(),
    };
    if (occasionDate) fields["Occasion Date"] = occasionDate;

    const record = await createOrder(fields);

    return Response.json({ orderId, recordId: record.id });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not save your order. Please try again." }, { status: 500 });
  }
}
