/**
 * Where to go back to after a sign-in (NIGHT-0916 order 3; D-NIGHT-0916-C).
 *
 * A signed-out visit to an app path — a deep link with no session, a token
 * that died mid-session — lands on login. The path the person meant (pathname
 * plus search) is remembered here, in sessionStorage under one key, BEFORE the
 * navigation to login, and the sign-in screen takes it on success: reads it,
 * clears it, goes there. Absent, sign-in lands where it always did (`/`, the
 * Dashboard through RootGate).
 *
 * Only an app route is worth remembering: a same-origin path that starts with
 * one slash — never protocol-relative (`//host`), never absolute, never a
 * marketing or auth path (those are not "where the person was" in the app).
 * A deliberate sign-out clears it (the person is leaving, not coming back).
 * Signup and verify never read it: a new account starts where new accounts
 * start. sessionStorage survives a refresh and dies with the tab — a new tab
 * starts clean, which is the intended scope. Storage that throws (a private
 * window, a blocked store) reads as absent and writes as nothing.
 */
export const RETURN_TO_KEY = 'ab-return-to'

/** Not "where the person was in the app": the visitor world and the auth walk. */
const NOT_APP_PATHS = new Set([
  '/',
  '/login',
  '/signup',
  '/verify-email',
  '/reset-password',
  '/accept-invite',
  '/onboarding',
  '/request-access',
  '/pricing',
  '/request-demo',
  '/privacy',
  '/terms',
])

/** An app route: one leading slash, same origin, outside the visitor and auth worlds. */
export function isAppPath(candidate: unknown): candidate is string {
  if (typeof candidate !== 'string') return false
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return false
  if (candidate.startsWith('/\\')) return false
  if (/[\r\n\0]/.test(candidate)) return false
  const pathname = candidate.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/'
  if (NOT_APP_PATHS.has(pathname)) return false
  if (pathname.startsWith('/dev/')) return false
  return true
}

function store(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/** Remember an intended app path; anything else is not remembered. */
export function rememberReturnTo(path: string): void {
  if (!isAppPath(path)) return
  try {
    store()?.setItem(RETURN_TO_KEY, path)
  } catch {
    // Storage that throws is storage that is absent.
  }
}

/** Read AND clear the remembered path; absent, or not an app path, is null. */
export function takeReturnTo(): string | null {
  try {
    const target = store()
    if (!target) return null
    const value = target.getItem(RETURN_TO_KEY)
    target.removeItem(RETURN_TO_KEY)
    return isAppPath(value) ? value : null
  } catch {
    return null
  }
}

export function clearReturnTo(): void {
  try {
    store()?.removeItem(RETURN_TO_KEY)
  } catch {
    // Nothing to clear where nothing can be stored.
  }
}
