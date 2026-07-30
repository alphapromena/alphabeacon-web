/**
 * Hand-written types for every entity the UI renders, plus the zod schemas
 * forms validate against. One of the three integration reconciliation points
 * (web-plan.md §13): keep this file small, central, and free of per-screen
 * variants.
 *
 * Nothing here is parsed from a wire — these are the shapes of values
 * committed under `src/data/entities/` and composed into datasets.
 */
import { z } from 'zod'
import type { DraftStatus } from '@/lib/draft-status'
import { MESSAGES } from '@/lib/messages'

// ---------------------------------------------------------------------------
// Org, users, session
// ---------------------------------------------------------------------------

/**
 * The org-wide do/don't rules that shape every draft (I2). Brand voice always
 * applies underneath whatever tone is selected — the two are layered, not
 * alternatives, which is why they are separate records.
 */
export interface BrandVoice {
  do: string[]
  dont: string[]
  /** Illustrative snippets, not rules — shown as examples in I2. */
  examples: string[]
}

export interface Org {
  id: string
  name: string
  /** One-line offer shown across onboarding and settings. */
  offer: string
  differentiators: string[]
  /** The standard closing ask drafts fall back to (I1). */
  ctaText: string
  /** A locally-read data URL from I1's picker; no asset is ever fetched. */
  logo?: string
  brandVoice: BrandVoice
  /** Onboarding progress; N3 resumes at `resumeStep` when incomplete. */
  onboarding: { completed: boolean; resumeStep: 1 | 2 | 3 | 4 | 5 }
}
// NOTE: the org's timezone lives on `Schedule`, not here. screens4.md I1 asks
// for "timezone (mirrors C1, single source)" — two fields would be two sources.

export interface User {
  id: string
  name: string
  email: string
  /**
   * Org role. `owner` arrived with the AlphaStudio integration (INT-2): the
   * API's model is three-tier, and ownership transfer + the last-owner rules
   * only make sense with it. Static datasets remain two-tier — an owner never
   * appears in a demo world — so every static behaviour is unchanged.
   */
  role: 'owner' | 'admin' | 'member'
  /** ISO date, shown mono in I7. */
  joinedAt: string
}

/** A sent-but-unaccepted invitation (I7's "Invited" rows). */
export interface TeamInvite {
  id: string
  email: string
  role: User['role']
  invitedAt: string
}

/**
 * A fake local session — drives guards, the signed-out redirect, the
 * locked-out countdown and plan gating. No token exists and nothing persists.
 */
export interface Session {
  signedIn: boolean
  userId: string
  /** Set by signup; A3 verifies it before onboarding starts. */
  pendingEmail?: string
  emailVerified: boolean
  /** Consecutive failed sign-ins — A2 locks out after MAX_SIGN_IN_ATTEMPTS. */
  failedSignIns: number
  /** Epoch ms the lockout ends; A2 renders a mono countdown until then. */
  lockedUntil?: number
}

// ---------------------------------------------------------------------------
// Connections (Area B)
// ---------------------------------------------------------------------------

export type Platform = 'facebook' | 'instagram' | 'linkedin' | 'x'

export type ConnectionStatus = 'not_connected' | 'active' | 'needs_reauth' | 'revoked'

export interface Connection {
  id: string
  platform: Platform
  status: ConnectionStatus
  accountName?: string
  handle?: string
  /** ISO date — shown mono as "connected since". */
  connectedSince?: string
  permissions: { analytics: boolean; posting: boolean }
  /** Granted OAuth scopes, shown mono + collapsible in B2. */
  scopes: string[]
  lastSyncAt?: string
  /** Facebook only: the multi-Page picker state. */
  pages?: { id: string; name: string; selected: boolean }[]
}

// ---------------------------------------------------------------------------
// Tones & generation models (Areas I3/I4, C1, onboarding step 4)
// ---------------------------------------------------------------------------

export interface Tone {
  id: string
  name: string
  /** Custom tones render identically to presets everywhere — no second-class UI. */
  kind: 'preset' | 'custom'
  description: string
  rules: { do: string[]; dont: string[] }
  /** Optional sample sentence used to steer generation. */
  example?: string
}

// ---------------------------------------------------------------------------
// Followed sources, topics, knowledge (I5, I6)
// ---------------------------------------------------------------------------

/** An RSS/news/blog feed the pipeline reads for material. */
export interface FollowedSource {
  id: string
  /** Scheme-less by design — the static law bans http(s):// literals in src/. */
  url: string
  name: string
  addedAt: string
}

