#!/usr/bin/env node
/**
 * Compares the live Airtable base against what the code actually reads and
 * writes, and reports every difference. Read-only — it changes nothing.
 *
 *   AIRTABLE_SCHEMA_TOKEN=pat... AIRTABLE_BASE_ID=app... node scripts/check-airtable.js
 *
 * The token needs schema.bases:read. That is a different scope from the one
 * the site uses (data.records:*), and having one does not grant the other.
 * Make a throwaway token, run this, then delete it.
 *
 * Why this exists: the failures it catches are all silent until a customer
 * hits them. A date field that should be dateTime rejects every timestamp
 * with a 422. A single-select missing an option refuses the write rather
 * than adding one, because the site's token has no schema permissions. Both
 * surface as "signup failed" or "order failed" a long way from the cause.
 */

const fs = require("fs");
const path = require("path");

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_SCHEMA_TOKEN;
const ORDERS_TABLE = process.env.AIRTABLE_TABLE_NAME || "Orders";
const USERS_TABLE = process.env.AIRTABLE_USERS_TABLE_NAME || "Users";

// Pulled out of lib/products.js rather than restated, so this can't drift
// from the catalog the way the order seeder did. lib/products.js is an ES
// module and this script is CommonJS, so it's read as text.
function editionsFromCatalog() {
  const src = fs.readFileSync(path.join(__dirname, "..", "lib", "products.js"), "utf8");
  const editions = [...src.matchAll(/edition:\s*"([^"]+)"/g)].map((m) => m[1]);
  const addons = [...src.matchAll(/addon:\s*\{[^}]*label:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (!editions.length) {
    throw new Error("Couldn't read any editions out of lib/products.js — has its shape changed?");
  }
  return { editions, addons: [...new Set(addons)] };
}

const { editions, addons } = editionsFromCatalog();

// `types` lists every Airtable type that accepts what the code writes, so a
// reasonable choice isn't reported as a fault. `options` lists select choices
// the code can produce — a missing one is a hard failure at write time.
const ORDERS_FIELDS = [
  { name: "Order ID", types: ["singleLineText"] },
  { name: "Customer Name", types: ["singleLineText"] },
  { name: "Customer Email", types: ["email", "singleLineText"] },
  { name: "Customer Phone", types: ["phoneNumber", "singleLineText"] },
  { name: "Recipient Name", types: ["singleLineText"] },
  { name: "Product Edition", types: ["singleSelect"], options: editions },
  { name: "Chocolate Breakdown", types: ["multilineText", "singleLineText"] },
  { name: "Quantity", types: ["number"] },
  { name: "Message Type", types: ["singleSelect"], options: ["Card Message", "Full Letter"] },
  { name: "Card Message", types: ["multilineText", "singleLineText"] },
  { name: "Add-on", types: ["singleSelect"], options: ["None", ...addons] },
  { name: "Add-on Detail", types: ["multilineText", "singleLineText"] },
  { name: "Street Address", types: ["multilineText", "singleLineText"] },
  { name: "City", types: ["singleLineText"] },
  { name: "State", types: ["singleLineText", "singleSelect"] },
  { name: "Postcode", types: ["singleLineText"] },
  { name: "Order Total", types: ["number", "currency"] },
  {
    name: "Payment Status",
    types: ["singleSelect"],
    options: ["Pending", "Paid", "Failed"],
  },
  {
    name: "Fulfillment Status",
    types: ["singleSelect"],
    options: [
      "Order Confirmed",
      "Baked & Packed",
      "Card Written",
      "Out for Delivery",
      "Delivered",
    ],
  },
  // Written as a full ISO timestamp. A date-only field rejects it outright.
  { name: "Order Date", types: ["dateTime"], note: "needs \"Include time\" turned on" },
  { name: "Occasion Date", types: ["date", "dateTime"] },
  { name: "ToyyibPay Bill Code", types: ["singleLineText"] },
  { name: "Courier", types: ["singleLineText", "singleSelect"] },
  { name: "Tracking Number", types: ["singleLineText"] },
];

const USERS_FIELDS = [
  { name: "Email", types: ["email", "singleLineText"] },
  { name: "Password Hash", types: ["singleLineText"] },
  { name: "Role", types: ["singleSelect"], options: ["Customer", "Admin"] },
  { name: "TOTP Secret", types: ["singleLineText"] },
  { name: "TOTP Enabled", types: ["checkbox"] },
  { name: "Backup Codes", types: ["multilineText", "singleLineText"] },
  { name: "Created At", types: ["dateTime"], note: "needs \"Include time\" turned on" },
];

function die(what, why, action) {
  console.error(`\n  ✗ ${what}\n    ${why}\n    → ${action}\n`);
  process.exit(1);
}

async function fetchSchema() {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    const fromAirtable = body && typeof body.error === "object";
    if (!fromAirtable && [403, 407, 502].includes(res.status)) {
      die(
        "The request never reached Airtable.",
        `Something between you and Airtable refused it (HTTP ${res.status}).`,
        "This is a network restriction, not your token. Run it from a machine that can reach api.airtable.com."
      );
    }
    if (res.status === 401) {
      die("Airtable rejected the token.", "Expired, revoked, or pasted incompletely.", "Create a fresh one at https://airtable.com/create/tokens.");
    }
    if (res.status === 403) {
      die(
        "That token can't read the base's structure.",
        "This needs the schema.bases:read scope, which is separate from data.records:read.",
        "Edit the token at https://airtable.com/create/tokens, add schema.bases:read, and list this base under its access."
      );
    }
    if (res.status === 404) {
      die(`No base found with ID ${BASE_ID}.`, "Either the ID is wrong or the token can't see it.", "Check the ID in the base's URL — it starts with 'app'.");
    }
    die(`Airtable returned ${res.status}.`, body?.error?.message || text, "Check https://status.airtable.com if this repeats.");
  }

  return body.tables || [];
}

function checkTable(table, expected, label) {
  const problems = [];

  if (!table) {
    problems.push({
      kind: "table",
      text: `No table named "${label}" in this base.`,
      fix: `Create it, or set the matching env var if yours has a different name.`,
    });
    return problems;
  }

  const byName = new Map(table.fields.map((f) => [f.name, f]));

  for (const want of expected) {
    const actual = byName.get(want.name);

    if (!actual) {
      problems.push({
        kind: "missing",
        text: `${label} · "${want.name}" is missing.`,
        fix: `Add it as ${want.types[0]}${want.note ? ` (${want.note})` : ""}.`,
      });
      continue;
    }

    if (!want.types.includes(actual.type)) {
      problems.push({
        kind: "type",
        text: `${label} · "${want.name}" is ${actual.type}, needs ${want.types.join(" or ")}.`,
        fix: `Click the field header → Edit field → change the type${want.note ? ` (${want.note})` : ""}.`,
      });
      continue;
    }

    if (want.options) {
      const have = new Set((actual.options?.choices || []).map((c) => c.name));
      const missing = want.options.filter((o) => !have.has(o));
      if (missing.length) {
        problems.push({
          kind: "options",
          text: `${label} · "${want.name}" is missing option(s): ${missing.map((m) => `"${m}"`).join(", ")}.`,
          fix: `Add them to the select. The site's token can't create options, so any write using a missing one fails with a 422.`,
        });
      }
    }
  }

  const expectedNames = new Set(expected.map((f) => f.name));
  const extra = table.fields.filter((f) => !expectedNames.has(f.name)).map((f) => f.name);
  if (extra.length) {
    problems.push({
      kind: "extra",
      text: `${label} · columns the code never touches: ${extra.join(", ")}.`,
      fix: `Harmless — listed only so you can tell leftovers from fields still in use.`,
    });
  }

  return problems;
}

async function main() {
  if (!TOKEN) {
    die(
      "AIRTABLE_SCHEMA_TOKEN is not set.",
      "This needs a token with schema.bases:read.",
      "Run: AIRTABLE_SCHEMA_TOKEN=pat... AIRTABLE_BASE_ID=app... node scripts/check-airtable.js"
    );
  }
  if (!BASE_ID || !BASE_ID.startsWith("app")) {
    die(
      "AIRTABLE_BASE_ID is missing or malformed.",
      `Base IDs start with "app". Got: ${JSON.stringify(BASE_ID)}`,
      "Copy it from the base's URL — the part right after airtable.com/."
    );
  }

  const tables = await fetchSchema();
  const find = (name) => tables.find((t) => t.name.toLowerCase() === name.toLowerCase());

  console.log(`\n  Base    ${BASE_ID}`);
  console.log(`  Tables  ${tables.map((t) => t.name).join(", ") || "(none)"}\n`);

  const problems = [
    ...checkTable(find(ORDERS_TABLE), ORDERS_FIELDS, ORDERS_TABLE),
    ...checkTable(find(USERS_TABLE), USERS_FIELDS, USERS_TABLE),
  ];

  const blocking = problems.filter((p) => p.kind !== "extra");

  if (!problems.length) {
    console.log("  ✓ Both tables match what the code expects. Nothing to change.\n");
    return;
  }

  for (const p of problems) {
    console.log(`  ${p.kind === "extra" ? "·" : "✗"} ${p.text}`);
    console.log(`      ${p.fix}\n`);
  }

  if (blocking.length) {
    console.log(`  ${blocking.length} problem(s) will cause failed writes until fixed.\n`);
    process.exit(1);
  }
  console.log("  Nothing blocking — the notes above are informational.\n");
}

main().catch((err) => {
  die("Couldn't reach Airtable.", err && err.message ? err.message : String(err), "Check your connection and try again.");
});
