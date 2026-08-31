import { dayFromNow } from '@/data/dates'
import { GENERATION_MODELS } from '@/data/entities/generation-models'
import { PLANS } from '@/data/entities/plans'
import { STUDIO_MODELS } from '@/data/entities/studio-models'
import { SAMPLE_TONES } from '@/data/entities/tones'
import type { Dataset } from '@/data/types'

/**
 * Nobody, yet — the world a prospect lands in.
 *
 * Signed out, so `/` renders the marketing site (M1) and every auth screen is
 * reachable as itself rather than behind a guard. This is the dataset the
 * signup → verify → the app golden walk starts from: the org does not exist
 * yet, and A1 is where it gets its name (ORDER ONB-0827 — there is no wizard
 * to fill it in afterwards).
 */
export function buildVisitorDataset(): Dataset {
  return {
    id: 'visitor',
    label: 'Visitor (signed out)',
    description:
      'Nobody signed in — the marketing site, then signup and verify, which land straight in the app.',
    org: {
      id: 'org_new',
      name: '',
      offer: '',
      differentiators: [],
      ctaText: '',
      brandVoice: { do: [], dont: [], examples: [] },
      exists: false,
    },
    users: [{ id: 'user_new', name: '', email: '', role: 'admin', joinedAt: dayFromNow(0) }],
    invites: [],
    session: { signedIn: false, userId: 'user_new', emailVerified: false, failedSignIns: 0 },
    followedSources: [],
    topics: [],
    knowledgeDocs: [],
    // Every platform shows as connectable: this world has never connected
    // anything, so B1 is where it first has something to say.
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
    tones: structuredClone(SAMPLE_TONES),
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
