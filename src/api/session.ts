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
 */
import type { AuthSession } from './types'

const KEY = 'ab-live-session'

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
  for (const storage of storages()) storage.removeItem(KEY)
}
