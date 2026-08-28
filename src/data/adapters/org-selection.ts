/**
 * Which org does this session work in? (ORDER ONB-0827-B, decisions.md
 * D-ONB-F.)
 *
 * ## Why this file exists
 *
 * The app used to answer with `orgs[0]`, which was correct for exactly as long
 * as a user could only ever have one org. ONB-0827 made every signup mint a
 * workspace, and then open-item 38 measured what that costs: an existing user
 * invited to a colleague's org **could not reach it**. `/me/orgs` orders by
 * `joinedAt` ASCENDING (measured 2026-08-28 on fresh orgs 1064/1065: their own
 * org at `15:39:27.119`, the inviting org at `15:39:28.771`), so `orgs[0]` is
 * always the org they made first, and the invitation was unreachable.
 *
 * ## The three-part rule, and where each part lives
 *
 * 1. **Accepting an invite switches to the inviting org immediately** — the
 *    caller passes the just-joined org id; `mostRecentlyJoined` below is how
 *    it is identified without guessing.
 * 2. **A session opens in the last active org it remembers** — never blindly
 *    `orgs[0]`. `selectActiveOrg` is that lookup, and the remembered id is
 *    persisted beside the session record (`src/api/session.ts`), so it
 *    survives a reload under the same `rememberMe` convention.
 * 3. **A remembered org that is gone falls back honestly** — first available
 *    org, and `fellBack: true` so the caller can say so out loud. Never a dead
 *    screen, and never demo data (trap 20): when there is no org at all this
 *    returns `null` and the workspace-creation surface owns the landing.
 *
 * Revocation really is detectable this way. Measured on the same pair: after
 * `DELETE .../members/:id`, the removed user's `/me/orgs` no longer lists the
 * org and a direct `GET /orgs/1064` answers **404 `not_found`** — existence
 * never leaks — so "the remembered id is absent from the session's list" is
 * the same fact as "membership was revoked", with no extra call to make.
 */
import type { ApiOrgSummary } from '@/api/types'

export interface ActiveOrgChoice {
  /** The org to work in, or `null` when the account has none. */
  org: ApiOrgSummary | null
  /**
   * True when a remembered org could not be honoured — it was deleted, or the
   * membership was revoked. The caller owes the user a word about it.
   */
  fellBack: boolean
}

/**
 * The org a session should open in.
 *
 * `remembered` is the last org this account actively worked in, or `null` on
 * a first run. It is looked up by id in the session's OWN org list, so a stale
 * id can never smuggle in an org the user no longer belongs to.
 */
export function selectActiveOrg(
  orgs: ApiOrgSummary[],
  remembered: string | null | undefined,
): ActiveOrgChoice {
  // No workspace at all. NOT a fallback — nothing was lost, the account simply
  // has nowhere to be yet, and `EmptyOrgScreen` is the honest landing.
  if (orgs.length === 0) return { org: null, fellBack: false }

  if (remembered) {
    const match = orgs.find((org) => org.id === remembered)
    if (match) return { org: match, fellBack: false }
    // Remembered, and gone: this is the revoked/deleted case.
    return { org: orgs[0], fellBack: true }
  }

  // First run for this account: the first org is as good an answer as exists,
  // and it is not a fallback because nothing was remembered to fall back from.
  return { org: orgs[0], fellBack: false }
}

/**
 * The org that was joined most recently — i.e. the one an invite just added.
 *
 * `/me/orgs` and the auth-session snapshot both order by `joinedAt` ascending
 * (measured, above), but this sorts rather than trusting position: an ordering
 * this rule depends on should be asserted by the code that depends on it, not
 * assumed to hold forever. Returns `null` for an empty list.
 */
export function mostRecentlyJoined(orgs: ApiOrgSummary[]): ApiOrgSummary | null {
  if (orgs.length === 0) return null
  return orgs.reduce((newest, candidate) =>
    new Date(candidate.joinedAt).getTime() > new Date(newest.joinedAt).getTime()
      ? candidate
      : newest,
  )
}
