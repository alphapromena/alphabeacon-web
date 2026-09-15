/**
 * MOMENT 2 (ORDER MOTION-0914/B) — "fires once per account, never again".
 *
 * The claim needs something that outlives the page, because the thing it must
 * survive is a RELOAD. In static mode the whole world is in memory and a
 * reload rebuilds it from the dataset (DEMO-0914's first finding), so any flag
 * kept in React state or in the reducer would come back cleared and the
 * welcome would play again on every refresh. `localStorage` is the only thing
 * here that does not.
 *
 * ## Keyed by the account, not by the browser
 *
 * A machine can sign up more than one account — the probes in `Docs/qa/` do it
 * several times an hour — and a single global flag would mean the second
 * account never gets its welcome. The key carries the account's own identity.
 *
 * The identity is the email, lowercased: it is what the person typed, it is
 * unique per account, and in static mode it is the ONLY account-shaped value
 * that differs between two signups (`org.id` is the dataset's `org_new` for
 * every one of them, and `user.id` is `user_new`).
 *
 * ## It is not a secret and it is not state
 *
 * No credential is stored — an address the browser already has, and a `1`. It
 * carries no meaning to anything but this animation, so a cleared storage just
 * means somebody sees a two-second welcome twice in their life.
 */

const PREFIX = 'ab-first-light'

/**
 * Storage can throw rather than merely be empty — Safari's private mode, and
 * any browser with site data blocked. A welcome animation is never worth an
 * exception, so every access is guarded and the failure mode is chosen
 * deliberately: on a read that throws we answer "already seen", so a browser
 * that cannot remember shows the moment NEVER rather than on every reload.
 */
function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

export function firstLightKey(email: string): string {
  return `${PREFIX}:${email.trim().toLowerCase()}`
}

/** True when this account has already been welcomed. Unknown counts as yes. */
export function hasSeenFirstLight(email: string): boolean {
  if (!email.trim()) return true
  const store = storage()
  if (!store) return true
  try {
    return store.getItem(firstLightKey(email)) !== null
  } catch {
    return true
  }
}

/**
 * Record it, and record it BEFORE the animation plays rather than after.
 *
 * A reload halfway through the two seconds must not replay it, and a tab
 * closed mid-welcome must not hand the next session a second one. The cost of
 * marking early is that a crash during the animation loses the moment, which
 * is the cheaper mistake by far.
 */
export function markFirstLightSeen(email: string): void {
  if (!email.trim()) return
  const store = storage()
  if (!store) return
  try {
    store.setItem(firstLightKey(email), '1')
  } catch {
    // Full, or blocked. The moment simply plays again next time.
  }
}
