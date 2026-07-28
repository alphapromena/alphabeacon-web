import { novaBilling, novaLedger } from '@/data/entities/billing'
import { novaConnections } from '@/data/entities/connections'
import { GENERATION_MODELS } from '@/data/entities/generation-models'
import { NOVA_ORG, NOVA_USERS } from '@/data/entities/orgs'
import { PLANS } from '@/data/entities/plans'
import { STUDIO_MODELS } from '@/data/entities/studio-models'
import { PRESET_TONES } from '@/data/entities/tones'
import type { Dataset } from '@/data/types'

/** A brand-new tenant: signed up minutes ago, nothing configured. This is
 *  the world every empty state and the setup-incomplete banner render from. */
export function buildFreshDataset(): Dataset {
  return {
    id: 'fresh',
    label: 'Fresh org',
    description:
      'Nova Skincare — just signed up, onboarding not started, no connections, no drafts.',
    org: structuredClone(NOVA_ORG),
    users: structuredClone(NOVA_USERS),
    session: { signedIn: true, userId: 'user_lena', emailVerified: true, failedSignIns: 0 },
    connections: novaConnections(),
    eventSources: [],
    events: [],
    schedule: {
      activeDays: [],
      postsPerDay: 1,
      generateAt: '09:00',
      timezone: 'America/New_York',
      modelId: 'gm_balanced',
      toneIds: [],
      attachToEvents: false,
      started: false,
    },
    slots: [],
    drafts: [],
    tones: structuredClone(PRESET_TONES),
    generationModels: structuredClone(GENERATION_MODELS),
    studioModels: structuredClone(STUDIO_MODELS),
    jobs: [],
    assets: [],
    plans: structuredClone(PLANS),
    billing: novaBilling(),
    ledger: novaLedger(),
    analytics: [],
    notifications: [],
    activity: [],
  }
}
