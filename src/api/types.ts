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
