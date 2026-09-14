/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  STOPGAP — CLIENT-SIDE FIRST-RUN SEEDING (ORDER DEMO-0914 §2)
 *
 *  THIS IS NOT WHERE THIS BELONGS. The server-side home is the workspace
 *  create — `POST /orgs` in `src/data/account.ts:createWorkspace`, which in
 *  LIVE mode is the one call that turns a verified account into a workspace.
 *  When the platform seeds a review world of its own, that response carries
 *  it, `live/resync` grafts it like any other wire truth, and THIS ENTIRE
 *  FILE IS DELETED along with its call site in `provider.tsx`.
 *
 *  Until then it exists for one reason, and the reason is not testing: a
 *  person signing up on the preview to judge whether this product was built
 *  currently lands on an empty Today, walks eight empty screens, and
 *  concludes — reasonably — that nothing was. Seeding the world they land in
 *  is the difference between reviewing a product and reviewing a shell.
 *
 *  ## It is STATIC-ONLY, deliberately
 *
 *  The reducer case that calls this (`workspace/created`) is the STATIC half
 *  of `createWorkspace`; live mode dispatches `live/resync` instead and never
 *  reaches here. That is the correct boundary and not an accident of
 *  plumbing: in live mode these rows do not exist on the platform, and
 *  writing them into the browser's copy of the world would make every screen
 *  report drafts, slots and renders that no other device, no reload and no
 *  API call could ever see. Faking the wire is worse than an empty screen.
 *
 *  The preview this order was written for is static — `VITE_API_BASE_URL`
 *  exists on Vercel only in `production` and in `preview` pinned to the
 *  `live` branch — so static-only is also, today, sufficient.
 *
 *  ## Same posture as the seeding already here
 *
 *  `visitor.ts` and `fresh.ts` already plant `SAMPLE_TONES` into a brand-new
 *  world for exactly this reason. This is that idea carried to the rest of
 *  the product, in one file, so that deleting it is one deletion.
 *
 *  ## What it deliberately does NOT seed, and why
 *
 *  - **The org profile** (offer, differentiators, standard CTA). Those are
 *    claims about somebody's actual business. Inventing them would put words
 *    in the owner's mouth, and an honestly empty profile is better than a
 *    confidently wrong one.
 *  - **Connections.** Nothing is connected, because connecting is not wired
 *    to anything (DEMO-0914 §3). A seeded "connected" channel would be the
 *    exact lie this order forbids.
 *  - **Published and publish-failed drafts.** Both states mean a post left
 *    the building through a channel, and no channel exists. The queue is
 *    seeded in the five states that are true of a workspace that has drafted
 *    but never published.
 *  - **Anything billing.** No plan, no invoice, no wallet movement. The
 *    balance a fresh account has is the balance it keeps.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { dayFromNow, timestampAt } from '@/data/dates'
import type {
  Asset,
  CalendarEvent,
  CalendarSource,
  Dataset,
  Draft,
  FollowedSource,
  Schedule,
  Slot,
  StudioJob,
} from '@/data/types'

/**
 * Craft rules, not business claims — the distinction that makes seeding these
 * honest when seeding the offer line would not be. Every one of them is a
 * rule about HOW to write, which any brand would accept and the owner can
 * rewrite in Settings the moment they disagree.
 */
const BRAND_VOICE = {
  do: [
    'Write in plain language a customer would use',
    'Lead with the specific thing that changed',
    'Say what happens next, once',
  ],
  dont: ['Promise a result we cannot evidence', 'Use jargon where a plain word exists'],
  examples: [],
}

const TOPICS = [
  'customer stories',
  'how we work',
  'industry news',
  'product updates',
  'hiring',
] as const

function seedSources(): FollowedSource[] {
  return [
    {
      id: 'src_seed_hbr',
      url: 'hbr.org/feed',
      name: 'Harvard Business Review',
      addedAt: dayFromNow(0),
    },
    {
      id: 'src_seed_mw',
      url: 'marketingweek.com/feed',
      name: 'Marketing Week',
      addedAt: dayFromNow(0),
    },
    {
      id: 'src_seed_twg',
      url: 'thinkwithgoogle.com/rss',
      name: 'Think with Google',
      addedAt: dayFromNow(0),
    },
  ]
}

/**
 * Holidays only. The static demo's other source kind is a connected Google
 * account, and connecting one is no more real here than connecting a channel
 * is — so the calendar gets the source that follows from the country and
 * nothing that implies an integration.
 *
 * Jordan because the world boots on `Asia/Amman`: the country, the holiday
 * source and the timezone are one fact said three times, and a review world
 * that disagreed with itself about where it operates would be its own bug.
 */
function seedEventSources(): CalendarSource[] {
  return [
    { id: 'src_seed_holidays', kind: 'holiday', label: 'Jordan public holidays', status: 'active' },
  ]
}

