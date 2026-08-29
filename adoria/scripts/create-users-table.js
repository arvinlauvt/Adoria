#!/usr/bin/env node
/**
 * Creates the Users table required by the auth system, via Airtable's Meta API.
 *
 * Run this instead of building the table by hand — the field names and the
 * Role options have to match exactly, and a typo in either fails at sign-in
 * rather than here.
 *
 *   AIRTABLE_SCHEMA_TOKEN=pat... AIRTABLE_BASE_ID=app... node scripts/create-users-table.js
 *
 * The token needs BOTH schema.bases:read and schema.bases:write. Those are two
 * separate scopes — listing the existing tables (so this doesn't create a
 * duplicate) is a read, creating the table is a write, and having one does not
 * grant the other. Neither is granted by the scopes the site itself uses
 * (data.records:read / data.records:write). Create a separate token for this,
 * run it once, then delete it — nothing in the running app needs schema access.
 *
 * Safe to run twice: it checks for an existing Users table first and stops
 * rather than creating a duplicate.
 */

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_SCHEMA_TOKEN;
const TABLE_NAME = process.env.AIRTABLE_USERS_TABLE_NAME || "Users";

// Mirrors README "Auth (Users table)". The first entry becomes the primary
// field. Names are matched exactly by lib/users.js — don't rename them here
// without changing that file too.
const FIELDS = [
  {
    name: "Email",
    type: "singleLineText",
    description: "Lowercased before writing. Looked up case-insensitively.",
  },
  {
    name: "Password Hash",
    type: "singleLineText",
    description: "bcrypt hash. Never a readable password.",
  },
  {
    name: "Role",
    type: "singleSelect",
    description: "Set server-side. Promote the first admin by hand here.",
    options: { choices: [{ name: "Customer" }, { name: "Admin" }] },
  },
  {
    name: "TOTP Secret",
    type: "singleLineText",
    description: "AES-256-GCM encrypted with AUTH_ENCRYPTION_KEY. Never the raw secret.",
  },
  {
    name: "TOTP Enabled",
    type: "checkbox",
    description: "Only true once the user has confirmed a live code.",
    options: { color: "greenBright", icon: "check" },
  },
  {
    name: "Backup Codes",
    type: "multilineText",
    description: "JSON array of bcrypt hashes. One is removed per use.",
  },
  {
    name: "Created At",
    type: "date",
    description: "ISO timestamp set at signup.",
    options: { dateFormat: { name: "iso" } },
  },
];

function die(what, why, action) {
  console.error(`\n  ✗ ${what}\n    ${why}\n    → ${action}\n`);
  process.exit(1);
}

// `need` names the scope the specific call requires. Listing tables and
// creating one need DIFFERENT scopes, so a single "you need write access"
// message sends people to check a permission that was never the problem.
async function api(path, init, need = { scope: "schema.bases:write", doing: "change the base's structure" }) {
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
    const type = body?.error?.type || "";
    const message = body?.error?.message || text;

    // A corporate proxy or egress allowlist also answers 403, with its own
    // body rather than Airtable's JSON. Without this check the script tells
    // you to fix your token scope when the real problem is that the request
    // never left the network.
    const fromAirtable = body && typeof body.error === "object";
    if (!fromAirtable && (res.status === 403 || res.status === 407 || res.status === 502)) {
      die(
        "The request never reached Airtable.",
        `Something between you and Airtable refused it (HTTP ${res.status}): ${String(text).slice(0, 200)}`,
        "This is a network restriction, not a problem with your token. Run this from a machine that can reach api.airtable.com."
      );
    }

    if (res.status === 401) {
      die(
        "Airtable rejected the token.",
        "It's expired, revoked, or was pasted incompletely.",
        "Create a fresh token at https://airtable.com/create/tokens and try again."
      );
    }
    if (res.status === 403 || /INVALID_PERMISSIONS|NOT_AUTHORIZED/i.test(type)) {
      die(
        `That token isn't allowed to ${need.doing}.`,
        `This step needs the ${need.scope} scope. Note that reading the base's structure ` +
          `and changing it are separate scopes, so having one doesn't grant the other — ` +
          `and neither is granted by data.records:read / data.records:write.`,
        `Edit your token at https://airtable.com/create/tokens, make sure it has BOTH ` +
          `schema.bases:read and schema.bases:write, and that this base is listed under ` +
          `its access. Then run this again.`
      );
    }
    if (res.status === 404) {
      die(
        `No base found with ID ${BASE_ID}.`,
        "Either the ID is wrong, or this token doesn't have access to that base.",
        "Check the ID in the base's URL (it starts with 'app'), and confirm the token lists this base under its access."
      );
    }
    die(
      `Airtable returned ${res.status}.`,
      message,
      "If this repeats, check https://status.airtable.com before retrying."
    );
  }

  return body;
}

async function main() {
  if (!TOKEN) {
    die(
      "AIRTABLE_SCHEMA_TOKEN is not set.",
      "This script needs a token with both schema.bases:read and schema.bases:write.",
      "Run: AIRTABLE_SCHEMA_TOKEN=pat... AIRTABLE_BASE_ID=app... node scripts/create-users-table.js"
    );
  }
  if (!BASE_ID || !BASE_ID.startsWith("app")) {
    die(
      "AIRTABLE_BASE_ID is missing or doesn't look like a base ID.",
      `Base IDs start with "app". Got: ${JSON.stringify(BASE_ID)}`,
      "Copy it from the base's URL — it's the part right after airtable.com/."
    );
  }

  console.log(`\n  Base    ${BASE_ID}`);
  console.log(`  Table   ${TABLE_NAME}`);

  // Idempotent: never create a second Users table over the top of a real one.
  const existing = await api("/tables", undefined, {
    scope: "schema.bases:read",
    doing: "read the base's structure",
  });
  const clash = (existing.tables || []).find(
    (t) => t.name.toLowerCase() === TABLE_NAME.toLowerCase()
  );

  if (clash) {
    console.log(`\n  ✓ A table named "${clash.name}" already exists (${clash.id}).`);
    const have = new Set(clash.fields.map((f) => f.name));
    const missing = FIELDS.filter((f) => !have.has(f.name)).map((f) => f.name);
    if (missing.length === 0) {
      console.log("    Every required field is present. Nothing to do.\n");
    } else {
      console.log(`    Missing field(s): ${missing.join(", ")}`);
      console.log("    Add these by hand, or rename the existing table and re-run.\n");
      process.exit(1);
    }
    return;
  }

  const created = await api("/tables", {
    method: "POST",
    body: JSON.stringify({
      name: TABLE_NAME,
      description: "Customer and admin accounts for the Cubelle site. Written by the auth system.",
      fields: FIELDS,
    }),
  });

  console.log(`\n  ✓ Created "${created.name}" (${created.id}) with ${created.fields.length} fields:`);
  for (const f of created.fields) console.log(`      ${f.name}  ·  ${f.type}`);
  console.log(
    "\n  Next: sign up at /signup, then change your row's Role to Admin here.\n" +
      "  Then delete the schema token you just used — the site doesn't need it.\n"
  );
}

main().catch((err) => {
  die(
    "Couldn't reach Airtable.",
    err && err.message ? err.message : String(err),
    "Check your internet connection and try again."
  );
});
