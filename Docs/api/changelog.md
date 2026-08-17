# Changelog

Newest first. One entry per user-visible or structural change; update alongside the
change itself (see CLAUDE.md — Workflow rules).

## Posts run proxies

- Three new residents of the `/alphastudio/*` namespace under
  `/orgs/:orgId/alphastudio/posts/...` (any member) — the content-generation runs:
  `POST .../posts/tones-preview` → upstream `/v1/run/tones.preview` (**sync** — the
  finished run comes back inline with one sample line in `outputs[0].content.sample`
  for the tone editor; `brandVoice` optional with the pushed context bundle as
  fallback, `tone` inline and required upstream), `POST .../posts/generate` → upstream
  `/v1/run/social-posts.generate` (**batch** — `202 { runId, status: "queued" }`; 1–3
  inline tones with unique ids, `plan` picks the whole recipe, `attachedEvent.rules`
  outrank tone/brand rules, fan-out over 6 refused not truncated), and
  `GET .../posts/runs/:runId` → upstream `/v1/runs/:runId` (the poller and the
  missed-callback recovery path; `queued → running → completed | failed`).
- Run bodies are frontend-owned like media jobs: any JSON object passes locally and
  forwards verbatim — the capability's own input schema upstream is the authority.
  Error mapping (`throwRunError`) follows the media ladder, with the upstream's 503s
  (`provider_unavailable`, `context_unavailable`) folding into `502` — from the
  caller's seat both mean "try again".
- E2E-tested against the real service: a sync `tones.preview` completed inline with a
  non-empty sample, a real `social-posts.generate` fan-out queued then polled to
  `completed` with pullable drafts, plus local validation (array body, run-id charset),
  the missing-`tone` upstream reject as `400 bad_request`, unknown run → 404, and auth.
- openapi.json regenerated (62 paths); api.md documents the sub-surface.

## Media proxies

- Six new residents of the `/alphastudio/*` namespace under
  `/orgs/:orgId/alphastudio/media/...` (any member), mirroring the upstream media API:
  create a job (**one endpoint whose body shape the FRONTEND decides** — the body's
  `capability` field selects the upstream schema; any JSON object passes locally and
  forwards verbatim → **202 `{ jobId, status: "queued" }`**), list jobs (newest first,
  assets without presigned urls), read/poll a job (finished jobs carry 1-hour presigned
  asset urls, no vendor refs ever), presign an asset **upload** (**201**
  `{ assetId, uploadUrl, mediaType }`, png/jpeg/webp only — the door for reference
  images), presign an asset **download** (no body → **200 `{ url, expiresAt }`**; the
  read IS the ownership check, unknown and not-yours are the same 404), and delete an
  asset (**204**, object and row together).
- **New error code `wallet_insufficient` (402)**: media job intake holds the catalog
  estimate against the org wallet's `availableCents` and refuses when it does not fit —
  an actionable state the frontend must distinguish (show top-up UI), so it gets its
  own code instead of hiding inside 400/502. Other mappings follow the proxy rules:
  upstream `invalid_input` (including the retired `modelAlias` field, refused by name)
  → `400 bad_request`; `capability_not_enabled` → `404`; `model_not_enabled` → `400`;
  `idempotency_replay` → `409`; upstream `429` → our `rate_limited`; outages → `502`.
- E2E-tested against the real service: one real `media.generate` balanced render queued
  (202 → listed → polled), the full asset flow with actual bytes (upload presign → PUT
  a 1×1 PNG to S3 → download presign over the real object → delete 204 → re-delete
  404), plus local validation (array body, malformed media type, id charset) and the
  upstream mirrors (`modelAlias` → 400, `application/pdf` presign → 400, unknown
  job/asset → 404) and auth guards.
- openapi.json regenerated (59 paths); api.md documents the sub-surface and the new
  error code.

## RAG knowledge proxies

