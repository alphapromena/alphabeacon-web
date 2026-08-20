import { describe, expect, it } from 'vitest'
import { planRun, reconcileSelection } from './run-plan'
import type { Tone } from '@/data/types'

const tone = (id: string): Tone => ({
  id,
  name: id,
  kind: 'preset',
  description: '',
  rules: { do: [], dont: [] },
})

const TONES = [tone('t1'), tone('t2'), tone('t3')]

describe('planRun', () => {
  it('counts the product of the selected tones and the drafts per tone', () => {
    expect(planRun(TONES, ['t1', 't2'], 1).fanout).toBe(2)
    expect(planRun(TONES, ['t1', 't2'], 2).fanout).toBe(4)
  })

  it('reports empty — not a count — when no tone is selected', () => {
    const plan = planRun(TONES, [], 1)

    expect(plan.empty).toBe(true)
    expect(plan.fanout).toBe(0)
    expect(plan.tones).toEqual([])
  })

  it('ignores ids no tone answers to any more (E2E-0820 F5)', () => {
    // The pre-sync world's id survived in the selection; it is not a draft.
    const plan = planRun(TONES, ['tone_warm', 't1', 't2'], 1)

    expect(plan.fanout).toBe(2)
    expect(plan.tones.map((entry) => entry.id)).toEqual(['t1', 't2'])
  })

  it('is empty when the only selected id is a ghost', () => {
    const plan = planRun(TONES, ['tone_warm'], 1)

    expect(plan.empty).toBe(true)
    expect(plan.fanout).toBe(0)
  })

  it('flags a fan-out the platform would refuse — and only that', () => {
    // The contract refuses tones x perTone GREATER than 6, so the picker's own
    // ceiling (3 tones, 2 each) sits exactly on the limit and is allowed.
    expect(planRun(TONES, ['t1', 't2', 't3'], 2).overBudget).toBe(false)
    expect(planRun([...TONES, tone('t4')], ['t1', 't2', 't3', 't4'], 2).overBudget).toBe(true)
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
