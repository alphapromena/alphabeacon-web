import { GENERATION_MODELS } from '@/data/entities/generation-models'
import { PLANS } from '@/data/entities/plans'
import { STUDIO_MODELS } from '@/data/entities/studio-models'
import { PRESET_TONES } from '@/data/entities/tones'
import type { Dataset } from '@/data/types'

/**
 * Nobody, yet — the world a prospect lands in.
 *
 * Signed out, so `/` renders the marketing site (M1) and every auth screen is
 * reachable as itself rather than behind a guard. This is the dataset the
 * signup → verify → onboarding → dashboard golden walk starts from: the org is
 * a blank shell that A1 names and A5 fills in.
 */
export function buildVisitorDataset(): Dataset {
  return {
    id: 'visitor',
    label: 'Visitor (signed out)',
    description:
      'Nobody signed in — the marketing site, then signup, verify, and the full onboarding wizard.',
    org: {
      id: 'org_new',
      name: '',
      offer: '',
      differentiators: [],
      timezone: 'Asia/Amman',
      onboarding: { completed: false, resumeStep: 1 },
    },
    users: [{ id: 'user_new', name: '', email: '', role: 'admin' }],
    session: { signedIn: false, userId: 'user_new', emailVerified: false, failedSignIns: 0 },
    // Every platform shows as connectable — onboarding step 2 is the first
    // place this world has anything to say.
    connections: (['facebook', 'instagram', 'linkedin', 'x'] as const).map((platform) => ({
      id: `conn_${platform}`,
      platform,
      status: 'not_connected' as const,
      permissions: { analytics: false, posting: false },
      scopes: [],
    })),
    eventSources: [],
    events: [],
    schedule: {
      activeDays: [],
      postsPerDay: 1,
      generateAt: '09:00',
      timezone: 'Asia/Amman',
      modelId: '',
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
    // The marketing page prices from this exact module, same as Billing.
    plans: structuredClone(PLANS),
    billing: { planId: 'free', status: 'active', history: [] },
    ledger: [],
    analytics: [],
    notifications: [],
    activity: [],
  }
}
