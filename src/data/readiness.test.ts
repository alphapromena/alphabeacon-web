/**
 * The readiness ruling, asserted flat (ORDER ONB-0827, D-ONB-D).
 *
 * These tests encode the PHASE-0 PROBE's finding rather than a preference: the
 * hard gate is the four brand entities, because a live org holding exactly
 * those four ran a real generation (202, request
 * `60c06fd5-acb7-4060-81d5-4a7b8113ebeb`) with no country and no schedule,
 * while an org with no tones was refused (400 `bad_request`, request
 * `ae30783f-f28d-4d5a-9ac6-88c92da1a2a9`). If someone later promotes the
 * country or the schedule to a blocker, one of these fails and asks for the
 * evidence.
 */
import { describe, expect, it } from 'vitest'
import { deriveReadiness, type ReadinessInput } from './readiness'

const COMPLETE: ReadinessInput = {
  known: true,
  brandVoice: { do: ['Short sentences.'], dont: [] },
  toneCount: 1,
  sourceCount: 1,
  topicCount: 1,
  country: 'JO',
  activeDayCount: 2,
}

/** Exactly what probe (a) had on the wire: the four, and nothing else. */
const FOUR_ONLY: ReadinessInput = {
  ...COMPLETE,
  country: null,
  activeDayCount: 0,
}

describe('deriveReadiness', () => {
  it('lets the four brand entities alone unlock generation (Phase-0 probe a)', () => {
    const readiness = deriveReadiness(FOUR_ONLY)

    expect(readiness.canGenerate).toBe(true)
    expect(readiness.missing).toEqual([])
  })

  it('still lists the country and the schedule, and marks them non-blocking', () => {
    const readiness = deriveReadiness(FOUR_ONLY)
    const optional = readiness.items.filter((item) => !item.blocking).map((item) => item.id)

    // Named in the checklist — they are real setup — but never blockers.
    expect(optional).toEqual(['country', 'schedule'])
    expect(readiness.items.find((item) => item.id === 'country')?.done).toBe(false)
    expect(readiness.items.find((item) => item.id === 'schedule')?.done).toBe(false)
  })

  it('refuses a workspace with no tones, and names that item (Phase-0 probe b)', () => {
    const readiness = deriveReadiness({ ...COMPLETE, toneCount: 0 })

    expect(readiness.canGenerate).toBe(false)
    expect(readiness.missing.map((item) => item.id)).toEqual(['tones'])
  })

  it('treats a voice with no rules at all as not set up', () => {
    const readiness = deriveReadiness({ ...COMPLETE, brandVoice: { do: [], dont: [] } })

    expect(readiness.canGenerate).toBe(false)
    expect(readiness.missing.map((item) => item.id)).toEqual(['voice'])
  })

  it("counts a don't-only voice as set up — one rule is a rule", () => {
    const readiness = deriveReadiness({ ...COMPLETE, brandVoice: { do: [], dont: ['No emojis.'] } })

    expect(readiness.canGenerate).toBe(true)
  })

  it('names every missing blocker, in checklist order', () => {
    const readiness = deriveReadiness({
      known: true,
      brandVoice: { do: [], dont: [] },
      toneCount: 0,
      sourceCount: 0,
      topicCount: 0,
      country: null,
      activeDayCount: 0,
    })

    expect(readiness.missing.map((item) => item.id)).toEqual([
      'voice',
      'tones',
      'sources',
      'topics',
    ])
  })

  it('every item offers a route, so a checklist row is never a dead end', () => {
    for (const item of deriveReadiness(COMPLETE).items) {
      expect(item.to.startsWith('/')).toBe(true)
    }
  })

  /**
   * TRAP 20. Before the live sync lands, the world still holds the seeded demo
   * — five tones, a full voice, sources and topics that belong to Atlas
   * Roasters. Deriving readiness from that would report someone else's
   * workspace ready. Unknown must be neither ready nor blocked.
   */
  it('never reports ready while the live sync has not answered', () => {
    const readiness = deriveReadiness({ ...COMPLETE, known: false })

    expect(readiness.known).toBe(false)
    expect(readiness.canGenerate).toBe(false)
    // And it is not a REFUSAL either: nothing is missing, it is simply unknown.
    expect(readiness.missing).toEqual([])
  })
})
