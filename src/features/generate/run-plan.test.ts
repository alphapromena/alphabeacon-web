import { describe, expect, it } from 'vitest'
import { planRun, reconcileSelection } from './run-plan'
import type { Tone } from '@/data/types'

const tone = (id: string): Tone => ({
  id,
  name: id,
  description: '',
  rules: { do: [], dont: [] },
})

const TONES = [tone('t1'), tone('t2'), tone('t3')]

describe('planRun', () => {
  it('counts one draft per selected tone (HSN-01: the per-tone multiplier is gone)', () => {
    expect(planRun(TONES, ['t1', 't2']).fanout).toBe(2)
    expect(planRun(TONES, ['t1', 't2', 't3']).fanout).toBe(3)
  })

  it('reports empty — not a count — when no tone is selected', () => {
    const plan = planRun(TONES, [])

    expect(plan.empty).toBe(true)
    expect(plan.fanout).toBe(0)
    expect(plan.tones).toEqual([])
  })

  it('ignores ids no tone answers to any more (E2E-0820 F5)', () => {
    // The pre-sync world's id survived in the selection; it is not a draft.
    const plan = planRun(TONES, ['tone_warm', 't1', 't2'])

    expect(plan.fanout).toBe(2)
    expect(plan.tones.map((entry) => entry.id)).toEqual(['t1', 't2'])
  })

  it('is empty when the only selected id is a ghost', () => {
    const plan = planRun(TONES, ['tone_warm'])

    expect(plan.empty).toBe(true)
    expect(plan.fanout).toBe(0)
  })

  /**
   * A workspace with NO tones at all is a real state since ONB-0827 (D-ONB-B):
   * nothing is seeded, so a fresh live org has an empty library until its
   * owner writes the first tone. The plan must report that as empty rather
   * than as a run of nothing — the readiness gate stops it reaching the wire,
   * and the Phase-0 probe recorded what the wire says if it does (400
   * bad_request, request ae30783f-f28d-4d5a-9ac6-88c92da1a2a9).
   */
  it('is empty for an org with no tones at all, not a run of zero drafts', () => {
    const plan = planRun([], [])

    expect(plan.empty).toBe(true)
    expect(plan.fanout).toBe(0)
    expect(plan.tones).toEqual([])
  })
})

describe('reconcileSelection', () => {
  it('returns the same array when every id still resolves', () => {
    const selected = ['t1', 't2']

    expect(reconcileSelection(TONES, selected)).toBe(selected)
  })

  it('drops ids that no longer exist', () => {
    expect(reconcileSelection(TONES, ['tone_warm', 't2'])).toEqual(['t2'])
  })

  it('falls back to the first tone when everything went stale', () => {
    expect(reconcileSelection(TONES, ['tone_warm'])).toEqual(['t1'])
  })

  it('leaves an org with no tones with nothing selected', () => {
    expect(reconcileSelection([], ['tone_warm'])).toEqual([])
  })
})
