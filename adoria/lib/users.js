// Users table lives in the same Airtable base as Orders, but as its own
// table — see README "Auth (Users table)" for the exact schema to create.
import { inMemoryStoreAllowed, createInMemoryUsers, warnInMemory } from "./devStore";
import { escapeFormulaValue } from "./sanitize";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.AIRTABLE_USERS_TABLE_NAME || "Users";

const API_URL = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
  TABLE_NAME
)}`;

// Same opt-in-only rule as lib/redis.js: a developer without Airtable
// credentials can run the auth flow against an in-memory table, but it can
// never engage by accident (and never on Netlify).
let devUsers = null;
function dev() {
  if (AIRTABLE_TOKEN && BASE_ID) return null;
  if (!inMemoryStoreAllowed()) return null;
  if (!devUsers) {
    warnInMemory("Users table");
    devUsers = createInMemoryUsers();
  }
  return devUsers;
}

function headers() {
  return {
    Authorization: `Bearer ${AIRTABLE_TOKEN}`,
    "Content-Type": "application/json",
  };
}

// `fields` keys must match the Airtable column names exactly. Never pass a
// plaintext password or raw TOTP secret here — hash/encrypt first (see
// lib/auth/password.js, lib/auth/crypto.js).
export async function createUser(fields) {
  const d = dev();
  if (d) return d.createUser(fields);
  const res = await fetch(API_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable createUser failed: ${res.status} ${body}`);
  }
  return res.json();
}

export async function findUserByEmail(email) {
  const d = dev();
  if (d) return d.findUserByEmail(email);
  const formula = encodeURIComponent(
    `LOWER({Email}) = "${escapeFormulaValue(email).toLowerCase()}"`
  );
  const res = await fetch(`${API_URL}?filterByFormula=${formula}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable findUserByEmail failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  return data.records[0] || null;
}

export async function getUserById(recordId) {
  const d = dev();
  if (d) return d.getUserById(recordId);
  const res = await fetch(`${API_URL}/${recordId}`, { headers: headers() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable getUserById failed: ${res.status} ${body}`);
  }
  return res.json();
}

export async function updateUser(recordId, fields) {
  const d = dev();
  if (d) return d.updateUser(recordId, fields);
  const res = await fetch(`${API_URL}/${recordId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable updateUser failed: ${res.status} ${body}`);
  }
  return res.json();
}
