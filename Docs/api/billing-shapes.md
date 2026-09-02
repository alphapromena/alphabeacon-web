# Billing endpoints — observed, not guessed (ORDER BIL-0902 Phase 0/R)

Captured by `pnpm tsx scripts/probe-billing.ts` against the deployed SANDBOX API on one fresh QA
org, on WARD'S CORRECTED PLANS (Phase 0/R, 2026-09-02). Ward's frontend guide is
`Docs/api/billing-frontend.md` (its plan names, amounts and interval are superseded by the
wire as recorded here); this file is what `src/api/types.ts` transcribes the billing shapes
from. It is its OWN file because `pnpm smoke:alphastudio` overwrites `alphastudio-shapes.md`
wholesale (founder-approved ruling, decisions.md BIL-0902 Phase 0). The earlier probe on the
old contract is kept below as dated history. Re-run the script when the backend changes.

- Run: `2026-09-02T17:39:57.508Z`
- Owner identity: `qa+1788370797508bil@alphapromena.com` · member identity: `qa+1788370797508bilm@alphapromena.com`
- Fresh QA org: `1745`
- Spend: none. One Checkout session was created and NEVER opened (abandoned; test mode).

Session tokens are never recorded. The checkout url and sessionId are redacted to their
shape (a Stripe test-mode link is harmless but it is still a link into a payment page);
every other field is verbatim. Request-ids are the server's `x-request-id` (or the
envelope's `requestId` on an error).

> **Reading (BIL-0902/R):** Ward's correction changed the plan NAMES, AMOUNTS and INTERVAL —
> `"Malaky Business"` 59900 usd/`month` and `"Malaky Scale"` 89900 usd/`month` — and KEPT the
> plan KEYS `base` / `pro`. So the "old key" probe (5b) answers **201**, not the expected 400,
> because `base` IS the live key: nothing of the old contract survives except its keys. The
> client's plan union therefore stays `base | pro`; what changes is what those keys render as.
> Both 5b and 5 minted a checkout session; both were abandoned unopened (test mode, zero spend).
## What this run established

- Fresh QA org: id 1745 ("QA Billing Org 1788370797508").
- Member-role account arranged: a second QA user, invited as `member`, added immediately.
- Plans: 200; 2 item(s); keys per item: plan, name, amountCents, currency, interval; PLAN KEYS as delivered: "base" · "pro"; names as delivered: "Malaky Business" · "Malaky Scale"; amounts: base=59900 usd/month · pro=89900 usd/month.
- Subscription at none: 200; status="none"; fields present: plan=null, status=string, currentPeriodStart=null, currentPeriodEnd=null, cancelAtPeriodEnd=boolean, canceledAt=null, updatedAt=null.
- Credits: 200 {"items":[],"total":0}; with limit/offset: 200 {"items":[],"total":0}.
- Wallet on the fresh org: 200 {"cents":0,"heldCents":0,"availableCents":0}.
- Member reads: plans 200 · subscription 200 · credits 200.
- Old key "base": 201 code=(no envelope) — STILL ACCEPTED: the old contract is NOT gone (report).
- Member checkout: 403 code=forbidden.
- Portal at none: 201 keys=url (was 201 on 2026-09-02 10:31).
- Checkout with "base": 201; keys: url, sessionId; url host: checkout.stripe.com; sessionId prefix: cs_test_… (66 chars).
- Subscription after an unopened checkout: status="none" (unchanged is the expectation).
- Wallet after: {"cents":0,"heldCents":0,"availableCents":0}.
- Org fields: PATCH 200; read-back keys [id, name, slug, status, createdAt, updatedAt, country] — still ABSENT: item 48 stays blocked.

## Captured exchanges, in order

### create org

`POST /orgs` → **201** · as owner · request-id `4521864a-09de-42f2-b5dc-5f670ac22a0f`
> the fresh QA org every probe below runs on

