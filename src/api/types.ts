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

// --- Brand (INT-3): four org-scoped resources, one CRUD surface -------------

interface BrandRow {
  id: string
  orgId: string
  createdAt: string
  updatedAt: string
}

export interface ApiTone extends BrandRow {
  name: string
  description: string
  preset: boolean
}

export interface ApiVoice extends BrandRow {
  description: string
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
