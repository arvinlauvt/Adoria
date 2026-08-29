import { createOrder } from "../../../../lib/airtable";
import { inMemoryStoreAllowed } from "../../../../lib/devStore";

// Test-only, gated like the other dev routes so it 404s in any real
// deployment. Lets the admin dashboard be exercised without Airtable.
export async function POST(req) {
  if (!inMemoryStoreAllowed()) {
    return new Response("Not found", { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const n = Math.min(Number(body.count) || 1, 20);
  const created = [];

  for (let i = 0; i < n; i++) {
    const record = await createOrder({
      "Order ID": `CBL-TEST-${String(Date.now()).slice(-6)}-${i}`,
      "Order Date": new Date(Date.now() - i * 86400000).toISOString(),
      "Customer Email": `customer${i}@example.com`,
      "Recipient Name": ["Jane Doe", "Aisyah Rahman", "Wei Ling Tan"][i % 3],
      "Product Edition": ["Anniversary", "Congratulations", "Hostess"][i % 3],
      Quantity: (i % 2) + 1,
      "Occasion Date": new Date(Date.now() + (7 + i) * 86400000).toISOString().slice(0, 10),
      "Chocolate Breakdown": "Box 1: 10 Noir Cubes, 15 Cacao Sepia (25/25)",
      "Street Address": `${10 + i} Jalan Teluk Sisek`,
      City: "Kuantan",
      State: "Pahang",
      Postcode: "25000",
      "Payment Status": i === 3 ? "Pending" : "Paid",
      "Fulfillment Status": i === 1 ? "Delivered" : "Order Confirmed",
    });
    created.push(record.id);
  }

  return Response.json({ ok: true, created });
}
