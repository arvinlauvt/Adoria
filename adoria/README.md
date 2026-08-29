# Cubelle

> **Picking this project up?** Read [HANDOVER.md](./HANDOVER.md) first. This
> file covers setup; that one covers current state, the decisions behind the
> code, and the traps that aren't visible from reading it.

Next.js site: landing page → product catalog → product page (description +
order form, per-box flavor picker, message type, add-ons) → ToyyibPay
checkout → thank-you page → "Your Orders" tracker backed by Airtable.

A luxury occasion gifting atelier — three editions, one box design (The
Cubelles: hand-baked Malaysian cookie cubes, 15×15cm matte black box,
gold-ink card). Products are defined in `lib/products.js`; add,
rename, or re-skin an edition by editing that
file, no other code changes needed as long as the `edition` string still
matches an option in Airtable's **Product Edition** field.

## Pricing

Set centrally in `lib/products.js` (`PRICE_CARD`, `PRICE_LETTER`,
`ADDON_PRICES`, `CUBE_CAP`, `LEAD_TIME_DAYS`, `computeTotalRM`). Per box: RM79
with a short card message, RM89 with a full letter instead, plus an add-on
on top of either — +RM25 for the Flower Frame Kit (Anniversary/Hostess
boxes) or +RM30 for the Custom Brass Bookmark (Congratulations box) — all
multiplied by quantity — each box can hold up to 25 cubes (mixed flavors),
which doesn't change the price. **This is always computed
server-side** in `/api/create-order` from the message type/add-on/quantity
the browser reports — the client-supplied total is never trusted for the
actual charge, and `/api/checkout` reads the price back from the Airtable
record rather than the request body, so a tampered request can't pay less
than it should.

## 1. Airtable

Base: **Cubelle Operations** (`appfj0RbV0rmJDaV2`), table **Orders**
(`tblm2nPjCEvudP25S`). Every order field has its own dedicated Airtable
column now — Product Edition, Message Type, Add-on, Add-on Detail — so
nothing gets folded into Notes; that field is free for your own fulfillment
notes.

Create a token at https://airtable.com/create/tokens:
- Scopes: `data.records:read`, `data.records:write`
- Access: only the "Cubelle Operations" base

Copy the token into `AIRTABLE_TOKEN`.

## 2. ToyyibPay

Once your account is verified and you've created a Category:
- `TOYYIBPAY_SECRET_KEY` — bottom of your dashboard
- `TOYYIBPAY_CATEGORY_CODE` — from the Category page

Also in your ToyyibPay dashboard, under account/email settings, confirm
**Customer Receipt Notification** is turned on — that's what emails the
payment receipt to the customer's Gmail automatically, no extra code needed.

Sandbox testing before your real bank account is verified: create a
separate account at https://dev.toyyibpay.com (its own login, its own
Category/Secret Key), set `TOYYIBPAY_BASE_URL=https://dev.toyyibpay.com` and
swap in the sandbox key/category, and use their test bank credentials to run
a full order without moving real money. Switch `TOYYIBPAY_BASE_URL` back to
`https://toyyibpay.com` with your real key/category once you're live.

## 3. Auth (Users table)

Login, admin, and customer accounts (`lib/auth/*`, `lib/users.js`) need a
second table, **Users**, in the same **Cubelle Operations** base as Orders.
Create it by hand in Airtable with these fields (names must match exactly):

| Field | Type | Notes |
|---|---|---|
| `Email` | Single line text | Lowercase before writing; looked up case-insensitively |
| `Password Hash` | Single line text | bcrypt hash — never a plaintext password |
| `Role` | Single select | Options: `Customer`, `Admin` |
| `TOTP Secret` | Single line text | AES-256-GCM encrypted (see `lib/auth/crypto.js`) — never the raw secret |
| `TOTP Enabled` | Checkbox | Only set true after the user confirms one live code |
| `Backup Codes` | Long text | JSON array of bcrypt hashes, one removed per use |
| `Created At` | Date **with "Include time" on** | Full ISO timestamp. A date-only field rejects the time part and signup fails with a 422. |

Same token as the Orders table works here too (same base, same scopes).
`AIRTABLE_USERS_TABLE_NAME` defaults to `Users`; only set it if you name the
table something else.

Rather than building it by hand, run:

```
AIRTABLE_SCHEMA_TOKEN=pat... AIRTABLE_BASE_ID=app... node scripts/create-users-table.js
```

