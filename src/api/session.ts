/**
 * Session persistence for live mode — the ONE thing this app now persists
 * beyond the theme (architecture.md § Persistence records the amendment).
 *
 * The stored record is exactly the auth session response: `{ token,
 * expiresAt, user, orgs }`. `rememberMe` chooses localStorage (survives the
 * browser) over sessionStorage (survives a refresh, dies with the tab) —
 * mirroring the server's own 30d-vs-12h sliding expiry. Only one of the two
 * ever holds a session; writing to one purges the other.
 *
 * Expiry discipline: the SERVER is the authority — sliding expiry happens
 * there and the client reacts to 401. The one client-side check is on load:
 * a record whose `expiresAt` is already past is discarded rather than
 * offered, so the app never paints a signed-in frame it knows is dead.
 *
 * SECOND RECORD (ORDER ONB-0827-B, D-ONB-F): the ACTIVE ORG ID, so a session
 * opens where it left off instead of blindly in `orgs[0]`. It is kept beside
 * the session under the same `rememberMe` convention and purged with it.
 *
 * It is STAMPED WITH THE USER ID, and that is not decoration. The choice has
 * to survive signing out and back in — "the last active org it remembers" is
 * worth nothing if a fresh login forgets it — while never leaking across
 * accounts on a shared machine. Keying it to the user does both: the same
 * person gets their workspace back, a different person reads `null` and
 * chooses their own. It is deliberately NOT validated here beyond that:
 * `selectActiveOrg` resolves the id against the session's own org list, which
 * is the only place that can know whether the membership still exists.
 */
import type { AuthSession } from './types'

const KEY = 'ab-live-session'
const ACTIVE_ORG_KEY = 'ab-live-active-org'

function storages(): Storage[] {
  // sessionStorage first: a tab-scoped session outranks a remembered one,
  // matching the order a fresh sign-in would have written them.
  return [window.sessionStorage, window.localStorage]
}

export function saveSession(session: AuthSession, rememberMe: boolean): void {
  const target = rememberMe ? window.localStorage : window.sessionStorage
  const other = rememberMe ? window.sessionStorage : window.localStorage
  target.setItem(KEY, JSON.stringify(session))
  other.removeItem(KEY)
  // The active-org record follows the session to its new home, so signing in
  // again does not strand it in the storage the previous session used.
  const carried = other.getItem(ACTIVE_ORG_KEY)
  if (carried && !target.getItem(ACTIVE_ORG_KEY)) target.setItem(ACTIVE_ORG_KEY, carried)
  other.removeItem(ACTIVE_ORG_KEY)
}

interface ActiveOrgRecord {
  userId: string
  orgId: string
}

/**
 * The org this user last worked in, or `null` when there is none for THEM.
 * A record belonging to a different account reads as null rather than being
 * offered — one slot, guarded by identity.
 */
export function loadActiveOrgId(userId: string): string | null {
  for (const storage of storages()) {
    const raw = storage.getItem(ACTIVE_ORG_KEY)
    if (!raw) continue
    try {
      const record = JSON.parse(raw) as ActiveOrgRecord
      if (record.userId === userId && record.orgId) return record.orgId
    } catch {
      storage.removeItem(ACTIVE_ORG_KEY)
    }
  }
  return null
}

/**
 * Remember the org this user is working in. Written to whichever storage
 * already holds the session, so `rememberMe` is honoured without being passed
 * around; a no-op when signed out, since there is no session to qualify.
 */
export function saveActiveOrgId(userId: string, orgId: string): void {
  for (const storage of storages()) {
    if (storage.getItem(KEY)) {
      storage.setItem(ACTIVE_ORG_KEY, JSON.stringify({ userId, orgId }))
      return
    }
  }
}

export function loadSession(): AuthSession | null {
  for (const storage of storages()) {
    const raw = storage.getItem(KEY)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as AuthSession
      if (!parsed.token || !parsed.expiresAt || !parsed.user) {
        storage.removeItem(KEY)
        continue
      }
      if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
        storage.removeItem(KEY)
        continue
      }
      return parsed
    } catch {
      // A corrupt record is worse than none.
      storage.removeItem(KEY)
    }
  }
  return null
}

export function purgeSession(): void {
  for (const storage of storages()) {
    storage.removeItem(KEY)
    storage.removeItem(ACTIVE_ORG_KEY)
  }
}

/**
 * Refresh the stored record in place — same storage, same rememberMe choice.
 * Used by the boot sync: `/me` + `/me/orgs` are the truth, the stored
 * snapshot is just a warm start (open-items 6). No-op when signed out.
 */
export function updateStoredSession(session: AuthSession): void {
  for (const storage of storages()) {
    if (storage.getItem(KEY)) {
      storage.setItem(KEY, JSON.stringify(session))
      return
    }
  }
}
