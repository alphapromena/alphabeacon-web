# Billing endpoints — observed, not guessed (ORDER BIL-0902 Phase 0)

> **SUPERSEDED PENDING WARD (founder stop order, 2026-09-02 14:25):** this record is the OLD
> contract — plans `base`/`pro`, yearly, 50000/80000 cents. Ward is changing the plans to
> `business` $599/month and `scale` $899/month (Enterprise has no checkout) and pointing
> `DASHBOARD_URL` at `https://1.malaky.ai`. Re-run `pnpm probe:billing` on the new contract
> before building on any shape here. The 402 addendum at the end stays valid regardless.

Captured by `pnpm tsx scripts/probe-billing.ts` against the deployed SANDBOX API on one
fresh QA org. Ward's frontend guide is `Docs/api/billing-frontend.md`; this file is what
`src/api/types.ts` transcribes the billing shapes from. It is its OWN file because
`pnpm smoke:alphastudio` overwrites `alphastudio-shapes.md` wholesale (founder-approved
ruling, decisions.md BIL-0902 Phase 0). Re-run the script when the backend changes.

- Run: `2026-09-02T10:31:09.216Z`
- Owner identity: `qa+1788345069216bil@alphapromena.com` · member identity: `qa+1788345069216bilm@alphapromena.com`
- Fresh QA org: `1670`
- Spend: none. One Checkout session was created and NEVER opened (abandoned; test mode).

Session tokens are never recorded. The checkout url and sessionId are redacted to their
shape (a Stripe test-mode link is harmless but it is still a link into a payment page);
every other field is verbatim. Request-ids are the server's `x-request-id` (or the
envelope's `requestId` on an error).

## What this run established

- Fresh QA org: id 1670 ("QA Billing Org 1788345069216").
- Member-role account arranged: a second QA user, invited as `member`, added immediately.
- Plans: 200; 2 item(s); keys per item: plan, name, amountCents, currency, interval; names as delivered: "Malaki Base" · "Malaki Pro"; amounts: base=50000 usd/year · pro=80000 usd/year.
- Subscription at none: 200; status="none"; fields present: plan=null, status=string, currentPeriodStart=null, currentPeriodEnd=null, cancelAtPeriodEnd=boolean, canceledAt=null, updatedAt=null.
- Credits: 200 {"items":[],"total":0}; with limit/offset: 200 {"items":[],"total":0} — top-level keys: items, total.
- Wallet on the fresh org: 200 {"cents":0,"heldCents":0,"availableCents":0}.
- Member reads: plans 200 · subscription 200 · credits 200.
- Bad plan: 400 code=validation_failed.
- Member checkout: 403 code=forbidden.
- Portal at none: 201 keys=url.
- Checkout: 201; keys: url, sessionId; url host: checkout.stripe.com; sessionId prefix: cs_test_… (66 chars).
- Subscription after an unopened checkout: status="none" (unchanged is the expectation).
- Wallet after: {"cents":0,"heldCents":0,"availableCents":0}.

## Captured exchanges, in order

### create org

`POST /orgs` → **201** · as owner · request-id `0a24ae75-c4ad-4227-b1b3-05076addf67f`
> the fresh QA org every probe below runs on

```json
{
  "org": {
    "id": "1670",
    "name": "QA Billing Org 1788345069216",
    "slug": "qa-billing-org-1788345069216",
    "status": "active",
    "createdAt": "2026-09-02T10:31:13.252Z",
    "updatedAt": "2026-09-02T10:31:13.252Z",
    "country": null
  },
  "membership": {
    "id": "1911",
    "orgId": "1670",
    "userId": "2047",
    "role": "owner",
    "isActive": true,
    "createdAt": "2026-09-02T10:31:13.252Z",
    "updatedAt": "2026-09-02T10:31:13.252Z"
  }
}
```

### invite the member (existing user → added at once)

`POST /orgs/1670/members/invite` → **201** · as owner · request-id `8b69b6fe-0a95-48a1-90bf-32cab1f491fb`

```json
{
  "userId": "2048",
  "email": "qa+1788345069216bilm@alphapromena.com",
  "role": "member",
  "invitedNewUser": false
}
```

### 1 · GET /billing/plans (owner)

`GET /orgs/1670/billing/plans` → **200** · as owner · request-id `bca24e5d-2229-4d3e-8a2d-b6d51138576e`

```json
{
  "items": [
    {
      "plan": "base",
      "name": "Malaki Base",
      "amountCents": 50000,
      "currency": "usd",
      "interval": "year"
    },
    {
      "plan": "pro",
      "name": "Malaki Pro",
      "amountCents": 80000,
      "currency": "usd",
      "interval": "year"
    }
  ],
  "total": 2
}
```

### 2 · GET /billing/subscription (owner, never subscribed)

`GET /orgs/1670/billing/subscription` → **200** · as owner · request-id `3951d989-6d16-4eab-98e5-c29b78b5959e`

```json
{
  "plan": null,
  "status": "none",
  "currentPeriodStart": null,
  "currentPeriodEnd": null,
  "cancelAtPeriodEnd": false,
  "canceledAt": null,
  "updatedAt": null
}
```

### 3 · GET /billing/credits (owner)

`GET /orgs/1670/billing/credits` → **200** · as owner · request-id `935f402f-3092-45ae-b614-8c43cdf83445`

```json
{
  "items": [],
  "total": 0
}
```

### 3b · GET /billing/credits?limit=5&offset=0 (paging echo)

`GET /orgs/1670/billing/credits?limit=5&offset=0` → **200** · as owner · request-id `6833f836-5fb3-405b-89b6-5f3ee6a23768`

