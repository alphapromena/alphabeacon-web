import { timestampAt } from '@/data/dates'
import type { AnalyticsSeries, Dataset } from '@/data/types'
import { buildActiveDataset } from './active'

/**
 * A week where nothing went out.
 *
 * The headline stat cards on G1 — posts published, and the deltas beside every
 * figure — could not be checked before this existed: every seeded world has a
 * busy last seven days, and there was no way to zero one from the UI. So the
 * one state a reviewer most needs to look at, the quiet week, was the one state
 * nobody could see.
 *
 * It is a real shape, not an empty one: no posts in the last seven days, reach
 * and engagement tapering toward a floor rather than falling to zero (older
 * posts keep working), and followers flat. That combination is what makes the
 * negative deltas and the honest "0" reachable at once.
 */
const QUIET_DAYS = 7

/** Taper the last `QUIET_DAYS` toward a floor, leaving the history intact. */
function taper(values: number[], floor: number): number[] {
  if (values.length === 0) return values
  const start = Math.max(0, values.length - QUIET_DAYS)
  return values.map((value, index) => {
    if (index < start) return value
    const step = index - start + 1
    const fade = 1 - step / (QUIET_DAYS + 1)
    return Math.max(floor, Math.round(value * fade))
  })
}

export function buildQuietWeekDataset(): Dataset {
  const world = buildActiveDataset()

  const analytics: AnalyticsSeries[] = world.analytics.map((series) => ({
    ...series,
    reach: taper(series.reach, 40),
    engagement: taper(series.engagement, 2),
    // Followers stop growing rather than collapsing — nobody unfollows because
    // you went quiet for a week, they just stop arriving.
    followers: series.followers.map((value, index) =>
      index < series.followers.length - QUIET_DAYS
        ? value
        : series.followers[series.followers.length - QUIET_DAYS - 1],
    ),
    // Everything published moves outside the quiet window, so "posts published"
    // in the last 7 days is a true zero rather than a hidden filter.
    posts: series.posts.map((post) => ({ ...post, publishedAt: timestampAt(-12, '09:00') })),
  }))

  return {
    ...world,
    id: 'quiet-week',
    label: 'Quiet week',
    description:
      'Atlas Roasters with nothing published in seven days — zero posts, falling reach, and the deltas that go with them.',
    analytics,
    notifications: world.notifications.filter((n) => n.type !== 'drafts_ready'),
  }
}