- Seven new residents of the `/alphastudio/*` namespace under
  `/orgs/:orgId/alphastudio/rag/...` (any member), mirroring the upstream RAG API paths
  verbatim: create/list collections, add a source (**two body shapes on `kind`** —
  `push` inline text or `url` fetched by the platform → **202**, ingestion is
  asynchronous), presign a file upload (**201**; the source row exists as `Uploading`
  immediately, PUT the bytes with exactly the requested mediaType, no "complete" call,
  15-minute expiry), list a collection's sources with their
  `Uploading → Processing → Ready | Failed` state, read one source (the polling
  endpoint), and delete a source (**200 `{ sourceId, vectorsDeleted }`** — vectors are
  removed inline before the response; the upstream shape passes through instead of our
  usual 204).
- Proxy bodies are validated **loose**: required fields and dangerous shapes (non-http
  url schemes, malformed media types, id charset for the signed target) are our own
  `400 validation_failed` before any external call; unknown fields pass through
  untouched, because the upstream schema is the authority and stripping them would
  silently mutate the payload. Upstream mappings share one rule
  (`throwRagError`): `invalid_input` (duplicate name, un-extractable media type) and
  `model_not_enabled` → `400 bad_request`; not-yours/nonexistent → `404`;
  idempotency-replayed mutation → `409`; outages → `502`.
- E2E-tested against the real service: the full lifecycle (create collection with
  `embed-default`, list, push + url + presign sources, list with the never-uploaded
  presign visible as `Uploading`, get by id, delete with a numeric `vectorsDeleted`,
  re-read and re-delete both 404) plus local validation, duplicate-name and
  `image/png` upstream rejections as `bad_request`, unknown collection 404, and the
  auth/membership guards.
- openapi.json regenerated (54 paths); api.md documents the whole sub-surface.

## Catalog proxy

- `GET /orgs/:orgId/alphastudio/catalog/capabilities/:capability[?plan=]` (any member) —
  third resident of the `/alphastudio/*` proxy namespace, forwarding the upstream
  capability-discovery read verbatim: `{ capability, selectable, field, plan, models }`,
  where `models` lists the app's own model **aliases** (never a vendor ref) and
  `selectable: false` means the capability pins its model and ignores a `plan`. The
  plain read answers every reachable model; `?plan=` narrows to one grade's row.
- Both `capability` and `plan` are embedded in the signed upstream target, so they get a
  strict charset (`media.generate`-style dotted id / dash-word grade) — anything else is
  our own `400 validation_failed` before any external call.
- Upstream mappings continue the proxy's honest-error rule: `403 capability_not_enabled`
  (the upstream deliberately answers unknown and not-granted identically) → our
  `404 not_found`, matching the existence-never-leaks convention; `400 invalid_input`
  (a plan grade the catalog lacks) → `400 bad_request`; `403 app_suspended` and other
  failures → `502`.
- E2E-tested against the real service: `media.generate` plain and with
  `?plan=balanced` round-trip with aliases in the answer, unknown capability → 404,
  bogus plan → 400 `bad_request`, charset rejects (space in plan, uppercase capability),
  and auth is required.
- openapi.json regenerated (50 paths); api.md documents the endpoint and mappings.

## Usage proxy

- `GET /orgs/:orgId/alphastudio/usage?from&to&group_by` (any member) — second resident
  of the `/alphastudio/*` proxy namespace, forwarding the upstream `GET /v1/usage`
  metering read-back verbatim: `{ from, to, groupBy, groups, days }` where `groups`
  totals the window at the requested grain and `days` is the day-grain series
  (`costUsdEstimate` is a decimal string on purpose). `from`/`to` are inclusive UTC
  days; `group_by` ∈ `model | tenant | capability`, defaulting to `model` like the
  upstream. **Scope caveat** (upstream semantics, documented in api.md):
  `model`/`capability` answer for the org alone, `tenant` answers across every org of
  the app — its group keys are org ids, so end-user charts should stick to the first two.
