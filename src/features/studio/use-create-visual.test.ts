/**
 * The Create visual form's own rules (HSN-0902): the duration is clamped on
 * a PLAN change and only then, and validated — whole seconds inside the
 * plan's range — before anything is sent. Pure functions: no provider, no
 * wire, no mode (the seam under them is pinned in `src/data/studio.test.ts`).
 */
import { describe, expect, it } from 'vitest'
import { VIDEO_DURATION_DEFAULT_S } from '@/data/studio'
import { MESSAGES } from '@/lib/messages'
import { EMPTY_VISUAL_FORM, applyVisualPatch, validateVisualForm } from './use-create-visual'

const VIDEO = { ...EMPTY_VISUAL_FORM, kind: 'video' as const }

describe('applyVisualPatch', () => {
  it('starts every visual at the default 8 s', () => {
    expect(EMPTY_VISUAL_FORM.durationS).toBe(VIDEO_DURATION_DEFAULT_S)
    expect(EMPTY_VISUAL_FORM.durationS).toBe(8)
  })

  it('clamps the duration to the new maximum on a plan change — creative 20 → balanced 10', () => {
    const creative = applyVisualPatch({ ...VIDEO, plan: 'creative' }, { durationS: 20 })
    expect(creative.durationS).toBe(20)
    expect(applyVisualPatch(creative, { plan: 'balanced' }).durationS).toBe(10)
    // A change to a roomier plan leaves a value inside the new range alone.
    expect(applyVisualPatch(creative, { plan: 'precise' }).durationS).toBe(20)
    // The same plan re-selected clamps nothing.
    expect(applyVisualPatch({ ...VIDEO, durationS: 99 }, { plan: 'balanced' }).durationS).toBe(99)
  })

  it('never rewrites a typed value under the user — an over-max entry stays, and is refused on submit', () => {
    const typed = applyVisualPatch(VIDEO, { durationS: 99 })
    expect(typed.durationS).toBe(99)
    expect(validateVisualForm(typed)).toBe(MESSAGES.errors.visualDurationRange)
  })

  it('a cleared field is NaN until typed again, and a plan change restores the default', () => {
    const cleared = applyVisualPatch(VIDEO, { durationS: Number.NaN })
    expect(Number.isNaN(cleared.durationS)).toBe(true)
    expect(validateVisualForm(cleared)).toBe(MESSAGES.errors.visualDurationRange)
    expect(applyVisualPatch(cleared, { plan: 'creative' }).durationS).toBe(VIDEO_DURATION_DEFAULT_S)
  })
})

describe('validateVisualForm', () => {
  it('still refuses a blank kind first', () => {
    expect(validateVisualForm(EMPTY_VISUAL_FORM)).toBe(MESSAGES.errors.visualKindRequired)
  })

  it('accepts whole seconds within the plan range for a video, and refuses the rest', () => {
    expect(validateVisualForm(VIDEO)).toBeNull()
    expect(validateVisualForm({ ...VIDEO, durationS: 10 })).toBeNull()
    expect(validateVisualForm({ ...VIDEO, durationS: 11 })).toBe(
      MESSAGES.errors.visualDurationRange,
    )
    expect(validateVisualForm({ ...VIDEO, plan: 'precise', durationS: 30 })).toBeNull()
    expect(validateVisualForm({ ...VIDEO, plan: 'precise', durationS: 31 })).toBe(
      MESSAGES.errors.visualDurationRange,
    )
    expect(validateVisualForm({ ...VIDEO, durationS: 0 })).toBe(MESSAGES.errors.visualDurationRange)
    expect(validateVisualForm({ ...VIDEO, durationS: 2.5 })).toBe(
      MESSAGES.errors.visualDurationRange,
    )
  })

  it('an image never looks at the duration, whatever the field holds', () => {
    expect(validateVisualForm({ ...EMPTY_VISUAL_FORM, kind: 'image', durationS: 999 })).toBeNull()
    expect(
      validateVisualForm({ ...EMPTY_VISUAL_FORM, kind: 'image', durationS: Number.NaN }),
    ).toBeNull()
  })
})
