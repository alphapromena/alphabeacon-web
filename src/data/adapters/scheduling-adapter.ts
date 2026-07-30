/**
 * Scheduling adapter (INT-4): schedules, event sources and slots.
 *
 * THE MODEL TABLE is the one explicit mapping between the app's generation
 * models and the API's `modelAlias` (fast | balanced | quality), used
 * everywhere — the task owner's rule. Balanced ↔ balanced and Precise ↔
 * quality pair semantically; Creative takes the remaining `fast` (logged in
 * open-items for the backend to confirm).
 *
 * SLOTS are the API's event keep-or-skip records (date + title + kind, no
 * time); the app's calendar slots carry a wall-clock time and draft links.
 * The graft renders each wire slot as an event + a decision slot pair:
 * `review → pending` (the skippable state), `skipped → skipped`,
 * `approved → done` (pipeline-owned; the UI can never set it). The slot's
 * time is the schedule's generateAt — presentation, not a wire fact — and a
 * skipped slot carries today's date as skippedAt so the undo affordance is
 * available, since the API allows un-skip at any time.
 */
import type { ApiEventSource, ApiSchedule, ApiSlot } from '@/api/types'
import type { CalendarEvent, CalendarSource, Schedule, Slot } from '@/data/types'

/**
 * App model id ↔ API modelAlias — THE table; nothing else may map these.
 * balanced↔balanced and precise↔quality are confirmed pairings;
 * creative↔fast is UNCONFIRMED — it takes the remaining alias by elimination,
 * pending the backend's answer (open-items 9). Change it HERE only.
 */
export const MODEL_ALIAS_BY_ID: Record<string, ApiSchedule['modelAlias']> = {
  gm_balanced: 'balanced',
  gm_creative: 'fast', // unconfirmed — see doc comment
  gm_precise: 'quality',
}

export const MODEL_ID_BY_ALIAS: Record<ApiSchedule['modelAlias'], string> = {
  balanced: 'gm_balanced',
  fast: 'gm_creative',
  quality: 'gm_precise',
}

export interface SchedulingGraft {
  /** The first (working) schedule, adapted — or null when none exists yet. */
  schedule: Schedule | null
  /** The API id of that schedule, for PATCH. */
  scheduleId: string | null
  eventSources: CalendarSource[]
  events: CalendarEvent[]
  slots: Slot[]
}

export function adaptSchedule(schedule: ApiSchedule): Schedule {
  return {
    activeDays: schedule.days,
    postsPerDay: Math.min(3, Math.max(1, schedule.postsPerDay)) as Schedule['postsPerDay'],
    generateAt: schedule.generateAt,
    timezone: schedule.timezone,
    modelId: MODEL_ID_BY_ALIAS[schedule.modelAlias] ?? 'gm_balanced',
    toneIds: schedule.toneIds,
    attachToEvents: schedule.eventAware,
    started: schedule.active,
  }
}

export function adaptScheduling(
  schedules: ApiSchedule[],
  sources: ApiEventSource[],
  slots: ApiSlot[],
  countryNames: Record<string, string>,
): SchedulingGraft {
  const first = schedules[0] ?? null
  const schedule = first ? adaptSchedule(first) : null
  const generateAt = schedule?.generateAt ?? '07:00'

  return {
    schedule,
    scheduleId: first?.id ?? null,
    eventSources: sources.map((source) => ({
      id: source.id,
      kind: 'holiday',
      label: `${countryNames[source.country] ?? source.country} public holidays`,
      status: 'active',
    })),
    events: slots.map((slot) => ({
      id: `evt_${slot.id}`,
      sourceId: slot.eventSourceId,
      name: slot.title,
      date: slot.date,
    })),
    slots: slots.map((slot) => ({
      id: slot.id,
      date: slot.date,
      time: generateAt,
      status:
        slot.status === 'skipped' ? 'skipped' : slot.status === 'approved' ? 'done' : 'pending',
      eventId: `evt_${slot.id}`,
      draftIds: [],
      skippedAt: slot.status === 'skipped' ? new Date().toISOString() : undefined,
    })),
  }
}
