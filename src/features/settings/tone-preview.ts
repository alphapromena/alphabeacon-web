/**
 * I4's Preview: what a line written in this tone would be shaped by.
 *
 * There is no model to ask, so this composes rather than generates — and says
 * so. What it CAN show honestly is the thing the screen exists to answer:
 * which brand-voice rules and which tone rules are in force at the same time,
 * and what a line in this tone sounds like. Kept pure so the composition is
 * testable without rendering a sheet.
 */
import type { BrandVoice, Tone } from '@/data/types'

export interface TonePreview {
  /** A sample line — the tone's own example when it has one. */
  line: string
  /** Every rule that shaped it, brand voice first because it always wins. */
  applied: { source: 'Brand voice' | 'Tone'; rule: string }[]
}

export function composePreview(
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
