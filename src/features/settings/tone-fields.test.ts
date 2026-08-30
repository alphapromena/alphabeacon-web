/**
 * The two tone fields' vocabulary and the "Not set" contract (HSN-03): an
 * absent value labels as `undefined`, which is what the I3 card turns into
 * "Not set" — never a default the tone was not given.
 */
import { describe, expect, it } from 'vitest'
import {
  TONE_LANGUAGE_OPTIONS,
  TONE_LENGTH_OPTIONS,
  toneLanguageLabel,
  toneLengthLabel,
} from './tone-fields'

describe('the tone fields', () => {
  it('use the wire vocabulary as values', () => {
    // `ar`/`en` is what the generate body always sent per tone; the lengths
    // are the 2026-08-28 reference envelope's.
    expect(TONE_LANGUAGE_OPTIONS.map((option) => option.value)).toEqual(['ar', 'en'])
    expect(TONE_LENGTH_OPTIONS.map((option) => option.value)).toEqual(['short', 'medium', 'long'])
  })

  it('label a set value, and answer undefined for an unset one so the card says "Not set"', () => {
    expect(toneLanguageLabel('ar')).toBe('Arabic')
    expect(toneLanguageLabel('en')).toBe('English')
    expect(toneLengthLabel('medium')).toBe('Medium')
    expect(toneLanguageLabel(undefined)).toBeUndefined()
    expect(toneLengthLabel(undefined)).toBeUndefined()
  })
})
