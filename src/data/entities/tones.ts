import type { Tone } from '@/data/types'

/** The five presets — always present, view-only in I3. */
export const PRESET_TONES: Tone[] = [
  {
    id: 'tone_provocative',
    name: 'Provocative',
    kind: 'preset',
    description: 'Challenges an assumption to stop the scroll.',
    rules: {
      do: ['Open with a contrarian claim', 'Back the claim within two sentences'],
      dont: ['Punch down', 'Manufacture outrage'],
    },
  },
  {
    id: 'tone_data_driven',
    name: 'Data-driven',
    kind: 'preset',
    description: 'Leads with a number and lets the evidence talk.',
    rules: {
      do: ['Open with the strongest figure', 'Cite the source inline'],
      dont: ['Round beyond recognition', 'Stack more than three stats'],
    },
  },
  {
    id: 'tone_educational',
    name: 'Educational',
    kind: 'preset',
    description: 'Teaches one useful thing, plainly.',
    rules: {
      do: ['One takeaway per post', 'Define jargon on first use'],
      dont: ['Lecture', 'Assume prior knowledge'],
    },
  },
  {
    id: 'tone_story',
    name: 'Story',
    kind: 'preset',
    description: 'A small narrative arc with a concrete detail.',
    rules: {
      do: ['Start in the middle of the action', 'Name a real detail'],
      dont: ['Moralize at the end', 'Invent people'],
    },
  },
  {
    id: 'tone_direct_cta',
    name: 'Direct-CTA',
    kind: 'preset',
    description: 'Says exactly what to do next, once.',
    rules: {
      do: ['One clear ask', 'Say what happens after the click'],
      dont: ['Stack multiple asks', 'Use pressure tactics'],
    },
  },
]

/** Custom tones owned by the active demo org — render identically to presets. */
export const ATLAS_CUSTOM_TONES: Tone[] = [
  {
    id: 'tone_founders_voice',
    name: "Founder's voice",
    kind: 'custom',
    description: 'First-person, workshop-floor honesty from the founder.',
    rules: {
      do: ['Write in first person', 'Mention what we tried and changed'],
      dont: ['Corporate we-speak', 'Hide the rough edges'],
    },
    example: 'We burned three roast batches learning this — here is what finally worked.',
  },
]