/** Uploading → Processing → Ready | Failed. Per file, mixed within one batch. */
export type KnowledgeStatus = 'uploading' | 'processing' | 'ready' | 'failed'

export interface KnowledgeDoc {
  id: string
  filename: string
  sizeBytes: number
  status: KnowledgeStatus
  /** 0–100 while uploading; absent once the upload finishes. */
  progress?: number
  /** failed only: what went wrong, shown next to Retry. */
  failureReason?: string
  addedAt: string
}

export type PlanTier = 'free' | 'pro' | 'studio'

/** Copy-drafting model — friendly names only, never vendor ids. */
export interface GenerationModel {
  id: string
  name: string
  description: string
  /** Minimum plan tier that unlocks it. */
  tier: PlanTier
}

// ---------------------------------------------------------------------------
// Schedule, slots, events (Area C)
// ---------------------------------------------------------------------------

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface Schedule {
  activeDays: Weekday[]
  postsPerDay: 1 | 2 | 3
  /** 24h "HH:mm" local to `timezone`. */
  generateAt: string
  timezone: string
  modelId: string
  toneIds: string[]
  attachToEvents: boolean
  /** True once "Start pipeline" ran (onboarding step 4 or C1). */
  started: boolean
}

export interface CalendarSource {
  id: string
  kind: 'holiday' | 'google'
  /** e.g. "Jordan public holidays" or the connected Google account email. */
  label: string
  status: 'active' | 'needs_reauth'
  /** Google only: which calendars feed in. */
  calendars?: { id: string; name: string; enabled: boolean }[]
}

export interface CalendarEvent {
  id: string
  sourceId: string
  name: string
  /** ISO date (day precision). */
  date: string
}

export type SlotStatus = 'pending' | 'generating' | 'review' | 'done' | 'skipped'

export interface Slot {
  id: string
  /** ISO date (day precision), local to the schedule's timezone. */
  date: string
  /** 24h "HH:mm", wall-clock in the schedule's timezone. */
  time: string
  status: SlotStatus
  eventId?: string
  draftIds: string[]
  /** Set when skipped; C4 offers undo only while it is still the same day. */
  skippedAt?: string
}

// ---------------------------------------------------------------------------
// Drafts (Areas D, F)
// ---------------------------------------------------------------------------

/** A cited fact — rendered as a ClaimChip. Source is scheme-less by design
 *  (the static law bans http(s):// literals under src/). */
export interface Claim {
  id: string
  /** e.g. "reuters.com/technology/…" — displayed mono, no scheme. */
  source: string
  title: string
  state: 'verified' | 'flagged'
}

export interface Draft {
  id: string
  status: DraftStatus
  copy: string
  /** The collapsible "why this post" rationale. */
  rationale: string
  toneId: string
  slotId?: string
  eventId?: string
  claims: Claim[]
  /** 0–100, shown mono in D3. */
  judgeScore?: number
  assetId?: string
  createdAt: string
  scheduledFor?: string
  /** Timestamped status history for D3's timeline. */
  timeline: { status: DraftStatus; at: string }[]
  /** Per-channel publish outcomes (D5 partial-failure list). */
  publishResults?: { platform: Platform; ok: boolean; reason?: string }[]
  /** publish_failed only: the reason shown next to Retry. */
  failureReason?: string
}

// ---------------------------------------------------------------------------
// Creative Studio (Area E)
// ---------------------------------------------------------------------------

export interface StudioModel {
  id: string
  name: string
  kind: 'image' | 'video'
  credits: number
  tier: PlanTier
  /** JSON-Schema-shaped params (W5 renders the form from this). */
  paramsSchema: Record<string, unknown>
}

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export interface StudioJob {
  id: string
  modelId: string
  kind: 'image' | 'video'
  prompt: string
  /** The values the schema-driven params form produced for this run. */
  params?: Record<string, string | number | boolean>
  credits: number
  status: JobStatus
  origin: { type: 'standalone' } | { type: 'draft'; draftId: string }
  assetId?: string
  createdAt: string
  failureReason?: string
}

