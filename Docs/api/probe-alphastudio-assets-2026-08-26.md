# Ward's new assets endpoint — what is actually there (2026-08-26)

Probe branch `probe/assets-0826`, cut from `main` (`fd84173`). **No product code
was changed, nothing was merged, nothing was pushed.** The probe scripts live in
the session scratchpad, not in the repo, so this file and the `open-items.md`
entry are the whole diff.

Ward, WhatsApp, ~11:38: _"We added a new proxy api to alphastudio to return the
assets — GET /alphastudio/media/assets"_. That is the only description we have.

Nine fresh QA orgs were minted (**939–947**); org **947** is the only one that
spent anything (**3 cents**, one render — see [Cost](#cost)). Org 619 and every
production org were left alone. The API was warmed to two consecutive sub-second
`/health` answers before each pass (2 probes, e.g. `345ms, 82ms`; 12-way fleet
slowest 248 ms) and a 4-wide heartbeat ran for the life of every pass, so no
latency below is a cold start.

## Verdict

1. **The endpoint is real, and it is broken.** `GET
   /api/orgs/:orgId/alphastudio/media/assets` is a **registered route** that
   returns **502 `bad_gateway` — "The media service returned an unexpected
   response"** on every single call. Deterministic: **eighteen calls across
   seven orgs**, including three back-to-back repeats, six query-parameter
   shapes, and both an empty org and an org holding a real asset. Never once
   anything but 502, and always in 580–870 ms — a real upstream round trip,
   not a timeout.
2. **Ward's literal path does not exist.** `GET /api/alphastudio/media/assets`
   is a plain 404. The canonical path is **org-scoped**, like every other
   `/alphastudio/*` surface.
3. **The contract cannot be captured yet.** Because the route never returns a
   body, every question the order asked about it — item shape, envelope,
   pagination, whether urls are embedded, presigned-vs-stable — is
   **unanswerable today**. This report characterises the surface and hands Ward
   the questions; it does not describe a JSON shape, because no JSON shape has
   ever been observed.
4. **There is no per-asset GET, and no byte proxy anywhere.** `GET
   /media/assets/:assetId` is unrouted — proven with a *real* asset id that the
   sibling presign route resolves happily. Every response on the whole surface
   is `application/json`; no call ever returned bytes, a `cache-control`, or a
   `content-disposition`. **The old law in `src/data/studio.ts` — "the platform
   deliberately never proxies bytes" — still holds on the wire.** Ward's change
   adds a JSON *list*, not a byte door.
5. **Collateral, and more urgent than the probe itself: `POST
   /media/assets/presign` is broken, and it breaks the shipped app.** The
   documented body — `{"mediaType":"image/png"}`, exactly what
   `uploadReferenceImage` sends and exactly what `openapi.json` specifies — is
   now rejected **upstream**. That is the live reference-image upload path.
   See [The presign is down](#the-presign-is-down).
6. **The media service itself is healthy.** A render job was accepted (202),
   ran, and produced a real asset with a 1-hour presigned url. So this is not an
   outage: it is the **asset surface specifically** — the new list route and the
   upload presign — that is broken, which is exactly the shape of a half-landed
   deployment.

## Route discovery

Every path tried, with the request-id of the recorded call.

| Path | Status | Routed? | requestId |
| ---- | ------ | ------- | --------- |
| `GET /orgs/:orgId/alphastudio/media/assets` | **502** | **yes** | `7629e41d-e87a-4597-8e36-307445eda825` |
| `HEAD /orgs/:orgId/alphastudio/media/assets` | **502** | **yes** | `843414c3-8495-45e2-ad23-8124e888c53a` |
| `GET /alphastudio/media/assets` — Ward's literal path | 404 | no | `f51091d1-5b62-4186-8d67-51c1d2be6eeb` |
| `GET /alphastudio/media/assets?orgId=939` | 404 | no | `2cf656fc-d14d-41ed-8092-fe5f62270198` |
| `GET /orgs/:orgId/alphastudio/media/assets/` (trailing slash) | 404 | no | `90d7a247-c0d8-4789-a487-e4e3ccddf9e5` |
| `GET /orgs/:orgId/alphastudio/assets` (no `media` segment) | 404 | no | `894eb9d3-5297-4342-802c-5db6f8755227` |
| `POST /orgs/:orgId/alphastudio/media/assets` | 404 | no | `aa222c32-0a71-4706-b656-ee7363b537bb` |
| `GET /orgs/:orgId/alphastudio/media/assets/:realAssetId` | 404 | **no** | `5e0f5fb3-54f7-4f85-8b7c-07aa8b083f65` |
| `GET …/media/assets/:realAssetId/content` and `/download` | 404 | no | — |

Query shapes tried on the collection, all **502**: `?limit=20`,
`?limit=20&offset=0`, `?kind=reference`, `?type=image`, `?page=1&pageSize=20`,
`?scope=tenant`, `?assetId=<real id>`.

### How "routed" was decided

The API answers an **unrouted** path with a bare envelope carrying **no
`requestId` field in the body**, and a **routed** path that reached upstream
with a **specific message and a body `requestId`**. The two are unmistakable:

```json
// unrouted — GET /orgs/941/alphastudio/nonsense-route
{"error":{"code":"not_found","message":"Not found"}}

// unrouted — GET /orgs/947/alphastudio/media/assets/masset_c09f0ca24a7c2b8588b7021b
{"error":{"code":"not_found","message":"Not found"}}

// ROUTED, asset genuinely absent — POST /orgs/941/alphastudio/media/assets/<fabricated>/presign
{"error":{"code":"not_found","message":"Asset not found","requestId":"d4333db1-4d8c-4248-bda1-c2717f1d4135"}}

// ROUTED, org genuinely absent — GET /orgs/1/alphastudio/media/assets
{"error":{"code":"not_found","message":"Org not found","requestId":"38540b86-24c7-4236-9b3f-d320027c750e"}}
```

The second line is the decisive one: `masset_c09f0ca24a7c2b8588b7021b` is a
**real, existing asset** — `POST /media/assets/:assetId/presign` returns **200**
for that same id (`45b29c95-eab0-486f-8913-536025924418`). A real id that the
presign route resolves, answered with the bare unrouted envelope, means the
per-asset GET is not registered. It is not "asset missing"; it is "no such
route".

Every response also carries an `x-request-id` **header**, on routed and unrouted
paths alike. Only the *body* `requestId` distinguishes them.

## What the endpoint is FOR

Read against what already exists, the intent is legible even though the route is
broken. Today an org's media lives in two places that cannot be enumerated
together: **uploaded reference images**, which are write-only from the client's
point of view (you presign, you PUT, you get an `assetId` back, and thereafter
the only thing you can do is mint a fresh download url or delete it), and
**render outputs**, which are reachable only *through the job that made them* —
`GET /media/jobs` lists jobs, and each job carries its own `assets[]`. There is
no way to ask "what media does this org have?", so a client wanting a media
library has to walk every job and remember every upload it ever made. A
collection `GET` on `/media/assets` is the obvious missing read: the org's
assets as a first-class list, independent of which job or upload produced them.
That reading is consistent with the route accepting `GET` and `HEAD` and
refusing `POST` (a pure read surface), and with Ward's own word "return the
assets". It is a **plausible reading of intent, not an observed fact** — the
route has never returned a body, so whether it actually spans both asset kinds
is the first thing on [the list for Ward](#what-only-ward-can-answer).

Note this would be a genuine philosophy change only in the *enumeration* sense.
It is **not** a change to the bytes law: nothing on this surface serves bytes,
and the existing per-asset presign still hands out short-lived S3 urls.

## The presign is down

This was found while trying to seed an asset, and it matters more than the probe
itself, because it is a **live regression in a shipped path**.

`src/data/studio.ts` → `uploadReferenceImage` sends `{ mediaType }`.
`openapi.json` declares exactly one required property, `mediaType`, with pattern
`^[\w.+-]+\/[\w.+-]+$`. `alphastudio-shapes.md` records that exact body
returning **201** on 2026-08-17 against an equally fresh org (570). Today, on
five different fresh orgs, it returns **400**:

```json
// POST /orgs/943/alphastudio/media/assets/presign   {"mediaType":"image/png"}
{"error":{"code":"bad_request",
  "message":"The media service rejected the request — check the body against the capability's schema",
  "requestId":"d7d9c7da-d652-4b26-a007-aea9c8d0bf24"}}
```

The failure is **upstream, not ours**. Our own validator is visibly working and
visibly passing this body through — send a malformed one and you get a different
code entirely:

```json
// {"mediaType":"png"}  — our API's own validator, before the proxy
{"error":{"code":"validation_failed","message":"Validation failed",
  "details":[{"field":"mediaType","message":"must be a media type like image/png"}],
  "requestId":"8feb08f9-174b-400e-a050-50f21a14a8cf"}}

// {} — same thing, missing field
{"error":{"code":"validation_failed","message":"Validation failed",
  "details":[{"field":"mediaType","message":"Invalid input: expected string, received undefined"}],
  "requestId":"a2c0566c-5f48-496b-9a21-67f890af240f"}}
```

So anything with a syntactically valid `mediaType` clears our layer and is
refused by the media service. **24 body shapes were tried** and every one with a
valid `mediaType` failed identically — `image/png`, `image/jpeg`, `image/webp`,
`video/mp4`, `application/pdf`, and `image/png` combined with each of
`fileName`, `filename`, `name`, `kind`, `assetKind`, `assetType`, `purpose`,
`usage`, `source`, `operation`, `scope` (`tenant`/`org`/`project`), `size`,
`sizeBytes`, `byteSize`, `contentLength`, `expiresIn`, `metadata`, `capability`,
and `capability`+`params`. No capability named `media.assets`, `media.upload`,
`assets.upload`, `media.assets.list` or `media.assets.upload` exists in the
catalog (all 404 `Capability not found`), so there was no schema to read.

That total invariance is itself the evidence: if the schema had merely gained a
required field, one of twenty-four guesses would likely have moved the error, or
changed its shape. It did not move at all. Combined with the sibling route on
the same service returning 502, **"the asset surface is mid-deployment" explains
both far better than "the presign schema changed and we failed to guess it"** —
but it is Ward's to confirm, and it is the reason no reference asset could be
seeded for this probe.

**Product impact:** in live mode, reference-image upload is broken. The failure
surfaces through `toFailure`, so the user gets an error toast with a request id
rather than a crash — but the feature does not work.

## What still works — the media service is healthy

The order asked whether the list covers uploads, render outputs, or both. It
could not be answered from the list, so it was approached from the other end: a
single cheapest render, to see whether the media service accepts work at all.

It does. `POST /media/jobs` → **202** (`2fb08376-d19e-4ff6-a99b-8ec4602a0a3b`),
job `mjob_458665346d6902add38ff136`, which polled `queued` → `submitted` →
**`succeeded`** and produced one real 1024×1024 asset. Same org, same token,
minutes apart from the failing calls.

| Call | Result |
| ---- | ------ |
| `POST /media/jobs` | **202** — accepted |
| `GET /media/jobs`, `GET /media/jobs/:jobId` | **200** |
| `POST /media/assets/:assetId/presign` | **200** — on the render output |
| `GET /wallet`, `GET /usage`, `GET /proposals`, `GET /rag/collections` | **200** |
| `PUT /orgs/:id/country` (our own DB, control) | **200** in 14.2 s (the documented holiday lookup) |
| `POST /media/assets/presign` | **400** upstream |
| `GET /media/assets` | **502** upstream |

The `PUT /country` control matters: our own database accepts a write on the same
org with the same token, so nothing is wrong with the identity, the org, or
authorisation. The two failures are isolated to the alphastudio media asset
surface.

### The render output, verbatim (urls redacted)

`GET /orgs/947/alphastudio/media/jobs/mjob_458665346d6902add38ff136` → 200:

```json
{
  "jobId": "mjob_458665346d6902add38ff136",
  "status": "succeeded",
  "capability": "media.generate",
  "plan": "balanced",
  "modelAlias": "image-balanced",
  "origin": { "kind": "standalone" },
  "assets": [
    {
      "assetId": "masset_c09f0ca24a7c2b8588b7021b",
      "kind": "image",
      "url": "https://aps-staging-assets.s3.us-east-1.amazonaws.com/assets/alphabeacon/947/mjob_458665346d6902add38ff136/0.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=<redacted>&X-Amz-Date=20260826T100952Z&X-Amz-Expires=3600&X-Amz-Security-Token=<redacted>&X-Amz-Signature=<redacted>&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject",
      "expiresAt": "2026-08-26T11:09:52.487Z",
      "meta": { "width": 1024, "height": 1024, "synthetic": true }
    }
  ],
  "createdAt": "2026-08-26T10:09:00.683Z",
  "updatedAt": "2026-08-26T10:09:15.993Z"
}
```

Two things worth noting. The url is **presigned with `X-Amz-Expires=3600`**, and
`expiresAt` is exactly one hour after the read — the 1-hour law is unchanged.
And the bucket is **`aps-staging-assets`**: the deployed API we test against is
pointed at the media service's *staging* asset store. That is almost certainly
already known, but it is on the wire, so it is recorded here.

### E3 is confirmed, and can be stated more precisely

`src/data/studio.ts:148` says the jobs list is "deliberately WITHOUT presigned
urls (E3)". That holds, and the boundary is now exact — it is the **list** that
omits them, and the **single-job read** that includes them. Same job, same org,
minutes apart:

```json
// GET /media/jobs  → jobs[0].assets[0]   — no url, no expiresAt
{"assetId":"masset_c09f0ca24a7c2b8588b7021b","kind":"image",
 "meta":{"width":1024,"height":1024,"synthetic":true}}
```

## Cross-checks

**Unauthenticated posture (step 2c).** Deferred from the first pass — the step
was written to run against "whichever route succeeds", and neither did — then
run against the route that is *registered*. Auth is enforced **before** the
proxy call, on the new route exactly as on known routes:

| Call | Result |
| ---- | ------ |
| `GET /media/assets`, no `Authorization` | **401** `unauthorized` · `efe99a91-a953-4ead-9675-46790508e3f4` |
| `GET /media/assets`, garbage bearer | **401** · `b573afd1-c4de-48eb-ae00-ebed70374bb0` |
| `GET /media/jobs`, no `Authorization` (control) | **401** · `1c5953fd-e3bc-4dda-826f-5b3234402f5e` |
| `GET /orgs/1/…/media/assets`, valid token, not our org | **404** `Org not found` · `38540b86-24c7-4236-9b3f-d320027c750e` |

The 401s come back in **91–451 ms** against the 502's **580–870 ms** (eighteen
502s across seven orgs), so the request is being rejected before the upstream
round trip rather than after a failed one. Posture is correct.

**DELETE → does it vanish from the list?** **Not answerable.** It needs a
seeded asset and a working list; the presign blocked the first and the 502
blocks the second. `DELETE /media/assets/:assetId` itself is unchanged and still
routed (`488d51ca-530b-4000-85fb-708af6d6a783`, `Asset not found` on a
fabricated id).

**OPTIONS preflight — open-items item 3, sharpened.** CORS has **not**
regressed, and the earlier reading that it had was an artefact of the probe
asking for `x-request-id`. Isolated on the new route, changing only the
requested headers:

| `access-control-request-headers` | Answer |
| -------------------------------- | ------ |
| `authorization` | 200 + `allow-headers: content-type,authorization`, `allow-methods: *`, `allow-origin: http://localhost:5173`, `max-age: 3600` |
| `authorization, content-type` | 200 + the same full grant |
| `authorization, content-type, x-request-id` | 200 + **no CORS headers at all** |

So item 3 is worse than "the header is not allowed": naming `x-request-id` in a
preflight makes the Function URL withhold the **entire** CORS grant, which fails
the whole request, not just that header. And there is still **no
`access-control-expose-headers`** — the server does now send an `x-request-id`
response header on every call, but a browser cannot read it. The ask is
unchanged and the new route inherits it: add `x-request-id` to both
`Access-Control-Allow-Headers` and `Access-Control-Expose-Headers`.

## A doc correction found on the way (not a break)

`POST /rag/collections` now **requires `scope`**. Isolated cleanly on org 945 —
same name, one field apart:

| Body | Result |
| ---- | ------ |
| `{"name":"knowledgebase","embeddingModel":"embed-default"}` | **400** · `5d7c660c-b4e4-4f5d-b174-f0ff5e3445f0` |
| `{"name":"knowledgebase","embeddingModel":"embed-default","scope":"tenant"}` | **201** · `b34e6db6-31df-44cc-8bd5-7fbda1d00cdd` |
| `{"name":"brandnewname","embeddingModel":"embed-default"}` | **400** · `df272575-e2b7-4834-8e6c-309a7f043386` |

A fresh name without `scope` still fails, so it is the field and not a name
collision. **The app is already correct** — `ensureCollection` sends
`scope: 'tenant'` — so nothing is broken; but `api.md` and the shapes note only
mark `embeddingModel` as the surprise required field, and `scope` now belongs
beside it.

## Cost

**3 cents, once, on probe org 947.** Wallet `5000 → 4997` (`heldCents` 3 while
the job ran, 0 after). Every other call in this probe is free. The render was
run deliberately: with the list 502-ing, submitting one job was the only way to
establish that the media service accepts work at all — which is what separates
"Ward's new route is half-deployed" from "the media service is down", and that
distinction is the report's main finding.

## What only Ward can answer

1. **Is `GET /api/orgs/:orgId/alphastudio/media/assets` the canonical path?**
   It is the only variant that routes; the literal path from the message
   (`/api/alphastudio/media/assets`) is a 404.
2. **The route 502s on every call — is it deployed but unfinished, or is
   something wrong on our side?** Sample request-ids:
   `7629e41d-e87a-4597-8e36-307445eda825` (empty org),
   `2edeb89b-e47b-4320-9ef1-18530967e0dc` (org holding a real asset).
3. **When it works, what is in it — uploaded reference assets, render outputs,
   or both?**
4. **Will items carry urls?** If so, presigned-with-expiry like everywhere else
   (1 hour), or stable/proxied? This decides whether the client can cache them.
5. **What is the pagination vocabulary** — `limit`/`offset`, `page`/`pageSize`,
   or a cursor — and is there an envelope (`{items,total}`) or a bare array?
6. **Is `POST /media/assets/presign` intentionally changed?** It now rejects
   `{"mediaType":"image/png"}`, the body in `openapi.json` and the one the app
   sends, which breaks reference-image upload in live mode. If the schema moved,
   what is the new required field? (`d7d9c7da-d652-4b26-a007-aea9c8d0bf24`)
7. **Is a `GET /media/assets/:assetId` meant to exist?** There is none today, so
   a single asset can only be reached by minting a download presign.

## Not measured

- **The list's actual contract.** No body has ever been observed. Nothing in
  this file describes the response shape, and nothing should be built against a
  guess — re-run the probe once Ward says the route is fixed.
- **Whether the presign broke at the same moment as the list.** The only prior
  observation is `alphastudio-shapes.md` on **2026-08-17**, where it returned
  201. Nothing was measured between then and this run, so the onset can only be
  dated "after 2026-08-17, before 2026-08-26 09:58 UTC". The live suite was
  13/13 on 2026-08-24, but no live spec exercises `uploadReferenceImage`, so it
  would not have caught this.
- **Behaviour on an org with a seeded *upload*.** Blocked by the presign; only a
  render-output asset was ever available.
- **`DELETE` → disappearance from the list**, per above.
