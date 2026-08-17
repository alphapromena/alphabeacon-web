# AlphaStudio API

Base URL: `https://g2pftek7nwnh7kstwuvii2j4pm0aqllt.lambda-url.eu-west-2.on.aws/api` (deployed).
The machine-readable contract is [openapi.json](openapi.json) (also served live at
`GET /api/openapi`); this file adds the human context: conventions, error semantics,
and per-endpoint notes.

## Conventions

- **Success responses** are bare resource JSON — no envelope. Paginated lists are
  `{ "items": [...], "total": <int> }` with `limit`/`offset` query params
  (default 20, max 100 — notifications default to 50). `total` is the full match count,
  not the page size.
- **Status codes**: `200` reads/updates · `201` creates · `204` deletes/logout (empty body).
- **IDs** are Postgres bigints serialized as **decimal strings** (`"42"`). Treat them as
  opaque strings; do not do arithmetic on them.
- **Timestamps** are ISO 8601 UTC strings (`2026-07-28T12:34:56.789Z`).
- **Request id**: every response carries `x-request-id` (a client may send its own and it
  is echoed). Include it in bug reports — it links to the server logs.
- **Auth**: `Authorization: Bearer <opaque session token>`. Tokens are opaque — no
  client-side parsing, no refresh endpoint; on 401 re-login. Sessions have a sliding
  expiry (12 h, or 30 d with `rememberMe`) under an absolute cap (7 d / 90 d).
- **CORS** is handled at the Lambda Function URL, not by the app.

## Error responses