- The query string is **inside the signed target** (the upstream's F11 — a parameter the
  server acts on is signed like a trusted header); `shared/svc/client.ts` now documents
  that `path` is signed verbatim including any query string, built in exact param order.
- Error mapping keeps proxy failures honest: misshapen params are our own
  `400 validation_failed` before any external call; a window the upstream rejects
  (backwards, >400 days) mirrors as `400 bad_request` instead of masquerading as an
  outage; only a genuinely unreachable/failed upstream is a `502`.
- E2E-tested against the real service: all three `group_by` values round-trip with the
  window echoed back, the default is `model`, local validation rejects missing/bad
  params, a backwards window comes back as `bad_request`, and auth is required.
- openapi.json regenerated (49 paths); api.md documents the endpoint and the scope caveat.

## Brand context sync

- Every committed mutation of a **voice, source, or topic** — create, update, delete,
  and the voice single-rule add/remove — now re-pushes the org's AlphaProStudio context
  bundle (`DELETE /v1/context` then `PUT /v1/context`, org as tenant), so the next
  generation run grounds on what was just saved. The bundle maps `brandVoice.rules` =
  all voice rules flattened in creation order, `followedSources` = source urls,
  `topics` = topic descriptions. **Tones are not in the bundle** and do not trigger it.
- The bundle is rebuilt from the database each time (`listAllForOrg` on the three
  repos), never echoed from the request — racing syncs converge on the same final
  state. A `404` on the DELETE (fresh tenant, nothing pushed yet) is treated as normal.
- The push runs AFTER the transaction commits and is **best-effort**
  (`features/brand/context-sync.ts`): a failed sync never turns a committed save into
  an error response — `context.sync_failed` is logged and the next mutation repairs the
  drift. Wired through the shared brand factory (`syncContext` config flag), so a new
  bundle-feeding resource is one flag away.
- `shared/svc/client.ts` now supports `PUT`/`DELETE` (idempotency key included on every
  non-GET, per §6.1) and tolerates empty response bodies.
- E2E-tested against the **real service** (`tests/context.test.ts`): mutations go
  through our API, the pushed bundle is read back via the signed `GET /v1/context` —
  covering create/patch/delete of all three resources, single-rule append, tone
  mutations leaving the bundle untouched, and voice deletion emptying its rules. The
  brand suite re-run green (writes are ~1–2 s slower now; documented).
- openapi.json regenerated (48 paths — no new routes; mutation descriptions note the
  side effect); api.md documents the sync contract.

## AlphaStudio wallet proxy & starter funding

- **New `/alphastudio/*` namespace** (frontend contract): everything under
  `/orgs/:orgId/alphastudio/*` is a pure signed proxy to the external AlphaProStudio
  service API — upstream response shapes passed through unchanged, upstream latencies,
  `502 bad_gateway` on upstream failure. Endpoints that store data of our own stay
  outside it. First resident: `GET /orgs/:orgId/alphastudio/wallet` (any member) →
  the upstream `GET /v1/wallet` snapshot `{ cents, heldCents, availableCents }`;
  `availableCents` is what the next generation request is checked against, and a
  never-funded tenant reads as zeros, not 404.
- **Starter funding**: creating an org now funds its wallet with **5000 cents** via the
  upstream `POST /v1/wallet/add` — server-side only, no client-facing funding endpoint.
  The org is the service tenant, so org creation (not account signup, which has no
  tenant yet) is the funding moment. The funding reference `org-<id>-initial` is
  idempotent forever (`applied: false` on a replay), so a retry can never double-fund.
  The call runs AFTER the creation transaction commits and is strictly best-effort: if
  the wallet service is down the org is still created and `wallet.initial_funding_failed`
  is logged. Audit: `org.wallet_funded` with `metadata { cents, applied }` — a fresh
  org's trail is now `org.created` + `org.wallet_funded`.
