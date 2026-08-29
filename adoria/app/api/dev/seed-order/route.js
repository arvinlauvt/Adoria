import { createOrder } from "../../../../lib/airtable";
import { inMemoryStoreAllowed } from "../../../../lib/devStore";
import { PRODUCTS } from "../../../../lib/products";

// Read from the catalog rather than spelling these out. "Product Edition" is
// a single-select in Airtable and the site's token deliberately has no schema
// permissions, so an edition name that isn't already an option fails with
// INVALID_MULTIPLE_CHOICE_OPTIONS instead of silently adding one. Deriving
// them here means the seeder can't drift away from what checkout writes.
const EDITIONS = PRODUCTS.map((p) => p.edition);

// Test-only, gated like the other dev routes so it 404s in any real
// deployment. Lets the admin dashboard and /track be exercised without
// placing a real order through checkout.
async function seed({ count, email }) {
  const n = Math.min(Math.max(Number(count) || 1, 1), 20);

  // Without this every seeded order belongs to customer0@example.com, so a
  // signed-in tester sees an empty list and reasonably concludes /track is
  // broken. Passing your own address is the whole point of seeding.
  const to = String(email || "").trim().toLowerCase();

  const created = [];
  for (let i = 0; i < n; i++) {
    const record = await createOrder({
      "Order ID": `CBL-TEST-${String(Date.now()).slice(-6)}-${i}`,
      "Order Date": new Date(Date.now() - i * 86400000).toISOString(),
      "Customer Email": to || `customer${i}@example.com`,
      "Recipient Name": ["Jane Doe", "Aisyah Rahman", "Wei Ling Tan"][i % 3],
      "Product Edition": EDITIONS[i % EDITIONS.length],
      Boxes: (i % 2) + 1,
      "Occasion Date": new Date(Date.now() + (7 + i) * 86400000).toISOString().slice(0, 10),
      "Cube Breakdown": "Box 1: 10 Double Chocolate, 15 Blueberry Biscoff (25/25)",
      "Street Address": `${10 + i} Jalan Teluk Sisek`,
      City: "Kuantan",
      State: "Pahang",
      Postcode: "25000",
      "Payment Status": i === 3 ? "Pending" : "Paid",
      "Fulfillment Status": i === 1 ? "Delivered" : "Order Confirmed",
    });
    created.push({ id: record.id, orderId: record.fields?.["Order ID"] });
  }

  return Response.json({ ok: true, count: created.length, email: to || "customer0@example.com", created });
}

export async function POST(req) {
  if (!inMemoryStoreAllowed()) return new Response("Not found", { status: 404 });
  const body = await req.json().catch(() => ({}));
  return seed({ count: body.count, email: body.email });
}

// A GET that writes is normally wrong, and this one only exists because the
// alternative is talking someone through a fetch() in the browser console.
// It cannot reach production: the same gate above 404s whenever NETLIFY is
// set or the opt-in flag is missing.
//
//   /api/dev/seed-order?count=3&email=you@example.com
export async function GET(req) {
  if (!inMemoryStoreAllowed()) return new Response("Not found", { status: 404 });
  const { searchParams } = new URL(req.url);
  return seed({ count: searchParams.get("count"), email: searchParams.get("email") });
}
