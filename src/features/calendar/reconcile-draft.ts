/**
 * Keeping C1's edit draft honest when the world changes under it
 * (E2E-0820 B9 — F5's defect class, on the schedule screen this time).
 *
 * The form mounts before the live sync lands, so its draft is seeded from the
 * PRE-SYNC world: the static demo's schedule, whose `toneIds` name tones this
 * org does not have. `live/orgSynced` then replaces `world.tones` and
 * `world.schedule` wholesale, and the old rule — adopt if the draft still
 * matches the last pristine, otherwise never touch — stranded anyone who had
 * typed before the sync arrived: the picker showed the five real tones while
 * the draft still held seven demo ids, the save bar could never go clean, and
 * Save would have posted ghost ids.
 *
 * Three rules, in this order:
 *
 * 1. **An unedited draft adopts.** Nothing of the user's is at stake, so the
 *    new pristine simply becomes the draft — including after a successful
 *    save, where the server's version (it re-sorts `toneIds`) IS the truth and
 *    the leave-guard must never fire on work already saved.
 * 2. **An edited draft keeps its edits, minus what cannot exist.** Ids no tone
 *    answers to are dropped — never the edit itself. Pruning to nothing is an
 *    allowed outcome: `invalid` then refuses the save and the field asks for a
 *    tone, which is the honest end of "you picked tones that are not here".
 * 3. **Never prune on evidence that has not arrived.** An empty tone list is
 *    "not loaded yet", not "this org has no tones"; and a tone list the
 *    pristine itself does not resolve against belongs to a different sync
 *    generation, so pruning across that seam would drop perfectly real ids.
 *
 * `edited` is tracked explicitly by the screen rather than inferred by
 * comparing the draft to the last pristine. The inference version looked
 * equivalent and was not: the two halves of the sync graft independently, so
 * the "last pristine" ref could advance to the live schedule on a render where
 * the draft had not adopted yet, and the next pass read a perfectly untouched
 * draft as an edit and pruned it to nothing. What the rule means is "did the
 * USER change something", so that is what gets recorded.
 */
import type { Schedule } from '@/data/types'

export function reconcileScheduleDraft(input: {
  /** What the form currently holds. */
  draft: Schedule
  /** The pristine that has just arrived. */
  pristine: Schedule
  /** Ids of the tones that exist in the world right now. */
  liveToneIds: string[]
  /** Has the USER changed anything since the last adopt or save? */
  edited: boolean
}): Schedule {
  const { draft, pristine, liveToneIds, edited } = input

  if (!edited) return pristine
  if (liveToneIds.length === 0) return draft
  if (!pristine.toneIds.every((id) => liveToneIds.includes(id))) return draft

  const kept = draft.toneIds.filter((id) => liveToneIds.includes(id))
  // Same object when there is nothing to drop: this drives a state setter, and
  // a fresh object every sync would re-render forever.
  if (kept.length === draft.toneIds.length) return draft
  return { ...draft, toneIds: kept }
}
