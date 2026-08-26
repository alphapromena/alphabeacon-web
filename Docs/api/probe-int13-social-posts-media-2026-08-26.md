# PROBE-INT13 — Hasan's `social-posts.media` fan-out, observed (2026-08-26)

Probe branch `probe/int13`, cut from `main` (`fd84173`). **No product code was
changed, nothing was merged, nothing was pushed.** The probe scripts live in the
session scratchpad (the PROBE-0826 convention), so this file, the appended
section in `alphastudio-shapes.md` and the `open-items.md` entry are the whole
diff.

Hasan (AlphaStudio upstream) specified the sanctioned flow for post media: the
generate button lives on a proposal **after it is approved**, and the wire is the
endpoint INT-11 already uses — `POST /orgs/:orgId/alphastudio/media/jobs` — with
the `social-posts.media` fan-out body. That body had never been sent by our code
and is not in `alphastudio-shapes.md`, so it was sent once, verbatim, with real
values, against a fresh QA org.

One fresh QA org was minted (**948**, `qa+1787742138618int13@alphapromena.com`).
Org 619 and every production org were left alone. The API was warmed before the
first call (probes `1296ms, 221ms, 92ms`; 12-way fleet slowest 1051 ms) and a
4-wide heartbeat ran for the life of the pass, so no latency below is a cold
start.

**Cost: 7 cents.** Two renders at 3 cents (both sends) and 1 cent of text for the
run that minted the proposal. Within the 2-media-call cap the order set.

## Verdict

1. **The request works. The RECEIPT does not.** `POST …/media/jobs` with
   Hasan's body answered **502 `bad_gateway` — "The media service returned an
   unexpected response"** on both sends, in 3.2 s each. And yet **both jobs were
   really created**: `GET …/media/jobs` lists them, they carry
   `capability: "social-posts.media"`, the platform resolved
   `modelAlias: "image-balanced"`, both reached **`succeeded`**, each produced a
   real 1024×1024 PNG with a 1-hour presigned url, and the wallet **held 6 cents
   in flight and settled them**. The failure is in the response path only.
2. **So the receipt shape is still UNOBSERVED.** The question the order asked
   first — one job, or `{ jobs: [...] }`? — **cannot be answered today**, because
   the endpoint has never returned a success body for this capability. Nothing
   was invented to fill the gap, and `createPostMediaJob` therefore has nothing
   to be typed on. **This is what stops Phase B**, not the association question.
3. **Re-association is CONFIRMED, and it is the mechanism Phase B expected.**
   Each job echoes `origin.ref` = exactly the `posts[].ref` we sent (the
   proposal id), with `origin.kind: "linked"` — a value we never sent, so the
   platform derives the origin from the fan-out item itself. The ref is present
   on the **job read** and on the **list**, so a reload can re-associate job →
   proposal with no client-side persistence. **Assets carry no ref**: the tag
   lives on the job only.
4. **There is NO idempotency, and that is dangerous here.** Two byte-identical
   sends produced **two distinct jobs** (`mjob_dc24…` and `mjob_3c1a…`), both
   charged. Combined with (1), the naive client behaviour — "502, so retry" —
   silently multiplies spend while showing the user nothing. Any client of this
   endpoint must treat a 502 as **possibly succeeded**, never as "nothing ran".
5. **It is almost certainly the fan-out body, not the whole endpoint.** Hours
   earlier the same day, on the same deployment, PROBE-0826 sent a
   `media.generate` body to this exact route and got a **202** with a real job
   and a real asset. That is strong evidence the break is specific to the
   `posts[]` shape — and it is the same half-landed media deployment PROBE-0826
   characterised. It is not conclusive: a `media.generate` control call on org
   948 would settle it, and it was not spent because the order capped this probe
   at two media calls.

The shape of (1) and (5) together: **the upstream service is fine and our proxy
cannot render its fan-out answer.** `MediaJobFanOutReceipt` in `src/api/types.ts`
already says a `posts[]` request answers a LIST while `studio.createJob` types
the receipt as a single `ApiMediaJob` — a proxy validating the upstream's list
against a single-job schema would produce precisely this envelope, at precisely
this point, after the job was already created. That is a hypothesis with good
evidence, not an observation, and Ward can confirm or kill it in a minute.

## The body that was sent

Verbatim Hasan, with real values: `ref` = the approved proposal's id, `content` =
that proposal's own text, `tone` joined from the org's live tones list.

```json
{
  "capability": "social-posts.media",
  "plan": "balanced",
  "params": { "count": 1, "aspectRatio": "1:1", "outputFormat": "png" },
  "style": { "medium": "auto", "text": false, "logo": false, "note": "muted, editorial" },
  "posts": [
    {
      "ref": "prop_b0a3be5896d27e3e569c101b",
      "content": "Attention Executives: The latest market analysis indicates a significant shift in consumer behavior towards sustainable products. …",
      "tone": {
        "id": "1664",
        "name": "Executive Brief",
        "rules": [{ "kind": "do", "text": "Open with the exposure, not the tooling." }]
      }
    }
  ]
}
```

