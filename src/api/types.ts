/**
 * Wire types for the AlphaStudio API, transcribed from docs/api/api.md +
 * openapi.json — the single source of truth. These are the API's shapes, NOT
 * the app's: `src/data/types.ts` remains the app's model, and adapters in the
 * provider translate between the two. When the two disagree, the adapter
 * adapts and the gap is logged — fields the API does not have are never
 * invented here.
 *
 * Conventions carried by every type:
 * - ids are Postgres bigints serialized as DECIMAL STRINGS — opaque, no math;
 * - timestamps are ISO 8601 UTC strings;
 * - paginated lists are `{ items, total }` with limit/offset query params.
 *
 * TWO KINDS OF TYPE LIVE HERE, and the difference decides how defensively each
 * is written. The types above the proxy divider are OURS: our API owns them,
 * they are versioned with it, and a missing field is a bug. Everything under
 * "AlphaStudio proxies" is an UPSTREAM shape — our API forwards the external
 * service's response unchanged and the contract says new fields "may appear
 * without notice". Those types are therefore written from JSON actually
 * observed on the wire (Docs/api/alphastudio-shapes.md, captured by
 * `scripts/smoke-alphastudio.ts`), never from guesswork; anything not proven
 * there is optional, and unknown fields are tolerated rather than stripped.
 */

export interface Paginated<T> {
  items: T[]
  /** Full match count — not the page size. */
  total: number
}

export interface PageQuery {
  limit?: number
  offset?: number
}

// --- Auth / users ------------------------------------------------------------

export type OrgRole = 'owner' | 'admin' | 'member'

export interface ApiUser {
  id: string
  name: string
  email: string
  /** Platform role, not org role. */
  role: string
  status: string
  emailVerifiedAt: string | null
  createdAt: string
}

export interface ApiOrgSummary {
  id: string
  name: string
  slug: string
  status: string
  role: OrgRole
  joinedAt: string
}

/** Returned by login, verify-email, and accept-invite. */
export interface AuthSession {
  token: string
  expiresAt: string
  user: ApiUser
  orgs: ApiOrgSummary[]
}

/** `POST /auth/signup` → 201. */
export interface SignupReceipt {
  email: string
  codeExpiresAt: string
}

// --- Orgs / members / invites (INT-2) ---------------------------------------

export interface ApiOrg {
  id: string
  name: string
  slug: string
  status: string
  /**
   * ISO 3166-1 alpha-2, uppercase; `null` until the org sets one. Rides on
   * every org response, and it is the ONLY holiday control the frontend has:
   * `PUT /orgs/:id/country` loads the calendar server-side (decisions.md
   * D-INT-F).
   */
  country: string | null
  createdAt?: string
  updatedAt?: string
}

/** `GET /orgs/:id` → the workspace root. */
export interface OrgRoot {
  org: ApiOrg
  membership: { id: string; role: OrgRole }
}

/** One row of `GET /orgs/:id/members` — `id` is the MEMBERSHIP id. */
export interface ApiMember {
  id: string
  userId: string
  name: string
  email: string
  role: OrgRole
  isActive: boolean
  joinedAt: string
}

/** One row of `GET /orgs/:id/invites` — pending, unaccepted. */
export interface ApiInvite {
  id: string
  userId: string
  email: string
  name: string
  role: OrgRole
  invitedAt: string
}

/** `POST /orgs/:id/members/invite` → 201. */
export interface InviteReceipt {
  userId: string
  email: string
  role: OrgRole
  invitedNewUser: boolean
}

// --- Org country + holidays (INT-8) -----------------------------------------
// OURS, not a proxy: the holiday rows are stored by our API. The lookup behind
// them is external, which is why the country write is slow (~10 s) and can fail
// with 502 — and when it does, nothing changed.

/** `PUT /orgs/:orgId/country` → 200. */
export interface CountryReceipt {
  /** The org as it now stands, `country` included. */
  org: ApiOrg
  /** Rows in the calendar after the write. `0` is a real answer, not an error. */
  holidaysCount: number
  /**
   * `false` = the org already had this country: a cheap success that fetched
   * nothing and left the calendar alone. Worth surfacing quietly rather than
   * claiming a reload that did not happen.
   */
  reloaded: boolean
}

/**
 * One row of `GET /orgs/:orgId/holidays`, in calendar order. Read-only by
 * design: rows are written exclusively by the country flow and replaced
 * wholesale, so there is no create/update/delete to model. No `updatedAt`.
 */
