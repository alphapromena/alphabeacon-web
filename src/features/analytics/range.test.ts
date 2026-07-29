import { describe, expect, it } from 'vitest'
import { buildDataset } from '@/data/datasets'
import {
  comparisonNote,
  deltaPercent,
  growth,
  inRange,
  periodSlice,
  priorSlice,
  sum,
} from '@/features/analytics/range'

const DAY = 24 * 60 * 60 * 1000

describe('range slicing', () => {
  const days = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('takes the most recent window, and the one before it', () => {
    expect(periodSlice(days, 3)).toEqual([8, 9, 10])
    expect(priorSlice(days, 3)).toEqual([5, 6, 7])
  })

  it('never overlaps the two windows', () => {
    const current = periodSlice(days, 4)
    const prior = priorSlice(days, 4)
    expect(current.some((value) => prior.includes(value))).toBe(false)
  })

  it('shortens rather than inventing data when history runs out', () => {
    expect(periodSlice(days, 30)).toHaveLength(10)
    expect(priorSlice(days, 30)).toEqual([])
  })
})

describe('summaries', () => {
  it('sums a window', () => {
    expect(sum([10, 20, 30])).toBe(60)
    expect(sum([])).toBe(0)
  })

  it('measures follower growth as net movement, not as a total', () => {
    expect(growth([100, 130, 120])).toBe(20)
    expect(growth([100])).toBe(0)
    expect(growth([])).toBe(0)
  })
})

describe('deltaPercent', () => {
  it('reports the change against the prior period', () => {
    expect(deltaPercent(120, 100)).toBe(20)
    expect(deltaPercent(80, 100)).toBe(-20)
  })

  it('is absent rather than invented when there is nothing to compare against', () => {
    // The rule this whole module exists for: no prior period means no delta,
    // not "0%" and not "+100%".
    expect(deltaPercent(50, 0)).toBeUndefined()
    expect(deltaPercent(0, 0)).toBeUndefined()
  })
})

describe('inRange', () => {
  const now = Date.parse('2026-07-29T12:00:00.000Z')

  it('includes today and excludes the day before the window opens', () => {
    expect(inRange(new Date(now - 2 * DAY).toISOString(), 7, now)).toBe(true)
    expect(inRange(new Date(now - 8 * DAY).toISOString(), 7, now)).toBe(false)
  })

  it('excludes the future and refuses nonsense', () => {
    expect(inRange(new Date(now + DAY).toISOString(), 7, now)).toBe(false)
    expect(inRange('not a date', 7, now)).toBe(false)
  })
})

describe('comparisonNote', () => {
  it('distinguishes "no history yet" from "history, but nothing in it"', () => {
    // The 30-day range on a 30-day series: there is no earlier window at all.
    expect(comparisonNote(0, 30)).toMatch(/No earlier 30 days/)
    // The window exists and was empty — a different fact, and a different fix.
    expect(comparisonNote(7, 7)).toMatch(/Nothing in the previous 7 days/)
  })
})

describe('the quiet-week world exists so a zero can be looked at', () => {
  it('publishes nothing in the last seven days, and still reports reach', () => {
    const quiet = buildDataset('quiet-week')
    const synced = quiet.analytics.filter((series) => series.synced)
    expect(synced.length).toBeGreaterThan(0)

    for (const series of synced) {
      const recent = series.posts.filter((post) => inRange(post.publishedAt, 7))
      expect(recent, 'a quiet week publishes nothing').toHaveLength(0)
      // Reach tapers rather than vanishing: older posts keep working, so a
      // floor of zero would be its own lie.
      expect(sum(periodSlice(series.reach, 7))).toBeGreaterThan(0)
      // And it really is quieter than the week before, so the delta is negative.
      expect(sum(periodSlice(series.reach, 7))).toBeLessThan(sum(priorSlice(series.reach, 7)))
    }
  })

  it('leaves the busy world alone, so the comparison is real', () => {
    const active = buildDataset('active')
    const recent = active.analytics
      .filter((series) => series.synced)
      .flatMap((series) => series.posts.filter((post) => inRange(post.publishedAt, 7)))
    expect(recent.length).toBeGreaterThan(0)
  })
})
