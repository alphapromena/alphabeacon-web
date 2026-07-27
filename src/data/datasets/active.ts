import { atlasAnalytics } from '@/data/entities/analytics'
import { atlasBilling, atlasLedger } from '@/data/entities/billing'
import { atlasConnections } from '@/data/entities/connections'
import { atlasDrafts, atlasSlots } from '@/data/entities/drafts'
import { atlasEventSources, atlasEvents } from '@/data/entities/events'
import { GENERATION_MODELS } from '@/data/entities/generation-models'
import { atlasActivity, atlasNotifications } from '@/data/entities/notifications'
import { ATLAS_ORG, ATLAS_USERS } from '@/data/entities/orgs'
import { PLANS } from '@/data/entities/plans'
import { atlasAssets, atlasJobs } from '@/data/entities/studio'
import { STUDIO_MODELS } from '@/data/entities/studio-models'
import { ATLAS_CUSTOM_TONES, PRESET_TONES } from '@/data/entities/tones'
import type { Dataset } from '@/data/types'

/** A healthy, mid-life tenant: pipeline running, drafts across the whole
 *  state machine, one connection needing attention. */
export function buildActiveDataset(): Dataset {
  return {
    id: 'active',
    label: 'Active org',
    description:
      'Atlas Roasters — Pro plan, pipeline running, drafts in every status, LinkedIn needs re-auth.',
    org: structuredClone(ATLAS_ORG),
    users: structuredClone(ATLAS_USERS),
    session: { signedIn: true, userId: 'user_maya' },
    connections: atlasConnections(),
    eventSources: atlasEventSources(),
    events: atlasEvents(),
    schedule: {
      activeDays: ['mon', 'tue', 'wed', 'thu', 'sun'],
      postsPerDay: 3,
      generateAt: '06:00',
      timezone: 'Asia/Amman',
      modelId: 'gm_balanced',
      toneIds: [
        'tone_provocative',
        'tone_data_driven',
        'tone_educational',
        'tone_story',
        'tone_direct_cta',
        'tone_founders_voice',
      ],
      attachToEvents: true,
      started: true,
    },
    slots: atlasSlots(),
    drafts: atlasDrafts(),
    tones: [...structuredClone(PRESET_TONES), ...structuredClone(ATLAS_CUSTOM_TONES)],
    generationModels: structuredClone(GENERATION_MODELS),
    studioModels: structuredClone(STUDIO_MODELS),
    jobs: atlasJobs(),
    assets: atlasAssets(),
    plans: structuredClone(PLANS),
    billing: atlasBilling(),
    ledger: atlasLedger(),
    analytics: atlasAnalytics(),
    notifications: atlasNotifications(),
    activity: atlasActivity(),
  }
}
