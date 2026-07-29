import { dayFromNow, timestampAt } from '@/data/dates'
import type { Draft, Slot } from '@/data/types'

/**
 * The active tenant's drafts — deliberately spread across the state machine
 * so every status-driven action row is reachable from one dataset.
 */
export function atlasDrafts(): Draft[] {
  return [
    {
      id: 'draft_001',
      status: 'pending_review',
      copy: 'Most subscription coffee goes stale before it ships. Ours is roasted after you order — 48 hours from drum to doorstep. That gap is the whole difference.',
      rationale:
        'Provocative angle on the freshness gap; grounded in the roast-to-order differentiator and current shipping stats.',
      toneId: 'tone_provocative',
      slotId: 'slot_today_09',
      claims: [
        {
          id: 'claim_001a',
          source: 'sca.coffee/research/freshness',
          title: 'Roasted coffee loses peak flavor within 21 days',
          state: 'verified',
        },
        {
          id: 'claim_001b',
          source: 'atlasroasters.example/ops',
          title: '48-hour roast-to-ship median, last quarter',
          state: 'verified',
        },
      ],
      judgeScore: 87,
      createdAt: timestampAt(0, '06:02'),
      timeline: [{ status: 'pending_review', at: timestampAt(0, '06:02') }],
    },
    {
      id: 'draft_002',
      status: 'pending_review',
      copy: 'We burned three roast batches learning our new Kenyan lot — here is the curve that finally tamed it, and why we let you watch us fail in public.',
      rationale:
        "Founder's-voice transparency post tied to the new single-origin launch on the marketing calendar.",
      toneId: 'tone_founders_voice',
      slotId: 'slot_today_09',
      claims: [
        {
          id: 'claim_002a',
          source: 'atlasroasters.example/roast-log',
          title: 'Batch 412–414 roast curves',
          state: 'flagged',
        },
      ],
      judgeScore: 74,
      createdAt: timestampAt(0, '06:02'),
      timeline: [{ status: 'pending_review', at: timestampAt(0, '06:02') }],
    },
    {
      id: 'draft_003',
      status: 'approved',
      copy: 'Arabica futures are up 31% this year. Our direct-trade contracts locked prices in January — your subscription price holds through December.',
      rationale:
        'Data-driven reassurance post; commodity-price news is trending and we have a real hedge story.',
      toneId: 'tone_data_driven',
      slotId: 'slot_today_13',
      claims: [
        {
          id: 'claim_003a',
          source: 'reuters.com/markets/commodities',
          title: 'Arabica futures +31% year to date',
          state: 'verified',
        },
      ],
      judgeScore: 91,
      createdAt: timestampAt(0, '06:02'),
      timeline: [
        { status: 'pending_review', at: timestampAt(0, '06:02') },
        { status: 'approved', at: timestampAt(0, '08:41') },
      ],
    },
    {
      id: 'draft_004',
      status: 'media_ready',
      copy: 'What does "washed process" actually mean? A 60-second guide to the step that decides half of what you taste.',
      rationale: 'Educational explainer; consistently our best-saving format on Instagram.',
      toneId: 'tone_educational',
      slotId: 'slot_today_17',
      claims: [
        {
          id: 'claim_004a',
          source: 'sca.coffee/processing-guide',
          title: 'Washed processing overview',
          state: 'verified',
        },
      ],
      judgeScore: 88,
      assetId: 'asset_001',
      createdAt: timestampAt(0, '06:02'),
      timeline: [
        { status: 'pending_review', at: timestampAt(0, '06:02') },
        { status: 'approved', at: timestampAt(0, '08:44') },
        { status: 'media_pending', at: timestampAt(0, '08:50') },
        { status: 'media_ready', at: timestampAt(0, '08:51') },
      ],
    },
    {
      id: 'draft_005',
      status: 'scheduled',
      copy: 'Tomorrow night: our summer tasting flight, live from the roastery. Three origins, one table, no slides.',
      rationale: 'Event-attached announcement for the tasting night on the marketing calendar.',
      toneId: 'tone_story',
      slotId: 'slot_tmrw_09',
      eventId: 'ev_tasting',
      claims: [],
      judgeScore: 82,
      createdAt: timestampAt(-1, '06:02'),
      scheduledFor: timestampAt(1, '09:00'),
      timeline: [
        { status: 'pending_review', at: timestampAt(-1, '06:02') },
        { status: 'approved', at: timestampAt(-1, '09:15') },
        { status: 'scheduled', at: timestampAt(-1, '09:20') },
      ],
    },
    {
      id: 'draft_006',
      status: 'published',
      copy: 'New arrival: Kirinyaga AA, Kenya. Blackcurrant, cane sugar, a finish that will not quit. 240 bags, then it is gone.',
      rationale: 'Direct-CTA launch post for the new single origin.',
      toneId: 'tone_direct_cta',
      slotId: 'slot_yday_09',
      claims: [],
      judgeScore: 90,
      createdAt: timestampAt(-1, '06:02'),
      scheduledFor: timestampAt(-1, '09:00'),
      publishResults: [
        { platform: 'facebook', ok: true },
        { platform: 'instagram', ok: true },
      ],
      timeline: [
        { status: 'pending_review', at: timestampAt(-1, '06:02') },
        { status: 'approved', at: timestampAt(-1, '07:30') },
        { status: 'scheduled', at: timestampAt(-1, '07:32') },
        { status: 'published', at: timestampAt(-1, '09:00') },
      ],
    },
    {
      id: 'draft_007',
      status: 'publish_failed',
      copy: 'Hiring: a weekend roaster apprentice. No experience needed — bring curiosity, leave with a trade.',
      rationale: 'LinkedIn-first hiring post; team asked for weekend coverage.',
      toneId: 'tone_direct_cta',
      slotId: 'slot_yday_17',
      claims: [],
      judgeScore: 85,
      createdAt: timestampAt(-1, '06:02'),
      scheduledFor: timestampAt(-1, '17:00'),
      failureReason: 'LinkedIn needs to be reconnected before this can publish.',
      publishResults: [{ platform: 'linkedin', ok: false, reason: 'Connection needs re-auth' }],
      timeline: [
        { status: 'pending_review', at: timestampAt(-1, '06:02') },
        { status: 'approved', at: timestampAt(-1, '07:35') },
        { status: 'scheduled', at: timestampAt(-1, '07:36') },
        { status: 'publish_failed', at: timestampAt(-1, '17:01') },
      ],
    },
  ]
}

