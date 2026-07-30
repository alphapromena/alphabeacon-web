/**
 * The account/org seam (INT-2): me, change-password, and the org record.
 *
 * - `createOrg` is the onboarding wizard's live completion: the creator
 *   becomes the first owner, and the resync that follows re-reads /me/orgs so
 *   the world flips from "no workspace" to the new one.
 * - `changePassword` revokes every OTHER session server-side; this one stays
 *   valid, which is why nothing here purges local state.
 * - `updateOrgName` backs I1's save in live mode; the org's other fields
 *   (offer, differentiators, CTA, logo) have no API home yet — they stay
 *   static-dispatched, awaiting the brand phase.
 */
import { api } from '@/api/client'
import { isLiveMode } from '@/api/config'
import { isApiError } from '@/api/errors'
import type { ApiOrg, ApiSchedule, ApiTone, ApiUser } from '@/api/types'
import { MODEL_ALIAS_BY_ID } from '@/data/adapters/scheduling-adapter'
import type { AuthActionResult } from '@/data/auth'
import { PRESET_TONES } from '@/data/entities/tones'
import { useDataDispatch, useLiveWorkingOrgId } from '@/data/provider'
import type { Schedule } from '@/data/types'

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

    async createOrg(name: string): Promise<AuthActionResult> {
      if (!live) return ok
      try {
        await api<{ org: ApiOrg }>('POST', '/orgs', { body: { name } })
        dispatch({ type: 'live/resync' })
        return ok
      } catch (error) {
        return failure(error)
      }
    },

    /**
     * The wizard's Finish, in one transaction-shaped action: the wizard runs
     * BEFORE the org exists in live mode, so its collected schedule and
     * holiday choices must ride along with the org creation — otherwise the
     * five steps would configure a world that vanishes at the last click.
     * Failures after the org exists are non-fatal (the settings screens can
     * redo them); the resync at the end reads back whatever landed.
     */
    async finishOnboarding(input: {
      orgName: string
      schedule: Schedule
      holidayCountryCodes: string[]
    }): Promise<AuthActionResult> {
      if (!live) return ok
      try {
        const created = await api<{ org: ApiOrg }>('POST', '/orgs', {
          body: { name: input.orgName },
        })
        const orgId = created.org.id
        // The five preset tones are product law ("always present", tones.ts);
        // the API has no seeding, so the org's first owner plants them here,
        // marked with the wire's own `preset` flag. Backend asked to seed
        // server-side instead (open-items).
        await Promise.allSettled(
          PRESET_TONES.map((tone) =>
            api<ApiTone>('POST', `/orgs/${orgId}/brand/tones`, {
              body: { name: tone.name, description: tone.description, preset: true },
            }),
          ),
        )
        await Promise.allSettled([
          api<ApiSchedule>('POST', `/orgs/${orgId}/schedules`, {
            body: {
              timezone: input.schedule.timezone,
              days: input.schedule.activeDays,
              generateAt: input.schedule.generateAt,
              postsPerDay: input.schedule.postsPerDay,
              modelAlias: MODEL_ALIAS_BY_ID[input.schedule.modelId] ?? 'balanced',
              // Tone ids collected statically have no live meaning pre-org;
              // tones are picked again in settings once they exist (INT-3).
              toneIds: [],
              eventAware: input.schedule.attachToEvents,
              active: input.schedule.started,
            },
          }),
          ...input.holidayCountryCodes.map((country) =>
            api('POST', `/orgs/${orgId}/event-sources`, {
              body: { kind: 'holidays', country },
            }),
          ),
        ])
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