All errors share one envelope:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Validation failed",
    "details": [{ "field": "email", "message": "Invalid email" }],
    "requestId": "0f3c1a2e-..."
  }
}
```

- `code` is machine-readable and **part of the contract** — switch on it, not on `message`.
- `details` appears only when there is something structured to say (never on `internal`).
- `internal` messages are always the generic `"Internal server error"` — internals are
  never leaked. Every other code (including `bad_gateway`) carries a safe, deliberate
  message.

| HTTP | `code`              | Meaning                                                                        |
| ---- | ------------------- | ------------------------------------------------------------------------------ |
| 400  | `bad_request`       | Malformed request or invalid/expired verification code                         |
| 400  | `validation_failed` | Body/query/param failed schema validation (`details` lists fields)             |
| 401  | `unauthorized`      | Missing/unknown/expired/revoked session token, or failed login                 |
| 403  | `forbidden`         | Authenticated, but wrong role/tier, org not active, or email not verified      |
| 404  | `not_found`         | Resource doesn't exist **or caller has no access** (existence is never leaked) |
| 409  | `conflict`          | Uniqueness/state invariant violated (duplicate email, double-redeemed code)    |
| 429  | `rate_limited`      | Too many requests — honor the `Retry-After` header (seconds)                   |
| 402  | `wallet_insufficient` | The org's AlphaProStudio wallet cannot cover the requested generation        |
| 502  | `bad_gateway`       | An upstream service failed — nothing changed, retry later                      |
| 500  | `internal`          | Unanticipated server bug — report with `requestId`                             |

## Email deep links (frontend contract)

Emails with codes deep-link into the frontend (`DASHBOARD_URL`, falling back to
`STUDIO_URL`) with the email and code in the query string so forms autofill:

| Email          | Link                                        |
| -------------- | ------------------------------------------- |
| Password reset | `/reset-password?email=<email>&code=<code>` |
| Org invite     | `/accept-invite?email=<email>&code=<code>`  |

Codes are 6 digits, expire after **10 minutes**, allow **5 attempts**, and are
rate-limited (60 s between sends, max 5 per hour per email+purpose). Requesting a new
code invalidates the previous one.

## Endpoints

### System

#### `GET /api/health`

Liveness probe. No auth, no database access. → `200 { "ok": true }`

#### `GET /api/openapi`

The generated OpenAPI 3.1 document for this API (excluded from itself).

### Webhooks

#### `POST /api/webhooks/callback`

Receives a callback from an external service. No auth (external senders cannot hold a
session token). Accepts **any** JSON payload — object, array or scalar — logs it, and
acknowledges. → `200 { "received": true }`

### Auth

The **auth session response** returned by login, verify-email, and accept-invite:

```json
{
  "token": "opaque-session-token",
  "expiresAt": "2026-07-29T06:11:09.032Z",
  "user": {
    "id": "1",
    "name": "...",
    "email": "...",
    "role": "user",
    "status": "active",
    "emailVerifiedAt": "...",
    "createdAt": "..."
  },
  "orgs": [{ "id": "1", "name": "...", "slug": "...", "status": "active", "role": "owner", "joinedAt": "..." }]
}
```

#### `POST /api/auth/signup`

Body `{ name, email, password }` (password 8–72 chars). Creates an **unverified**
account and emails a signup code. → `201 { email, codeExpiresAt }`.
Retrying with the same **unverified** email overwrites name/password and resends the
code; a **verified** email → `409`.

#### `POST /api/auth/verify-email`

Body `{ email, code, rememberMe? }`. Consumes the signup code, marks the email
verified, and **logs the user in** → `200` auth session response.
note: for testing and dev the code will always be 000000

#### `POST /api/auth/resend-verification`

Body `{ email }`. Resends the signup code. Always `204` (silent no-op for unknown or
already-verified emails) — never an account oracle. Rate limits still apply (`429`).

#### `POST /api/auth/login`

Body `{ email, password, rememberMe? }` → `200` auth session response.
Failures: unknown email / wrong password → `401` `"Invalid email or password"` (same
message, no enumeration). Correct password but unverified email → `403` with
`details.reason = "email_not_verified"` (route the user to the verify screen and offer
resend). Disabled account → `403` `"This account is disabled"`.

#### `POST /api/auth/logout` _(auth)_

Revokes the current session → `204`.

#### `POST /api/auth/logout-all` _(auth)_

Revokes **every** session of the user, including this one → `200 { revoked }`.

#### `POST /api/auth/forgot-password`

Body `{ email }`. Emails a password-reset code (deep link above). Always `204` —
silent no-op for unknown emails. Calling again **is** the resend (rate-limited).

#### `POST /api/auth/reset-password`

Body `{ email, code, newPassword }`. Sets the password, revokes **all** sessions, and
(as a side effect of proving inbox ownership) marks the email verified → `204`.
Log in afterwards.

#### `POST /api/auth/accept-invite`

Body `{ email, code, password, name?, rememberMe? }`. For **new users** invited to an
org (deep link above): sets their password + optional name, verifies the email, and
logs them in → `200` auth session response. Existing users never receive a code —
their membership is added immediately on invite.

### Me _(all require auth)_

#### `GET /api/me`

→ `200` user (`{ id, name, email, role, status, emailVerifiedAt, createdAt }`).

#### `PATCH /api/me`

Body `{ name? }` (at least one field) → `200` updated user.

#### `POST /api/me/change-password`

Body `{ currentPassword, newPassword }`. Wrong current password → `400`. Revokes every
**other** session (the current one stays valid) → `204`.

#### `GET /api/me/orgs`

→ `200 { items: [org summary], total }` — orgs the user actively belongs to, with
their role and join date.

### Orgs _(all require auth)_

Org-scoped routes (`/orgs/:orgId/...`) resolve membership once per request: non-members
get `404` (existence never leaks), members of a suspended/closed org get `403`.
Platform admins bypass membership with a synthetic owner role.

#### `POST /api/orgs`

Body `{ name, slug? }` (slug: lowercase/digits/dashes, derived from name when omitted;
duplicate explicit slug → `409`). Creator becomes the first **owner** →
`201 { org, membership }`.

Creating an org also **funds its AlphaProStudio wallet with 5000 cents** (the org is
the service tenant, so this is the moment the tenant starts existing — signup alone has
no tenant to fund). Funding is server-side and idempotent (`org-<id>-initial`
reference — it can never double-apply); there is **no client-facing funding endpoint**.
If the wallet service is down the org is still created and the failure is logged —
check the balance via the wallet proxy below.

#### `GET /api/orgs/:orgId`

→ `200 { org, membership }` — the workspace root.

#### `PATCH /api/orgs/:orgId` _(owner)_

Body `{ name?, slug? }` (at least one; duplicate slug → `409`) → `200` updated org.

#### `DELETE /api/orgs/:orgId` _(owner)_

**Soft-close**: status becomes `closed`, data is retained, and every member — owners
included — is locked out (`403` on org routes). Reopening requires a platform admin.
→ `204`.

#### `PUT /api/orgs/:orgId/country` _(admin or owner)_

Body `{ country }` — ISO 3166-1 alpha-2, case-insensitive on input, must be an
**active** country (same rules as event sources; unknown/inactive → `400` on `country`).
The org object carries the current value as `country` (`null` until first set).

→ `200 { org, holidaysCount, reloaded }`.

Setting a **new** country loads the org's holiday calendar from the external
`holidays.lookup` capability and **replaces** the previous one — expect the call to take
~10 s. An empty result simply means the country has no holidays left this year
(`holidaysCount: 0`). Re-sending the **current** country is a cheap success:
`reloaded: false`, nothing fetched, calendar untouched. If the holiday service fails →
`502 bad_gateway` and **nothing** changes (country and calendar keep their previous
values).

#### `GET /api/orgs/:orgId/holidays`

→ `200 { items, total }` in **calendar order** (`date` ascending), offset-paginated
(default 20, max 100). Any member may read. Empty until the org sets a country.

```json
{
  "id": "3",
  "orgId": "1",
  "date": "2026-12-25",
  "event": "Christmas Day",
  "rules": [{ "kind": "do", "text": "Keep the tone warm and inclusive." }],
  "createdAt": "2026-08-16T10:00:00.000Z"
}
```

- `rules` are the capability's do/don't guidance stored **raw** with the holiday
  (`kind` is `do` or `dont` today — treat unknown kinds as generic rather than failing).
- Read-only: the calendar is written exclusively by `PUT .../country`; there are no
  create/update/delete endpoints, and rows are replaced wholesale on a country change.

#### `POST /api/orgs/:orgId/leave`

Any member may leave (their membership is deactivated) → `204`. The **last owner**
cannot leave (`409`) — transfer ownership (role change) or close the org first.

#### `GET /api/orgs/:orgId/members`

→ `200 { items: [{ id, userId, name, email, role, isActive, joinedAt }], total }`.
**Accepted members only** — pending invites live under `/invites`. Deactivated
(removed/left) members are hidden unless `?includeInactive=true`. `id` is the
membership id used by the member/invite management endpoints.

#### `POST /api/orgs/:orgId/members/invite` _(admin or owner)_

Body `{ email, role? }` with `role ∈ admin | member` (default `member`; owners are not
invitable — ownership is granted via role change). → `201 { userId, email, role, invitedNewUser }`.

- **Existing user** → membership added (or an inactive one reactivated) immediately;
  informational email; `invitedNewUser: false`. Already an active member → `409`.
- **New user** → account created (unusable password) + membership; the invite email
  carries a set-password code redeemed via `POST /api/auth/accept-invite`;
  `invitedNewUser: true`. Until accepted it appears under `/invites`, not `/members`.

#### `PATCH /api/orgs/:orgId/members/:memberId` _(owner)_

Body `{ role }` with `role ∈ owner | admin | member` → `200` member item. Granting
`owner` is how co-owners / ownership transfer work. Demoting the **last owner** →
`409`. Works on pending invites too (adjusts the role they will get).

#### `DELETE /api/orgs/:orgId/members/:memberId` _(admin or owner)_

Soft-remove (membership deactivated; re-inviting reactivates) → `204`.
Admins may remove members only; owners may remove anyone; equal/higher role → `403`;
the last owner → `409`; yourself → `400` (use `/leave`).

#### `GET /api/orgs/:orgId/invites` _(admin or owner)_

→ `200 { items: [{ id, userId, email, name, role, invitedAt }], total }` — invites the
recipient has not accepted yet (`id` is the membership id).

#### `POST /api/orgs/:orgId/invites/:memberId/resend` _(admin or owner)_

Mints a fresh code (invalidating the previous one) and re-sends the invite email →
`200 { email, codeExpiresAt }`. Code rate limits apply (`429` + `Retry-After`).
Already accepted → `409`.

#### `DELETE /api/orgs/:orgId/invites/:memberId` _(admin or owner)_

Cancels a pending invite → `204`. The membership is deleted; if the invitee has no
other org, their placeholder account and codes are deleted too, so the email can sign
up or be re-invited completely fresh. Already accepted → `409` (remove the member
instead).

### AlphaStudio proxies _(auth + org membership)_

Everything under `/api/orgs/:orgId/alphastudio/*` is a **pure proxy** to the external
AlphaProStudio service API: the backend signs the request with the org as tenant,
forwards it, and returns the **upstream's response shape** unchanged. That is the
contract of the namespace — expect upstream latencies, upstream fields (new ones may
appear without notice here), and `502 bad_gateway` when the upstream fails. Endpoints
that store or transform data of our own (e.g. holidays) live outside this namespace.

#### `GET /api/orgs/:orgId/alphastudio/wallet`

→ `200` the org's wallet, any member may read:

```json
{ "cents": 5000, "heldCents": 0, "availableCents": 5000 }
```

- `cents` — funded and not yet settled away, **including** anything currently held.
- `heldCents` — reserved by generation jobs in flight; released or settled when they finish.
- `availableCents` — `cents - heldCents`, and **the number the next request is actually
  checked against**. Watch this one, not `cents`.
- A tenant that was never funded reads as an all-zero wallet, not a `404`.
- Funding happens automatically on org creation (see `POST /api/orgs`); there is no
  endpoint to add funds.

#### `GET /api/orgs/:orgId/alphastudio/usage`

→ `200` the metering read-back for a window, any member may read. Query params:

| Param      | Required       | Rules                                                     |
| ---------- | -------------- | --------------------------------------------------------- |
| `from`     | yes            | inclusive UTC day, `YYYY-MM-DD`                           |
| `to`       | yes            | inclusive UTC day, `YYYY-MM-DD`                           |
| `group_by` | no (`model`)   | `model` \| `tenant` \| `capability`                       |

```json
{
  "from": "2026-07-18", "to": "2026-08-16",
  "groupBy": "model",
  "groups": [{ "key": "balanced", "unit": "input_tokens", "qty": 1200, "costUsdEstimate": "0.003600000000" }],
  "days":   [{ "day": "2026-08-16", "unit": "input_tokens", "qty": 1200, "costUsdEstimate": "0.003600000000" }]
}
```

- `groups` totals the window at the requested grain; `days` is the same window at day
  grain, for charts and reconciliation. `key` is `null` for unattributed usage.
- `costUsdEstimate` is a **decimal string** — do not parse it into a float.
- **Scope caveat**: `model` and `capability` report the org's own usage; **`group_by=
  tenant` reports across every org of this app** (the upstream's cross-tenant billing
  view — group keys are org ids). Point end-user charts at `model`/`capability`.
- A malformed date or `group_by` → `400 validation_failed` (never reaches the
  upstream); a window the upstream rejects (backwards, over 400 days) → `400
  bad_request`; upstream down → `502`.

#### `GET /api/orgs/:orgId/alphastudio/catalog/capabilities/:capability`

→ `200` capability discovery, any member may read: which model **aliases** the
capability may run on, and whether the plan choice is the caller's at all. Optional
`?plan=<grade>` narrows to the row that one grade would actually render on.

```json
{
  "capability": "media.generate",
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [{ "alias": "image-core", "kind": "image", "plan": "balanced" }]
}
```

- `selectable: false` = the capability **pins** its model — a `plan` sent to its run is
  ignored, not refused. `field` names the request field to put the plan in (`null` when
  pinned). Model rows may carry more fields than shown; everything speaks the app's own
  aliases — no vendor model or provider ever appears.
- `capability` is a dotted id like `media.generate` (lowercase letters/digits with
  `. - _` separators); `plan` is a grade name like `balanced`. Both are embedded in the
  signed upstream target, so anything outside that charset → `400 validation_failed`
  without reaching the upstream.
- An **unknown or not-granted** capability → `404 not_found` — the upstream answers
  both identically on purpose, which matches this API's existence-never-leaks rule.
- A plan the catalog does not have → `400 bad_request`; upstream down → `502`.

#### Posts (`/api/orgs/:orgId/alphastudio/posts/...`)

The content-generation runs behind the posts surface, proxied to the upstream run API —
any member. Run bodies are **frontend-owned** and forward verbatim (any JSON object
passes locally; the capability's own input schema upstream is the authority). Run ids
(`run_…`) outside `[A-Za-z0-9_-]` → `400` without reaching the upstream. Error
mapping matches media: `invalid_input` → `400`; `capability_not_enabled` → `404`;
`model_not_enabled` → `400`; idempotency replay → `409`; wallet → `402`; the
upstream's 503s (`provider_unavailable`, `context_unavailable`) and outages → `502`.

##### `POST .../posts/tones-preview`

Proxy to `POST /v1/run/tones.preview` — **sync**: the finished run comes back inline
(expect a few seconds) with one sample line for the tone editor:

```json
{ "runId": "run_…", "capability": "tones.preview", "mode": "sync",
  "status": "completed",
  "outputs": [{ "index": 0, "content": { "sample": "…" }, "flags": [], "attributions": [] }],
  "modelVersions": [{ "step": "sample", "alias": "small" }] }
```

- `tone` travels inline and is required upstream (`{ name, description?, rules[],
  example?, language? }`). `brandVoice` is **optional**: send it and it is
  authoritative; omit it and the platform falls back to the org's pushed context
  bundle (never a merge).

##### `POST .../posts/generate`

Proxy to `POST /v1/run/social-posts.generate` — **batch**: → `202 { runId, status:
"queued" }`; pull the judged, grounded drafts via the run endpoint below (a run
reaches `completed` within a couple of seconds).

- 1–3 **inline** `tones` (full objects, unique ids — used for this run, never stored);
  each draft comes back stamped with its `toneId`.
- `plan` picks the whole recipe (`balanced` grounds on the org's context bundle,
  followed sources and knowledge base; `creative`/`precise` ground on a curated web
  search instead). `options.perTone` (1–2) multiplies drafts; tones × perTone > 6 or
  duplicate tone ids → `400`, refused rather than truncated.
- `attachedEvent.rules` (the `{kind, text}` shape `holidays.lookup` returns) **outrank**
  tone and brand rules — a holiday from the org's calendar drops straight in.

##### `GET .../posts/runs/:runId`

Proxy to `GET /v1/runs/:runId` → `200` the run: `queued → running → completed |
failed`, with `outputs` once terminal. Also the recovery path for a missed callback —
the run record is pullable regardless of delivery. Model steps name the app's own
aliases; no vendor ref ever appears. Unknown, or another org's → `404`.

#### Media (`/api/orgs/:orgId/alphastudio/media/...`)

Generation jobs and their assets, proxied to the upstream media API — any member may
read and write. Ids are upstream-issued (`mjob_…`, `masset_…`); anything outside
`[A-Za-z0-9_-]` → `400` without reaching the upstream. **The org's wallet pays**: job
intake holds the catalog estimate against `availableCents` and refuses with
`402 wallet_insufficient` when it does not fit — check the wallet proxy and top-up
expectations before large renders.

##### `POST .../media/jobs`

**One endpoint whose body shape the frontend decides**: the body's `capability` field
(default `media.generate`) selects the schema the upstream parses it with — the body
passes through verbatim (any JSON object is accepted locally). → **`202`**:

```json
{ "jobId": "…", "status": "queued", "capability": "media.generate" }
```

- For `media.generate`: ask for a `plan` (`balanced` | `creative` | `precise`);
  `balanced` settles in seconds, dearer rungs finish later — poll the job. `kind`
  picks image vs video; `guidance` items are quarantined end-user text (max 6).
- The retired `modelAlias` field is **refused by name** → `400` (send `plan`).
- A prompt the guardrail refuses → `400`; a not-enabled capability → `404`; a plan the
  app does not hold → `400`; the wallet cannot cover the estimate → `402`.

##### `GET .../media/jobs`

→ `200 { jobs: [...] }`, newest first. Assets are listed **without** presigned urls —
mint one via the download presign below for the ones you actually open.

##### `GET .../media/jobs/:jobId`

→ `200` the job — the polling endpoint. Assets on a **finished** job arrive with
presigned GET urls (1 h) already minted. No provider or vendor model ref ever appears.
Unknown, or another org's → `404`.

##### `POST .../media/assets/presign`

Body `{ mediaType }` (`image/png` | `image/jpeg` | `image/webp`) → `201 { assetId,
uploadUrl, mediaType }` — the org's **own** image, in (for reference-image
capabilities like `images.edit`). `PUT` the bytes to `uploadUrl` with exactly that
mediaType. Nothing is generated or metered. Other media types → `400`.

##### `POST .../media/assets/:assetId/presign`

No body → `200 { url, expiresAt }` — a presigned, expiring GET over an asset this org
owns; this is what goes into `params.referenceImages`. The read **is** the ownership
check: unknown and not-yours are the same `404`, on purpose.

##### `DELETE .../media/assets/:assetId`

→ `204`. Removes an asset this org owns — a render output or an upload — deleting the
object and its row together. Unknown or not-yours → `404`.

#### RAG knowledge (`/api/orgs/:orgId/alphastudio/rag/...`)

The org's knowledge collections and their sources, proxied to the upstream RAG API —
any member may read and write. Ids are upstream-issued opaque strings (`col_…`,
`src_…`); anything outside `[A-Za-z0-9_-]` → `400` without reaching the upstream.
Request bodies are validated for their **required** fields only — unknown fields pass
through to the upstream schema untouched. Shared error mapping: upstream
`invalid_input` (bad body, duplicate name, un-extractable media type) and
`model_not_enabled` → `400 bad_request`; a collection/source that doesn't exist **for
this org** → `404`; upstream down → `502`.

##### `POST .../rag/collections`

Body `{ name, scope?, embeddingModel?, chunkProfile? }` → `201` the collection:

```json
{ "collectionId": "col_…", "name": "handbook", "scope": "tenant",
  "embeddingModel": "embed-default", "chunkProfile": "default-text",
  "activeIndex": "…", "status": "active" }
```

- A collection **pins** its embedding model alias and chunk profile for its lifetime.
- `scope: "tenant"` (default reading: only this org sees it) or `"app"` (every org of
  this app). `name` is unique per scope → duplicate is `400`.
- `embeddingModel` is the app's own **alias** — vendor ids never cross the wire.

##### `GET .../rag/collections`

→ `200 { collections: [...] }` — the org's own plus every `scope: app` collection.
Another org's collections are absent here and `404` by id.

##### `POST .../rag/collections/:collectionId/sources`

Two body shapes on `kind` → **`202`** (not 200 — ingestion is asynchronous):

```json
{ "kind": "push", "title": "…", "mediaType": "text/markdown", "content": "…" }
{ "kind": "url",  "url": "https://…", "title": "…" }
```

- `push` sends text you already have; `url` has the platform fetch it (http/https
  only, ≤2 MB, SSRF-guarded upstream — other schemes are our `400` before signing).
- → `{ sourceId: "src_…", collectionId, kind, status: "Processing", chunkCount: 0,
  deduped: false }`. Poll the source (or the list) to watch it settle.

##### `POST .../rag/collections/:collectionId/sources/presign`

Body `{ filename, mediaType }` → `201 { sourceId, uploadUrl, expiresAt, mediaType }`.
Step 1 of a file upload: the source row exists as `Uploading` immediately. `PUT` the
bytes to `uploadUrl` with **exactly** the requested `mediaType` (it is part of the S3
signature); ingestion starts by itself when the object lands — there is **no**
"complete" call. Presigns live **15 minutes**. Media types the platform cannot extract
(e.g. `image/png`) → `400`.

##### `GET .../rag/collections/:collectionId/sources`

→ `200 { sources: [...] }` with each source's ingestion state:
`Uploading → Processing → Ready | Failed`. `chunkCount` is what the source contributed
once `Ready`; `deduped: true` means identical content already existed (nothing embedded
or billed); `failureReason` appears only on `Failed`, from a closed vocabulary.

##### `GET .../rag/sources/:sourceId`

→ `200` the source — the polling endpoint while ingestion settles.

##### `DELETE .../rag/sources/:sourceId`

→ `200 { sourceId, vectorsDeleted }`. Vectors are removed **inline, before the
response** — `vectorsDeleted` makes that checkable. Deleting an already-deleted source
→ `404`. Note the upstream shape passes through: a successful delete is `200` with a
body here, not this API's usual `204`.

### Brand _(auth + org membership)_

The workspace's brand kit: four org-scoped resources under `/api/orgs/:orgId/brand`.
All four expose the **same** CRUD surface, so one table covers
`<resource> ∈ voices | tones | sources | topics`:

| Method   | Path                                    | Result                 |
| -------- | --------------------------------------- | ---------------------- |
| `GET`    | `/api/orgs/:orgId/brand/<resource>`     | `200 { items, total }` |
| `POST`   | `/api/orgs/:orgId/brand/<resource>`     | `201` the created item |
| `GET`    | `/api/orgs/:orgId/brand/<resource>/:id` | `200` the item         |
| `PATCH`  | `/api/orgs/:orgId/brand/<resource>/:id` | `200` the updated item |
| `DELETE` | `/api/orgs/:orgId/brand/<resource>/:id` | `204`                  |

- **Any member** may read and write — there is no role tier here; tenant isolation is
  the only gate.
- Lists are newest first (`createdAt DESC`), offset-paginated (default 20, max 100).
- `PATCH` is partial and requires **at least one** field — `{}` → `400`.
- `DELETE` is a hard delete (no soft-delete flag); deleting twice → `404`.
- An id that belongs to **another org** is a `404`, never a `403` — the org scope is in
  the SQL `WHERE`, so existence never leaks.

Fields per resource — every item also carries `id`, `orgId`, `createdAt`, `updatedAt`:

| Resource  | Body fields                              | Required on create    | Validation                                                              |
| --------- | ---------------------------------------- | --------------------- | ----------------------------------------------------------------------- |
| `voices`  | `name`, `description`, `rules`           | `name`, `description` | `name` 1–120, `description` 1–2000, `rules` see below                   |
| `tones`   | `name`, `description`, `preset`, `rules` | `name`, `description` | `name` 1–120, `description` 1–2000, `preset` boolean (defaults `false`) |
| `sources` | `url`, `title`                           | `url`, `title`        | `url` must parse as a URL, ≤2048 chars; `title` 1–200                   |
| `topics`  | `description`                            | `description`         | 1–2000 chars                                                            |

`preset` marks a built-in/starter tone so the UI can group or lock it; it is a plain
settable field, not a protected one.

#### Context sync (voices, sources & topics)

Every **committed mutation** of a voice, source, or topic — create, update, delete, and
the voice single-rule endpoints — re-pushes the org's **AlphaProStudio context bundle**
server-side (`DELETE /v1/context` + `PUT /v1/context`, org as tenant), so the very next
generation run grounds on what was just saved:

- `brandVoice.rules` — every voice's rules, flattened, in creation order
- `followedSources` — the source `url`s
- `topics` — the topic `description`s

**Tones are not part of the bundle** and their mutations do not trigger a sync. The
bundle is rebuilt from the database (never echoed from the request), the push happens
after the write commits, and it is **best-effort**: a failed sync never turns a
successful save into an error (it is logged server-side, and the next mutation repairs
the drift). Expect these writes to take ~1–2 s longer than reads. There is no endpoint
to read or edit the bundle directly — it is derived state.

#### Rules (voices & tones)

Voices and tones each carry a list of do/don't **rules**:

```json
{ "id": "7", "kind": "do", "text": "Short sentences." }
```

- `kind` is `do` or `dont`; `text` is 1–500 chars; at most **50** rules per create/PATCH.
- Rules are **embedded in every voice/tone response** — list, get, create and update —
  in creation order (`id` ascending). No extra call is needed to fetch them.
- Create accepts an optional `rules` array (defaults `[]`):
  `{ "name": "...", "description": "...", "rules": [{ "kind": "dont", "text": "No emojis." }] }`.
- `PATCH .../:id` with `rules` **replaces the whole list** (`[]` clears it; rule ids are
  reissued). Omit it to leave the rules untouched.
- Rules cannot be edited in place — delete and re-add, or PATCH the whole list.
- Deleting a voice/tone deletes its rules with it.

Single-rule endpoints for incremental edits:

##### `POST /api/orgs/:orgId/brand/<voices|tones>/:id/rules`

Body `{ kind, text }` — appends one rule → `201 { id, kind, text }`.

##### `DELETE /api/orgs/:orgId/brand/<voices|tones>/:id/rules/:ruleId`

→ `204`. An unknown rule, a rule belonging to a different voice/tone, or a parent
belonging to another org → `404` (existence never leaks).

### Scheduling _(auth + org membership)_

Three org-scoped resources that together decide **when** content is generated and **what
dates matter**: a `schedule` is the recurring plan, an `event-source` is a feed of dated
events, and the `slots` it produces are those events awaiting a keep-or-skip decision.

**Any member** may read and write — no role tier; tenant isolation is the only gate. An
id belonging to another org is `404`, never `403`. `PATCH` is partial and requires at
least one field (`{}` → `400`). Lists are offset-paginated (default 20, max 100).

#### `GET /api/orgs/:orgId/schedules`

→ `200 { items, total }`, newest first.

#### `POST /api/orgs/:orgId/schedules`

→ `201` the created schedule.

```json
{
  "timezone": "Asia/Amman",
  "days": ["sun", "mon", "tue", "wed", "thu"],
  "generateAt": "07:00",
  "postsPerDay": 2,
  "modelAlias": "balanced",
  "toneIds": ["12"],
  "eventAware": true,
  "active": true
}
```

| Field         | Required | Rules                                                                     |
| ------------- | -------- | ------------------------------------------------------------------------- |
| `timezone`    | yes      | IANA zone name (anything `Intl` accepts), ≤64 chars                       |
| `days`        | yes      | 1–7 of `sun mon tue wed thu fri sat`, no duplicates                       |
| `generateAt`  | yes      | `HH:MM`, 24-hour, zero-padded — wall-clock time **in `timezone`**         |
| `postsPerDay` | no (1)   | integer 1–24                                                              |
| `modelAlias`  | no (`balanced`) | `fast` \| `balanced` \| `quality`                                   |
| `toneIds`     | no (`[]`)| ids of **this org's** tones, ≤50, no duplicates                           |
| `eventAware`  | no (true)| whether generation should take slots into account                         |
| `active`      | no (true)| paused schedules stay listed                                              |

- A tone id that doesn't exist **or belongs to another org** → `400` `validation_failed`
  with a `details` entry per offending id. Nothing is written.
- `toneIds` comes back sorted ascending — the order you send is not preserved.
- Deleting a tone removes it from every schedule that referenced it.

#### `GET` / `PATCH` / `DELETE /api/orgs/:orgId/schedules/:id`

→ `200` the schedule · `200` the updated schedule · `204`.
`PATCH toneIds` **replaces** the whole selection; `[]` clears it. Omit it to leave the
tones untouched. Delete is a hard delete.

#### `GET /api/orgs/:orgId/event-sources/countries`

→ `200 { items: [{ code, name }], total }` — the active countries, name-ordered, and the
only valid values for `country`. Global reference data: the same list for every org, and
**not paginated** (`limit`/`offset` are ignored). Registered above `/:id`, so `countries`
is never read as an event-source id.

#### `GET` / `POST` / `GET :id` / `PATCH :id` / `DELETE :id` `/api/orgs/:orgId/event-sources`

```json
{ "kind": "holidays", "country": "JO" }
```

| Field     | Required | Rules                                                            |
| --------- | -------- | ---------------------------------------------------------------- |
| `kind`    | yes      | `holidays` (the only kind today)                                 |
| `country` | yes      | ISO 3166-1 alpha-2, case-insensitive on input, stored uppercase  |

- An unknown or **deactivated** country → `400` `validation_failed` on `country`.
  Deactivating a country blocks new sources but leaves existing ones working.
- One source per `kind` + `country` per org — a duplicate is `409`.
- `DELETE` also deletes every slot that source produced.

#### `GET /api/orgs/:orgId/slots`

→ `200 { items, total }` in **calendar order** (`date` ascending), not newest-first.

```json
{
  "id": "7",
  "orgId": "1",
  "eventSourceId": "3",
  "date": "2026-07-24",
  "status": "review",
  "title": "Eid al-Adha",
  "kind": "holiday"
}
```

Query params (on top of `limit`/`offset`): `from` and `to` (`YYYY-MM-DD`, **inclusive**),
`status`, `eventSourceId`. `date` is a plain calendar date — no time, no zone, and it
round-trips byte-for-byte.

#### `PATCH /api/orgs/:orgId/slots/:id`

Body `{ skip }` → `200` the updated slot. This is the **entire** slot mutation surface:
slots are written by event ingestion, so there is no create and no delete (`POST`/`DELETE`
on these paths are `404`).

- `skip: true` → `status: "skipped"`
- `skip: false` → `status: "review"`
- `approved` is set by the generation pipeline and is never reachable from this endpoint.
- Re-ingesting a feed never resurrects a skipped slot or duplicates an existing one.

### Notifications _(auth + org membership)_

A per-user inbox scoped to one org: you only ever see **your own** notifications for the
org in the path, and there is no id in any path. Nothing here writes to an inbox —
notifications are raised server-side by the feature that causes them.

#### `GET /api/orgs/:orgId/notifications`

→ `200 { items, total }`, newest first. `limit` **defaults to 50** (max 100), `offset`
defaults to 0.

Item shape:

```json
{
  "id": "12",
  "orgId": "1",
  "userId": "3",
  "kind": "content.published",
  "title": "Your post is live",
  "message": "“Launch week” was published to LinkedIn.",
  "action": "/content/42",
  "relatedType": "content",
  "relatedId": "42",
  "seenAt": null,
  "createdAt": "2026-07-29T09:12:00.000Z",
  "updatedAt": "2026-07-29T09:12:00.000Z"
}
```

- `seenAt: null` means **unread**.
- `action` is an optional call to action (a frontend route or label); `null` when there
  is nothing to click.
- `relatedType` + `relatedId` point at the subject and are **both null or both set**.
  There is no foreign key on purpose — the subject may have been deleted since, so
  resolve the link defensively.
- `kind` is a free-form event type owned by the producing feature; treat unknown kinds
  as generic rather than failing.

#### `GET /api/orgs/:orgId/notifications/unread-count`

→ `200 { unread }` — the badge count for this user in this org.

#### `POST /api/orgs/:orgId/notifications/read-all`

Stamps every unread row as seen → `200 { updated }` (how many rows flipped).
Idempotent: a second call returns `{ "updated": 0 }`. Rows that were already read keep
their original `seenAt`. There is no per-notification read endpoint yet.
