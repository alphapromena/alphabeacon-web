import type { GenerationModel } from '@/data/types'

/** Copy-drafting models — friendly names only, never vendor ids. */
export const GENERATION_MODELS: GenerationModel[] = [
  {
    id: 'gm_balanced',
    name: 'Balanced',
    description: 'Reliable everyday drafts — the sensible default.',
    tier: 'free',
  },
  {
    id: 'gm_creative',
    name: 'Creative',
    description: 'Bolder angles and fresher hooks; a touch slower.',
    tier: 'pro',
  },
  {
    id: 'gm_precise',
    name: 'Precise',
    description: 'Tightest grounding to your sources; best for regulated topics.',
    tier: 'pro',
  },
]
