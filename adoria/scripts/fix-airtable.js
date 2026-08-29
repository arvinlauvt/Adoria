#!/usr/bin/env node
/**
 * Applies the schema changes the code now expects: renames the four stale
 * columns and adds the select options that are missing.
 *
 *   node scripts/fix-airtable.js            # show what would change
 *   node scripts/fix-airtable.js --apply    # actually change it
 *
 *   AIRTABLE_SCHEMA_TOKEN=pat... AIRTABLE_BASE_ID=app... node scripts/fix-airtable.js
 *
 * The token needs schema.bases:read AND schema.bases:write.
 *
 * Dry-run by default, deliberately: this edits the live base holding real
 * orders, and a rename you didn't expect is worth catching before it happens
 * rather than after.
 *
 * Both operations preserve data. Renaming a field keeps every value in it —
 * Airtable tracks fields by id, not name. Adding a select option leaves the
 * existing options and the rows using them untouched.
 *
 * ⚠ A rename takes effect immediately, and the deployed site writes the OLD
 * names until it is redeployed. Run this at the same time as the deploy, not
 * before it, or live orders will fail in between.
 */

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_SCHEMA_TOKEN;
const ORDERS_TABLE = process.env.AIRTABLE_TABLE_NAME || "Orders";
const APPLY = process.argv.includes("--apply");

// from -> to. Only these four; anything else is left alone.
const RENAMES = [
  ["Chocolate Breakdown", "Cube Breakdown"],
  ["Quantity", "Boxes"],
  ["Card Message", "Message Text"],
  ["Order Total", "Order Total (RM)"],
];

// Select options the code can produce that may not exist yet.
const ADD_OPTIONS = [["Add-on", ["None", "Flower Frame Kit", "Custom Brass Bookmark"]]];

function die(what, why, action) {
  console.error(`\n  ✗ ${what}\n    ${why}\n    → ${action}\n`);
  process.exit(1);
}

async function api(path, init) {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init && init.headers),
    },
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
        "A network restriction, not your token. Run this where api.airtable.com is reachable."
      );
    }
    if (res.status === 401) {
      die("Airtable rejected the token.", "Expired, revoked, or pasted incompletely.", "Create a fresh one at https://airtable.com/create/tokens.");
    }
    if (res.status === 403) {
      die(
        "That token isn't allowed to change the base's structure.",
        "Renaming a field needs schema.bases:write, which is separate from schema.bases:read — having one doesn't grant the other.",
        "Edit the token at https://airtable.com/create/tokens, tick BOTH schema scopes, and list this base under its access."
      );
    }
    die(`Airtable returned ${res.status}.`, body?.error?.message || text, "Check https://status.airtable.com if this repeats.");
  }
  return body;
}

async function main() {
  if (!TOKEN) die("AIRTABLE_SCHEMA_TOKEN is not set.", "This needs schema.bases:read and schema.bases:write.", "set AIRTABLE_SCHEMA_TOKEN=pat... then run again.");
  if (!BASE_ID || !BASE_ID.startsWith("app")) die("AIRTABLE_BASE_ID is missing or malformed.", `Base IDs start with "app". Got: ${JSON.stringify(BASE_ID)}`, "Copy it from the base's URL.");

  const { tables } = await api("/tables");
  const table = (tables || []).find((t) => t.name.toLowerCase() === ORDERS_TABLE.toLowerCase());
  if (!table) die(`No table named "${ORDERS_TABLE}".`, `Found: ${(tables || []).map((t) => t.name).join(", ")}`, "Check AIRTABLE_TABLE_NAME.");

  const byName = new Map(table.fields.map((f) => [f.name, f]));
  const planned = [];

  for (const [from, to] of RENAMES) {
    if (byName.has(to)) {
      console.log(`  · "${to}" already exists — nothing to do.`);
      continue;
    }
    const field = byName.get(from);
    if (!field) {
      console.log(`  · "${from}" not found and "${to}" doesn't exist either — skipping.`);
      continue;
    }
    planned.push({ kind: "rename", id: field.id, from, to });
  }

  for (const [fieldName, wanted] of ADD_OPTIONS) {
    const field = byName.get(fieldName);
    if (!field) {
      console.log(`  · "${fieldName}" not found — skipping its options.`);
      continue;
    }
    const existing = field.options?.choices || [];
    const have = new Set(existing.map((c) => c.name));
    const missing = wanted.filter((w) => !have.has(w));
    if (!missing.length) {
      console.log(`  · "${fieldName}" already has every option.`);
      continue;
    }
    planned.push({ kind: "options", id: field.id, fieldName, existing, missing });
  }

  if (!planned.length) {
    console.log("\n  ✓ Nothing to change — the base already matches the code.\n");
    return;
  }

  console.log("");
  for (const p of planned) {
    if (p.kind === "rename") console.log(`  → rename  "${p.from}"  to  "${p.to}"`);
    else console.log(`  → add to  "${p.fieldName}"  option(s): ${p.missing.map((m) => `"${m}"`).join(", ")}`);
  }

  if (!APPLY) {
    console.log(
      "\n  This was a dry run — nothing has changed.\n" +
        "  Re-run with --apply to make these changes.\n" +
        "  Remember: the deployed site writes the OLD names until you redeploy it.\n"
    );
    return;
  }

  console.log("");
  for (const p of planned) {
    if (p.kind === "rename") {
      await api(`/tables/${table.id}/fields/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: p.to }),
      });
      console.log(`  ✓ renamed "${p.from}" to "${p.to}"`);
    } else {
      // Existing choices must be sent back with their ids, or Airtable treats
      // the omitted ones as deleted — which would blank that column on every
      // row already using them.
      const choices = [
        ...p.existing.map((c) => ({ id: c.id, name: c.name })),
        ...p.missing.map((name) => ({ name })),
      ];
      await api(`/tables/${table.id}/fields/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ options: { choices } }),
      });
      console.log(`  ✓ added ${p.missing.length} option(s) to "${p.fieldName}"`);
    }
  }

  console.log("\n  Done. Run scripts/check-airtable.js to confirm it's clean.\n");
}

main().catch((err) => die("Couldn't reach Airtable.", err && err.message ? err.message : String(err), "Check your connection and try again."));
