/**
 * The org-selection rule, asserted flat (ORDER ONB-0827-B, D-ONB-F).
 *
 * These encode a MEASUREMENT, not a preference. Open-item 38 was found by
 * probing the deployed API on 2026-08-28 with two fresh accounts that each
 * owned an org (1064 and 1065):
 *
 *   - the owner of 1064 invited the owner of 1065 -> `201 invitedNewUser:
 *     false`, and **no code was sent**: `POST /auth/accept-invite` for that
 *     user answered `400 bad_request "Invalid or expired code"` (request
 *     `4b0959ba-b8d1-409a-9816-b93aaa83ef13`). An existing user does not
 *     accept an invite; membership is simply added;
 *   - a fresh login then listed `[{1065, owner, 15:39:27.119}, {1064, member,
 *     15:39:28.771}]` — **`joinedAt` ASCENDING**, so `orgs[0]` is always the
 *     org they made first and the invitation was unreachable;
 *   - after `DELETE .../members/:id`, `/me/orgs` dropped 1064 and a direct
 *     `GET /orgs/1064` answered `404 not_found`.
 *
 * Every case below is one of those facts.
 */
import { describe, expect, it } from 'vitest'
import type { ApiOrgSummary } from '@/api/types'
import { mostRecentlyJoined, selectActiveOrg } from './org-selection'

function org(id: string, joinedAt: string, role: ApiOrgSummary['role'] = 'member'): ApiOrgSummary {
  return { id, name: `Org ${id}`, slug: `org-${id}`, status: 'active', role, joinedAt }
}

/** The measured pair: their own org first, the inviting org second. */
const OWN = org('1065', '2026-08-28T15:39:27.119Z', 'owner')
const INVITING = org('1064', '2026-08-28T15:39:28.771Z', 'member')
const BOTH = [OWN, INVITING]

describe('selectActiveOrg', () => {
  it('opens in the remembered org, not the first one', () => {
    // The whole of open-item 38 in one assertion.
    const choice = selectActiveOrg(BOTH, INVITING.id)

    expect(choice.org?.id).toBe(INVITING.id)
    expect(choice.fellBack).toBe(false)
  })

  it('falls back to the first org when the remembered one is gone, and says so', () => {
    // Membership revoked: the id is still remembered, the org is not listed.
    const choice = selectActiveOrg([OWN], INVITING.id)

    expect(choice.org?.id).toBe(OWN.id)
    expect(choice.fellBack).toBe(true)
  })

  it('takes the first org on a first run — that is not a fallback', () => {
    const choice = selectActiveOrg(BOTH, null)

    expect(choice.org?.id).toBe(OWN.id)
    // Nothing was lost, so nothing is announced.
    expect(choice.fellBack).toBe(false)
  })

  it('reports no org rather than inventing one (trap 20)', () => {
    const choice = selectActiveOrg([], 'anything')

    expect(choice.org).toBeNull()
    // An account with no workspace has not "fallen back" from anywhere — the
    // workspace-creation surface owns that landing, not a toast.
    expect(choice.fellBack).toBe(false)
  })

  it('never selects an org the session does not list', () => {
    // A stale id from another account on a shared machine must not resolve.
    const choice = selectActiveOrg([OWN], '9999')

    expect(choice.org?.id).toBe(OWN.id)
    expect(BOTH.some((entry) => entry.id === '9999')).toBe(false)
  })
})

describe('mostRecentlyJoined', () => {
  it('is the org an invite just added, whatever order the list arrives in', () => {
    expect(mostRecentlyJoined(BOTH)?.id).toBe(INVITING.id)
    // Sorted, not positional: the rule must not depend on the API's ordering
    // continuing to be ascending forever.
    expect(mostRecentlyJoined([INVITING, OWN])?.id).toBe(INVITING.id)
  })

  it('is null when there is nothing to join', () => {
    expect(mostRecentlyJoined([])).toBeNull()
  })
})