/** Slots grouping the drafts above: yesterday, today (3 slots), tomorrow. */
export function atlasSlots(): Slot[] {
  return [
    {
      id: 'slot_yday_09',
      date: dayFromNow(-1),
      time: '09:00',
      status: 'done',
      draftIds: ['draft_006'],
    },
    {
      id: 'slot_yday_17',
      date: dayFromNow(-1),
      time: '17:00',
      status: 'done',
      draftIds: ['draft_007'],
    },
    {
      id: 'slot_today_09',
      date: dayFromNow(0),
      time: '09:00',
      status: 'review',
      draftIds: ['draft_001', 'draft_002'],
    },
    {
      id: 'slot_today_13',
      date: dayFromNow(0),
      time: '13:00',
      status: 'review',
      draftIds: ['draft_003'],
    },
    {
      id: 'slot_today_17',
      date: dayFromNow(0),
      time: '17:00',
      status: 'review',
      draftIds: ['draft_004'],
    },
    {
      id: 'slot_tmrw_09',
      date: dayFromNow(1),
      time: '09:00',
      status: 'done',
      eventId: 'ev_tasting',
      draftIds: ['draft_005'],
    },
    // Upcoming, nothing drafted yet. A running pipeline always has these ahead
    // of it, and they are the only slots that can honestly be skipped — so
    // without them C3 looks like a calendar that stops at tomorrow, and C4's
    // skip has nothing to act on.
    ...[2, 3, 4, 6, 7].flatMap((offset) =>
      ['09:00', '13:00'].map((time) => ({
        id: `slot_ahead_${offset}_${time.replace(':', '')}`,
        date: dayFromNow(offset),
        time,
        status: 'pending' as const,
        draftIds: [],
      })),
    ),
  ]
}