/** A generated asset. Previews are locally rendered placeholders (no URLs). */
export interface Asset {
  id: string
  jobId: string
  kind: 'image' | 'video'
  label: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Billing (Area H)
// ---------------------------------------------------------------------------

export interface Plan {
  id: PlanTier
  name: string
  priceMonthly: number
  /** Monthly credit grant, shown mono and prominent. */
  credits: number
  entitlements: {
    channels: number
    slotsPerDay: 1 | 2 | 3
    studio: boolean
    modelTiers: PlanTier[]
    features: string[]
  }
}

export type LedgerEntryType = 'grant' | 'reserved' | 'released' | 'committed' | 'refund'

/**
 * Signed, append-only rows; the displayed balance is always the sum of
 * `amount` (computed, never a stored literal). A hold that succeeds becomes
 * three rows (reserved −N, released +N, committed −N); a hold that fails
 * becomes two (reserved −N, released +N).
 */
export interface LedgerEntry {
  id: string
  at: string
  type: LedgerEntryType
  amount: number
  ref?: { kind: 'job' | 'subscription'; id: string }
}

export interface Billing {
  planId: PlanTier
  status: 'active' | 'past_due' | 'canceled'
  renewsAt?: string
  /** canceled only: end-of-access date. */
  endsAt?: string
  paymentMethod?: { brand: string; last4: string }
  history: { id: string; at: string; amount: number; status: 'paid' | 'failed' }[]
}

// ---------------------------------------------------------------------------
// Analytics (Area G)
// ---------------------------------------------------------------------------

export interface AnalyticsSeries {
  connectionId: string
  /** Day-indexed series, oldest first; labels align by index. */
  labels: string[]
  reach: number[]
  engagement: number[]
  followers: number[]
  synced: boolean
  /** Platforms with restricted analytics get the honesty note, not a broken chart. */
  limited: boolean
  posts: {
    draftId?: string
    title: string
    /** Which tone wrote it — G2's "best-performing tone" reads this. */
    toneId?: string
    publishedAt: string
    /** Absent until the platform reports — never render 0 in its place. */
    metrics?: { reach: number; engagement: number; likes: number }
  }[]
}

// ---------------------------------------------------------------------------
// Notifications & activity (Areas D1, N1)
// ---------------------------------------------------------------------------

export type NotificationType =
  'reauth_needed' | 'low_credits' | 'generation_failed' | 'payment_failed' | 'drafts_ready'

export interface AppNotification {
  id: string
  type: NotificationType
  message: string
  at: string
  read: boolean
  /** In-app route the item clicks through to. */
  href: string
}

export interface ActivityItem {
  id: string
  type: 'post_published' | 'media_generated' | 'draft_approved'
  message: string
  at: string
}

// ---------------------------------------------------------------------------
// Dataset — a whole-tenant world (src/data/datasets/*)
// ---------------------------------------------------------------------------

export type DatasetId =
  'visitor' | 'fresh' | 'active' | 'past-due' | 'needs-reauth' | 'low-credits' | 'quiet-week'

export interface Dataset {
  id: DatasetId
  label: string
  description: string
  org: Org
  users: User[]
  invites: TeamInvite[]
  session: Session
  connections: Connection[]
  followedSources: FollowedSource[]
  topics: string[]
  knowledgeDocs: KnowledgeDoc[]
  eventSources: CalendarSource[]
  events: CalendarEvent[]
  schedule: Schedule
  slots: Slot[]
  drafts: Draft[]
  tones: Tone[]
  generationModels: GenerationModel[]
  studioModels: StudioModel[]
  jobs: StudioJob[]
  assets: Asset[]
  plans: Plan[]
  billing: Billing
  ledger: LedgerEntry[]
  analytics: AnalyticsSeries[]
  notifications: AppNotification[]
  activity: ActivityItem[]
}

// ---------------------------------------------------------------------------
// Form schemas (react-hook-form + zod) — rules named here, worded in messages
// ---------------------------------------------------------------------------

export const MAX_POSTS_PER_DAY = 3

/** A2 locks out after this many consecutive failures (screens4.md A2). */
export const MAX_SIGN_IN_ATTEMPTS = 3
export const SIGN_IN_LOCKOUT_MS = 30_000
/** A3's resend cooldown, shown as a mono countdown. */
export const VERIFY_RESEND_COOLDOWN_MS = 30_000

export const scheduleConfigSchema = z.object({
  activeDays: z
    .array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']))
    .min(1, MESSAGES.errors.activeDaysRequired),
  postsPerDay: z
    .number()
    .int()
    .min(1, MESSAGES.errors.postsPerDayCap)
    .max(MAX_POSTS_PER_DAY, MESSAGES.errors.postsPerDayCap),
  generateAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  timezone: z.string().min(1, MESSAGES.errors.timezoneRequired),
  modelId: z.string().min(1),
  toneIds: z.array(z.string()).min(1, MESSAGES.errors.toneRequired),
  attachToEvents: z.boolean(),
})

export type ScheduleConfigInput = z.infer<typeof scheduleConfigSchema>
