import { describe, expect, it } from 'vitest'
import { reconcileScheduleDraft } from './reconcile-draft'
import type { Schedule } from '@/data/types'

/** The pre-sync world: the static demo's schedule, in demo tone ids. */
const STATIC: Schedule = {
  activeDays: ['mon', 'tue', 'wed'],
  postsPerDay: 2,
  generateAt: '06:00',
  timezone: 'Asia/Amman',
  modelId: 'model_balanced',
  toneIds: ['tone_provocative', 'tone_warm', 'tone_atlas_custom'],
  attachToEvents: true,
  started: true,
}

/** What the live sync brings back: the org's own schedule, in real ids. */
const LIVE: Schedule = { ...STATIC, postsPerDay: 1, toneIds: ['464', '465'] }

const LIVE_TONE_IDS = ['464', '465', '466']

describe('reconcileScheduleDraft', () => {
  it('adopts the new pristine when the user has not edited', () => {
    const result = reconcileScheduleDraft({
      draft: STATIC,
      pristine: LIVE,
      liveToneIds: LIVE_TONE_IDS,
      edited: false,
    })

    expect(result).toBe(LIVE)
  })

  it('adopts after a successful save, so a saved form can never read dirty', () => {
    // The screen clears `edited` on a good save; the server re-sorts toneIds,
    // and its version is the truth.
    const justSaved: Schedule = { ...LIVE, toneIds: ['465', '464'] }

    expect(
      reconcileScheduleDraft({
        draft: justSaved,
        pristine: LIVE,
        liveToneIds: LIVE_TONE_IDS,
        edited: false,
      }),
    ).toBe(LIVE)
  })

  it('keeps a real edit, and drops only the ids no tone answers to', () => {
    const edited: Schedule = { ...STATIC, postsPerDay: 3, toneIds: ['464', 'tone_warm'] }

    const result = reconcileScheduleDraft({
      draft: edited,
      pristine: LIVE,
      liveToneIds: LIVE_TONE_IDS,
      edited: true,
    })

    expect(result.postsPerDay).toBe(3)
    expect(result.toneIds).toEqual(['464'])
  })

  it('returns the same object when an edited draft has nothing to prune', () => {
    const edited: Schedule = { ...STATIC, postsPerDay: 3, toneIds: ['464'] }

    expect(
      reconcileScheduleDraft({
        draft: edited,
        pristine: LIVE,
        liveToneIds: LIVE_TONE_IDS,
        edited: true,
      }),
    ).toBe(edited)
  })

  it('may prune an edited draft down to no tones at all', () => {
    // Honest end state: `invalid` refuses the save and the field asks for a
    // tone, rather than posting ids the org does not have.
    const edited: Schedule = { ...STATIC, postsPerDay: 3 }

    expect(
      reconcileScheduleDraft({
        draft: edited,
        pristine: LIVE,
        liveToneIds: LIVE_TONE_IDS,
        edited: true,
      }).toneIds,
    ).toEqual([])
  })

  it('never prunes against a tone list that has not arrived', () => {
    const edited: Schedule = { ...STATIC, postsPerDay: 3 }

    expect(
      reconcileScheduleDraft({
        draft: edited,
        pristine: LIVE,
        liveToneIds: [],
        edited: true,
      }),
    ).toBe(edited)
  })

  it('never prunes across a stale seam between the tone list and the schedule', () => {
    // Brand and scheduling graft independently, so a render can hold a LIVE
    // schedule beside the demo's tone list. Pruning there would drop ids that
    // are perfectly real.
    const edited: Schedule = { ...LIVE, postsPerDay: 3 }

    expect(
      reconcileScheduleDraft({
        draft: edited,
        pristine: LIVE,
        liveToneIds: ['tone_provocative', 'tone_warm'],
        edited: true,
      }),
    ).toBe(edited)
  })
})
