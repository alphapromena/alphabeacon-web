/**
 * One announcement, five ways — the sample the tone chips morph on M1.
 *
 * Marketing copy, keyed by the PRESET tone names the provider serves (the
 * chips themselves render from `useTones()`, so the row can never drift from
 * the product's real tone set). The fallback exists so a future sixth preset
 * degrades to something honest rather than a blank sentence.
 */
export const TONE_SAMPLES: Record<string, string> = {
  Provocative: 'Most “fresh” coffee sat in a warehouse for months. Ours didn’t.',
  'Data-driven': 'Roasted 48 hours before dispatch — the aroma peaks in your cup, not in transit.',
  Educational: 'Coffee peaks 4–14 days after roasting. We only ship inside that window.',
  Story: 'The roaster clicks on at 6 a.m. By Friday, that batch is in your cup.',
  'Direct-CTA': 'Taste what roast-to-order changes — your first bag ships free.',
}

export const TONE_SAMPLE_FALLBACK = 'Every draft, in the tone you chose — before you were awake.'
