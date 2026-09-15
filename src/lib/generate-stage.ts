/**
 * MOMENT 4 (ORDER MOTION-0914/B) — what a run is ACTUALLY doing, right now.
 *
 * The screen said "Writing your draft…" from the moment a run was accepted
 * until the moment it finished, which is one sentence covering three different
 * things and is wrong for two of them: for the first stretch nothing has been
 * written at all, and by the end the grounding chips are arriving beside the
 * copy and nobody has said so.
 *
 * ## Every stage is read off something observable, and there are only three
 *
 * There is no timer here, no easing, no invented progress and above all no
 * percentage — the product does not know how much of a run remains, and a bar
 * that implied it would be the fake progress the design law refuses
 * (design.md Part 5). Each stage is a fact that has already happened:
 *
 *   accepted  — the run has started and NOT ONE WORD has arrived yet.
 *   writing   — words are arriving.
 *   grounding — words are arriving AND a cited claim has surfaced beside them.
 *
 * It can only move forward, and it moves when the thing it describes changes.
 * If a run drops before a claim appears, the stage simply never reaches
 * `grounding` — it does not skip ahead to look complete.
 */
export type GenerateStage = 'accepted' | 'writing' | 'grounding'

export function generateStage(input: { text: string; claimCount: number }): GenerateStage {
  if (input.text.trim().length === 0) return 'accepted'
  return input.claimCount > 0 ? 'grounding' : 'writing'
}

/**
 * What each stage says out loud. Present continuous, because it is happening;
 * no ellipsis on the last one, because grounding is the part that finishes.
 */
export const GENERATE_STAGE_LINE: Record<GenerateStage, string> = {
  accepted: 'Reading your brand voice, tones and sources…',
  writing: 'Writing your draft…',
  grounding: 'Checking the claims it made against your sources…',
}
