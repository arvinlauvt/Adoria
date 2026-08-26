import { getCommittedBoxesForRange } from "../../../lib/airtable";
import { MAX_BOXES_PER_DAY } from "../../../lib/products";

function pad(n) {
  return String(n).padStart(2, "0");
}

// Returns the delivery dates within the requested calendar month that are
// already fully booked (>= MAX_BOXES_PER_DAY Paid boxes, shared across
// every product) — the delivery-date calendar disables these client-side,
// and /api/create-order re-checks the chosen date server-side before
// charging, since this endpoint's response can go stale between requests.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return Response.json({ error: "Invalid month." }, { status: 400 });
    }
    const [year, mm] = month.split("-").map(Number);
    const daysInMonth = new Date(year, mm, 0).getDate();
    const startISO = `${year}-${pad(mm)}-01`;
    const endISO = `${year}-${pad(mm)}-${pad(daysInMonth)}`;

    const committed = await getCommittedBoxesForRange(startISO, endISO);
    const full = Object.keys(committed).filter((date) => committed[date] >= MAX_BOXES_PER_DAY);

    return Response.json({ full });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not load availability." }, { status: 500 });
  }
}