- `shared/svc/client.ts` now exports `isSvcUnavailable` (the upstream-failure test the
  holiday client used privately) so every svc consumer maps outages to `502` the same way.
- E2E-tested against the real service: a fresh org reads back exactly
  `5000 / 0 / 5000` through the proxy with the audit entry (`applied: true`), plus the
  auth/membership guards (401 / outsider 404 / member may read). Orgs suite re-run green
  (its audit-trail assertion now includes `org.wallet_funded`).
- openapi.json regenerated (48 paths); api.md documents the namespace contract, the
  wallet endpoint, and the funding-on-creation behaviour.

## Org country & holiday calendar

- **Org country**: `orgs.country` (ISO alpha-2, FK → countries, `null` by default) now
  rides on every org response. New endpoint `PUT /orgs/:orgId/country` (admin or owner):
  same country → cheap success (`reloaded: false`, nothing fetched); a NEW country calls
  the external `holidays.lookup` capability (~10 s), then replaces the org's holiday
  calendar and sets the country in one transaction → `200 { org, holidaysCount,
  reloaded }`. An unknown/inactive country is a `400` before any external call; a failed
  lookup is a `502` with **nothing** changed. Audit: `org.country_updated` with
  `metadata { from, to, holidaysLoaded }`.
- **Holidays** (`GET /orgs/:orgId/holidays`): the org's calendar in date order, any
  member may read. One row per holiday — `date`, `event`, and the capability's do/don't
  `rules` stored raw as jsonb on the same row. Read-only surface: rows are written
  exclusively by the country flow and replaced wholesale, never edited. Migration
  `0005_org_country_holidays` (no `updated_at` on `holidays` for that reason; org delete
  cascades).
- **Signed service client** (`shared/svc/client.ts`): generic HMAC-SHA256 request
  signing for the AlphaProStudio service API per the developer's Postman collection
  (§6.1 canonical string over method/path/timestamp/app/tenant/request-id/
  idempotency-key/body-hash; seven `x-aps-*` headers; fresh nonce per attempt). A new
  capability is one `svcRequest` call — `features/holidays/holiday.client.ts` is the
  first consumer. Config via `SVC_BASE_URL/SVC_APP/SVC_KEY_ID/SVC_KEY_SECRET`
  (+ optional `SVC_EDGE_SECRET`), added to both env schemas, `.env.example`, and the
  Lambda environment; the signed tenant is the org id. Signatures/headers are never
  logged — only path, status and duration.
- **New error code `bad_gateway` (502)**: an upstream dependency failed; the request
  changed nothing and can be retried. Unlike `internal`, its message is deliberate and
  safe, so the error handler now masks only `internal` messages.
- E2E-tested against the dev database **and the real capability** (guards, validation,
  and empty-calendar tests are local; the flow test drives two real lookups): load →
  verify shape/order/audit → lowercase same-country no-op keeps row ids → country
  change replaces all rows. Admin gate (member → 403), outsider → 404, inactive
  country → 400 all covered; the orgs suite re-run green against the new org shape.
- openapi.json regenerated (47 paths); api.md documents the new surface and error code.

## Voice & tone rules, voice names

- **Voices** now have a `name` (1–120 chars, required on create) next to the
  description, matching tones; existing rows were backfilled from the first 120 chars of
  their description. **Breaking:** `POST /brand/voices` without `name` is now a `400`,
  and the voice audit label is the name, not the description.
- **Rules**: voices and tones both carry a list of do/don't rules
  (`{ id, kind: do|dont, text }`, text 1–500, ≤50 per write). Rules are embedded in
  every read — list, get, create, update — in creation order, so the frontend never
  needs a second call. Create accepts a `rules` array; `PATCH rules` replaces the whole
  list (`[]` clears it, ids are reissued); omitting it leaves the rules alone. New
  endpoints for incremental edits: `POST .../brand/<voices|tones>/:id/rules` (append
  one → `201` the rule) and `DELETE .../:id/rules/:ruleId` (→ `204`; unknown rule,
  wrong parent or wrong org → `404`).