```json
{
  "request": {
    "name": "QA Billing Org 1788370797508"
  },
  "response": {
    "org": {
      "id": "1745",
      "name": "QA Billing Org 1788370797508",
      "slug": "qa-billing-org-1788370797508",
      "status": "active",
      "createdAt": "2026-09-02T17:40:00.900Z",
      "updatedAt": "2026-09-02T17:40:00.900Z",
      "country": null
    },
    "membership": {
      "id": "1993",
      "orgId": "1745",
      "userId": "2125",
      "role": "owner",
      "isActive": true,
      "createdAt": "2026-09-02T17:40:00.900Z",
      "updatedAt": "2026-09-02T17:40:00.900Z"
    }
  }
}
```

### invite the member (existing user → added at once)

`POST /orgs/1745/members/invite` → **201** · as owner · request-id `8e95c219-d6f7-4fa9-98e9-68fee261b39e`

```json
{
  "request": {
    "email": "qa+1788370797508bilm@alphapromena.com",
    "role": "member"
  },
  "response": {
    "userId": "2126",
    "email": "qa+1788370797508bilm@alphapromena.com",
    "role": "member",
    "invitedNewUser": false
  }
}
```

### 1 · GET /billing/plans (owner)

`GET /orgs/1745/billing/plans` → **200** · as owner · request-id `65719d4c-d272-4f46-9892-505b1ebcae4b`

```json
{
  "items": [
    {
      "plan": "base",
      "name": "Malaky Business",
      "amountCents": 59900,
      "currency": "usd",
      "interval": "month"
    },
    {
      "plan": "pro",
      "name": "Malaky Scale",
      "amountCents": 89900,
      "currency": "usd",
      "interval": "month"
    }
  ],
  "total": 2
}
```

### 2 · GET /billing/subscription (owner, never subscribed)

`GET /orgs/1745/billing/subscription` → **200** · as owner · request-id `4383041d-78eb-4e95-8441-a09e890f1ab4`

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

`GET /orgs/1745/billing/credits` → **200** · as owner · request-id `552dca56-0670-4056-ade4-4b085e8bde10`

```json
{
  "items": [],
  "total": 0
}
```

### 3b · GET /billing/credits?limit=5&offset=0 (paging echo)

`GET /orgs/1745/billing/credits?limit=5&offset=0` → **200** · as owner · request-id `bb6664fe-a4e9-4ae7-9b08-8ce258d1e0cd`

```json
{
  "items": [],
  "total": 0
}
```

### 4 · GET /alphastudio/wallet (owner, fresh org)

`GET /orgs/1745/alphastudio/wallet` → **200** · as owner · request-id `83a13bc4-06d7-4fe8-8111-195385f03984`

```json
{
  "cents": 0,
  "heldCents": 0,
  "availableCents": 0
}
```

### GET /billing/plans (member)

`GET /orgs/1745/billing/plans` → **200** · as member · request-id `cbc6c797-230d-4bbd-a1ea-68f02c107065`

```json
{
  "items": [
    {
      "plan": "base",
      "name": "Malaky Business",
      "amountCents": 59900,
      "currency": "usd",
      "interval": "month"
    },
    {
      "plan": "pro",
      "name": "Malaky Scale",
      "amountCents": 89900,
      "currency": "usd",
      "interval": "month"
    }
  ],
  "total": 2
}
```

### GET /billing/subscription (member)

`GET /orgs/1745/billing/subscription` → **200** · as member · request-id `b1854ad9-72a0-44bd-bd44-5e0cb73afe47`

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

`GET /orgs/1745/billing/credits` → **200** · as member · request-id `42dae223-da6a-4759-8939-fd0d992966bb`

```json
{
  "items": [],
  "total": 0
}
```

### 5b · POST /billing/checkout {plan:"base"} (owner) — the OLD contract's key

`POST /orgs/1745/billing/checkout` → **201** · as owner · request-id `b0eaf265-de72-48d8-9f48-c59a296231d8`

```json
{
  "request": {
    "plan": "base"
  },
  "response": {
    "url": "<redacted: 479 chars, starts "https://chec…">",
    "sessionId": "<redacted: 66 chars, starts "cs_test_a1A6…">"
  }
}
```

### 6 · POST /billing/checkout {plan:"base"} (member)

