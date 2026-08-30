/**
 * The two tone fields HSN-03 added, as the Settings screens name them. The
 * VALUES are the wire vocabulary (`ar`/`en` is what the generate body already
 * sent per tone; `short`/`medium`/`long` is the 2026-08-28 reference plus the
 * founder's `medium`); the labels are ours. Kept beside the components rather
 * than in one of them so both the editor and the library card read one list.
 */
import type { ToneLanguage, ToneLength } from '@/data/types'

export const TONE_LANGUAGE_OPTIONS: { value: ToneLanguage; label: string }[] = [
  { value: 'ar', label: 'Arabic' },
  { value: 'en', label: 'English' },
]

export const TONE_LENGTH_OPTIONS: { value: ToneLength; label: string }[] = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
]

/** Undefined for an unset field — the card says "Not set", never a default. */
export function toneLanguageLabel(value: ToneLanguage | undefined): string | undefined {
  return TONE_LANGUAGE_OPTIONS.find((option) => option.value === value)?.label
}

export function toneLengthLabel(value: ToneLength | undefined): string | undefined {
  return TONE_LENGTH_OPTIONS.find((option) => option.value === value)?.label
}