- Migration `0004_brand_rules`: `tone_rules` + `voice_rules` — one table per parent
  rather than one polymorphic table, because only real FKs cascade when a tone/voice is
  deleted. No `org_id` (a rule is only reachable through its org-scoped parent, and that
  lookup is the tenant check) and no `updated_at` (rules are added/removed, never
  edited). The embed is a correlated `json_agg` subquery, same pattern as
  `schedules.toneIds` — a list of N parents stays one round trip.
- **Audit**: 4 new actions (`brand.voice.rule_added|rule_removed`,
  `brand.tone.rule_added|rule_removed`) written in the same transaction as the change,
  targeting the parent, with `metadata: { ruleId, kind }` — never the rule text.
  Create/update with rules stays a single `created`/`updated` entry (`rules` shows up in
  `metadata.changed`).
- E2E-tested against the dev database (12 new tests across both resources): embed
  round-trips through create/get/list, PATCH replace/clear/omit semantics, single
  add/delete, validation rejections (bad kind, empty/oversized text, >50 rules),
  cross-tenant and cross-parent 404s that leak nothing, and audit entries.
- openapi.json regenerated (45 paths); api.md documents the new surface.

## Webhook callback endpoint

- `POST /api/webhooks/callback` — unauthenticated stub that accepts any JSON payload,
  logs it (`webhook.callback.received`), and returns `200 { "received": true }`. A
  deliberate exception to the no-request-bodies logging rule until real handling exists.

## E2E test suite for the whole API

- `npm test` / `npm run test:e2e` — 138 tests across `tests/{auth,me,orgs,brand,notifications,scheduling}.test.ts`
  covering every endpoint in the spec. Node's built-in test runner via tsx, so **no test
  framework was added**; nothing is mocked — requests go through `app.request()` against
  the real `DATABASE_URL`, so all middleware, guards, validators and the error handler run.
- The suite forces `MAIL_TRANSPORT=log`, which pins verification codes to `000000` and lets
  signup → verify, password reset and invite → accept be driven end to end as a real client
  would. Fixtures use the real endpoints (`signupUser`, `orgOwner`); the only direct
  DB/service writes are for things no endpoint can do — promoting a platform admin, and
  seeding slots via the ingestion repository.
- Coverage highlights: anti-enumeration (identical message for unknown email vs wrong
  password), code rate limits and the 5-attempt lockout, session revocation semantics
  (logout vs logout-all vs change-password vs reset), the full invite lifecycle including
  cancel-frees-the-email, the member/admin/owner permission matrix, last-owner guards,
  closed-org lockout, platform-admin bypass with its synthetic membership, per-resource
  brand CRUD + validation + pagination, per-user notification isolation across orgs, and
  scheduling validation/filters/cascades. Tenant isolation is asserted per resource: every
  cross-org read, write and delete is a 404 that leaves no audit row.
- **Fixed:** `POST /orgs/:orgId/schedules` echoed `toneIds` back in the order the client
  sent them, while `GET`/`PATCH` return them DB-ordered — so a create response and a later
  fetch of the same schedule disagreed, contradicting the documented "order is not
  preserved". Create now re-reads inside its transaction like update does.
- Env for tests comes from node's `--env-file`, not a `dotenv/config` import: imports hoist,
  so any reordering in a test file would otherwise leave `shared/env.ts` parsing an empty
  `process.env`. Real shell vars still win, which is what lets the script pin the transport.
- Runner is pinned to `--test-concurrency=1` (the Neon pool is `max: 1` per process) and
  every fixture is named so cleanup is a pattern delete — users on the reserved
  `@example.test` domain, orgs named `E2E %` — which also sweeps up a crashed run.
- Full run takes ~20 min, dominated by bcrypt and Neon round trips.

## Fixed dev verification code, gated

