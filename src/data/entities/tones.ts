import type { Tone } from '@/data/types'

/**
 * The demo worlds' five sample tones — ORDINARY tones (CUT-0831: the preset
 * concept is gone; nothing here is view-only or undeletable any more). The
 * rows themselves are unchanged demo data.
 */
export const SAMPLE_TONES: Tone[] = [
  {
    id: 'tone_provocative',
    name: 'Provocative',
    language: 'en',
    length: 'short',
    description: 'Challenges an assumption to stop the scroll.',
    rules: {
      do: ['Open with a contrarian claim', 'Back the claim within two sentences'],
      dont: ['Punch down', 'Manufacture outrage'],
    },
  },
  {
    id: 'tone_data_driven',
    name: 'Data-driven',
    language: 'en',
    length: 'medium',
    description: 'Leads with a number and lets the evidence talk.',
    rules: {
      do: ['Open with the strongest figure', 'Cite the source inline'],
      dont: ['Round beyond recognition', 'Stack more than three stats'],
    },
  },
  {
    id: 'tone_educational',
    name: 'Educational',
    language: 'en',
    length: 'long',
    description: 'Teaches one useful thing, plainly.',
    rules: {
      do: ['One takeaway per post', 'Define jargon on first use'],
      dont: ['Lecture', 'Assume prior knowledge'],
    },
  },
  {
    id: 'tone_story',
    name: 'Story',
    language: 'en',
    length: 'long',
    description: 'A small narrative arc with a concrete detail.',
    rules: {
      do: ['Start in the middle of the action', 'Name a real detail'],
      dont: ['Moralize at the end', 'Invent people'],
    },
  },
  {
    id: 'tone_direct_cta',
    name: 'Direct-CTA',
    language: 'en',
    length: 'short',
    description: 'Says exactly what to do next, once.',
    rules: {
      do: ['One clear ask', 'Say what happens after the click'],
      dont: ['Stack multiple asks', 'Use pressure tactics'],
    },
  },
]

/** A tone the active demo org wrote itself, beside the samples. */
export const ATLAS_CUSTOM_TONES: Tone[] = [
  {
    id: 'tone_founders_voice',
    name: "Founder's voice",
    language: 'en',
    length: 'medium',
    description: 'First-person, workshop-floor honesty from the founder.',
    rules: {
      do: ['Write in first person', 'Mention what we tried and changed'],
      dont: ['Corporate we-speak', 'Hide the rough edges'],
    },
    example: 'We burned three roast batches learning this — here is what finally worked.',
  },
]
