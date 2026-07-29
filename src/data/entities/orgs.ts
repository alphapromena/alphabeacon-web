import { dayFromNow } from '@/data/dates'
import type { BrandVoice, Org, User } from '@/data/types'

/** Atlas's org-wide rules (I2). Applied underneath every tone, never instead. */
const ATLAS_BRAND_VOICE: BrandVoice = {
  do: [
    'Name the farm, the process, or the roast date when it matters',
    'Write the way we talk on the roastery floor',
    'Say the price plainly when we mention one',
  ],
  dont: ['Call anything "artisanal"', 'Promise a flavour we have not tasted this season'],
  examples: ['This lot landed Tuesday and we roasted it Thursday — that is the whole trick.'],
}

/** The active demo tenant — a specialty coffee roaster with a running pipeline. */
export const ATLAS_ORG: Org = {
  id: 'org_atlas',
  name: 'Atlas Roasters',
  offer: 'Specialty coffee, roasted to order and shipped within 48 hours.',
  differentiators: ['Roasted to order', 'Direct-trade sourcing', 'Carbon-neutral shipping'],
  ctaText: 'Order this week’s roast',
  brandVoice: ATLAS_BRAND_VOICE,
  onboarding: { completed: true, resumeStep: 5 },
}

export const ATLAS_USERS: User[] = [
  {
    id: 'user_maya',
    name: 'Maya Haddad',
    email: 'maya@atlasroasters.example',
    role: 'admin',
    joinedAt: dayFromNow(-266),
  },
  {
    id: 'user_omar',
    name: 'Omar Nasser',
    email: 'omar@atlasroasters.example',
    role: 'member',
    joinedAt: dayFromNow(-161),
  },
]

/** The fresh tenant — just signed up, nothing configured yet. */
export const NOVA_ORG: Org = {
  id: 'org_nova',
  name: 'Nova Skincare',
  offer: '',
  differentiators: [],
  ctaText: '',
  // Empty on purpose: I2's empty state invites the first rule.
  brandVoice: { do: [], dont: [], examples: [] },
  onboarding: { completed: false, resumeStep: 1 },
}

export const NOVA_USERS: User[] = [
  {
    id: 'user_lena',
    name: 'Lena Park',
    email: 'lena@novaskincare.example',
    role: 'admin',
    joinedAt: dayFromNow(-7),
  },
]