- `newVerifyCode()` returns `000000` **only** under `MAIL_TRANSPORT=log`, where no email is
  delivered and there is nothing to scrape; every other transport gets a crypto-random
  code as before. Replaces an ungated hardcode that would have made every signup, password
  reset and invite code guessable wherever it shipped.
- CDK synth now **refuses** `MAIL_TRANSPORT=log` (`ALLOW_LOG_MAIL=true` overrides, for
  throwaway sandboxes). Synth reads the same `.env` as the dev server — where `log` is the
  norm — so without this the guard above would have been one forgotten edit from a public
  Function URL handing out `000000`.

## Scheduling: schedules, event sources & slots

- **Schedules** (`/orgs/:orgId/schedules`): full CRUD. A schedule is `timezone` + `days` +
  `generateAt` (wall-clock `HH:MM` in that zone) + `postsPerDay` + `modelAlias`
  (`fast|balanced|quality`) + `toneIds` + `eventAware` + `active`. `toneIds` are checked
  against the org's own tones inside the write transaction — an unknown or cross-org id is
  a `400` naming it, and nothing is written. `PATCH toneIds` replaces the whole selection
  (`[]` clears it); omitting it leaves the tones alone.
- **Event sources** (`/orgs/:orgId/event-sources`): full CRUD over `{ kind, country }`.
  `country` is ISO 3166-1 alpha-2 (case-insensitive on input), must be an **active**
  country, and is unique per `kind` per org (duplicate → `409`). Deleting a source deletes
  the slots it produced. `GET /event-sources/countries` returns the active countries
  (`{ code, name }`, name-ordered, unpaginated) for the picker.
- **Slots** (`/orgs/:orgId/slots`): `GET` in calendar order with `from`/`to` (inclusive),
  `status` and `eventSourceId` filters, plus `PATCH /:id { skip }` — the only mutation.
  `skip: true` → `skipped`, `skip: false` → `review`; `approved` belongs to the generation
  pipeline. No create/delete endpoints: slots come from ingestion
  (`slotRepository.insertNewForSource`, no HTTP surface yet), which is idempotent per
  `(event_source_id, date, title)` and never overwrites a member's decision.
- Migration `0003_scheduling`: `countries` (ISO code as PK, `active` flag, seeded with all
  249 officially assigned alpha-2 codes), `schedules`, `schedule_tones`, `event_sources`,
  `slots`. Enums are `text` + CHECK mirrored by TS unions as usual. Tones are a **link
  table**, not a `bigint[]` — Postgres cannot foreign-key array elements, so an array
  would keep dangling ids after a tone is deleted; the FK cascade now unlinks it instead.
- `date` columns are calendar dates end to end: a DATE type parser in `shared/db/client.ts`
  plus `--date-parser string` in `npm run codegen` keep them as `'YYYY-MM-DD'` strings
  rather than `Date`s that would serialize as the previous day west of UTC.
- **Audit**: 8 new actions (`schedule.created|updated|deleted`,
  `event_source.created|updated|deleted`, `slot.skipped|unskipped`) written inside the same
  transaction as the change. Labels are the readable handle — `"Asia/Amman 07:00"`,
  `"holidays JO"`, `"2026-07-24 Eid al-Adha"`; updates add `metadata.changed` (field names,
  never values). Rejected writes leave no trail.
- Cross-feature tone lookups go through `brandService.findToneIdsForOrg`, not the tone
  repository — services are the only place cross-feature calls are allowed.
- E2E-tested against the dev database (117 checks): CRUD round-trips, every validation
  rejection (bad timezone, `7:00`, hour 25, empty/duplicate days, `postsPerDay` bounds,
  unknown alias, duplicate/foreign/unknown tone ids, 1-letter and inactive countries),
  country normalization and deactivation, duplicate-source `409`, patch semantics
  (partial, tone-only, clear, empty-body `400`, rollback on failure), tone-delete cascade,
  slot ordering/filters/idempotent re-ingestion, event-source→slot cascade, audit entries,
  and tenant isolation — cross-org reads, patches and deletes all `404` without leaking
  existence or writing an audit row.
