# Cubelle

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
`PRICE_ADDON`, `computeTotalRM`). Per box: RM79 with a short card message,
RM89 with a full letter instead, +RM25 on top of either for an add-on
(Flowers on the Anniversary/Hostess boxes, Achievement Token on the
Congratulations box), all multiplied by quantity. **This is always computed
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

## 3. Deploy to Netlify

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

- `/` — hero explaining Cubelle in one screen (full viewport height, with
  "What is Cubelle?" and "Browse the catalog" buttons), then a catalog grid
  (image + name only, no prices, per your call on not wanting customers
  price-comparing across occasions). The Festive box shows as "Coming Soon"
  and isn't orderable yet.
- `/about` — brand story page, linked from the hero.
- `/products/[slug]` — one page per edition (`lib/products.js`): description
  first, order form below it (styled as a clipboard). Message type (card vs.
  letter) and any add-on are chosen here. On submit it calls
  `/api/create-order` (computes the real price server-side, writes a
  "Pending" row to Airtable tagged with that product's edition) then
  `/api/checkout` (re-reads that price from Airtable, creates the ToyyibPay
  bill), then redirects to ToyyibPay to pay.
- `/api/toyyibpay-callback` — ToyyibPay calls this server-to-server after
  payment. It re-checks the payment directly with ToyyibPay (never trusts the
  callback body alone) and marks the Airtable row Paid/Failed.
- `/thank-you` — where ToyyibPay redirects the customer. Also re-checks
  payment status itself, and shows the "receipt sent to your Gmail" note.
- `/track` — customer enters their email, sees every order's card message,
  address, and shipping progress. Reads live from Airtable, so updating
  **Fulfillment Status** / **Tracking Number** / **Courier** in Airtable
  updates the site immediately — no redeploy needed.
