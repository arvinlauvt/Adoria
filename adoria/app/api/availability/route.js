import { getCommittedBoxesForRange } from "../../../lib/airtable";
import { MAX_BOXES_PER_DAY } from "../../../lib/products";
import { withErrorHandling, badRequest } from "../../../lib/errors";

export const dynamic = "force-dynamic";

function pad(n) {
  return String(n).padStart(2, "0");
}

// Returns the delivery dates within the requested calendar month that are
// already fully booked (>= MAX_BOXES_PER_DAY Paid boxes, shared across every
// product) — the delivery-date calendar disables these client-side, and
// /api/create-order re-checks the chosen date server-side before charging,
// since this endpoint's response can go stale between requests.
export const GET = withErrorHandling("availability", async (req) => {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw badRequest({
      field: "month",
      code: "month_invalid",
      what: "We couldn't read that month.",
      why: "It needs to arrive as YYYY-MM with a month between 01 and 12.",
      action: "Reload the page and use the calendar's own arrows to change month.",
    });
  }

  const [year, mm] = month.split("-").map(Number);

  // Bounded to a sane window. Without this, a request for year 275760 makes
  // us build an enormous date range and ask Airtable to scan it.
  const thisYear = new Date().getFullYear();
  if (year < thisYear - 1 || year > thisYear + 3) {
    throw badRequest({
      field: "month",
      code: "month_out_of_range",
      what: "That month is outside what we take orders for.",
      why: `We only schedule deliveries between ${thisYear - 1} and ${thisYear + 3}.`,
      action: "Pick a date within the next couple of years.",
    });
  }

  const daysInMonth = new Date(year, mm, 0).getDate();
  const startISO = `${year}-${pad(mm)}-01`;
  const endISO = `${year}-${pad(mm)}-${pad(daysInMonth)}`;

  const committed = await getCommittedBoxesForRange(startISO, endISO);
  const full = Object.keys(committed).filter((date) => committed[date] >= MAX_BOXES_PER_DAY);

  return Response.json({ full });
});
