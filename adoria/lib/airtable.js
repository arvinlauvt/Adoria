const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || "Orders";

const API_URL = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
  TABLE_NAME
)}`;

function headers() {
  return {
    Authorization: `Bearer ${AIRTABLE_TOKEN}`,
    "Content-Type": "application/json",
  };
}

// Creates a new order record. `fields` keys must match the Airtable
// column names exactly - see README "Airtable schema" section.
export async function createOrder(fields) {
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

// Returns every order placed with this email, most recent first.
export async function findOrdersByEmail(email) {
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
