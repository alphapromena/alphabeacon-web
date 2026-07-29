import { dayLabels, timestampAt } from '@/data/dates'
import type { AnalyticsSeries } from '@/data/types'

/** How much history every world carries, so G1/G2's ranges have something to
 *  compare against: a 7-day range needs the 7 days before it to show a delta. */
export const ANALYTICS_DAYS = 30

/**
 * A deterministic day series — a steady drift with a weekly rhythm on top.
 *
 * Written as a formula rather than thirty hand-typed numbers so the shape stays
 * readable, the labels can never fall out of alignment with the values, and a
 * test can assert on the arithmetic instead of on a magic constant.
 */
function series(start: number, drift: number, swing: number, offset = 0): number[] {
  return Array.from({ length: ANALYTICS_DAYS }, (_, i) =>
    Math.round(start + drift * i + swing * Math.sin(((i + offset) * Math.PI) / 3.5)),
  )
}

/**
 * Atlas's channels.
 *
 * Three shapes on purpose: two healthy channels that report everything, and
 * LinkedIn — whose read scope only ever yields follower counts (hence
 * `limited`) and whose token has lapsed (hence `synced: false`). That one
 * record is what makes G1's "Sync pending" card and G2's limited-data note
 * reachable in the default world instead of only in a broken one.
 */
export function atlasAnalytics(): AnalyticsSeries[] {
  const labels = dayLabels(ANALYTICS_DAYS)
  return [
    {
      connectionId: 'conn_fb',
      labels,
      reach: series(1740, 46, 380),
      engagement: series(92, 4.6, 34),
      followers: series(3980, 10.4, 6),
      synced: true,
      limited: false,
      posts: [
        {
          draftId: 'draft_006',
          title: 'New arrival: Kirinyaga AA, Kenya…',
          toneId: 'tone_story',
          publishedAt: timestampAt(-1, '09:00'),
          metrics: { reach: 3120, engagement: 236, likes: 142 },
        },
        {
          title: 'Why we roast to order (and what it costs us)',
          toneId: 'tone_founders_voice',
          publishedAt: timestampAt(-5, '09:00'),
          metrics: { reach: 2610, engagement: 174, likes: 98 },
        },
        {
          title: 'The washed vs natural question, settled',
          toneId: 'tone_educational',
          publishedAt: timestampAt(-9, '17:30'),
          metrics: { reach: 2380, engagement: 145, likes: 87 },
        },
        {
          title: 'Three grinders we actually recommend',
          toneId: 'tone_direct_cta',
          publishedAt: timestampAt(-16, '09:00'),
          metrics: { reach: 1755, engagement: 88, likes: 51 },
        },
      ],
    },
    {
      connectionId: 'conn_ig',
      labels,
      reach: series(2090, 58, 470, 2),
      engagement: series(178, 7.4, 62, 2),
      followers: series(5910, 13.1, 9),
      synced: true,
      limited: false,
      posts: [
        {
          draftId: 'draft_006',
          title: 'New arrival: Kirinyaga AA, Kenya…',
          toneId: 'tone_story',
          publishedAt: timestampAt(-1, '09:00'),
          metrics: { reach: 3690, engagement: 401, likes: 318 },
        },
        {
          title: 'Why we roast to order (and what it costs us)',
          toneId: 'tone_founders_voice',
          publishedAt: timestampAt(-5, '09:00'),
          metrics: { reach: 3105, engagement: 297, likes: 241 },
        },
        {
          title: 'The washed vs natural question, settled',
          toneId: 'tone_educational',
          publishedAt: timestampAt(-9, '17:30'),
          metrics: { reach: 2870, engagement: 262, likes: 205 },
        },
        {
          title: 'Three grinders we actually recommend',
          toneId: 'tone_direct_cta',
          publishedAt: timestampAt(-16, '09:00'),
          metrics: { reach: 2120, engagement: 165, likes: 122 },
        },
      ],
    },
    {
      connectionId: 'conn_li',
      labels,
      // Empty, not zeroed: LinkedIn never reported these, and a flat line at
      // zero would read as "nobody saw it" instead of "we were never told".
      reach: [],
      engagement: [],
      followers: series(1240, 2.1, 3),
      synced: false,
      limited: true,
      posts: [],
    },
  ]
}