export interface ApiHoliday {
  id: string
  orgId: string
  /** Plain calendar date, no time, no zone. */
  date: string
  event: string
  /**
   * The lookup capability's own do/don't guidance, stored raw. `kind` is `do`
   * or `dont` today but the contract says to treat an unknown kind as generic
   * rather than failing — hence `string`, not `ApiRuleKind`.
   */
  rules: { kind: string; text: string }[]
  createdAt: string
}

// --- Brand (INT-3, rules added 2026-08-17): four resources, one CRUD surface -

interface BrandRow {
  id: string
  orgId: string
  createdAt: string
  updatedAt: string
}

/**
 * A do/don't rule on a voice or a tone. `kind` is a closed set here — the API
 * validates it — unlike the holiday rules below, which come from an external
 * capability and may carry a kind we have never seen.
 */
export type ApiRuleKind = 'do' | 'dont'

export interface ApiRule {
  id: string
  kind: ApiRuleKind
  text: string
}

/** What a write sends: rules have no client-chosen id (ids are reissued). */
export type ApiRuleInput = Pick<ApiRule, 'kind' | 'text'>

export interface ApiTone extends BrandRow {
  name: string
  description: string
  preset: boolean
  /**
   * Embedded in EVERY read — list, get, create, update — in creation order, so
   * the rules never need a second call. On `PATCH`, sending `rules` replaces
   * the whole list (`[]` clears it); omitting it leaves them untouched.
   */
  rules: ApiRule[]
  /**
   * NOT persisted upstream as of 2026-08-30 (HSN-03): the tones API stores
   * only `{name, description, preset, rules}`, and Hasan adds these later.
   * Typed optional so the day the server echoes them the adapter reads them —
   * server value wins, and the client sidecar entry retires.
   */
  language?: string
  length?: string
}

export interface ApiVoice extends BrandRow {
  /** Required on create since 2026-08-17 — a voice without one is a 400. */
  name: string
  description: string
  /** Same embed and replace semantics as a tone's. */
  rules: ApiRule[]
}

export interface ApiSource extends BrandRow {
  url: string
  title: string
}

export interface ApiTopic extends BrandRow {
  description: string
}

// --- Scheduling (INT-4) ------------------------------------------------------

export type ApiWeekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