- openapi.json regenerated (40 paths); api.md documents the new surface.
- Not included: the ingestion worker that fills slots, and generation itself — `active`,
  `eventAware`, `generateAt` and `approved` are stored but nothing consumes them yet.

## Brand & notification endpoints

- **Brand** (`/orgs/:orgId/brand/...`): full CRUD — list, get, create, update, delete —
  for `voices`, `tones`, `sources` and `topics`. Lists are newest-first and
  offset-paginated (default 20, max 100); `PATCH` is partial and rejects an empty body;
  `DELETE` is a hard delete. **Any member** may read and write (no role tier) — tighten a
  resource by adding `orgRoleAtLeast("admin")` to its routes.
- Zod validation per resource: `description` 1–2000, tone `name` 1–120 with a `preset`
  boolean defaulting to false, source `url` parsed as a URL (≤2048) plus `title` 1–200.
- **Notifications** (`/orgs/:orgId/notifications`): `GET` the caller's own inbox
  (paginated, **50 per page** by default), `GET /unread-count` → `{ unread }` for badges,
  and `POST /read-all` → `{ updated }` (idempotent; a second call reports 0).
  Notifications are raised server-side via `createNotification()` — no write endpoint, so
  nothing can post into another member's inbox.
- **Audit**: every brand create/update/delete writes an `audit_logs` entry
  (`brand.<entity>.created|updated|deleted`, 12 new action names) inside the same
  transaction as the change, so a mutation can never commit un-audited. Entries carry the
  actor, `target_type` + `target_id`, and a `target_label` snapshot capped at 120 chars
  (tone `name`, source `title`, voice/topic `description`); updates add
  `metadata.changed` — the list of field names, never their values. Reads are not
  audited, and a rejected write (validation error, wrong tenant) leaves no trail.
- The four brand resources share one CRUD service + handler factory
  (`features/brand/`) so their status codes, audit entries and 404-on-wrong-tenant
  behaviour cannot drift apart. Both routers mount **inside** the `/orgs/:orgId`
  workspace router, which keeps `userAuth()` + `orgContext()` running exactly once per
  request.
- E2E-tested against the dev database (126 checks): CRUD round-trips for all four
  resources, validation rejections, pagination and ordering, unread-count/read-all
  semantics, audit entries (action names, actor, labels, truncation, changed-field
  metadata), and tenant isolation — cross-org reads, fetches by id, and deletes all 404
  without leaking existence or writing an audit row, and one user's notifications are
  invisible to org-mates and to themselves in another org.
- openapi.json regenerated (33 paths); api.md documents both surfaces.
- Not included: per-notification "mark as read".

## Content & notification tables

- Migration `0002_content_and_notifications`: five new org-scoped tables (all with
  `org_id` FK → orgs ON DELETE CASCADE, timestamptz pair + `set_updated_at()` trigger,
  and an `org_id` index): `voices` (description), `tones` (name, preset flag,
  description), `sources` (url, title), `topics` (description), and `notifications`.
- `notifications` are per-user (`user_id` FK → users CASCADE) with kind/title/message,
  optional `action`, an optional polymorphic `related_type`/`related_id` pointer (no FK,
  null-or-set-together CHECK), and `seen_at` (NULL = unread). Extra indexes:
  `(user_id, created_at DESC)` for inbox listing and a partial unseen index for badge
  counts.
- DB types regenerated (`npm run codegen`). No API surface change yet.

## Org management endpoints

- **Org**: `PATCH /orgs/:orgId` (rename/re-slug, owner only), `DELETE /orgs/:orgId`
  (soft-close — data retained, all members locked out, platform admin can reopen),
  `POST /orgs/:orgId/leave` (any member; last owner blocked).
