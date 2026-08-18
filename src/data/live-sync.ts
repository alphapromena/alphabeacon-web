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
  ApiNotification,
  ApiInvite,
  ApiMember,
  ApiHoliday,
  ApiSchedule,
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
import {
  adaptHolidays,
  adaptSchedule,
  type SchedulingGraft,
} from '@/data/adapters/scheduling-adapter'

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
 * The workspace root: the VIEWER's own role in this org, and the org's
 * country. The role is the
 * authoritative "who am I here" (`GET /orgs/:orgId` resolves the caller's
 * membership; platform admins arrive as a synthetic owner). Permissions
 * derive from THIS, never from scanning the members list.
 */
export async function fetchOrgRoot(
  orgId: string,
): Promise<{ role: OrgRole; country: string | null }> {
  const root = await api<OrgRoot>('GET', `/orgs/${orgId}`)
  // The country rides on every org response since 2026-08-17, and this is the
  // one call that already reads the org itself - so it costs nothing extra.
  return { role: root.membership.role, country: root.org.country ?? null }
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
  const list = await api<Paginated<ApiCountry>>('GET', `/orgs/${orgId}/event-sources/countries`)
  countriesCache = list.items
  return list.items
}

/**
 * The when of the pipeline: the schedule, plus the org's holiday calendar.
 *
 * NO event-source and NO slot call (INT-8). Ward confirmed on 2026-08-17 that
 * both are superseded by the org country and its holidays, and that the
 * backend feeds holidays into scheduling itself - so those requests would be
 * two round trips whose answers the product no longer acts on. The adapters
 * for them stay in the codebase for the static demo.
 */
export async function fetchScheduling(orgId: string): Promise<SchedulingGraft> {
  const [schedules, holidays] = await Promise.all([
    api<Paginated<ApiSchedule>>('GET', `/orgs/${orgId}/schedules`, { query: { limit: 20 } }),
    fetchHolidays(orgId),
  ])
  const first = schedules.items[0] ?? null
  return {
    schedule: first ? adaptSchedule(first) : null,
    scheduleId: first?.id ?? null,
    // Superseded: the country is the source, and there is no keep-or-skip on
    // the wire, so an empty list is the honest answer rather than demo data
    // dressed as live data.
    eventSources: [],
    events: adaptHolidays(holidays),
    slots: [],
  }
}

/**
 * The whole calendar, in calendar order.
 *
 * Paginated to `total` rather than one page: a year of holidays for some
 * countries runs past the default 20, and a calendar that silently stopped in
 * March would look like the rest of the year has no occasions.
 */
export async function fetchHolidays(orgId: string): Promise<ApiHoliday[]> {
  const first = await api<Paginated<ApiHoliday>>('GET', `/orgs/${orgId}/holidays`, {
    query: { limit: 100, offset: 0 },
  })
  const items = [...first.items]
  while (items.length < first.total && first.items.length > 0) {
    const page = await api<Paginated<ApiHoliday>>('GET', `/orgs/${orgId}/holidays`, {
      query: { limit: 100, offset: items.length },
    })
    if (page.items.length === 0) break
    items.push(...page.items)
  }
  return items
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
