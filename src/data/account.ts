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
import type { ApiOrg, ApiSchedule, ApiTone, ApiUser, CountryReceipt } from '@/api/types'
import { MODEL_ALIAS_BY_ID } from '@/data/adapters/scheduling-adapter'
import type { AuthActionResult } from '@/data/auth'
import { joinRules } from '@/data/adapters/brand-adapter'
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
     * Finishing the wizard is where the workspace becomes real. Everything the
     * steps collected has to be written HERE, in this order, because none of
     * it can exist before the org does:
     *
     *   org -> preset tones (with their rules) -> schedule (with the REAL tone
     *   ids the seeding just minted) -> country (which loads the holidays)
     *
     * The tone step is what closes open-items 10's empty-`toneIds` note: the
     * wizard picks tones by their STATIC ids, which mean nothing server-side,
     * so the seeding's own answers are mapped back by name and the schedule
     * gets ids that actually resolve.
     *
     * Country is last and deliberately so: it takes ~10 s and a failure there
     * must not cost the user the org, the tones or the schedule. Everything
     * after the org is best-effort for the same reason - the settings screens
     * can redo any of it, and the resync at the end reads back what landed.
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
        // marked with the wire's own `preset` flag and carrying their rules
        // (D-INT-C). Backend still asked to seed server-side (open-items 26).
        const seeded = await Promise.allSettled(
          PRESET_TONES.map((tone) =>
            api<ApiTone>('POST', `/orgs/${orgId}/brand/tones`, {
              body: {
                name: tone.name,
                description: tone.description,
                preset: true,
                rules: joinRules(tone.rules),
              },
            }),
          ),
        )

        // Static preset id -> the id the API just minted, matched by name.
        const liveToneIdByStaticId: Record<string, string> = {}
        seeded.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            liveToneIdByStaticId[PRESET_TONES[index].id] = result.value.id
          }
        })
        const toneIds = input.schedule.toneIds
          .map((staticId) => liveToneIdByStaticId[staticId])
          .filter(Boolean)

        await api<ApiSchedule>('POST', `/orgs/${orgId}/schedules`, {
          body: {
            timezone: input.schedule.timezone,
            days: input.schedule.activeDays,
            generateAt: input.schedule.generateAt,
            postsPerDay: input.schedule.postsPerDay,
            modelAlias: MODEL_ALIAS_BY_ID[input.schedule.modelId] ?? 'balanced',
            toneIds,
            eventAware: input.schedule.attachToEvents,
            active: input.schedule.started,
          },
        }).catch(() => undefined)

        // The country loads the holiday calendar and scheduling consumes it
        // automatically (D-INT-F). One country, not a list of sources: the
        // event-source surface it replaced is superseded.
        const country = input.holidayCountryCodes[0]
        if (country) {
          await api<CountryReceipt>('PUT', `/orgs/${orgId}/country`, {
            body: { country },
          }).catch(() => undefined)
        }

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