`POST /orgs/1745/billing/checkout` → **403** · as member · request-id `29edb4e1-8728-4a3e-85e3-96998e56f153`

```json
{
  "request": {
    "plan": "base"
  },
  "response": {
    "error": {
      "code": "forbidden",
      "message": "You do not have access to this resource",
      "requestId": "29edb4e1-8728-4a3e-85e3-96998e56f153"
    }
  }
}
```

### 7 · POST /billing/portal (owner, never subscribed)

`POST /orgs/1745/billing/portal` → **201** · as owner · request-id `30912741-2631-4316-aa0c-e230f1f28cda`

```json
{
  "url": "<redacted: 133 chars, starts \"https://bill…\">"
}
```

### 5 · POST /billing/checkout {plan:"base"} (owner)

`POST /orgs/1745/billing/checkout` → **201** · as owner · request-id `e1475ee5-c248-4ea3-81b7-493303d0aca7`
> url and sessionId redacted to their shape; the url was NEVER opened and the session is abandoned (test mode, expires on its own)

```json
{
  "request": {
    "plan": "base"
  },
  "response": {
    "url": "<redacted: 479 chars, starts \"https://chec…\">",
    "sessionId": "<redacted: 66 chars, starts \"cs_test_a1m6…\">"
  }
}
```

### GET /billing/subscription (owner, after an unopened checkout)

`GET /orgs/1745/billing/subscription` → **200** · as owner · request-id `93f6ed94-fe9c-47a6-bbb9-00cd974aeccd`

```json
{
  "plan": null,
  "status": "none",
  "currentPeriodStart": null,
  "currentPeriodEnd": null,
  "cancelAtPeriodEnd": false,
  "canceledAt": null,
  "updatedAt": "2026-09-02T17:40:13.724Z"
}
```

### GET /alphastudio/wallet (owner, after)

`GET /orgs/1745/alphastudio/wallet` → **200** · as owner · request-id `381698d3-abbe-4c39-a642-c28264cc6124`

```json
{
  "cents": 0,
  "heldCents": 0,
  "availableCents": 0
}
```

### 8 · PATCH /orgs/:id — whatYouOffer + whatSetsYouApart beside name

`PATCH /orgs/1745` → **200** · as owner · request-id `79bce607-9e00-4a80-a30b-bd4582e14fe4`

```json
{
  "request": {
    "name": "QA Billing Org 1788370797508",
    "whatYouOffer": "Specialty coffee, roasted to order and shipped within 48 hours.",
    "whatSetsYouApart": "Roasted to order. Direct-trade sourcing. Carbon-neutral shipping."
  },
  "response": {
    "id": "1745",
    "name": "QA Billing Org 1788370797508",
    "slug": "qa-billing-org-1788370797508",
    "status": "active",
    "createdAt": "2026-09-02T17:40:00.900Z",
    "updatedAt": "2026-09-02T17:40:19.002Z",
    "country": null
  }
}
```

### 8 · GET /orgs/:id — read back

`GET /orgs/1745` → **200** · as owner · request-id `4c199f3d-1782-418d-b422-0c4bb9091a5e`

```json
{
  "org": {
    "id": "1745",
    "name": "QA Billing Org 1788370797508",
    "slug": "qa-billing-org-1788370797508",
    "status": "active",
    "createdAt": "2026-09-02T17:40:00.900Z",
    "updatedAt": "2026-09-02T17:40:19.002Z",
    "country": null
  },
  "membership": {
    "id": "1993",
    "orgId": "1745",
    "userId": "2125",
    "role": "owner",
    "isActive": true,
    "createdAt": "2026-09-02T17:40:00.900Z",
    "updatedAt": "2026-09-02T17:40:00.900Z"
  }
}
```

---

## History — the earlier record, kept as dated history (superseded)

What follows is the previous `billing-shapes.md` verbatim, with its top heading demoted.
Its plan keys, names, amounts and interval describe a contract that no longer answers;
its shapes for `subscription`, `credits` and the 402 addendum still read the same.

### Billing endpoints — observed, not guessed (ORDER BIL-0902 Phase 0)

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

