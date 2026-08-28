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
import { isApiError, type ApiErrorCode } from '@/api/errors'
import type {
  ApiOrg,
  ApiOrgSummary,
  ApiSchedule,
  ApiTone,
  ApiUser,
  CountryReceipt,
  Paginated,
} from '@/api/types'
import { MODEL_ALIAS_BY_ID } from '@/data/adapters/scheduling-adapter'
import type { AuthActionResult } from '@/data/auth'
import { useDataDispatch, useLiveWorkingOrgId } from '@/data/provider'
import type { Schedule } from '@/data/types'

/**
 * A step of Finish that did not land (E2E-0820 F12).
 *
 * The org itself either exists or it does not — that is the ok/not-ok axis.
 * Everything after it is repairable from Settings, so a failure there is
 * reported rather than thrown away, and named so the toast can say WHICH part
 * of the workspace is missing instead of "something went wrong".
 */
export interface FinishStepFailure {
  step: 'schedule' | 'country'
  code?: ApiErrorCode
  /** The envelope's requestId, for a bug report (open-items 3). */
  requestId?: string
}

export type FinishOnboardingResult =
  | { ok: true; incomplete: FinishStepFailure[] }
  | Extract<AuthActionResult, { ok: false }>

/** Reads an ApiError into a step failure; anything else re-throws. */
function stepFailure(step: FinishStepFailure['step'], error: unknown): FinishStepFailure {
  if (isApiError(error)) return { step, code: error.code, requestId: error.requestId }
  return { step }
}

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
     *   org -> schedule (with the tone ids the org really has) -> country
     *   (which loads the holidays)
     *
     * THE TONE-SEEDING STEP IS GONE (ORDER ONB-0827, D-ONB-B). It used to sit
     * between the org and the schedule, planting five presets so the schedule
     * had ids to point at; a fresh live org now starts with zero tones on
     * purpose, and the schedule carries only ids that resolve.
     *
     * THREE RULES, all of them learned from org 619 (E2E-0820 F12), whose
     * workspace came out of this function with tones but no schedule and no
     * country while the wizard reported success:
     *
     * 1. **Every step is attempted.** A failure part-way no longer skips what
     *    comes after it — the country is worth setting even if the schedule
     *    would not save.
     * 2. **Nothing is swallowed.** Each failure is collected with its code and
     *    the envelope's requestId, and handed back so the screen can say which
     *    part of the workspace is missing. Silence here is what turned a
     *    half-built org into a mystery.
     * 3. **Re-running repairs rather than duplicates.** The org is reused when
     *    the user already owns one by this name (a lost response to `POST
     *    /orgs` used to mint a second workspace on the retry), and a schedule
     *    is created only when the org has none.
     *
     * Country stays last: it takes ~10 s, and the steps before it should not
     * be waiting on the holiday calendar to load.
     */
    async finishOnboarding(input: {
      orgName: string
      schedule: Schedule
      holidayCountryCodes: string[]
    }): Promise<FinishOnboardingResult> {
      if (!live) return { ok: true, incomplete: [] }
      try {
        // IDEMPOTENCY, step 1: a retry after a lost response must not mint a
        // second workspace. If the read fails we fall through and create —
        // the user asked to finish, and a duplicate is better than a dead end.
        let existingOrgId: string | null = null
        try {
          const mine = await api<Paginated<ApiOrgSummary>>('GET', '/me/orgs')
          existingOrgId = mine.items.find((org) => org.name === input.orgName)?.id ?? null
        } catch {
          existingOrgId = null
        }

        const orgId =
          existingOrgId ??
          (
            await api<{ org: ApiOrg }>('POST', '/orgs', {
              body: { name: input.orgName },
            })
          ).org.id

        const incomplete: FinishStepFailure[] = []

        // NO SEEDED TONES, EVER (ORDER ONB-0827, D-ONB-B). A fresh live org
        // starts with ZERO tones and the user writes their first one from
        // Settings. The five presets were only ever a client-side product law
        // ("always present", tones.ts) that this function planted because the
        // API has no seeding — planting them made every workspace claim five
        // voices its owner never chose. `PRESET_TONES` stays what it always
        // was for the DEMO world; nothing plants it live.
        //
        // What the wizard collected is therefore resolved against the tones
        // the org REALLY has: a tone created mid-wizard is a real live row and
        // passes through, while a static preset id names nothing server-side
        // and is dropped rather than written as a dangling reference. An
        // unreadable list resolves to none — a schedule with no tones is the
        // honest answer, and Settings repairs it.
        let liveToneIds = new Set<string>()
        try {
          liveToneIds = new Set(
            (await api<Paginated<ApiTone>>('GET', `/orgs/${orgId}/brand/tones`)).items.map(
              (tone) => tone.id,
            ),
          )
        } catch {
          liveToneIds = new Set()
        }

        const toneIds = input.schedule.toneIds.filter((id) => liveToneIds.has(id))

        // IDEMPOTENCY, step 3: one schedule per org. A second Finish leaves
        // the existing one alone rather than stacking another beside it.
        let hasSchedule = false
        try {
          hasSchedule =
            (await api<Paginated<ApiSchedule>>('GET', `/orgs/${orgId}/schedules`)).items.length > 0
        } catch {
          hasSchedule = false
        }
        if (!hasSchedule) {
          try {
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
            })
          } catch (error) {
            incomplete.push(stepFailure('schedule', error))
          }
        }

        // The country loads the holiday calendar and scheduling consumes it
        // automatically (D-INT-F). One country, not a list of sources: the
        // event-source surface it replaced is superseded. A PUT, so re-running
        // it is free.
        const country = input.holidayCountryCodes[0]
        if (country) {
          try {
            await api<CountryReceipt>('PUT', `/orgs/${orgId}/country`, {
              body: { country },
            })
          } catch (error) {
            incomplete.push(stepFailure('country', error))
          }
        }

        dispatch({ type: 'live/resync' })
        return { ok: true, incomplete }
      } catch (error) {
        return failure(error) as Extract<AuthActionResult, { ok: false }>
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
