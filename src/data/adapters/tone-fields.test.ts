/**
 * The tone-fields sidecar's three rules (HSN-03), which fail silently if they
 * drift: the server's value wins, a fully-served tone retires its entry, and a
 * deleted tone takes its entry with it. Written at the HSN-FINAL gate.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import type { Tone } from '@/data/types'
import { hydrateToneFields, retireToneFields, writeToneFields } from './tone-fields'

const ORG = 'org_1'
const KEY = `ab-tone-fields:${ORG}`

function tone(id: string, extra: Partial<Tone> = {}): Tone {
  return {
    id,
    name: id,
    description: 'A tone.',
    rules: { do: [], dont: [] },
    ...extra,
  }
}

function stored(): Record<string, unknown> | null {
  const raw = window.localStorage.getItem(KEY)
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : null
}

beforeEach(() => window.localStorage.clear())

describe('writeToneFields', () => {
  it('records only the two fields, only when set', () => {
    writeToneFields(ORG, 'tone_a', { language: 'ar' })
    expect(stored()).toEqual({ tone_a: { language: 'ar' } })

    writeToneFields(ORG, 'tone_a', { language: 'ar', length: 'long' })
    expect(stored()).toEqual({ tone_a: { language: 'ar', length: 'long' } })
  })

  it('removes an entry that would hold nothing, and the key with the last entry', () => {
    writeToneFields(ORG, 'tone_a', { language: 'en' })
    writeToneFields(ORG, 'tone_a', {})
    expect(stored()).toBeNull()
  })

  it('keys by org, so two workspaces never share a tone', () => {
    writeToneFields(ORG, 'tone_a', { language: 'en' })
    writeToneFields('org_2', 'tone_a', { language: 'ar' })
    expect(stored()).toEqual({ tone_a: { language: 'en' } })
    expect(window.localStorage.getItem('ab-tone-fields:org_2')).toBe('{"tone_a":{"language":"ar"}}')
  })
})

describe('hydrateToneFields', () => {
  it('fills a tone the server answered without the fields', () => {
    writeToneFields(ORG, 'tone_a', { language: 'ar', length: 'short' })
    const [hydrated] = hydrateToneFields(ORG, [tone('tone_a')])
    expect(hydrated.language).toBe('ar')
    expect(hydrated.length).toBe('short')
    // Still the sidecar's job: the server carried neither.
    expect(stored()).toEqual({ tone_a: { language: 'ar', length: 'short' } })
  })

  it('lets the SERVER value win, field by field', () => {
    writeToneFields(ORG, 'tone_a', { language: 'ar', length: 'short' })
    const [hydrated] = hydrateToneFields(ORG, [tone('tone_a', { language: 'en' })])
    expect(hydrated.language).toBe('en')
    expect(hydrated.length).toBe('short')
  })

  it('retires an entry once the server carries both fields', () => {
    writeToneFields(ORG, 'tone_a', { language: 'ar', length: 'short' })
    writeToneFields(ORG, 'tone_b', { language: 'en' })
    const hydrated = hydrateToneFields(ORG, [
      tone('tone_a', { language: 'en', length: 'long' }),
      tone('tone_b'),
    ])
    // The served tone is returned as served, not overwritten from the sidecar.
    expect(hydrated[0].language).toBe('en')
    expect(hydrated[0].length).toBe('long')
    expect(stored()).toEqual({ tone_b: { language: 'en' } })
  })

  it('prunes entries for tones that no longer exist', () => {
    writeToneFields(ORG, 'tone_gone', { language: 'ar' })
    writeToneFields(ORG, 'tone_a', { length: 'medium' })
    hydrateToneFields(ORG, [tone('tone_a')])
    expect(stored()).toEqual({ tone_a: { length: 'medium' } })
  })

  it('leaves a tone untouched when the sidecar has nothing for it', () => {
    const plain = tone('tone_a')
    const [hydrated] = hydrateToneFields(ORG, [plain])
    expect(hydrated).toBe(plain)
    expect('language' in hydrated).toBe(false)
    expect('length' in hydrated).toBe(false)
  })

  it('treats an unreadable store as empty rather than throwing', () => {
    window.localStorage.setItem(KEY, '{not json')
    const [hydrated] = hydrateToneFields(ORG, [tone('tone_a')])
    expect(hydrated.language).toBeUndefined()
  })
})

describe('retireToneFields', () => {
  it('drops a deleted tone and clears the key when nothing is left', () => {
    writeToneFields(ORG, 'tone_a', { language: 'ar' })
    writeToneFields(ORG, 'tone_b', { language: 'en' })
    retireToneFields(ORG, 'tone_a')
    expect(stored()).toEqual({ tone_b: { language: 'en' } })
    retireToneFields(ORG, 'tone_b')
    expect(stored()).toBeNull()
  })

  it('is a no-op for a tone it never held', () => {
    writeToneFields(ORG, 'tone_a', { language: 'ar' })
    retireToneFields(ORG, 'tone_zzz')
    expect(stored()).toEqual({ tone_a: { language: 'ar' } })
  })
})
