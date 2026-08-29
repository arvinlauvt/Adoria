# Handover

Written 30 August 2026, at the end of the Claude Code sessions. If you're
picking this project up — future you, or an assistant without access to the
repo — read this first. `README.md` covers setup; this covers **state,
decisions, and the traps that cost real time.**

---

## 1. Where things stand

**The live site at `cubelle.my` is behind, and cannot currently take an
order.** That is expected, not a fault to debug.

Production runs the code from `main` as of 29 August. Since then, 17 commits
have landed on `fix/created-at-field` that have never deployed, because the
Netlify account exhausted its build credits. Among those commits are the
Airtable column renames — and the renames were already applied to Airtable.
So the deployed code writes column names that no longer exist.

**The first thing to do when Netlify credits reset:**

```
git checkout main
git merge --ff-only fix/created-at-field
git push origin main
```

Then place one real order on `cubelle.my` to confirm it saves. Until that
merge happens, don't send anyone to the live site.

### What's built and working

Verified end to end on `localhost:3000`: signup, sign in, sign out, 2FA
(enrol, verify, backup codes, disable), password reset by email, the order
form with validation and capacity limits, order tracking for both guests and
signed-in customers, the account page, and the admin dashboard.

### What has never run once

**The payment flow.** Bill creation, the ToyyibPay hosted page, and the
payment callback. It needs a ToyyibPay merchant account, which needs a bank
account. It is roughly 60 lines across `lib/toyyibpay.js`,
`app/api/checkout/route.js` and `app/api/toyyibpay-callback/route.js`, and
it is the only untested code that can lose money. Test it before launch.

The callback can be tested locally without a public URL: place an order, take
the bill code from Airtable, and POST it yourself:

```
curl -X POST http://localhost:3000/api/toyyibpay-callback -d "billcode=THE_CODE"
```

That is a genuine test, not a fake one — the callback ignores the POST body
and re-checks the real payment status with ToyyibPay directly.

### Still open

- **ToyyibPay account** → then the payment test above.
- **Deploy** the 17 commits (above).
- **Read `/allergens` against the real recipe.** Everything on it is now
  something confirmed out loud, but "I think" was the standard for one line
  and that isn't good enough for a page where being wrong hurts a person.
- **Have the legal pages reviewed** — see section 2a.
- **`next@16` upgrade — attempted and rolled back.** See section 2b. Do not
  take it with `npm audit fix --force`.

---

## 2. Traps that cost real time

Every one of these was found the hard way. They will not be obvious from
reading the code.

### Next 15 made four things async

`cookies()`, `headers()`, `params` and `searchParams` all became Promises.
Used synchronously they return `undefined`, and the failures are silent in
the worst way — the product pages 404'd with no error anywhere, and
`/thank-you` never once told a paying customer their payment succeeded.

Everything is now written `await cookies()` / `const { slug } = await params`.
**Awaiting a non-Promise is a no-op**, so one spelling works on both 14 and
16. Keep it that way; don't "simplify" the awaits away.

`package.json` pins **14.2.35**, which is what Netlify builds. A plain
`npm install` may hand you 16 — if `npm run dev` prints a version that isn't
14.2.35, run `npm install next@14.2.35`. Testing a different major than you
ship is how a bug reaches customers that no local run could have shown.

### Airtable will refuse rather than adapt

- **A single-select rejects any value not already in its option list.** The
  site's token deliberately has no schema permissions, so it cannot add one.
  Symptom: `422 INVALID_MULTIPLE_CHOICE_OPTIONS` at checkout, which surfaces
  as a failed order a long way from the cause. Adding a flavour, an add-on,
  or a fulfilment stage in code means adding the option in Airtable too.
- **A date-only field rejects a full ISO timestamp.** `Created At` and
  `Order Date` must have "Include time" turned on. This broke every signup
  for an afternoon.
- **The Meta API can rename a field but cannot change its options.** It
  accepts an `options` payload, ignores it, and returns 200 — so a script
  that tries will report success and change nothing. Options are a manual
  job in the UI.
- **Renaming a column is safe for data** — Airtable tracks fields by id, so
  values survive. But **deleting a select option blanks that value on every
  row using it.**

`scripts/check-airtable.js` compares the live base against what the code
reads and writes, and reports missing fields, wrong types, and missing select
options. Run it whenever orders or signups start failing for no clear reason.
It needs a throwaway token with `schema.bases:read`. Delete the token after.

### Two scopes that sound like one

`schema.bases:read` and `schema.bases:write` are separate, and neither is
granted by `data.records:read` / `data.records:write`. The site only ever
needs the `data.records` pair.

### Environment variables

The full list is in `README.md`. Two worth calling out:

- **`AUTH_ENCRYPTION_KEY` must be identical locally and in production.** It
  encrypts TOTP secrets. A secret encrypted with one key cannot be read with
  another — a mismatch locks you out of your own account after a deploy.
  Copy the value from Netlify; never generate a second one.