That token needs **both `schema.bases:read` and `schema.bases:write`**. They are
separate scopes: listing the existing tables (so this doesn't create a duplicate)
is a read, creating the table is a write, and having one does not grant the
other. Neither is granted by the scopes the site itself uses
(`data.records:read` / `data.records:write`) — the running app never alters the
base's structure. Make a separate token for this, run it once, then delete it.

The script checks for an existing `Users` table before creating anything, so
running it twice is safe.

This table also needs Upstash Redis (sessions, rate limits, short-lived
reset/2FA tokens — see `.env.example` for setup) and Resend (password-reset
emails) to actually function; the `lib/auth/*` and `lib/resend.js` helpers
throw a clear setup error if their env vars are missing, rather than
failing silently.

### Making yourself an admin

Signup always creates a `Customer` — the role is set server-side and can't
be requested, so there's no way to sign up as an admin. To get the first
admin: create a normal account at `/signup`, then open the **Users** table
in Airtable and change that row's **Role** to `Admin` by hand. Sign out and
back in (role is read when the session is created).

### Pages

| Path | Who |
|---|---|
| `/signup`, `/login`, `/forgot-password`, `/reset-password` | Guests (signed-in visitors are redirected away) |
| `/login/verify` | Mid-sign-in, when 2FA is on |
| `/track` | Everyone — guests look up by email, signed-in customers see their own orders automatically |
| `/account/security` | Signed-in customers, to turn 2FA on or off |
| `/admin` | Admins only |

### Running the auth flow locally without Upstash/Resend/Airtable

`lib/devStore.js` provides in-memory stand-ins for all three:

```
AUTH_ALLOW_INMEMORY_STORE=true AUTH_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))") npm run start
```

It engages only when the real credentials are absent, only with that flag
set, and never when `NETLIFY` is set. Without the flag, missing credentials
throw — in-memory sessions and rate limits would look like they work while
providing none of the guarantees they exist for. The `/api/dev/*` routes
(seeding users and orders, minting a reset token) are behind the same flag
and 404 otherwise. Data is per-process and lost on restart.

## 4. Deploy to Netlify

1. Push this folder to a new GitHub repo.
2. In Netlify: **Add new site** → **Import an existing project** → pick that repo.
3. Under **Build settings**: set Runtime to **Next.js**, Base directory to
   the folder this project sits in inside the repo, Build command to
   `npm run build`, and leave Publish directory blank so the Next.js runtime
   manages it — don't override it manually.
4. Under **Environment variables**, add every value from `.env.example`
   (real values, not placeholders). Set `SITE_URL` to the
   `https://<your-site>.netlify.app` URL Netlify gives you. Mark
   `AIRTABLE_TOKEN`, `TOYYIBPAY_SECRET_KEY`, and `TOYYIBPAY_CATEGORY_CODE` as
   secret; leave the rest as plain values with "Same value for all deploy
   contexts."
5. Deploy — a real build takes 1–3 minutes (installing packages, compiling);
   if a deploy finishes in 5 seconds, it silently skipped the actual Next.js
   build and needs the settings above rechecked.
6. When your domain finishes initializing: add it under **Domain
   management** in Netlify, then update `SITE_URL` to the new domain and
   redeploy.

## How the pieces fit together

- `components/Header.js` / `components/Footer.js` — persistent nav and
  footer, included once in `app/layout.js` so every page gets them
  automatically.
- `/` — full editorial redesign based on a Claude Design mockup: type-led
  hero (no product photo needed), a stat strip, "The box" specs section,
  and the catalog as filterable list rows (All occasions / Romance / Career
  / Visiting) instead of a card grid.
- `/about` — narrative brand story page.
- `/allergens` — ingredients & allergens page. The allergen table is
  intentionally all "TBC" placeholders — replace with real data once
  confirmed with the kitchen, never publish guessed allergen claims.
- `/products/[slug]` — sticky product image/spec panel on the left, a
  6-step checkout wizard on the right (Details → Boxes → Message → Add-on →
  Delivery → Review & Pay). Boxes use per-flavor cube-count steppers capped
  at `CUBE_CAP` (25) with a live visual fill grid. The message step shows a
  live preview — a dark gold-ink card for short messages, or a full framed
  letter (ornate corners for Anniversary/Hostess, plain rule for
  Congratulations) for full letters. Delivery uses a real calendar date
  picker that disables anything inside the `LEAD_TIME_DAYS` lead time. On
  submit it calls `/api/create-order` (computes the real price server-side,
  writes a "Pending" row to Airtable) then `/api/checkout` (re-reads that
  price from Airtable, creates the ToyyibPay bill), then redirects to
  ToyyibPay to pay.
- `/api/toyyibpay-callback` — ToyyibPay calls this server-to-server after
  payment. It re-checks the payment directly with ToyyibPay (never trusts the
  callback body alone) and marks the Airtable row Paid/Failed.
- `/thank-you` — where ToyyibPay redirects the customer. Also re-checks
  payment status itself, and shows the "receipt sent to your Gmail" note.
- `/track` — customer enters their email, sees a 5-stage vertical timeline
  (Order Confirmed → Baked & Packed → Card Written → Out for Delivery →
  Delivered) plus card message, address, and tracking number. Reads live
  from Airtable, so updating **Fulfillment Status** / **Tracking Number** /
  **Courier** in Airtable updates the site immediately — no redeploy needed.

## Known simplifications from the mockup

- The footer newsletter email field is decorative only — not wired to
  collect emails anywhere yet.
- The nav collapses to just the logo on mobile (no hamburger menu) rather
  than a full mobile nav drawer.
- Product photography is still placeholder textures — swap the
  `repeating-linear-gradient` blocks in `app/page.js` and
  `app/products/[slug]/page.js` for real `<Image>` tags once photos exist.
