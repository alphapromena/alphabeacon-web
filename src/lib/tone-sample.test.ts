/**
 * MOMENT 1's source rules (ORDER MOTION-0914/B).
 *
 * The rule that matters most is the one about not calling anything: this is a
 * pure function, and the test proves the words come from data the world
 * already holds — a seeded draft first, the tone's own example second, its
 * description last, and never a sentence about the business that nobody wrote.
 */
import { describe, expect, it } from 'vitest'
import { applyFirstRunSeed } from '@/data/first-run-seed'
import { buildVisitorDataset } from '@/data/datasets/visitor'
import type { Draft, Tone } from '@/data/types'
import { toneSample } from '@/lib/tone-sample'

const TONE: Tone = {
  id: 'tone_x',
  name: 'Provocative',
  language: 'en',
  length: 'short',
  description: 'Challenges an assumption to stop the scroll.',
  rules: { do: [], dont: [] },
}

function draft(over: Partial<Draft>): Draft {
  return {
    id: 'd1',
    status: 'pending_review',
    copy: 'A real line this workspace has already written.',
    rationale: '',
    toneId: 'tone_x',
    claims: [],
    createdAt: '2026-09-14T06:02:00.000Z',
    timeline: [],
    ...over,
  }
}

describe('toneSample', () => {
  it('prefers a draft the workspace has actually written in that tone', () => {
    const sample = toneSample(TONE, [draft({})])
    expect(sample).toEqual({
      copy: 'A real line this workspace has already written.',
      source: 'draft',
    })
  })

  it('takes the most recent draft, so the sample tracks what is being produced', () => {
    const sample = toneSample(TONE, [
      draft({ id: 'old', copy: 'Older line.', createdAt: '2026-09-01T06:00:00.000Z' }),
      draft({ id: 'new', copy: 'Newer line.', createdAt: '2026-09-14T06:00:00.000Z' }),
    ])
    expect(sample?.copy).toBe('Newer line.')
  })

  it('ignores drafts written in some other tone', () => {
    const sample = toneSample(TONE, [draft({ toneId: 'tone_other', copy: 'Not this voice.' })])
    expect(sample?.source).toBe('description')
  })

  it('falls back to the tone the user wrote, then to its description', () => {
    expect(toneSample({ ...TONE, example: 'My own line.' }, [])).toEqual({
      copy: 'My own line.',
      source: 'example',
    })
    expect(toneSample(TONE, [])).toEqual({ copy: TONE.description, source: 'description' })
  })

  it('never invents a sentence about the business', () => {
    // D-DEMO-0914-B: the offer line is the owner's claim to make. Nothing in
    // here composes one, and a tone with nothing to say says nothing.
    const bare = { ...TONE, description: '  ', example: undefined }
    expect(toneSample(bare, [])).toBeNull()
  })

  it('trims a long draft at a word boundary rather than mid-word', () => {
    const long = 'word '.repeat(80).trim()
    const sample = toneSample(TONE, [draft({ copy: long })])
    expect(sample!.copy.length).toBeLessThanOrEqual(181)
    expect(sample!.copy.endsWith('…')).toBe(true)
    expect(sample!.copy).not.toMatch(/wor…$/)
  })

  it('answers for every tone the DEMO-0914 review world seeds', () => {
    // The whole point of moment 1 is that a brand-new account sees output, so
    // every tone it lands with must have something to show.
    const world = applyFirstRunSeed({ ...buildVisitorDataset() })
    expect(world.tones.length).toBeGreaterThan(0)
    for (const tone of world.tones) {
      const sample = toneSample(tone, world.drafts)
      expect(sample, `no sample for ${tone.name}`).not.toBeNull()
      expect(sample!.copy.trim().length).toBeGreaterThan(0)
    }
    // And most of them are real drafts rather than descriptions — that is what
    // makes it read as the product working.
    const fromDrafts = world.tones.filter(
      (tone) => toneSample(tone, world.drafts)?.source === 'draft',
    )
    expect(fromDrafts.length).toBeGreaterThanOrEqual(4)
  })
})
