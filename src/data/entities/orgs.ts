import type { Org, User } from '@/data/types'

/** The active demo tenant — a specialty coffee roaster with a running pipeline. */
export const ATLAS_ORG: Org = {
  id: 'org_atlas',
  name: 'Atlas Roasters',
  offer: 'Specialty coffee, roasted to order and shipped within 48 hours.',
  differentiators: ['Roasted to order', 'Direct-trade sourcing', 'Carbon-neutral shipping'],
  timezone: 'Asia/Amman',
  onboarding: { completed: true, resumeStep: 5 },
}

export const ATLAS_USERS: User[] = [
  { id: 'user_maya', name: 'Maya Haddad', email: 'maya@atlasroasters.example', role: 'admin' },
  { id: 'user_omar', name: 'Omar Nasser', email: 'omar@atlasroasters.example', role: 'member' },
]

/** The fresh tenant — just signed up, nothing configured yet. */
export const NOVA_ORG: Org = {
  id: 'org_nova',
  name: 'Nova Skincare',
  offer: '',
  differentiators: [],
  timezone: 'America/New_York',
  onboarding: { completed: false, resumeStep: 1 },
}

export const NOVA_USERS: User[] = [
  { id: 'user_lena', name: 'Lena Park', email: 'lena@novaskincare.example', role: 'admin' },
]
