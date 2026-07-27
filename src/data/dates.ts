/**
 * Relative-date helpers for dataset records, so demo worlds stay "today"-
 * centered forever instead of going stale. App code may read the clock —
 * only the network is off-limits.
 */
const DAY_MS = 24 * 60 * 60 * 1000

/** ISO date (day precision), n days from today. Negative n = past. */
export function dayFromNow(n: number): string {
  return new Date(Date.now() + n * DAY_MS).toISOString().slice(0, 10)
}

/** Full ISO timestamp, n days from now at the given local time. */
export function timestampAt(daysFromNow: number, time = '09:00'): string {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(Date.now() + daysFromNow * DAY_MS)
  d.setHours(h ?? 9, m ?? 0, 0, 0)
  return d.toISOString()
}

/** Last n day labels (oldest first) for analytics series, e.g. "Jul 21". */
export function dayLabels(n: number): string[] {
  return Array.from({ length: n }, (_, i) =>
    new Date(Date.now() - (n - 1 - i) * DAY_MS).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  )
}
