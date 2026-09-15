/**
 * MOMENT 4 (ORDER MOTION-0914/B) — the stages describe real work.
 *
 * The rule the order sets is "never invented progress, never a percentage the
 * product does not know", so the assertions here are mostly about what the
 * module CANNOT do.
 */
import { describe, expect, it } from 'vitest'
import { generateStage, GENERATE_STAGE_LINE } from '@/lib/generate-stage'

describe('generateStage', () => {
  it('says accepted while nothing has been written', () => {
    expect(generateStage({ text: '', claimCount: 0 })).toBe('accepted')
    expect(generateStage({ text: '   ', claimCount: 0 })).toBe('accepted')
  })

  it('says writing once words are arriving', () => {
    expect(generateStage({ text: 'Most teams', claimCount: 0 })).toBe('writing')
  })

  it('says grounding once a claim has surfaced beside the words', () => {
    expect(generateStage({ text: 'Most teams', claimCount: 1 })).toBe('grounding')
  })

  it('is a pure function of what has already happened', () => {
    // No clock, no counter, no run id: the same inputs give the same stage
    // forever, which is what makes it impossible for it to drift ahead of the
    // run it describes.
    const input = { text: 'Most teams', claimCount: 1 }
    expect(generateStage(input)).toBe(generateStage(input))
  })

  it('never claims progress it cannot know', () => {
    for (const line of Object.values(GENERATE_STAGE_LINE)) {
      expect(line).not.toMatch(/%/)
      expect(line).not.toMatch(/\d+\s*(of|\/)\s*\d+/)
      expect(line).not.toMatch(/almost|nearly|halfway|seconds? (left|remaining)/i)
    }
  })

  it('gives every stage a line, so the screen can never say nothing', () => {
    for (const stage of ['accepted', 'writing', 'grounding'] as const) {
      expect(GENERATE_STAGE_LINE[stage].trim().length).toBeGreaterThan(0)
    }
  })
})
