/**
 * I4's Preview, composed rather than generated - and honest about which it is.
 *
 * STATIC mode has no model to ask, so it composes: the sample line is the
 * tone's own example (or its description), and the value of the card is the
 * list beside it - which brand-voice rules and which tone rules are in force
 * at the SAME time. That list is the thing the screen exists to answer, and it
 * is what stops someone writing a tone that quietly contradicts the voice.
 *
 * LIVE mode replaces the line with a real sample from `posts/tones-preview`
 * and sets `generated`, but keeps the same rule list beside it: the platform
 * grounds the sample on the org's pushed context bundle, which is built from
 * exactly these rules. The seam owns that call (`src/data/brand.ts`); this
 * file stays pure so the composition is testable without rendering a sheet.
 *
 * Moved here from `features/settings/` in INT-7: both modes now need it, and a
 * feature is the wrong home for something the data layer calls.
 */
import type { BrandVoice, Tone } from '@/data/types'

export interface TonePreview {
  /** A sample line - the tone's own example when it has one. */
  line: string
  /** Every rule that shaped it, brand voice first because it always wins. */
  applied: { source: 'Brand voice' | 'Tone'; rule: string }[]
  /**
   * `true` only when a real run wrote the line. The card says which it is,
   * because "here is what your tone sounds like" and "here is the line you
   * typed, echoed back" are very different promises.
   */
  generated: boolean
}

export function composeTonePreview(
  input: {
    offer: string
    brandVoice: BrandVoice
  },
  tone: Pick<Tone, 'name' | 'rules' | 'example' | 'description'>,
): TonePreview {
  const name = tone.name.trim() || 'this tone'
  const line =
    tone.example?.trim() ||
    tone.description.trim() ||
    (input.offer.trim()
      ? `${input.offer.trim().replace(/\.$/, '')} — said in ${name}.`
      : `A line in ${name}.`)

  return {
    line,
    generated: false,
    applied: [
      ...input.brandVoice.do.map((rule) => ({ source: 'Brand voice' as const, rule })),
      ...input.brandVoice.dont.map((rule) => ({
        source: 'Brand voice' as const,
        rule: `Never: ${rule}`,
      })),
      ...tone.rules.do.map((rule) => ({ source: 'Tone' as const, rule })),
      ...tone.rules.dont.map((rule) => ({ source: 'Tone' as const, rule: `Never: ${rule}` })),
    ],
  }
}