## What each call answered

| Call | Status | requestId |
| ---- | ------ | --------- |
| `POST …/media/jobs` — send 1 | **502** | `b14c4cf6-3e3d-4021-9f7a-f549ace8f7c1` |
| `POST …/media/jobs` — send 2, byte-identical | **502** | `0bb130e0-03fe-467c-b586-79ce8760064b` |
| `GET …/media/jobs` — after send 1 (1 job) | 200 | `debdca5e-039d-4de8-b31e-35d5e0e32a7f` |
| `GET …/media/jobs` — after send 2 (2 jobs) | 200 | `67944927-5e01-45ea-850f-a714f65189ff` |
| `GET …/media/jobs/mjob_dc240533e90d361bddc09985` — `succeeded` | 200 | `ecb2cd53-3ff1-4c77-b28e-a0c7feb1cf91` |
| `GET …/media/jobs/mjob_3c1a8d8a99741665cf590dca` — `succeeded` | 200 | `02cf354b-8140-4516-9114-0e126d018d0c` |
| `POST …/media/assets/masset_00d12b79863ade33a58a00e3/presign` | 200 | `8d54c5b7-d3d7-4f6c-8f4d-2034bdc8dc29` |
| `POST …/media/assets/masset_294df9b53df465652b3b9f07/presign` | 200 | `bce3717a-d69b-4312-a1f6-1008cc30d2d5` |
| `GET …/media/jobs` — both terminal | 200 | `c1cd5a59-7d13-4db7-ac02-14212324fd0c` |
| `GET …/catalog/capabilities/social-posts.media` | 200 | `72c08480-79bb-451a-b969-c32dbad9b061` |
| `POST …/posts/generate` — mints the proposal | 202 | `2ac35c10-ebe0-4dfc-b6b1-5f71c2af40a0` |
| `GET …/proposals?runId=` | 200 | `a1e1857e-d94a-4d32-8629-e8061480c44e` |
| `POST …/proposals/:id/approve` | 200 | `514ea553-7bf8-4109-b28b-8893ed313aec` |
| `GET …/wallet` — before / after | 200 | `2aa67901-802f-46c8-a88d-ea5fa03b1991` / `cc515064-1330-4d73-a2c0-ad7b4ef60996` |
| `GET …/usage?group_by=capability` | 200 | `b513b0e6-7439-416f-8988-d021ecba1c65` |

### The 502, verbatim (both sends, same envelope)

```json
{
  "error": {
    "code": "bad_gateway",
    "message": "The media service returned an unexpected response",
    "requestId": "b14c4cf6-3e3d-4021-9f7a-f549ace8f7c1"
  }
}
```

### The job it nevertheless created — the fan-out shape, terminal

```json
{
  "jobId": "mjob_dc240533e90d361bddc09985",
  "status": "succeeded",
  "capability": "social-posts.media",
  "plan": "balanced",
  "modelAlias": "image-balanced",
  "origin": {
    "kind": "linked",
    "ref": "prop_b0a3be5896d27e3e569c101b"
  },
  "assets": [
    {
      "assetId": "masset_00d12b79863ade33a58a00e3",
      "kind": "image",
      "url": "<presigned, 1544 chars>",
      "expiresAt": "2026-08-26T13:18:33.909Z",
      "meta": { "width": 1024, "height": 1024, "synthetic": true }
    }
  ],
  "createdAt": "2026-08-26T11:02:54.509Z",
  "updatedAt": "2026-08-26T11:03:12.093Z"
}
```

Note `origin.kind: "linked"`. We sent no `origin` at all — the platform minted it
from `posts[0].ref`. `media.generate` jobs carry `{"kind":"standalone"}`
(INT-11), so **`kind` distinguishes a post-linked render from a Studio one**,
which is exactly the discriminator a re-association mapper wants.

The asset shape is INT-11's, unchanged: `assetId`, `kind`, `url`, `expiresAt`,
`meta {width, height, synthetic}`. **No field carries the ref.** And
`POST …/media/assets/:assetId/presign` resolves a fan-out output happily (200,
`{assetId, url, expiresAt}`), so the 1-hour mint-on-open law works here exactly
as it does for Studio renders — worth stating because PROBE-0826 found the
sibling **upload** presign broken; the download route is a different one and it
is healthy.

### The list — the reload path

Both jobs, newest first, `origin.ref` on each, **assets present but urls
absent** — the 1-hour law holds on the list exactly as INT-11 recorded it.

```json
{
  "jobs": [
    { "jobId": "mjob_3c1a8d8a99741665cf590dca", "status": "submitted",
      "capability": "social-posts.media", "plan": "balanced",
      "modelAlias": "image-balanced",
      "origin": { "kind": "linked", "ref": "prop_b0a3be5896d27e3e569c101b" },
      "assets": [], "createdAt": "2026-08-26T11:02:58.496Z",
      "updatedAt": "2026-08-26T11:02:58.705Z" },
    { "jobId": "mjob_dc240533e90d361bddc09985", "status": "submitted", "…": "…" }
  ]
}
```

