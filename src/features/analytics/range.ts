/**
 * The arithmetic behind G1 and G2, kept out of the components so a number the
 * user reads can be proven without rendering anything.
 *
 * One rule runs through all of it: a figure we were never given is `undefined`,
 * never `0`. A delta with no comparable prior period is absent rather than
 * "0%", the same way an unreported metric is "Syncing…" rather than a zero.
 */
export const RANGES = [7, 14, 30] as const

export type RangeDays = (typeof RANGES)[number]

export function rangeLabel(days: RangeDays): string {
  return `Last ${days} days`
}

/** The most recent `days` entries of a day-indexed series. */
export function periodSlice<T>(values: T[], days: number): T[] {
  return values.slice(Math.max(0, values.length - days))
}

/** The `days` entries immediately before the current period — the comparison. */
export function priorSlice<T>(values: T[], days: number): T[] {
  const end = Math.max(0, values.length - days)
  return values.slice(Math.max(0, end - days), end)
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

/** Net movement across a window — what "follower growth" actually means. */
export function growth(values: number[]): number {
  if (values.length < 2) return 0
  return values[values.length - 1] - values[0]
}

/**
 * Period-over-period change, or `undefined` when the comparison would be
 * invented: no prior period, or a prior period of zero (every change from
 * nothing is infinite, and "+∞%" tells the reader less than saying nothing).
 */
export function deltaPercent(current: number, previous: number): number | undefined {
  if (!Number.isFinite(previous) || previous === 0) return undefined
  return Math.round(((current - previous) / previous) * 100)
}

/** Whether an ISO timestamp falls inside the last `days` days. */
export function inRange(iso: string, days: number, now: number = Date.now()): boolean {
  const at = new Date(iso).getTime()
  if (Number.isNaN(at)) return false
  return at > now - days * 24 * 60 * 60 * 1000 && at <= now
}
