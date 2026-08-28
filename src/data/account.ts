/**
 * The account/org seam (INT-2): me, change-password, and the org record.
 *
 * - `createWorkspace` is where a workspace becomes real. It used to be
 *   `finishOnboarding`, the wizard's last screen, and it pushed four things
 *   at once — org, preset tones, schedule, country. **The wizard is gone**
 *   (ORDER ONB-0827, D-ONB-C) and so are three of the four: tones are the
 *   user's to write (D-ONB-B), the posting rhythm belongs to the Calendar
 *   editor, and the country belongs to I1. What is left is the org, which is
 *   the only thing that cannot be set from Settings because Settings needs it
 *   to exist first.
 * - `changePassword` revokes every OTHER session server-side; this one stays
 *   valid, which is why nothing here purges local state.
 * - `updateOrgName` backs I1's save in live mode; the org's other fields
 *   (offer, differentiators, CTA, logo) have no API home yet — they stay
 *   static-dispatched, awaiting the brand phase.
 */
import { api } from '@/api/client'
import { isLiveMode } from '@/api/config'
import { isApiError } from '@/api/errors'
import type { ApiOrg, ApiOrgSummary, ApiUser, Paginated } from '@/api/types'
import type { AuthActionResult } from '@/data/auth'
import { useDataDispatch, useLiveWorkingOrgId } from '@/data/provider'

const ok: AuthActionResult = { ok: true }

function failure(error: unknown): AuthActionResult {
  if (isApiError(error)) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldDetails,
      reason: error.reason,
      retryAfterSeconds: error.retryAfterSeconds,
      requestId: error.requestId,
    }
  }
  throw error
}

export function useAccountActions() {
  const dispatch = useDataDispatch()
  const orgId = useLiveWorkingOrgId()
  const live = isLiveMode()

  return {
    async updateProfileName(name: string): Promise<AuthActionResult> {
      if (!live) return ok
      try {
        await api<ApiUser>('PATCH', '/me', { body: { name } })
        dispatch({ type: 'live/resync' })
        return ok
      } catch (error) {
        return failure(error)
      }
    },

    async changePassword(input: {
      currentPassword: string
      newPassword: string
    }): Promise<AuthActionResult> {
      if (!live) return ok
      try {
        await api<void>('POST', '/me/change-password', { body: input })
        return ok
      } catch (error) {
        return failure(error)
      }
    },

    /**
     * The workspace, created once and idempotently (ORDER ONB-0827, D-ONB-C).
     *
     * Called right after the email is verified, from the name the user typed
     * at signup — and again from `EmptyOrgScreen` when that first attempt did
     * not land. There is no wizard between signup and the product any more, so
     * this is the ONLY thing standing between a verified account and the app.
     *
     * IDEMPOTENCY, and it is the whole point: a lost response to `POST /orgs`
     * used to mint a SECOND workspace on the retry (E2E-0820 F12). So the
     * user's own orgs are read first and one matching the name is reused. If
     * that read fails we fall through and create — the user asked for a
     * workspace, and a duplicate is a better outcome than a dead end.
     *
     * Nothing else is pushed. Tones, the posting schedule and the country all
     * have durable homes in Settings and the Calendar, and pushing them from
     * here is exactly what left org 619 half-built while reporting success.
     *
     * STATIC: the same call, resolved in the reducer — every demo world works
     * without a wire, which is the law that made integration a swap.
     */
    async createWorkspace(name: string): Promise<AuthActionResult> {
      if (!live) {
        dispatch({ type: 'workspace/created', name })
        return ok
      }
      try {
        let existing: string | null = null
        try {
          const mine = await api<Paginated<ApiOrgSummary>>('GET', '/me/orgs')
          existing = mine.items.find((org) => org.name === name)?.id ?? null
        } catch {
          existing = null
        }

        if (!existing) {
          await api<{ org: ApiOrg }>('POST', '/orgs', { body: { name } })
        }

        // The resync re-reads /me/orgs, which is what flips `org.exists` and
        // opens the product. Nothing here sets that flag by hand.
        dispatch({ type: 'live/resync' })
        return ok
      } catch (error) {
        return failure(error)
      }
    },

    async updateOrgName(name: string): Promise<AuthActionResult> {
      if (!live || !orgId) return ok
      try {
        await api<ApiOrg>('PATCH', `/orgs/${orgId}`, { body: { name } })
        dispatch({ type: 'live/resync' })
        return ok
      } catch (error) {
        return failure(error)
      }
    },
  }
}
