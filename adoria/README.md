# Adoria

Next.js site: landing page → product catalog → product page (description +
order form, per-box flavor picker) → ToyyibPay checkout → thank-you page →
"Your Orders" tracker backed by Airtable.

Pivoted from an anniversary-only box to a luxury occasion gifting atelier —
four editions, one box design. Products are defined in `lib/products.js`;
add, rename, or re-skin an edition (the Seasonal one especially) by editing
that file, no other code changes needed as long as the `edition` string
still matches an option in Airtable's **Product Edition** field.

## 1. Airtable

Base already created for you: **Adoria Operations** (`appJdCJbADZcg4zY3`),
table **Orders** (`tbldLqe4tEXTiLHJq`) — updated for the pivot with a
**Product Edition** field, and **Recipient Name** / **Occasion Date** in
place of the old Partner Name / Anniversary Date.

Create a token at https://airtable.com/create/tokens:
- Scopes: `data.records:read`, `data.records:write`
- Access: only the "Adoria Operations" base

Copy the token into `AIRTABLE_TOKEN`.

## 2. ToyyibPay

Once your account is verified and you've created a Category:
- `TOYYIBPAY_SECRET_KEY` — bottom of your dashboard
- `TOYYIBPAY_CATEGORY_CODE` — from the Category page

Also in your ToyyibPay dashboard, under account/email settings, confirm
**Customer Receipt Notification** is turned on — that's what emails the
payment receipt to the customer's Gmail automatically, no extra code needed.

## 3. Deploy to Vercel

1. Push this folder to a new GitHub repo.
2. In Vercel: **Add New Project** → import that repo → it auto-detects Next.js.
3. Before the first deploy, add every variable from `.env.example` under
   **Settings → Environment Variables** (use your real values, not the
   placeholders). Set `SITE_URL` to the `https://<project>.vercel.app` URL
   Vercel gives you.
4. Deploy. Once it's live, go back to ToyyibPay's dashboard settings and make
   sure nothing there is hardcoded to `localhost` — the callback and return
   URLs are built from `SITE_URL` automatically by the app, not configured in
   ToyyibPay itself.
5. When your domain finishes initializing: add it under **Settings →
   Domains** in Vercel, then update `SITE_URL` to the new domain and
   redeploy.

## 4. Test it end-to-end

ToyyibPay sandbox: set `TOYYIBPAY_BASE_URL=https://dev.toyyibpay.com` and use
their test bank credentials to run a full order without moving real money.
Switch back to `https://toyyibpay.com` for production.

## How the pieces fit together

- `/` — hero explaining Adoria in one screen, then a catalog grid (image +
  name only, no prices, per your call on not wanting customers price-
  comparing across occasions).
- `/products/[slug]` — one page per edition (`lib/products.js`): description
  first, order form below it. On submit it calls `/api/create-order` (writes
  a "Pending" row to Airtable, tagged with that product's edition) then
  `/api/checkout` (creates the ToyyibPay bill), then redirects to ToyyibPay
  to pay.
- `/api/toyyibpay-callback` — ToyyibPay calls this server-to-server after
  payment. It re-checks the payment directly with ToyyibPay (never trusts the
  callback body alone) and marks the Airtable row Paid/Failed.
- `/thank-you` — where ToyyibPay redirects the customer. Also re-checks
  payment status itself, and shows the "receipt sent to your Gmail" note.
- `/track` — customer enters their email, sees every order's card message,
  address, and shipping progress. Reads live from Airtable, so updating
  **Fulfillment Status** / **Tracking Number** / **Courier** in Airtable
  updates the site immediately — no redeploy needed.
