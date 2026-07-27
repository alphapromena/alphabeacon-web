/**
 * Display formatting for values the UI shows in more than one place, so two
 * screens can never disagree about how the same fact reads. Every number
 * these produce is still rendered through `MonoNumber` at the call site.
 */
const RELATIVE = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
]

/** "2 hours ago", "yesterday" — for feeds and notification lists. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  let duration = (new Date(iso).getTime() - now.getTime()) / 1000
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return RELATIVE.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }
  return RELATIVE.format(Math.round(duration), 'year')
}

/** "9:00 AM" — slot and timeline times. */
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** "Jul 27" — compact calendar and chart labels. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