- **`AUTH_ALLOW_INMEMORY_STORE=true`** makes the app fall back to fake
  in-memory storage when credentials are missing, and unlocks the
  `/api/dev/*` routes. Useful for local testing, dangerous as a habit: it
  makes a broken config look like it's working. It can never engage on
  Netlify, which sets its own `NETLIFY` variable.

### A layout shift can swallow a click

On the sign-in and order forms, blurring a field inserted an inline error,
which moved the submit button between mousedown and mouseup — so the browser
fired no click at all and the button looked dead. Fixed with
`onMouseDown={(e) => e.preventDefault()}` on those buttons. If a button ever
seems to need two clicks, this is why.

### A silent bug worth remembering the shape of

The daily capacity check was disabled for a while without anyone noticing.
`getCommittedBoxesForRange` asked Airtable for a column that had been
renamed — the field name was URL-encoded in the query string, so a search
for the old name didn't find it. Airtable returns nothing for a field it
doesn't recognise rather than erroring, so every date totalled zero boxes
and every order passed the limit.

Nothing failed. Nothing was logged. It would have shown up as a week where
the kitchen was somehow booked for eleven boxes on a Saturday.

When renaming anything that crosses a service boundary, search for it
URL-encoded and inside template strings too, not just as a quoted literal.

### Other small ones

- **zxcvbn needs its `translations` loaded**, or feedback comes back as raw
  keys like `common` and those get shown to the user as the reason.
- **zxcvbn matches user inputs as whole dictionary entries.** Passing a whole
  email only penalises that exact string — `arvinlau@example.com` scored 0
  while `arvinlau-arvinlau` scored a full 4. Inputs are now split into parts,
  plus an outright rejection for passwords made only of the account's details.
- **`--bg-deep` is dark in both themes**, so anything on it needs a colour
  that doesn't invert (`--cream`, not `--text-heading`). The backup codes
  were invisible in light mode for exactly this reason.
- **The CSP allows `unsafe-eval` in development only.** React's dev build
  needs it; production never does. Don't "fix" the production header by
  adding it.

---

## 2b. The Next 16 upgrade was tried, and rolled back

`npm audit fix --force` will offer to take you to Next 16, and it fixes every
outstanding advisory. **It was tested and it breaks authentication.** Don't
let that command make the decision for you.

What was tested on 16.3.3: every page rendered, the build passed, the API
routes worked, signup and logout worked, orders were created. Then this:

| | Next 14.2.35 | Next 16.3.3 |
|---|---|---|
| `/api/auth/me` with a session cookie | signed in | signed in |
| `/account` with the same cookie | 200 | **307 → /login** |
| `/track` with the same cookie | "Signed in as…" | **shows signed out** |

Route handlers read the session; **pages do not.** Same cookie, same request.
A signed-in customer would be bounced to the sign-in page from every page
that checks a session, while the API believed them.

The likely cause is that the opt-in in-memory dev store ends up as two
separate module instances under Turbopack — the server-component bundle and
the route-handler bundle each getting their own Map — which would make it an
artifact of local testing rather than a real fault. **That was not proven.**
It could not be tested against real Upstash from where this was run, so the
possibility that it also breaks in production was never ruled out.

So: unproven cause, sitting directly on the auth path. Not something to ship
and hope.

**To finish this properly**, someone needs to run the upgrade with real
Upstash credentials and repeat exactly the table above. If pages read the
session correctly against real Upstash, the upgrade is fine and the local
failure was the dev store. If they don't, there is a real bug to fix first.

Until then `package.json` pins **`14.2.35` exactly, with no caret** —
deliberately, because a range is what let a routine install drift onto an
untested major.

### What you're living with meanwhile

Next 14.2.35 carries around twenty advisories, high severity, mostly denial
of service, cache poisoning, and SSRF in features this site doesn't lean on.
None is a remote code execution, and none is an open door to the Airtable
data. That is a real risk, not a dismissed one — it just isn't a worse risk
than shipping authentication that might send every signed-in customer to the
login page.

## 2a. Legal pages

`/privacy` and `/terms` exist and are linked from the footer. **Neither has
been reviewed by a lawyer.** Three things to settle before taking real money:

- **Get them read by someone Malaysian-qualified.** They were written against
  the PDPA 2010 and the Consumer Protection Act 1999, but written by an
  assistant, not a solicitor.
- **Check the Bahasa Malaysia.** The PDPA requires the notice in both
  languages, so the translation is load-bearing, not a courtesy. Have a native
  speaker read it.
- **Check whether you must register as a data user.** The PDPA requires
  registration for certain classes of data user. Whether a small online food
  business falls in one is a question for someone qualified — it was not
  possible to answer here, and guessing at it would be worse than flagging it.

The privacy notice lists exactly what the code collects and which services
receive it. **If you add a field or a service, that page has to change with
it.** A privacy notice that no longer matches the system isn't just stale —
it's a written claim that isn't true.