```json
{
  "items": [],
  "total": 0
}
```

### 4 · GET /alphastudio/wallet (owner, fresh org)

`GET /orgs/1670/alphastudio/wallet` → **200** · as owner · request-id `3aa41779-6ef5-4d49-b101-12009d9b6d64`

```json
{
  "cents": 0,
  "heldCents": 0,
  "availableCents": 0
}
```

### GET /billing/plans (member)

`GET /orgs/1670/billing/plans` → **200** · as member · request-id `677ccdb4-2bc3-48c1-bc2e-56bcbcbd1a8f`

```json
{
  "items": [
    {
      "plan": "base",
      "name": "Malaki Base",
      "amountCents": 50000,
      "currency": "usd",
      "interval": "year"
    },
    {
      "plan": "pro",
      "name": "Malaki Pro",
      "amountCents": 80000,
      "currency": "usd",
      "interval": "year"
    }
  ],
  "total": 2
}
```

### GET /billing/subscription (member)

`GET /orgs/1670/billing/subscription` → **200** · as member · request-id `d2231360-3039-4989-a294-5b1eb58d0895`

```json
{
  "plan": null,
  "status": "none",
  "currentPeriodStart": null,
  "currentPeriodEnd": null,
  "cancelAtPeriodEnd": false,
  "canceledAt": null,
  "updatedAt": null
}
```

### GET /billing/credits (member)

`GET /orgs/1670/billing/credits` → **200** · as member · request-id `8e68fcf0-8d7b-4e6e-8457-fc9968645332`

```json
{
  "items": [],
  "total": 0
}
```

### 7 · POST /billing/checkout {plan:"gold"} (owner)

`POST /orgs/1670/billing/checkout` → **400** · as owner · request-id `b0446b1f-6b25-4533-a27b-87360ddaff3e`

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Validation failed",
    "details": [
      {
        "field": "plan",
        "message": "Invalid option: expected one of \"base\"|\"pro\""
      }
    ],
    "requestId": "b0446b1f-6b25-4533-a27b-87360ddaff3e"
  }
}
```

### 6 · POST /billing/checkout {plan:"base"} (member)

`POST /orgs/1670/billing/checkout` → **403** · as member · request-id `731aa5d9-52c6-4911-8ad3-23f7daf246be`

```json
{
  "error": {
    "code": "forbidden",
    "message": "You do not have access to this resource",
    "requestId": "731aa5d9-52c6-4911-8ad3-23f7daf246be"
  }
}
```

### extra · POST /billing/portal (owner, never subscribed)

`POST /orgs/1670/billing/portal` → **201** · as owner · request-id `8a2e7e6d-6baf-4872-afc2-194994183bf4`

```json
{
  "url": "<redacted: 133 chars, starts \"https://bill…\">"
}
```

### 5 · POST /billing/checkout {plan:"base"} (owner)

`POST /orgs/1670/billing/checkout` → **201** · as owner · request-id `7e198c18-318c-4946-89e2-26f7e6dd35e6`
> url and sessionId redacted to their shape; the url was NEVER opened and the session is abandoned (test mode, expires on its own)

```json
{
  "url": "<redacted: 479 chars, starts \"https://chec…\">",
  "sessionId": "<redacted: 66 chars, starts \"cs_test_a19z…\">"
}
```

### GET /billing/subscription (owner, after an unopened checkout)

`GET /orgs/1670/billing/subscription` → **200** · as owner · request-id `6f9f1436-6015-4d68-853a-6648579f73dd`

```json
{
  "plan": null,
  "status": "none",
  "currentPeriodStart": null,
  "currentPeriodEnd": null,
  "cancelAtPeriodEnd": false,
  "canceledAt": null,
  "updatedAt": "2026-09-02T10:31:25.746Z"
}
```

### GET /alphastudio/wallet (owner, after)

`GET /orgs/1670/alphastudio/wallet` → **200** · as owner · request-id `b05d6aab-c676-4821-b17f-3ae35edd81cc`

```json
{
  "cents": 0,
  "heldCents": 0,
  "availableCents": 0
}
```


## Addendum — the 402 on a never-subscribed org (gate finding, 2026-09-02)

Run by hand during the BIL-0902 live gate (a standalone zero-spend probe, not
`probe:billing`), because `live-generate` and `live-brand-rules` went red on
fresh orgs: Ward's guide says every generation call answers `402
wallet_insufficient` until the org subscribes, and the sandbox now funds
nothing at creation. Measured on fresh QA org **1683**:

### wallet — fresh org

`GET /orgs/1683/alphastudio/wallet` → **200** · request-id `28584bba-3b7e-4743-a7a9-63a95675d44b`

```json
{ "cents": 0, "heldCents": 0, "availableCents": 0 }
```

### posts/tones-preview — the cheapest generation call, on the zero wallet

`POST /orgs/1683/alphastudio/posts/tones-preview` → **402** · request-id `f4220662-0752-4488-9ffc-133a7bbd5779`
> body `{ tone: { id, name, description, rules: [{kind:"do", text}] }, language: "en" }`

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "f4220662-0752-4488-9ffc-133a7bbd5779"
  }
}
```

### wallet — after the refusal (unchanged)

`GET /orgs/1683/alphastudio/wallet` → **200** · request-id `27c7e0c4-bf66-43d2-8d10-8653d368b7d5`

```json
{ "cents": 0, "heldCents": 0, "availableCents": 0 }
```

So the live suite's generating specs (`live-generate`, `live-proposals`,
`live-studio`'s Render, `live-brand-rules`' tone preview, `live-create-visual`)
cannot pass on a fresh QA org until one is subscribed — open-items 46.