export interface ApiSchedule {
  id: string
  orgId: string
  timezone: string
  days: ApiWeekday[]
  /** `HH:MM`, wall-clock in `timezone`. */
  generateAt: string
  postsPerDay: number
  modelAlias: 'fast' | 'balanced' | 'quality'
  /** Comes back sorted ascending; PATCH replaces the whole selection. */
  toneIds: string[]
  eventAware: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ApiEventSource {
  id: string
  orgId: string
  kind: 'holidays'
  /** ISO 3166-1 alpha-2, stored uppercase. */
  country: string
  createdAt: string
  updatedAt: string
}

export interface ApiCountry {
  code: string
  name: string
}

// --- Notifications (INT-5) ---------------------------------------------------

/** Raised server-side by the producing feature; never written from here. */
export interface ApiNotification {
  id: string
  orgId: string
  userId: string
  /** Free-form event type owned by the producer — treat unknown as generic. */
  kind: string
  title: string
  message: string
  /** A frontend route or a label; null when there is nothing to click. */
  action: string | null
  relatedType: string | null
  relatedId: string | null
  /** null = unread. */
  seenAt: string | null
  createdAt: string
  updatedAt: string
}

/** Event ingestion writes these; `{skip}` is the entire mutation surface. */
export interface ApiSlot {
  id: string
  orgId: string
  eventSourceId: string
  /** Plain calendar date, no time, no zone. */
  date: string
  status: 'review' | 'skipped' | 'approved'
  title: string
  kind: string
}

// ============================================================================
// AlphaStudio proxies — UPSTREAM SHAPES (INT-9 … INT-11)
// ============================================================================
//
// Everything below crosses `/orgs/:orgId/alphastudio/*`, which our API forwards
// to the external AlphaProStudio service unchanged. Three consequences, and all
// three are why these types look different from the ones above:
//
// 1. The frontend still only ever calls OUR API, with the normal Bearer
//    session. It never reaches the upstream service, never signs a request,
//    never holds a service key (Ward, 2026-08-17; guard-static enforces it).
// 2. The contract states new fields "may appear without notice". So these
//    types describe what was OBSERVED on the wire — see
//    Docs/api/alphastudio-shapes.md — and stay tolerant of the rest. Unknown
//    fields are carried, not stripped; anything the smoke run did not prove is
//    optional.
// 3. Request bodies here are OURS to get right. Our API validates them loosely
//    and forwards them verbatim, so a wrong body comes back as an upstream
//    `400 bad_request`, not a local schema error. The Postman collection
//    (Docs/api/alphaprostudio.postman.json) is the authority for their shape.

/**
 * The plan vocabulary for on-demand runs and media jobs — a grade, and the
 * whole recipe behind it. Deliberately SEPARATE from a schedule's `modelAlias`
 * (`fast|balanced|quality`), which is a different vocabulary on a different
 * surface (decisions.md D-INT-D); the two must never be mapped onto each other.
 */
export type ApiPlan = 'balanced' | 'creative' | 'precise'

// --- Wallet + usage (INT-9) --------------------------------------------------

/**
 * `GET .../alphastudio/wallet`. Money in CENTS — there is no credit here, and
 * live mode never invents an exchange rate (decisions.md D-INT-E). Orgs are
 * funded once at creation; there is no funding endpoint on this API.
 */
export interface ApiWallet {
  /** Funded and not yet settled away — INCLUDING anything currently held. */
  cents: number
  /** Reserved by jobs in flight; released or settled when they finish. */
  heldCents: number
  /**
   * `cents - heldCents`, and the number the next request is actually checked
   * against. Watch this one, not `cents`.
   */
  availableCents: number
}

/** One row of a usage read, at whichever grain was asked for. */
export interface ApiUsageGroup {
  /** `null` for unattributed usage. */
  key: string | null
  unit: string
  qty: number
  /**
   * A DECIMAL STRING, on purpose. Never `parseFloat` it: display it as given,
   * and if a total is ever needed, sum it in integer units parsed from the
   * string (decisions.md D-INT-E).
   */
  costUsdEstimate: string
}

/** The same row at day grain, for charts and reconciliation. */
export interface ApiUsageDay extends Omit<ApiUsageGroup, 'key'> {
  /** Inclusive UTC day, `YYYY-MM-DD`. */
  day: string
}

/**
 * `GET .../alphastudio/usage?from&to&group_by`.
 *
 * `model` and `capability` report this org's own usage. `tenant` reports across
 * EVERY org of this app (its keys are org ids) — it is a billing view and must
 * never back an end-user chart.
 */
export interface ApiUsage {
  from: string
  to: string
  groupBy: ApiUsageGrain
  groups: ApiUsageGroup[]
  days: ApiUsageDay[]
}

export type ApiUsageGrain = 'model' | 'tenant' | 'capability'

/** The two grains an end-user screen may ask for (D-INT-E). */
export type ApiUserUsageGrain = Exclude<ApiUsageGrain, 'tenant'>

// --- Capability catalog (INT-11) ---------------------------------------------

/**
 * One model a capability can run on, named by the APP'S OWN ALIAS — never a
 * vendor model or a provider. Every field below was observed on the wire; a row
 * may carry more, so read defensively.
 *
 * Two of these turned out to be worth more than the docs suggested:
 * `displayHint` is a ready-made friendly label (E1 needs no name table of its
 * own), and `capabilitySchema` is a real JSON Schema for that model's `params`
 * — which is exactly what W5's "the params form is generated from the model's
 * schema, and may not name a model or a parameter" law was built to consume.
 */
export interface ApiCatalogModel {
  alias: string
  /** `image` | `video` observed; keep it open. */
  kind: string
  /** The grade that resolves to this row. */
  plan: string
  /** A human label with no vendor in it, e.g. "Balanced image". */
  displayHint?: string
  /** JSON Schema for this model's `params` — the source for the params form. */
  capabilitySchema?: Record<string, unknown>
  /** Which capabilities this alias may be named for. */
  capabilities?: string[]
  /**
   * Unit → decimal-string price, e.g. `{ images: "0.03" }` or
   * `{ video_seconds: "0.07" }`. A DECIMAL STRING like `costUsdEstimate`:
   * display it, never `parseFloat` it for arithmetic.
   */
  cost?: Record<string, string>
  /** App-side gating metadata, e.g. `{ min_plan: "pro" }`. */
  appMetadata?: Record<string, unknown>
}

/**
 * `GET .../alphastudio/catalog/capabilities/:capability[?plan=]`.
 *
 * THE source for E1's gallery — no model list is ever hardcoded (INT-11).
 * A capability that is unknown OR not granted answers 404, identically and on
 * purpose, so "granted" is something to probe rather than assume.
 */
export interface ApiCapabilityCatalog {
  capability: string
  /**
   * `false` = the capability pins its model, and a `plan` sent to its run is
   * IGNORED rather than refused.
   */
  selectable: boolean
  /** Which request field the plan belongs in; `null` when pinned. */
  field: string | null
  /** Echoes the `?plan=` filter, `null` on the plain read. */
  plan: string | null
  models: ApiCatalogModel[]
}

// --- Posts runs (INT-7 preview, INT-10 generate) -----------------------------

/** A tone as a RUN carries it: inline, used for this run, never stored. */
export interface ApiRunTone {
  /** Unique within one request. Our tone id, sent through as-is. */
  id?: string
  name: string
  description?: string
  rules?: ApiRuleInput[]
  example?: string
  language?: string
  /**
   * `short` | `medium` | `long` — per Hasan's 2026-08-28 reference envelope
   * (HSN-03). Sourced from the tone model and OMITTED when the tone has none;
   * never invented.
   */
  length?: string
}

/** `POST .../posts/tones-preview` — sync; the finished run comes back inline. */
export interface TonesPreviewRequest {
  /** Required upstream. */
  tone: ApiRunTone
  /**
   * OPTIONAL, and omitting it is the deliberate choice (INT-7): the platform
   * then falls back to the org's pushed context bundle, which is what real
   * generation grounds on. Sending it overrides the bundle entirely — never a
   * merge — so a preview that sent one would not preview the real thing.
   */
  brandVoice?: { rules: ApiRuleInput[] }
  language?: string
}

/** The day a run is being written for. */
export interface ApiRunSlot {
  /** Our own reference for the slot; echoed back untouched. */
  ref?: string
  dateISO: string
  /** `HH:MM`. */
  time?: string
  /** IANA zone name. */
  timezone?: string
}

/**
 * An occasion attached to a run. Its `rules` OUTRANK the tone's and the
 * brand's — a holiday from the org's own calendar drops straight in, which is
 * exactly the `{ kind, text }` shape `ApiHoliday.rules` already carries.
 */
export interface ApiAttachedEvent {
  title: string
  dateISO: string
  rules?: { kind: string; text: string }[]
}

/** `POST .../posts/generate` — batch; answers a receipt, not the drafts. */
export interface PostsGenerateRequest {
  /** 1–3, ids unique. */
  tones: ApiRunTone[]
  plan?: ApiPlan
  /**
   * REQUIRED, despite reading as optional in the docs: the smoke run's
   * no-slot probe came back `400` (Docs/api/alphastudio-shapes.md). F1 must
   * always send one — today, now, schedule timezone or the browser's.
   */
  slot: ApiRunSlot
  attachedEvent?: ApiAttachedEvent
}

/** A `202` from a batch run: the drafts are pulled from the run endpoint. */
export interface RunReceipt {
  runId: string
  status: ApiRunStatus
}

export type ApiRunStatus = 'queued' | 'running' | 'completed' | 'failed'

/**
 * One output of a run.
 *
 * `content` is a bag whose keys follow the capability, and the OBSERVED shapes
 * are why it is not flattened: `tones.preview` answers `{ sample }`, while
 * `social-posts.generate` answers `{ toneId, content, rationale }` — the tone
 * id and the rationale live INSIDE `content`, not beside it. Read them through
 * the two aliases below rather than by hand.
 */
export interface ApiRunOutput {
  index: number
  content: Record<string, unknown>
  /** Guardrail findings. Always rendered, never hidden (design law). */
  flags?: unknown[]
  /** Where the claim came from. Upstream terms require these stay visible. */
  attributions?: unknown[]
  /** `social-posts.generate` only: the run's own scoring of this draft. */
  judge?: { score?: number; voice?: number; grounding?: number; repetition?: number }
  /**
   * A proposal record DOES exist upstream for every draft — but the proposals
   * surface is not proxied, so this id is currently unusable. Kept because it
   * is the handle an approve/decline wire would need (open-items question).
   */
  proposalId?: string
}

/** `content` of a `social-posts.generate` output, as observed. */
export interface ApiPostDraftContent {
  /** Filled by the engine from the request's tones — never echoed by a model. */
  toneId?: string
  content?: string
  rationale?: string
}

/** `content` of a `tones.preview` output, as observed. */
export interface ApiTonePreviewContent {
  sample?: string
}

/**
 * `GET .../posts/runs/:runId`, and the inline answer of the sync preview.
 *
 * Also the recovery path for a missed callback: the record is pullable
 * regardless of delivery, which is what makes the local run ledger workable
 * (D-INT-G). Unknown, or another org's → 404.
 */
export interface ApiRun {
  runId: string
  status: ApiRunStatus
  capability?: string
  capabilityVersion?: number
  /** `sync` | `batch`. */
  mode?: string
  outputs?: ApiRunOutput[]
  /** Steps named by the app's own aliases; no vendor ref ever appears. */
  modelVersions?: { step: string; alias: string }[]
  /** Provenance of the prompts that wrote the run. Not user-facing. */
  promptVersions?: { capability: string; name: string; version: number; contentHash: string }[]
  /** Present on `failed`. */
  error?: unknown
  createdAt?: string
  updatedAt?: string
}

// --- Proposals: the generation-feedback ledger (INT-12) ----------------------

export type ApiProposalState = 'pending' | 'approved' | 'declined'

/**
 * One decision row. NOTE WHAT IS NOT HERE: no content, no tone, no rationale.
 * The draft itself lives on the run output this id is stamped on, which is why
 * Today is a JOIN (ledger -> runs) rather than a list (decisions.md D-INT-J).
 */
export interface ApiProposal {
  proposalId: string
  runId: string
  state: ApiProposalState
  /** null while pending. */
  decidedAt: string | null
  /** The org's OWN id for the published entry; null until approved. */
  publishedId: string | null
}

/**
 * `GET .../proposals` - keyset paging, newest first.
 *
 * The END is the ABSENCE of `nextCursor`, never a short page: rows appearing
 * mid-walk do not shift the boundaries, so a page can be shorter than `limit`
 * and still have more behind it. Treating a short page as the end would
 * silently truncate the review queue.
 */
export interface ProposalsPage {
  proposals: ApiProposal[]
  nextCursor?: string
}

export interface ProposalsQuery {
  state?: ApiProposalState
  runId?: string
  /** 1-200; upstream default 50. */
  limit?: number
  /** The previous page's `nextCursor`, verbatim. */
  cursor?: string
}

/**
 * `POST .../proposals/:id/approve`. `publishedId` is the ORG'S own id, and
 * approving also creates the published-social entry dated now. Re-approving
 * with the SAME id is a safe retry; a different or already-taken id is a 409
 * that changes nothing - which is why the app derives the id deterministically
 * from the proposal (decisions.md D-INT-K).
 */
export interface ApproveProposalRequest {
  publishedId: string
}

/**
 * `POST .../proposals/:id/decline`. The row STAYS: it is the instruction the
 * next run is scored against, and a `reason` sharpens that from "avoid these"
 * to "avoid these, because". Re-declining without one clears a previous reason.
 */
export interface DeclineProposalRequest {
  reason?: string
}

// --- Media jobs + assets (INT-11) --------------------------------------------

/** End-user text the platform quarantines; at most 6 per job. */
export interface ApiMediaGuidance {
  /** `headline` | `palette` | `style` | `subject` | `instruction` | `scene`. */
  role: string
  text: string
}

/**
 * `POST .../media/jobs` — ONE endpoint whose body shape the frontend decides:
 * `capability` selects the schema the upstream parses it with. `modelAlias` is
 * retired and REFUSED BY NAME, so it must never be sent; ask for a `plan`.
 */
export interface MediaJobRequest {
  /** Defaults to `media.generate` upstream when omitted. */
  capability?: string
  plan?: ApiPlan
  /** `image` | `video`, where the capability serves both. Omitted = image. */
  kind?: string
  prompt?: string
  /** Only for capabilities that own the brief (e.g. an edit). */
  instruction?: string
  params?: Record<string, unknown>
  origin?: { kind?: string; ref?: string }
  guidance?: ApiMediaGuidance[]
  style?: Record<string, unknown>
  /** The fan-out surface: one render per item, each tagged by its `ref`. */
  posts?: { ref: string; content: string; tone?: ApiRunTone }[]
}

/**
 * A media job's lifecycle, OBSERVED: `queued → submitted → succeeded`. Note it
 * is NOT a run's vocabulary — a run reaches `completed`, a job reaches
 * `succeeded` — so the two must never share a status type or a poll predicate.
 * Left open because only the happy path has been watched end to end.
 */
export type ApiMediaJobStatus = 'queued' | 'submitted' | 'succeeded' | 'failed' | (string & {})

/**
 * One rendered asset. `url` is a presigned GET, minted for 1 hour and ONLY on a
 * finished job read — the list endpoint deliberately omits it, so a screen mints
 * one per asset the user actually opens.
 */
export interface ApiMediaAsset {
  assetId: string
  url?: string
  expiresAt?: string
  mediaType?: string
  /** `image` | `video`. */
  kind?: string
  /** Observed: `{ width, height, synthetic }`. Useful for laying out E4. */
  meta?: Record<string, unknown>
}

/**
 * `GET .../media/jobs/:jobId` — the polling endpoint. What is absent is as
 * deliberate as what is present: no provider, no vendor model, no route.
 *
 * `modelAlias` here is the platform's ANSWER — which catalog row served the
 * render. It is safe to read and must never be SENT: on a request the field is
 * retired and refused by name (see `MediaJobRequest`).
 */
export interface ApiMediaJob {
  jobId: string
  status: ApiMediaJobStatus
  capability?: string
  plan?: string
  /** Resolved by the platform. Read-only — never echo it back on a request. */
  modelAlias?: string
  assets?: ApiMediaAsset[]
  origin?: { kind?: string; ref?: string }
  /** Present on failure. */
  error?: unknown
  createdAt?: string
  updatedAt?: string
}

/**
 * The `202` from job intake. Observed to be the FULL job object (with
 * `assets: []`), not the three documented fields — so the receipt and the poll
 * read the same type, and a caller can render immediately.
 */
export type MediaJobReceipt = ApiMediaJob

/**
 * A fan-out answers a LIST, because one request produced several jobs.
 *
 * HSN-02 (2026-08-30): the founder's ruling is that a `social-posts.media`
 * request answers this shape EVEN FOR ONE POST — take `jobs[0]`. Stated
 * plainly: the shape has never been observed on the wire. PROBE-INT13 (branch
 * `probe/int13`, `Docs/api/probe-int13-social-posts-media-2026-08-26.md`) saw
 * the `posts[]` path create and bill the job and then answer 502 instead, so
 * `jobFromFanOutReceipt` in `src/data/studio.ts` reads this list, tolerates a
 * bare job (the single-job control call's shape), and treats anything else as
 * "accepted but unconfirmed" rather than as success.
 */
export interface MediaJobFanOutReceipt {
  jobs: MediaJobReceipt[]
}

/**
 * `POST .../media/jobs` with `capability: "social-posts.media"` — Hasan's
 * post-visual envelope (sync 2026-08-28; HSN-02). Transcribed from the
 * founder-supplied reference body in `Docs/api/alphastudio-shapes.md`
 * ("Upstream social-posts.media envelope — Hasan sync 2026-08-28"):
 * structure authoritative, values illustrative.
 *
 * This is NOT `MediaJobRequest` narrowed. Two fields differ in SHAPE from the
 * `media.generate` body that type describes: `guidance` is a list of plain
 * strings here (not `{role, text}`), and a post's `tone` carries exactly
 * `{id, name, description, rules[]}` — no `length`, `example` or `language`.
 *
 * `posts` holds EXACTLY ONE entry by law (HSN-02, from PROBE-INT13 evidence:
 * the multi-post path billed and then 502'd; single-post is the proven-clean
 * control). `params` is always `{}` and `collection` is always
 * `{ use: false }` — hardcoded by the founder's word, never a UI toggle.
 */
export interface SocialPostMediaTone {
  id: string
  name: string
  description: string
  /** `[]` when the tone has no rules — never invented, and the key is never omitted. */
  rules: ApiRuleInput[]
}

export interface SocialPostMediaPost {
  /** The draft's own id: a proposal id from Today, a run output otherwise. */
  ref: string
  content: string
  tone: SocialPostMediaTone
}

export interface SocialPostMediaStyle {
  /** Sent verbatim; upstream accepts any string. The list is curated client-side. */
  imgStyle: string
  /** Include text on the visual. */
  text: boolean
  /** Include the brand logo. */
  logo: boolean
}

export interface SocialPostsMediaRequest {
  capability: 'social-posts.media'
  plan: ApiPlan
  kind: 'image' | 'video'
  posts: [SocialPostMediaPost]
  style: SocialPostMediaStyle
  /** Free text, at most 6 entries (founder-confirmed). */
  guidance: string[]
  params: Record<string, never>
  collection: { use: false }
}

/** `GET .../media/jobs` → newest first, assets WITHOUT presigned urls. */
export interface ApiMediaJobList {
  jobs: ApiMediaJob[]
}

/**
 * `POST .../media/assets/presign` → 201. The org's own image, in: `PUT` the
 * bytes to `uploadUrl` with exactly this `mediaType` (it is part of the
 * signature) via `uploadToPresignedUrl`. png/jpeg/webp only. Nothing is metered.
 */
export interface MediaUploadTicket {
  assetId: string
  uploadUrl: string
  mediaType: string
  expiresAt?: string
}

/**
 * `POST .../media/assets/:assetId/presign` → 200. The read IS the ownership
 * check: unknown and not-yours are the same 404, on purpose. Good for an hour.
 */
export interface MediaDownloadTicket {
  url: string
  expiresAt: string
  assetId?: string
}

// --- RAG knowledge (INT-11) --------------------------------------------------

/**
 * A knowledge collection. It PINS its embedding model alias and chunk profile
 * for its lifetime, so the choice is made once at creation and never edited.
 */
export interface ApiRagCollection {
  collectionId: string
  name: string
  /** `tenant` = this org only; `app` = every org of this app. */
  scope: string
  embeddingModel: string
  chunkProfile: string
  activeIndex: string
  status: string
  createdAt?: string
  updatedAt?: string
}

export interface ApiRagCollectionList {
  collections: ApiRagCollection[]
}

/** `POST .../rag/collections` → 201. A duplicate name in a scope is a 400. */
export interface RagCollectionRequest {
  name: string
  scope?: 'tenant' | 'app'
  /**
   * REQUIRED here, though api.md marks it optional: the smoke run's
   * without-it probe came back `400` (Docs/api/alphastudio-shapes.md). It is
   * the app's own alias — a vendor id never crosses this wire — and
   * `embed-default` is the one this app holds.
   */
  embeddingModel: string
  chunkProfile?: string
}

/**
 * `POST .../rag/collections/:id/sources` → 202. Two shapes on `kind`: `push`
 * sends text we already hold, `url` has the platform fetch it (http/https only).
 */
export type RagSourceRequest =
  | { kind: 'push'; title: string; mediaType: string; content: string }
  | { kind: 'url'; url: string; title?: string }

/**
 * Ingestion state, upstream's own capitalisation. `Uploading` is a presigned
 * row whose bytes have not landed; a source that never receives them simply
 * stays there.
 */
export type ApiRagSourceStatus = 'Uploading' | 'Processing' | 'Ready' | 'Failed'

export interface ApiRagSource {
  sourceId: string
  collectionId?: string
  kind?: string
  status: ApiRagSourceStatus
  /** What this source contributed, once `Ready`. */
  chunkCount?: number
  /** `true` = identical content already existed: nothing embedded or billed. */
  deduped?: boolean
  /** Only on `Failed`, from a closed vocabulary. */
  failureReason?: string
  title?: string
  mediaType?: string
  /** How dedupe is decided; appears once the content has been read. */
  contentHash?: string
  createdAt?: string
  updatedAt?: string
}

export interface ApiRagSourceList {
  sources: ApiRagSource[]
}

/**
 * `POST .../rag/collections/:id/sources/presign` → 201. The source row exists
 * as `Uploading` immediately; `PUT` the bytes with EXACTLY this `mediaType`
 * within 15 minutes and ingestion starts by itself — there is no "complete"
 * call. A media type the platform cannot extract is a 400.
 */
export interface RagUploadTicket {
  sourceId: string
  uploadUrl: string
  expiresAt: string
  mediaType: string
}

/**
 * `DELETE .../rag/sources/:id` → **200 with a body**, not this API's usual 204:
 * the upstream shape passes through. Vectors are removed inline before the
 * response, and `vectorsDeleted` is what makes that checkable.
 */
export interface RagDeleteReceipt {
  sourceId: string
  vectorsDeleted: number
}