Two jobs for one proposal, from two sends. **A re-association mapper must handle
many jobs per ref**, not one — the list is the only place that count is visible,
and with no idempotency it grows on every retry.

### The catalog — what the dialog must build its options from

`GET …/catalog/capabilities/social-posts.media` → `selectable: true`,
`field: "plan"`, **12 model rows**, plans `balanced` / `creative` / `precise`,
six image rows and six video rows. `plan: balanced` resolved to `image-balanced`
at **$0.03/image**; `precise` rows cost $0.211. Every image row's
`capabilitySchema` is the same:

```json
{
  "type": "object",
  "properties": {
    "seed": { "type": "integer", "minimum": 0, "maximum": 4294967295 },
    "count": { "type": "integer", "minimum": 1, "maximum": 20 },
    "aspectRatio": { "enum": ["1:1","16:9","9:16","4:3","3:4","3:2","2:3"], "type": "string" },
    "outputFormat": { "enum": ["png","jpeg","webp"], "type": "string" },
    "negativePrompt": { "type": "string", "maxLength": 1000 }
  },
  "additionalProperties": false
}
```

`additionalProperties: false` is worth reading twice: `params` may carry **only**
those five keys. Note also that `social-posts.media` grants **video** rows —
`count` is images-only, and a `plan` of `creative`/`precise` can select a video
model. A dialog that offers plan chips without pinning the kind can bill
`video_seconds`. INT-13 sends images; that has to be deliberate, not incidental.

### Cost, measured

Wallet `5000` → in flight `{cents: 5000, heldCents: 6, availableCents: 4994}` →
settled `{cents: 4993, heldCents: 0, availableCents: 4993}`. So a render **holds
before it settles**, which is what the balance chip should show mid-job.
`GET …/usage?group_by=capability` attributes it exactly:

| capability | unit | qty | costUsdEstimate |
| ---------- | ---- | --- | --------------- |
| `social-posts.media` | `images` | 2 | 0.060000000000 |
| `social-posts.media` | `input_tokens` | 1546 | 0.001546000000 |
| `social-posts.media` | `output_tokens` | 196 | 0.000980000000 |
| `social-posts.media` | `guardrail_text_units` | 2 | 0.000300000000 |
| `social-posts.generate` | `input_tokens` | 4494 | 0.004035800000 |
| `social-posts.generate` | `output_tokens` | 686 | 0.003116800000 |

The media job spends **tokens as well as images** — the platform writes an image
prompt from the post text before it renders. That is the fan-out doing real work
on `content` and `tone`, and it is why the two sends were not free duplicates of
one another.

## Found on the way: the proposals row now carries `content`

Not INT-13's business, but it contradicts a documented premise and someone will
build on it. `ApiProposal` in `src/api/types.ts` says, in capitals, "**NOTE WHAT
IS NOT HERE: no content, no tone, no rationale**", and INT-12's whole design
(D-INT-J) is a JOIN from the ledger back to the runs because of it. The wire
today answers:

```json
{
  "proposalId": "prop_b0a3be5896d27e3e569c101b",
  "runId": "run_55ff7e2f32a0caf4cfe207da",
  "outputIndex": 0,
  "content": "Attention Executives: …",
  "key": "1664",
  "state": "pending",
  "reason": null,
  "publishedId": null,
  "createdAt": "2026-08-26T11:02:47.855Z",
  "decidedAt": null
}
```

Five fields our type does not model — `outputIndex`, `content`, `key`, `reason`,
`createdAt` — and `content` is the draft text itself. **This answers open-item 31
in the affirmative**: the proposals list *could* now carry the draft, so Today's
run-join could collapse to a single read. Nothing is broken (extra fields are
ignored, and the join still works), but the type's doc comment is now false and
INT-12's design rationale has an expiry date on it. `key` appears to be the tone
id — here `"1664"`, the id of the tone the run was given — which would also make
the tone resolvable without a run read.

**Not acted on here.** It is a separate decision, and INT-13 must not quietly
re-architect INT-12 on the way past.

## What Ward needs to be asked

1. **`POST /media/jobs` with a `posts[]` body 502s after creating the job.**
   Request ids `b14c4cf6-3e3d-4021-9f7a-f549ace8f7c1` and
   `0bb130e0-03fe-467c-b586-79ce8760064b`, org 948. The jobs
   (`mjob_dc240533e90d361bddc09985`, `mjob_3c1a8d8a99741665cf590dca`) both
   succeeded and both billed. **What is the intended success body — one job, or
   `{ jobs: [...] }`?** We cannot type the call until it comes back once.
2. **Is the proxy validating the fan-out answer against the single-job schema?**
   That would explain the envelope, the timing and the fact that the job exists.
3. **Is there any idempotency key?** Two identical sends billed twice. With a
   502 on the success path, a retrying client burns money invisibly.
4. **`social-posts.media` grants video models.** Intended for this capability, or
   an over-broad grant? It changes what a plan chip is allowed to mean.
5. **When did `content` land on the proposals row** (see above), and is it
   contractual now? `api.md` still describes the content-free row.
