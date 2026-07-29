/**
 * Wall-clock ↔ instant conversion for a named IANA zone.
 *
 * A slot stores what a person sees on the wall — `2026-07-14` at `09:00` — and
 * the org's timezone. The actual instant that names depends on the zone's
 * offset ON THAT DATE, which moves with daylight saving: 09:00 in New York is
 * 13:00Z in July and 14:00Z in January. Jordan is the opposite case, fixed at
 * UTC+3 since it abolished DST in 2022, so the two together are a genuine test
 * of the arithmetic rather than of one lucky offset.
 *
 * No date library: `Intl` already knows every zone's rules, so the offset is
 * measured rather than tabulated — and it stays right when the rules change.
 */

/** The zone's offset, in minutes, at a given instant. */
export function offsetMinutesAt(instant: Date, timeZone: string): number {
  // Formatting an instant *as* the zone and reading it back as if it were UTC
  // yields exactly the offset, without hardcoding a single rule.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)

  // `hour: '2-digit'` with hour12:false renders midnight as 24 in some engines.
  const hour = get('hour') % 24

  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    hour,
    get('minute'),
    get('second'),
  )
  return (asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60_000
}

/**
 * The instant at which a wall-clock time occurs in a zone.
 *
 * Two passes: guess with the offset at the naive instant, then re-measure at
 * the corrected one. That second pass is what makes the hour either side of a
 * DST change come out right.
 */
export function zonedTimeToInstant(date: string, time: string, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const naive = Date.UTC(year, month - 1, day, hour, minute)

  const firstGuess = new Date(naive - offsetMinutesAt(new Date(naive), timeZone) * 60_000)
  const corrected = new Date(naive - offsetMinutesAt(firstGuess, timeZone) * 60_000)
  return corrected
}

/** "9:00 AM" as read in the given zone. */
export function formatTimeInZone(instant: Date | string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(instant))
}

/** "Jul 14" as read in the given zone. */
export function formatDateInZone(instant: Date | string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
  }).format(new Date(instant))
}

/** "GMT+3" — shown beside a timezone so the choice is legible, not just named. */
export function zoneAbbreviation(timeZone: string, at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(at)
    .find((part) => part.type === 'timeZoneName')
  return parts?.value ?? timeZone
}

/**
 * The zones offered in C1. A searchable subset rather than all ~600: these are
 * the ones this product's tenants actually publish from, and a list nobody can
 * scroll is worse than a short one somebody can.
 */
export const TIMEZONES = [
  'Asia/Amman',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Asia/Beirut',
  'Africa/Cairo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Istanbul',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC',
] as const
