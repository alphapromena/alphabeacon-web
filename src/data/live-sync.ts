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
  ApiCountry,
  ApiEventSource,
  ApiNotification,
  ApiInvite,
  ApiMember,
  ApiSchedule,
  ApiSlot,
  ApiSource,
  ApiTone,
  ApiTopic,
  ApiUser,
  ApiVoice,
  ApiOrgSummary,
  AuthSession,
  OrgRole,
  OrgRoot,
  Paginated,
} from '@/api/types'
import { adaptBrand, type BrandGraft } from '@/data/adapters/brand-adapter'
import { adaptTeam, type TeamGraft } from '@/data/adapters/org-adapter'
import { adaptNotifications } from '@/data/adapters/notification-adapter'
import { adaptScheduling, type SchedulingGraft } from '@/data/adapters/scheduling-adapter'

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

/**
 * The VIEWER's own role in this org, from the workspace root — the
 * authoritative "who am I here" (`GET /orgs/:orgId` resolves the caller's
 * membership; platform admins arrive as a synthetic owner). Permissions
 * derive from THIS, never from scanning the members list.
 */
export async function fetchViewerRole(orgId: string): Promise<OrgRole> {
  const root = await api<OrgRoot>('GET', `/orgs/${orgId}`)
  return root.membership.role
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

/** Global reference data — one list for every org, cached for the session. */
let countriesCache: ApiCountry[] | null = null
export async function fetchCountries(orgId: string): Promise<ApiCountry[]> {
  if (countriesCache) return countriesCache
  const list = await api<Paginated<ApiCountry>>(
    'GET',
    `/orgs/${orgId}/event-sources/countries`,
  )
  countriesCache = list.items
  return list.items
}

/** Schedules, event sources and their slots — the when of the pipeline. */
export async function fetchScheduling(orgId: string): Promise<SchedulingGraft> {
  const [schedules, sources, slots, countries] = await Promise.all([
    api<Paginated<ApiSchedule>>('GET', `/orgs/${orgId}/schedules`, { query: { limit: 20 } }),
    api<Paginated<ApiEventSource>>('GET', `/orgs/${orgId}/event-sources`, {
      query: { limit: 100 },
    }),
    api<Paginated<ApiSlot>>('GET', `/orgs/${orgId}/slots`, { query: { limit: 100 } }),
    fetchCountries(orgId),
  ])
  return adaptScheduling(
    schedules.items,
    sources.items,
    slots.items,
    Object.fromEntries(countries.map((country) => [country.code, country.name])),
  )
}

/** The signed-in user's inbox for this org + the true unread count. */
export async function fetchInbox(orgId: string) {
  const [list, count] = await Promise.all([
    api<Paginated<ApiNotification>>('GET', `/orgs/${orgId}/notifications`),
    api<{ unread: number }>('GET', `/orgs/${orgId}/notifications/unread-count`),
  ])
  return { notifications: adaptNotifications(list.items), unread: count.unread }
}

/** The brand kit: tones, voices, sources, topics — any member may read all. */
export async function fetchBrand(orgId: string): Promise<BrandGraft> {
  const list = { query: { limit: 100 } }
  const [tones, voices, sources, topics] = await Promise.all([
    api<Paginated<ApiTone>>('GET', `/orgs/${orgId}/brand/tones`, list),
    api<Paginated<ApiVoice>>('GET', `/orgs/${orgId}/brand/voices`, list),
    api<Paginated<ApiSource>>('GET', `/orgs/${orgId}/brand/sources`, list),
    api<Paginated<ApiTopic>>('GET', `/orgs/${orgId}/brand/topics`, list),
  ])
  return adaptBrand(tones.items, voices.items, sources.items, topics.items)
}
