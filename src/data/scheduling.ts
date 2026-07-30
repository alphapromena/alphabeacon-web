/**
 * The scheduling seam (INT-4): the schedule, event sources, and slot
 * decisions — one signature, two implementations.
 *
 * Live rules, straight from the contract:
 * - There is a LIST of schedules; the app works the first. Saving creates it
 *   when none exists and PATCHes it after; `toneIds` REPLACES the whole
 *   selection, and per-field validation lands back on the caller via
 *   `fieldErrors` (a tone id from another org is refused with one entry per
 *   offending id — nothing written).
 * - The model picker maps through THE table (`scheduling-adapter`), never ad
 *   hoc.
 * - Event sources are `holidays` + a country from the countries endpoint;
 *   one per country (409). Deleting one deletes every slot it produced.
 * - Slots are written by ingestion; `{skip}` is the entire mutation surface.
 *   `approved` is pipeline-owned and unreachable from here by construction.
 */
import { api } from '@/api/client'
import { isLiveMode } from '@/api/config'
import { isApiError } from '@/api/errors'
import type { ApiCountry, ApiEventSource, ApiSchedule, ApiSlot } from '@/api/types'
import type { AuthActionResult } from '@/data/auth'
import { fetchCountries } from '@/data/live-sync'
import { MODEL_ALIAS_BY_ID } from '@/data/adapters/scheduling-adapter'
import {
  useDataDispatch,
  useLiveScheduleId,
  useLiveWorkingOrgId,
} from '@/data/provider'
import type { CalendarSource, Schedule } from '@/data/types'

/** The countries reference list, re-exported so features stay off src/api. */
export type Country = ApiCountry

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

export function useSchedulingActions() {
  const dispatch = useDataDispatch()
  const orgId = useLiveWorkingOrgId()
  const scheduleId = useLiveScheduleId()
  const live = isLiveMode()

  const resync = () => dispatch({ type: 'live/resync' })

  return {
    /** C1's save. The whole draft is the payload; the server validates. */
    async saveSchedule(draft: Schedule): Promise<AuthActionResult> {
      if (!live || !orgId) {
        dispatch({ type: 'schedule/update', patch: draft })
        return ok
      }
      const body = {
        timezone: draft.timezone,
        days: draft.activeDays,
        generateAt: draft.generateAt,
        postsPerDay: draft.postsPerDay,
        modelAlias: MODEL_ALIAS_BY_ID[draft.modelId] ?? 'balanced',
        toneIds: draft.toneIds,
        eventAware: draft.attachToEvents,
        active: draft.started,
      }
      try {
        if (scheduleId) {
          await api<ApiSchedule>('PATCH', `/orgs/${orgId}/schedules/${scheduleId}`, { body })
        } else {
          await api<ApiSchedule>('POST', `/orgs/${orgId}/schedules`, { body })
        }
        dispatch({ type: 'schedule/update', patch: draft })
        resync()
        return ok
      } catch (error) {
        return failure(error)
      }
    },

    /** The countries picker's options; null in static mode (local list). */
    async listCountries(): Promise<ApiCountry[] | null> {
      if (!live || !orgId) return null
      try {
        return await fetchCountries(orgId)
      } catch {
        return null
      }
    },

    async addHolidaySource(
      countryCode: string,
      staticSource: CalendarSource,
    ): Promise<AuthActionResult> {
      if (!live || !orgId) {
        dispatch({ type: 'eventSources/add', source: staticSource })
        return ok
      }
      try {
        await api<ApiEventSource>('POST', `/orgs/${orgId}/event-sources`, {
          body: { kind: 'holidays', country: countryCode },
        })
        resync()
        return ok
      } catch (error) {
        return failure(error)
      }
    },

    /** Server-side, this also deletes every slot the source produced. */
    async removeEventSource(sourceId: string): Promise<AuthActionResult> {
      if (!live || !orgId) {
        dispatch({ type: 'eventSources/remove', sourceId })
        return ok
      }
      try {
        await api<void>('DELETE', `/orgs/${orgId}/event-sources/${sourceId}`)
        resync()
        return ok
      } catch (error) {
        return failure(error)
      }
    },

    async skipSlot(slotId: string): Promise<AuthActionResult> {
      if (!live || !orgId) {
        dispatch({ type: 'slot/skip', slotId })
        return ok
      }
      try {
        await api<ApiSlot>('PATCH', `/orgs/${orgId}/slots/${slotId}`, {
          body: { skip: true },
        })
        dispatch({ type: 'slot/skip', slotId })
        resync()
        return ok
      } catch (error) {
        return failure(error)
      }
    },

    async unskipSlot(slotId: string): Promise<AuthActionResult> {
      if (!live || !orgId) {
        dispatch({ type: 'slot/unskip', slotId })
        return ok
      }
      try {
        await api<ApiSlot>('PATCH', `/orgs/${orgId}/slots/${slotId}`, {
          body: { skip: false },
        })
        dispatch({ type: 'slot/unskip', slotId })
        resync()
        return ok
      } catch (error) {
        return failure(error)
      }
    },
  }
}
