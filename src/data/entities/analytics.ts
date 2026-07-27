import { dayLabels, timestampAt } from '@/data/dates'
import type { AnalyticsSeries } from '@/data/types'

/** Seven-day series for the two analytics-enabled channels. LinkedIn is
 *  needs_reauth (no series) and would show the honesty note, not zeros. */
export function atlasAnalytics(): AnalyticsSeries[] {
  const labels = dayLabels(7)
  return [
    {
      connectionId: 'conn_fb',
      labels,
      reach: [1840, 2010, 1755, 2380, 2940, 2610, 3120],
      engagement: [96, 121, 88, 145, 210, 174, 236],
      followers: [4180, 4188, 4195, 4210, 4242, 4260, 4291],
      synced: true,
      limited: false,
      posts: [
        {
          draftId: 'draft_006',
          title: 'New arrival: Kirinyaga AA, Kenya…',
          publishedAt: timestampAt(-1, '09:00'),
          metrics: { reach: 3120, engagement: 236, likes: 142 },
        },
      ],
    },
    {
      connectionId: 'conn_ig',
      labels,
      reach: [2210, 2445, 2120, 2870, 3480, 3105, 3690],
      engagement: [188, 214, 165, 262, 344, 297, 401],
      followers: [6120, 6134, 6150, 6177, 6215, 6248, 6290],
      synced: true,
      limited: false,
      posts: [
        {
          draftId: 'draft_006',
          title: 'New arrival: Kirinyaga AA, Kenya…',
          publishedAt: timestampAt(-1, '09:00'),
          metrics: { reach: 3690, engagement: 401, likes: 318 },
        },
      ],
    },
  ]
}