Two things deliberately not built, despite being asked for:

- **EULA** — licenses software to end users. This shop sells cookies; the
  terms of sale cover the same ground.
- **DMCA policy** — a US safe-harbour mechanism for sites hosting
  user-generated content. Nothing customers write here is published, and
  Malaysia has its own Copyright Act 1987 regime. The terms carry a plain
  "message us and we'll take it down" route instead, which is what actually
  gets used.

Both would have been paperwork that looks like protection without being any.

## 3. Decisions worth not re-litigating

**Sessions are opaque random tokens, not JWTs.** The only way to read a
session's role is to look it up in Redis, which means sign-out, password
changes and admin revocation all work by deleting one key. No signature-based
token can be revoked that cheaply.

**Role is set server-side, only at sign-in.** Nothing the browser sends can
make someone an admin. It also means changing a role in Airtable does nothing
until that person signs out and back in — that's correct, not a bug.

**Sign-in and password reset answer the same way whether or not the account
exists.** Anything more specific turns them into a way to test which email
addresses have accounts. Signup is deliberately the exception: a vague answer
there would strand someone who simply forgot they'd signed up.

**`/api/track` never returns the delivery address or the card message.** An
email address alone used to be enough to pull back someone's home address and
the private message on their gift.

**One place where a failure is deliberately not shown:** if the password
reset email fails to send, the customer still sees the uniform "if that email
has an account…" reply. Only real addresses reach the send, so a visible
error there would leak exactly what the uniform reply exists to hide. It is
logged loudly with a reference code, and the reply tells people what to do if
nothing arrives.

**Error messages were deliberately shortened.** Their input gets one sentence
saying what to fix. Our failures get no diagnosis at all — which service
broke is a log concern — plus a WhatsApp link with a reference code that ties
the customer's screen to the exact stack trace in the logs.

---

## 4. Working on this without Claude Code

An assistant in a plain chat window cannot see the repo, run the site, or
read the logs. That changes what's worth asking for.

**Give it context up front.** Paste this file first. Then paste the specific
files involved — whole files, not fragments, since it can't open the rest.

**Paste errors in full.** The terminal line, not the browser message. Every
server failure logs as:

```
[route-name] CB-XXXXXX code: Error: the real message
```

That line is the diagnosis. The browser text is deliberately vague.

**Ask for whole files back.** "Rewrite `lib/x.js` with this change" is far
safer than a patch you have to apply by hand.

**Verify before you trust.** Nothing the assistant writes has been run. This
project had bugs that only appeared when something was actually executed —
an undeclared variable inside the error handler, a hard-coded column count
that broke a table, a script that reported success while changing nothing.
`npm run build` catches syntax; only running the page catches the rest.

**Useful commands:**

```
npm run dev                      # http://localhost:3000
npm run build                    # catches syntax and import errors
node scripts/check-airtable.js   # schema vs code (needs a schema token)
```

---

## 5. Accounts and where things live

| Service | Holds | Note |
|---|---|---|
| GitHub `arvinlauvt/Adoria` | The code | 2FA on. Repo moved from lowercase `adoria` — remote still uses the old URL and is redirected |
| Netlify | Hosting, every production secret | 2FA on. Build credits exhausted; deploys paused |
| Airtable | Orders and Users | **No 2FA available on this plan** — its password is the only defence on customer addresses |
| Upstash | Sessions, rate limits, short-lived tokens | |
| Resend | Password reset email | `cubelle.my` domain verified |
| Spaceship | The `cubelle.my` domain | Nameservers point at Netlify DNS |
| ToyyibPay | Payments | **Not set up yet** |

Airtable having no second factor is the weakest point in the whole setup.
That password should be long, unique, and in a password manager.

---

## 6. Map of the code

```
app/
  page.js, about/, allergens/       marketing pages
  products/[slug]/                  product page + OrderForm (the box builder)
  track/                            order tracking, guest and signed-in
  account/                          profile page
  account/security/                 2FA setup and removal
  admin/                            orders dashboard, admin-only
  login/, signup/, forgot-password/, reset-password/
  api/                              every route; all wrapped in withErrorHandling
lib/
  products.js      the catalog. edition = short name stored in Airtable,
                   editionLabel = long name shown on the page
  airtable.js      Orders table
  users.js         Users table
  redis.js         Upstash
  errors.js        the error contract — read this before changing any message
  sanitize.js      input validation and size limits
  config.js        env-var validation; restricts where the payment key is sent
  auth/            sessions, passwords, TOTP, rate limits, encryption
scripts/
  create-users-table.js   one-time Users table creation
  check-airtable.js       schema vs code, read-only
  fix-airtable.js         applies renames; dry-run unless --apply
```

`lib/errors.js` is the one to read before touching any user-facing message.
It encodes the whole contract: what the customer sees, what goes to the log,
and which failures are worth retrying.

---

Good luck with it. The hard parts are done and tested; what's left is a bank
account and a build.
