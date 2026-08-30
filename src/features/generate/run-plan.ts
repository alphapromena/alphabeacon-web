/**
 * What a generate run will actually do, resolved against the tones that exist
 * RIGHT NOW (E2E-0820 F5).
 *
 * F1 keeps its tone selection as a list of ids, and the ids it starts with are
 * seeded from whatever `useTones()` returned on first paint. In live mode that
 * is the pre-sync world: `live/orgSynced` later REPLACES `world.tones`
 * wholesale with the ids the API minted, so an id chosen a moment earlier can
 * stop existing while it is still in the selection. The summary counted the
 * raw id list and the run body counted the intersection, so the two disagreed
 * — a ghost id read as "3 drafts" over two highlighted tones, and as "1 draft"
 * over none at all.
 *
 * Resolving through the tone records is what keeps the promise honest: the
 * number on screen is computed from the same tones the request will carry.
 */
import type { Tone } from '@/data/types'

export interface RunPlan {
  /** The selected tones that still exist, in the org's own order. */
  tones: Tone[]
  /** One draft per selected tone (HSN-01) — exactly what the run will produce. */
  fanout: number
  /** Nothing resolves, so there is nothing to run and nothing to count. */
  empty: boolean
}

export function planRun(tones: Tone[], selectedIds: string[]): RunPlan {
  const resolved = tones.filter((tone) => selectedIds.includes(tone.id))
  return {
    tones: resolved,
    fanout: resolved.length,
    empty: resolved.length === 0,
  }
}

/**
 * The selection, minus ids no tone answers to any more.
 *
 * Returns the SAME array when nothing was stale, so this can drive a state
 * setter without looping. An emptied selection falls back to the first tone —
 * the same default the screen opens with — rather than leaving a picker that
 * looks broken.
 */
export function reconcileSelection(tones: Tone[], selectedIds: string[]): string[] {
  const live = selectedIds.filter((id) => tones.some((tone) => tone.id === id))
  if (live.length === selectedIds.length) return selectedIds
  return live.length > 0 ? live : tones.slice(0, 1).map((tone) => tone.id)
}
