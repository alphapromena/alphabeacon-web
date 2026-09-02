# Billing — frontend guide

> **Superseded by the wire as recorded (BIL-0902/R, 2026-09-02):** the plan names, amounts and
> interval below are the old contract. `GET /billing/plans` now delivers `base` = **"Malaky
> Business" 59900 usd / month** and `pro` = **"Malaky Scale" 89900 usd / month** (the keys
> unchanged); Enterprise has no checkout (a "Custom" card with the demo request); Managed is
> sales-assisted, no add-on; `DASHBOARD_URL` = `https://1.malaky.ai`. Record: `billing-shapes.md`.

How subscriptions work from the frontend's seat. The full endpoint reference is in
[api.md](api.md) (section **Billing**) and [openapi.json](openapi.json).

## The model in one paragraph

Subscriptions belong to an **org**, not a user. Two yearly plans: **Base $500/year**
and **Pro $800/year**. Payment happens on a Stripe-hosted Checkout page (no Stripe.js,
no publishable key in the frontend). Every paid Stripe invoice — the first payment,
each yearly renewal, a prorated upgrade — credits the org's AlphaProStudio **wallet**
with exactly the amount paid ($500 → 50 000 cents). The wallet is what generation
spends. **There is no other way to fund a wallet**: a new org starts at zero and
every generation call answers `402 wallet_insufficient` until it subscribes.

Only **owners** can subscribe or manage billing. Any member can read the plans, the
subscription and the credit history.

## Endpoints

All under `/api/orgs/:orgId/billing`, session auth as everywhere.

| Method | Path            | Who    | Returns                                                     |
| ------ | --------------- | ------ | ----------------------------------------------------------- |
| GET    | `/plans`        | member | `{ items: [{ plan, name, amountCents, currency, interval }], total }` |
| GET    | `/subscription` | member | `{ plan, status, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, canceledAt, updatedAt }` |
| POST   | `/checkout`     | owner  | body `{ plan: "base" \| "pro" }` → `201 { url, sessionId }` |
| POST   | `/portal`       | owner  | no body → `201 { url }`                                     |
| GET    | `/credits`      | member | `{ items: [{ cents, plan, stripeInvoiceId, createdAt, … }], total }` (newest first, `limit`/`offset`) |

The wallet balance itself stays where it was: `GET /api/orgs/:orgId/alphastudio/wallet`
→ `{ cents, heldCents, availableCents }`. Watch `availableCents`.

## Screens to build

### 1. Plans page (`/billing`)

- Load `GET /plans` and render the prices from it — do not hardcode $500/$800.
- Load `GET /subscription`. If `status` is `none` (or `canceled` / `incomplete_expired`)
  show the two plans with a **Subscribe** button each (owners only; members see the
  plans without the button).
- On click: `POST /checkout { plan }`, then `window.location.assign(url)`. That is the
  whole integration — Stripe renders the payment form.
- If the org already has a live subscription the endpoint answers `409 conflict`;
  show "Manage billing" instead (below).
- This page is also where Stripe sends the user back on an **abandoned** checkout:
  `/billing?orgId=<id>&checkout=cancelled`. Just show the plans again (a small "payment
  cancelled" note is nice, nothing else happened).

### 2. Success page (`/billing/success`)

Stripe redirects here after payment with `?orgId=<id>&session_id=cs_…`.

- **Do not treat arriving here as proof of payment.** The backend learns about the
  payment from a Stripe webhook that lands a second or two later.
- Poll `GET /subscription` every ~2 s (give up after ~60 s with a "still processing,
  refresh later" message) until `status` is `active`. Then show the plan and the new
  wallet balance from the wallet endpoint, and link to the workspace.
- `session_id` is informational; the backend does not need it back.

### 3. Manage billing

For an org whose `status` is not `none`: a **Manage billing** button that calls
`POST /portal` and redirects the browser to `url`. The Stripe portal handles:

- cancel (takes effect at the end of the paid year — `cancelAtPeriodEnd` turns `true`),
- switch plan — an **upgrade** is charged now (prorated) and the difference credits
  the wallet; a **downgrade** waits until the period ends,
- change the card, download invoices.

The portal returns to `/billing?orgId=<id>`. Re-fetch `GET /subscription` on return;
the webhook may still be a second behind, so a short poll is fine here too.

### 4. Billing history

`GET /credits` lists every wallet credit (one per paid invoice) with the amount and
the plan — the "why is my balance what it is" screen. Optional, but cheap.

## Reacting to state everywhere else

- **`402 wallet_insufficient`** on any generation call → the org cannot pay for this
  request. Show "Your wallet is empty / too low — subscribe or renew" and link to
  `/billing`. (The existing "show top-up UI" advice in api.md now means this page.)
- **`status: past_due`** — the yearly renewal charge failed and Stripe is retrying.
  Show a banner: "Payment failed — update your card" → `POST /portal`. The owners also
  receive a `billing.payment_failed` notification.
- **`cancelAtPeriodEnd: true`** — the plan ends on `currentPeriodEnd`; a "Resume"
  action lives in the portal.
- **Notifications** the backend raises (kind → meaning), both with `action: "/billing"`:
  - `billing.wallet_credited` — "$500.00 was added to your wallet from your base plan payment."
  - `billing.payment_failed` — a live subscription's charge failed.

## `status` values

| `status`              | Meaning                                                    | UI                              |
| --------------------- | ---------------------------------------------------------- | ------------------------------- |
| `none`                | never subscribed                                           | plans + Subscribe               |
| `active`, `trialing`  | healthy                                                    | Manage billing                  |
| `past_due`, `unpaid`  | a renewal charge failed, Stripe retrying                   | banner + Manage billing         |
| `paused`              | paused in the portal                                       | Manage billing                  |
| `canceled`            | ended (credits already granted stay in the wallet)         | plans + Subscribe again         |
| `incomplete`, `incomplete_expired` | first payment never completed                 | plans + Subscribe               |

## Testing in Stripe test mode

The dev backend runs against Stripe **test** keys. On the Checkout page use card
`4242 4242 4242 4242`, any future expiry, any CVC and postcode. Nothing is charged.
Test-mode payments credit the org's real dev wallet, so a test org can generate
content right after "paying".

## Routes the backend hard-codes (do not rename without telling the backend)

| After                | Route on `DASHBOARD_URL`                        |
| -------------------- | ----------------------------------------------- |
| successful checkout  | `/billing/success?orgId=<id>&session_id=<cs_…>` |
| abandoned checkout   | `/billing?orgId=<id>&checkout=cancelled`        |
| leaving the portal   | `/billing?orgId=<id>`                           |
