import { inMemoryStoreAllowed, createInMemoryOrders, warnInMemory } from "./devStore";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || "Orders";

const API_URL = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
  TABLE_NAME
)}`;

// Opt-in-only in-memory orders, on the same terms as lib/redis.js and
// lib/users.js: only when Airtable credentials are absent, only when the
// flag is explicitly set, and never on Netlify. With real credentials
// present this is inert and every call below goes to Airtable unchanged.
let devOrders = null;
function dev() {
  if (AIRTABLE_TOKEN && BASE_ID) return null;
  if (!inMemoryStoreAllowed()) return null;
  if (!devOrders) {
    warnInMemory("Orders table");
    devOrders = createInMemoryOrders();
  }
  return devOrders;
}

function headers() {
  return {
    Authorization: `Bearer ${AIRTABLE_TOKEN}`,
    "Content-Type": "application/json",
  };
}

// Creates a new order record. `fields` keys must match the Airtable
// column names exactly - see README "Airtable schema" section.
export async function createOrder(fields) {
  const d = dev();
  if (d) return d.createOrder(fields);
  const res = await fetch(API_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable createOrder failed: ${res.status} ${body}`);
  }
  return res.json();
}

// Looks up the single order record that holds this ToyyibPay bill code.
export async function findOrderByBillCode(billCode) {
  const formula = encodeURIComponent(`{ToyyibPay Bill Code} = "${billCode}"`);
  const res = await fetch(`${API_URL}?filterByFormula=${formula}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable lookup failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  return data.records[0] || null;
}

export async function updateOrder(recordId, fields) {
  const d = dev();
  if (d) return d.updateOrder(recordId, fields);
  const res = await fetch(`${API_URL}/${recordId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable update failed: ${res.status} ${body}`);
  }
  return res.json();
}

// Fetches a single order record by its Airtable record ID. Used at checkout
// to charge the amount actually committed to Airtable, never a client-
// supplied number, so a tampered request can't pay less than it should.
export async function getOrder(recordId) {
  const d = dev();
  if (d) return d.getOrder(recordId);
  const res = await fetch(`${API_URL}/${recordId}`, { headers: headers() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable getOrder failed: ${res.status} ${body}`);
  }
  return res.json();
}

// Every order, most recent first, for the admin dashboard. Paged through
// Airtable's 100-record limit so a busy month doesn't silently truncate the
// list — an order missing from the fulfilment queue is an order that doesn't
// get made.
export async function listOrders({ pageLimit = 20 } = {}) {
  const d = dev();
  if (d) return d.listOrders();

  const records = [];
  let offset;
  for (let page = 0; page < pageLimit; page++) {
    const params = new URLSearchParams({
      "sort[0][field]": "Order Date",
      "sort[0][direction]": "desc",
      pageSize: "100",
    });
    if (offset) params.set("offset", offset);

    const res = await fetch(`${API_URL}?${params}`, { headers: headers() });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable listOrders failed: ${res.status} ${body}`);
    }
    const data = await res.json();
    records.push(...data.records);
    if (!data.offset) break;
    offset = data.offset;
  }
  return records;
}

// Returns every order placed with this email, most recent first.
export async function findOrdersByEmail(email) {
  const d = dev();
  if (d) {
    const all = await d.listOrders();
    const target = email.toLowerCase();
    return all.filter(
      (r) => String(r.fields["Customer Email"] || "").toLowerCase() === target
    );
  }
  const safe = email.replace(/"/g, '\\"');
  const formula = encodeURIComponent(
    `LOWER({Customer Email}) = "${safe.toLowerCase()}"`
  );
  const res = await fetch(
    `${API_URL}?filterByFormula=${formula}&sort[0][field]=Order Date&sort[0][direction]=desc`,
    { headers: headers() }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable email lookup failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  return data.records;
}

// Total boxes already Paid for a single delivery date, across every
// product (the kitchen's daily capacity is shared) — used to reject a
// checkout that would push that date over MAX_BOXES_PER_DAY. `dateISO`
// must already be validated as YYYY-MM-DD by the caller before this runs,
// since it's interpolated directly into the filter formula.
export async function getCommittedBoxesForDate(dateISO) {
  const formula = encodeURIComponent(
    `AND({Payment Status} = "Paid", {Occasion Date} = "${dateISO}")`
  );
  const res = await fetch(`${API_URL}?filterByFormula=${formula}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable capacity lookup failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  return data.records.reduce((sum, r) => sum + (r.fields["Quantity"] || 0), 0);
}

// Same as getCommittedBoxesForDate but for a whole date range in one call —
// used to paint a full calendar month at once instead of one request per
// day. Returns { "YYYY-MM-DD": totalBoxes }, only for dates with a Paid
// order. `startISO`/`endISO` must already be validated as YYYY-MM-DD.
export async function getCommittedBoxesForRange(startISO, endISO) {
  const formula = encodeURIComponent(
    `AND({Payment Status} = "Paid", NOT({Occasion Date} = ""), IS_AFTER({Occasion Date}, DATEADD(DATETIME_PARSE("${startISO}", 'YYYY-MM-DD'), -1, 'days')), IS_BEFORE({Occasion Date}, DATEADD(DATETIME_PARSE("${endISO}", 'YYYY-MM-DD'), 1, 'days')))`
  );
  const res = await fetch(
    `${API_URL}?filterByFormula=${formula}&fields%5B%5D=Occasion%20Date&fields%5B%5D=Quantity`,
    { headers: headers() }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable range capacity lookup failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  const totals = {};
  for (const r of data.records) {
    const date = r.fields["Occasion Date"];
    if (!date) continue;
    totals[date] = (totals[date] || 0) + (r.fields["Quantity"] || 0);
  }
  return totals;
}