function seedEvents(): CalendarEvent[] {
  return [
    {
      id: 'ev_seed_holiday',
      sourceId: 'src_seed_holidays',
      name: 'Public holiday',
      date: dayFromNow(5),
    },
    {
      id: 'ev_seed_holiday_2',
      sourceId: 'src_seed_holidays',
      name: 'Public holiday',
      date: dayFromNow(12),
    },
  ]
}

/**
 * A rhythm that is running, because "started" is what makes Today's empty
 * state say "your next drafts are on the way" instead of "tell Malaky when to
 * post" — and a workspace with a queue in it has plainly already been told.
 */
function seedSchedule(timezone: string): Schedule {
  return {
    activeDays: ['sun', 'mon', 'tue', 'wed', 'thu'],
    postsPerDay: 2,
    generateAt: '06:00',
    timezone,
    modelId: 'gm_balanced',
    toneIds: [
      'tone_provocative',
      'tone_data_driven',
      'tone_educational',
      'tone_story',
      'tone_direct_cta',
    ],
    attachToEvents: true,
    started: true,
  }
}

/**
 * The queue. Three drafts waiting on a decision across two of today's slots,
 * one already approved, one with its visual made, one scheduled for tomorrow
 * — which is every state a workspace can honestly be in before it has ever
 * published, and enough for every action row on D2 and D3 to be reachable.
 *
 * The copy is about the craft of publishing rather than any industry, because
 * the org it lands in is whatever the person typed at signup and a draft
 * confidently discussing their business would be a stranger's guess.
 */
function seedDrafts(): Draft[] {
  return [
    {
      id: 'draft_seed_01',
      status: 'pending_review',
      copy: 'Most teams publish on the days they remember to. The ones that compound publish on the days they decided in advance, and never spend a morning deciding again.',
      rationale:
        'Provocative opening on consistency — the argument for the posting rhythm this workspace just set.',
      toneId: 'tone_provocative',
      slotId: 'slot_seed_today_09',
      claims: [
        {
          id: 'claim_seed_01a',
          source: 'marketingweek.com/consistency-study',
          title: 'Posting cadence outranks volume for recall',
          state: 'verified',
        },
      ],
      judgeScore: 86,
      createdAt: timestampAt(0, '06:02'),
      timeline: [{ status: 'pending_review', at: timestampAt(0, '06:02') }],
    },
    {
      id: 'draft_seed_02',
      status: 'pending_review',
      copy: 'A post approved the week it was written reaches roughly three times the audience of one rescued from a backlog a month later. Freshness is a distribution feature, not a virtue.',
      rationale:
        'Data-driven case for reviewing daily; pairs with the queue this workspace now generates every morning.',
      toneId: 'tone_data_driven',
      slotId: 'slot_seed_today_09',
      claims: [
        {
          id: 'claim_seed_02a',
          source: 'thinkwithgoogle.com/recency-and-reach',
          title: 'Recency and organic reach, 2026 review',
          state: 'verified',
        },
        {
          id: 'claim_seed_02b',
          source: 'hbr.org/content-velocity',
          title: 'Content velocity and audience growth',
          state: 'flagged',
        },
      ],
      judgeScore: 91,
      createdAt: timestampAt(0, '06:02'),
      timeline: [{ status: 'pending_review', at: timestampAt(0, '06:02') }],
    },
    {
      id: 'draft_seed_03',
      status: 'pending_review',
      copy: 'The first draft this workspace produced took eleven seconds. The argument about whether to publish it took two days. Only one of those numbers is worth attacking.',
      rationale:
        'Story-shaped observation about review latency — the bottleneck most teams do not measure.',
      toneId: 'tone_story',
      slotId: 'slot_seed_today_13',
      claims: [],
      judgeScore: 78,
      createdAt: timestampAt(0, '06:02'),
      timeline: [{ status: 'pending_review', at: timestampAt(0, '06:02') }],
    },
    {
      id: 'draft_seed_04',
      status: 'approved',
      copy: 'Brand voice and tone are not the same control. Voice is the set of rules that never bend. Tone is the register you choose for one post. Write the first once; pick the second every time.',
      rationale:
        'Educational explainer on the two controls in Settings — the distinction new workspaces ask about first.',
      toneId: 'tone_educational',
      slotId: 'slot_seed_today_13',
      claims: [],
      judgeScore: 88,
      createdAt: timestampAt(0, '06:02'),
      timeline: [
        { status: 'pending_review', at: timestampAt(0, '06:02') },
        { status: 'approved', at: timestampAt(0, '08:40') },
      ],
    },
    {
      id: 'draft_seed_05',
      status: 'media_ready',
      copy: 'We are hiring someone to own how this all sounds. No portfolio required — bring three things you have written and the reason you would cut two of them.',
      rationale:
        'Direct-CTA hiring post with a visual attached; hiring posts carry furthest from a company page.',
      toneId: 'tone_direct_cta',
      slotId: 'slot_seed_today_17',
      claims: [],
      judgeScore: 83,
      assetId: 'asset_seed_01',
      createdAt: timestampAt(0, '06:02'),
      timeline: [
        { status: 'pending_review', at: timestampAt(0, '06:02') },
        { status: 'approved', at: timestampAt(0, '08:44') },
        { status: 'media_pending', at: timestampAt(0, '08:50') },
        { status: 'media_ready', at: timestampAt(0, '08:51') },
      ],
    },
    {
      id: 'draft_seed_06',
      status: 'scheduled',
      copy: 'Everything we shipped this quarter, in the order it mattered — and the one thing we got wrong and rebuilt twice.',
      rationale:
        'Story round-up scheduled for tomorrow morning, when this audience is most active.',
      toneId: 'tone_story',
      slotId: 'slot_seed_tmrw_09',
      claims: [],
      judgeScore: 85,
      createdAt: timestampAt(0, '06:02'),
      scheduledFor: timestampAt(1, '09:00'),
      timeline: [
        { status: 'pending_review', at: timestampAt(0, '06:02') },
        { status: 'approved', at: timestampAt(0, '09:10') },
        { status: 'scheduled', at: timestampAt(0, '09:12') },
      ],
    },
  ]
}

