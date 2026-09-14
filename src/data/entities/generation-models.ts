import type { GenerationModel } from '@/data/types'

/** Copy-drafting models — friendly names only, never vendor ids. */
export const GENERATION_MODELS: GenerationModel[] = [
  {
    id: 'gm_balanced',
    name: 'Balanced',
    description: 'Grounded in your knowledge and sources, with fresh phrasing. The default.',
    tier: 'free',
  },
  {
    id: 'gm_creative',
    name: 'Creative',
    description:
      'More freedom in angle and wording. Stays inside your brand rules, leans less on verbatim facts.',
    tier: 'pro',
  },
  {
    id: 'gm_precise',
    name: 'Precise',
    description:
      'Stays closest to your approved knowledge and sources. The safest choice for factual posts.',
    tier: 'pro',
  },
]
