/**
 * The live sync (INT-2): what the provider pulls from AlphaStudio when a
 * session exists, so screens can keep reading synchronously.
 *
 * Two rules govern it:
 * - The stored session is a WARM START, not the truth — `/me` + `/me/orgs`
 *   are refreshed on boot (open-items 6), and the stored record is updated in
 *   place so the next boot starts warmer.
 * - Sync is per-entity-group and additive: INT-2 pulls the team; later
 *   phases add their groups here, and a group the API does not cover simply
 *   never syncs — the dataset keeps supplying it.
 */
import { api } from '@/api/client'
import { isApiError } from '@/api/errors'
import { updateStoredSession } from '@/api/session'
import type {
  ApiInvite,
  ApiMember,
  ApiUser,
  ApiOrgSummary,
  AuthSession,
  Paginated,
} from '@/api/types'
import { adaptTeam, type TeamGraft } from '@/data/adapters/org-adapter'

/** Fresh user + orgs; the stored record is rewritten in the same storage. */
export async function refreshAuthSnapshot(current: AuthSession): Promise<AuthSession> {
  const [user, orgs] = await Promise.all([
    api<ApiUser>('GET', '/me'),
    api<Paginated<ApiOrgSummary>>('GET', '/me/orgs'),
  ])
  const refreshed: AuthSession = {
    token: current.token,
    expiresAt: current.expiresAt,
    user,
    orgs: orgs.items,
  }
  updateStoredSession(refreshed)
  return refreshed
}

/** Members + pending invites for the working org, adapted for the world. */
export async function fetchTeam(orgId: string): Promise<TeamGraft> {
  const [members, invites] = await Promise.all([
    api<Paginated<ApiMember>>('GET', `/orgs/${orgId}/members`, { query: { limit: 100 } }),
    // Invites are admin/owner-only reads; a plain member's 403 is not an
    // error, it is "you don't get to see these" — an empty list renders true.
    api<Paginated<ApiInvite>>('GET', `/orgs/${orgId}/invites`, { query: { limit: 100 } }).catch(
      (error: unknown) => {
        if (isApiError(error) && error.code === 'forbidden') return { items: [], total: 0 }
        throw error
      },
    ),
  ])
  return adaptTeam(members.items, invites.items)
}