/**
 * Today's three slots hold the queue; tomorrow holds the scheduled one; the
 * days after are empty and pending, which is what a running pipeline looks
 * like from the front and the only kind of slot C4's skip can act on.
 */
function seedSlots(): Slot[] {
  return [
    {
      id: 'slot_seed_today_09',
      date: dayFromNow(0),
      time: '09:00',
      status: 'review',
      draftIds: ['draft_seed_01', 'draft_seed_02'],
    },
    {
      id: 'slot_seed_today_13',
      date: dayFromNow(0),
      time: '13:00',
      status: 'review',
      draftIds: ['draft_seed_03', 'draft_seed_04'],
    },
    {
      id: 'slot_seed_today_17',
      date: dayFromNow(0),
      time: '17:00',
      status: 'review',
      draftIds: ['draft_seed_05'],
    },
    {
      id: 'slot_seed_tmrw_09',
      date: dayFromNow(1),
      time: '09:00',
      status: 'done',
      draftIds: ['draft_seed_06'],
    },
    ...[2, 3, 4, 6, 7].flatMap((offset) =>
      ['09:00', '13:00'].map((time) => ({
        id: `slot_seed_ahead_${offset}_${time.replace(':', '')}`,
        date: dayFromNow(offset),
        time,
        status: 'pending' as const,
        draftIds: [],
      })),
    ),
  ]
}

/**
 * Studio history: one render that worked and one that did not.
 *
 * No RUNNING job, unlike the `active` demo world. A job left mid-flight is
 * honest in a dataset somebody switches to on purpose and reads as a hang to
 * somebody walking the product for the first time — it never finishes,
 * because nothing in the static world is actually rendering.
 */
function seedJobs(): StudioJob[] {
  return [
    {
      id: 'job_seed_01',
      modelId: 'sm_prism',
      kind: 'image',
      prompt: 'Team portrait at a desk, natural window light, editorial, muted palette',
      credits: 12,
      status: 'succeeded',
      origin: { type: 'draft', draftId: 'draft_seed_05' },
      assetId: 'asset_seed_01',
      createdAt: timestampAt(0, '08:50'),
    },
    {
      id: 'job_seed_02',
      modelId: 'sm_motion',
      kind: 'video',
      prompt: 'Slow pan across a whiteboard of the quarter plan, 10 seconds',
      credits: 30,
      status: 'failed',
      origin: { type: 'standalone' },
      createdAt: timestampAt(-1, '15:20'),
      failureReason: 'The model could not complete this run. Your credits were released.',
    },
  ]
}

function seedAssets(): Asset[] {
  return [
    {
      id: 'asset_seed_01',
      jobId: 'job_seed_01',
      kind: 'image',
      label: 'Hiring post portrait',
      createdAt: timestampAt(0, '08:51'),
    },
  ]
}

/**
 * Apply the review world to a world whose workspace has just been created.
 *
 * Additive over what the dataset already carries — the five sample tones stay
 * exactly as they are and the schedule keeps the timezone the world booted
 * with, so a seeded workspace never contradicts the world it grew out of.
 *
 * `country` is set even though the static demo normally leaves it unset
 * (`types.ts` calls it live-only, and I1 renders its picker in live mode
 * only): the readiness checklist reads that field, and a review world that
 * shows an outstanding "Country — Set up" row pointing at a screen with no
 * country control on it would be a dead end on the landing screen.
 */
export function applyFirstRunSeed(world: Dataset): Dataset {
  return {
    ...world,
    org: { ...world.org, brandVoice: { ...BRAND_VOICE }, country: 'JO' },
    followedSources: seedSources(),
    topics: [...TOPICS],
    eventSources: seedEventSources(),
    events: seedEvents(),
    schedule: seedSchedule(world.schedule.timezone),
    slots: seedSlots(),
    drafts: seedDrafts(),
    jobs: seedJobs(),
    assets: seedAssets(),
  }
}