- **Members**: `PATCH /members/:memberId` role change (owner only; granting `owner` =
  co-owner/ownership transfer; last-owner demotion blocked), `DELETE /members/:memberId`
  (soft-remove; admins remove members, owners remove anyone; self must use leave).
  `GET /members` now lists accepted members only and hides deactivated ones unless
  `?includeInactive=true`.
- **Invites** (pending = invitee hasn't set a password yet): `GET /invites`,
  `POST /invites/:memberId/resend` (fresh code + email, rate-limited),
  `DELETE /invites/:memberId` (cancel; orphan placeholder accounts and their codes are
  deleted so the email can be reused fresh).
- All flows E2E-tested against the dev database, including the permission matrix
  (member/admin/owner), last-owner guards, resend rate limit, cancel-invite orphan
  cleanup, reactivating removed members, and closed-org lockout.
- openapi.json regenerated (22 paths); api.md documents the new surface.

## Auth, profile & org endpoints

- **Auth**: `POST /auth/signup` (unverified account + emailed 6-digit code),
  `verify-email` (consumes code, auto-login), `resend-verification`, `login`
  (returns `{ token, expiresAt, user, orgs }`; unverified email → 403 with
  `details.reason=email_not_verified`), `logout` (204), `logout-all` (`{ revoked }`),
  `forgot-password` (silent 204, resend by re-calling), `reset-password` (revokes all
  sessions, also verifies the email), `accept-invite` (new invitees set password + name,
  auto-login).
- **Me**: `GET/PATCH /me`, `POST /me/change-password` (requires current password,
  revokes other sessions), `GET /me/orgs`.
- **Orgs**: `POST /orgs` (creator becomes owner, slug derived from name),
  `GET /orgs/:orgId` (workspace root), `GET /orgs/:orgId/members`,
  `POST /orgs/:orgId/members/invite` (admin+; existing users added immediately, new
  users created with a set-password code).
- **Email deep links**: password-reset and invite emails link to
  `/reset-password?email=..&code=..` and `/accept-invite?email=..&code=..` on
  `DASHBOARD_URL` (fallback `STUDIO_URL`) so the frontend autofills both fields.
- All flows E2E-tested locally against the dev database (signup → verify → org →
  invite → accept → password change/reset → logout; tenant isolation and role gates).
- openapi.json regenerated (17 paths); api.md fully documents the new surface.

## Initial scaffold

- Project structure copied/adapted from zeena-backend-x (shared infrastructure, auth/org
  foundations) and took_backend (Kysely migration registry): Hono on Lambda Function URL,
  Kysely + Neon Postgres, zod v4 + hono-openapi, CDK infra.
- `src/shared/`: AppError hierarchy + single error handler, JSON request logger with
  `x-request-id`, AsyncLocalStorage request context, zod validate wrapper + shared
  schemas, runtime env schema, DB client (CamelCase, pool max:1) + transaction helpers +
  offset pagination, crypto (bcrypt passwords, peppered sha256 tokens, 6-digit codes),
  email port/adapter (Resend + log transport, verify-code & org-invite templates),
  S3 presigned uploads, auth middleware (userAuth / orgContext / orgRoleAtLeast /
  platformAdminOnly).
- Foundations (services + repos, routes not yet mounted): sessions with sliding+absolute
  expiry, email verify codes with rate limits, org membership guard with platform_admin
  bypass, audit log.
- Migration `0001_init`: `orgs`, `users`, `org_users`, `sessions`, `email_verify_codes`,
  `audit_logs` (+ `set_updated_at()` trigger). Runner: `npm run db:migrate`.
- API surface: `GET /api/health`, `GET /api/openapi`. Local dev server (`npm run dev`),
  OpenAPI dump (`npm run openapi` → docs/openapi.json).
- CDK: `ApiStack` (Lambda + Function URL + uploads bucket + CloudFront), `WorkersStack`
  stub. Docs: CLAUDE.md, docs/api.md, docs/changelog.md.
