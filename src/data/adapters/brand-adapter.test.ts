/**
 * The two interpretations INT-7 is built on, pinned (decisions.md D-INT-B/C).
 *
 * Both are the kind of thing that would fail silently: a flatten in the wrong
 * order still renders a list, and a rule filed under the wrong half still
 * renders a rule — it just means the opposite of what the user wrote.
 */
import { describe, expect, it } from 'vitest'
import type { ApiVoice, ApiTone } from '@/api/types'
import { adaptBrand, joinRules, splitRules, CANONICAL_VOICE_NAME } from './brand-adapter'

const row = {
  orgId: '1',
  createdAt: '2026-08-17T00:00:00.000Z',
  updatedAt: '2026-08-17T00:00:00.000Z',
}

const voice = (id: string, name: string, rules: ApiVoice['rules']): ApiVoice => ({
  ...row,
  id,
  name,
  description: `${name} description`,
  rules,
})

const tone = (id: string, rules: ApiTone['rules'], preset = false): ApiTone => ({
  ...row,
  id,
  name: `Tone ${id}`,
  description: 'Sounds like something.',
  preset,
  rules,
})

describe('splitRules / joinRules', () => {
  it('round-trips a do/dont split', () => {
    const app = { do: ['Name the farm'], dont: ['Say artisanal'] }
    expect(splitRules(joinRules(app).map((r, i) => ({ ...r, id: String(i) })))).toEqual(app)
  })

  it('ignores an unknown kind rather than guessing a half', () => {
    // A rule filed under the wrong half inverts its meaning, which is worse
    // than not showing it at all.
    const rules = [
      { id: '1', kind: 'do' as const, text: 'Keep it short' },
      { id: '2', kind: 'sideways' as unknown as 'do', text: 'Mystery' },
    ]
    expect(splitRules(rules)).toEqual({ do: ['Keep it short'], dont: [] })
  })

  it('treats missing rules as an empty split, not a crash', () => {
    expect(splitRules(undefined)).toEqual({ do: [], dont: [] })
  })
})

describe('adaptBrand — voices (D-INT-B)', () => {
  /**
   * REPLACES the flatten this file used to pin (item 65, 2026-09-13). The old
   * contract read every row and wrote one, so the screen showed a merge and a
   * save wrote that merge onto the canonical row — org 1867 grew 18 rules to
   * 94 across five saves that way. What is read is now what a save replaces.
   */
  it('reads the CANONICAL row only, because that is the row a save replaces', () => {
    const newest = voice('30', 'Later voice', [{ id: '3', kind: 'do', text: 'Third' }])
    const middle = voice('20', CANONICAL_VOICE_NAME, [
      { id: '2', kind: 'do', text: 'Mine' },
      { id: '4', kind: 'dont', text: 'Second' },
    ])
    const oldest = voice('10', 'INT-3 leftover', [{ id: '1', kind: 'do', text: 'First' }])

    const graft = adaptBrand([], [newest, middle, oldest], [], [])

    expect(graft.brandVoice.do).toEqual(['Mine'])
    expect(graft.brandVoice.dont).toEqual(['Second'])
    expect(graft.canonicalVoiceId).toBe('20')
  })

  it('counts the other rows that still carry rules instead of hiding them', () => {
    // The server builds its context bundle from EVERY voice row, so rules this
    // screen stops showing would go on shaping drafts invisibly. They are
    // counted so the screen can say so; nothing is migrated or deleted here.
    const newest = voice('30', 'Later voice', [{ id: '3', kind: 'do', text: 'Third' }])
    const canonical = voice('20', CANONICAL_VOICE_NAME, [{ id: '2', kind: 'do', text: 'Mine' }])
    const empty = voice('10', 'INT-3 leftover', [])

    const graft = adaptBrand([], [newest, canonical, empty], [], [])

    // The empty row contributes nothing and is not counted; the one with a
    // rule is, by id, name and count.
    expect(graft.extraVoiceRows).toEqual([{ id: '30', name: 'Later voice', ruleCount: 1 }])
  })

  it('keeps the OLDEST row when two carry the canonical name, so the target never moves', () => {
    // Org 1867 had two rows both named "Brand voice". Picking the newest would
    // move the write target every time a stray row appeared.
    const newer = voice('294', CANONICAL_VOICE_NAME, [{ id: '9', kind: 'do', text: 'Newer' }])
    const older = voice('293', CANONICAL_VOICE_NAME, [{ id: '1', kind: 'do', text: 'Older' }])

    // The wire answers newest-first.
    const graft = adaptBrand([], [newer, older], [], [])

    expect(graft.canonicalVoiceId).toBe('293')
    expect(graft.brandVoice.do).toEqual(['Older'])
    expect(graft.extraVoiceRows).toEqual([{ id: '294', name: CANONICAL_VOICE_NAME, ruleCount: 1 }])
  })

  it('resolves the canonical row writes target, case-insensitively', () => {
    const graft = adaptBrand([], [voice('7', 'brand VOICE', [])], [], [])
    expect(graft.canonicalVoiceId).toBe('7')
  })

  it('reports no canonical row when the org has none yet, so the seam creates one', () => {
    const graft = adaptBrand([], [voice('7', 'Something else', [])], [], [])
    expect(graft.canonicalVoiceId).toBeNull()
  })

  it('leaves an INT-3-era row alone: no rules means it contributes nothing', () => {
    // Those rows carried their rule in `description`. Parsing it back out would
    // be exactly the smuggling this repo refuses; they simply read as empty.
    const graft = adaptBrand([], [voice('9', 'Old row', [])], [], [])
    expect(graft.brandVoice).toEqual({ do: [], dont: [], examples: [] })
    expect(graft.extraVoiceRows).toEqual([])
  })

  it('never invents examples — they still have no wire home', () => {
    const graft = adaptBrand(
      [],
      [voice('1', CANONICAL_VOICE_NAME, [{ id: '1', kind: 'do', text: 'Be plain' }])],
      [],
      [],
    )
    expect(graft.brandVoice.examples).toEqual([])
  })
})

describe('adaptBrand — tones (D-INT-C)', () => {
  it('carries a tone rules both ways and keeps the preset/custom split', () => {
    const graft = adaptBrand(
      [
        tone(
          '1',
          [
            { id: '1', kind: 'do', text: 'Open with the figure' },
            { id: '2', kind: 'dont', text: 'Round beyond recognition' },
          ],
          true,
        ),
      ],
      [],
      [],
      [],
    )
    // CUT-0831: the wire's `preset` is read and IGNORED — no kind survives.
    expect('kind' in graft.tones[0]).toBe(false)
    expect(graft.tones[0].rules).toEqual({
      do: ['Open with the figure'],
      dont: ['Round beyond recognition'],
    })
  })

  it('a tone with no rules is empty, not undefined — the editor renders either way', () => {
    const graft = adaptBrand([tone('2', [])], [], [], [])
    expect(graft.tones[0].rules).toEqual({ do: [], dont: [] })
  })
})
