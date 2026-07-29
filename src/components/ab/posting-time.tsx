/**
 * A posting time, said unambiguously — the one place this product renders when
 * something goes out.
 *
 * Three rules live here so no screen can hold a different opinion:
 *
 * 1. **The schedule's zone is the fact.** A slot is a wall-clock time in the
 *    org's posting zone; that is what was configured and what will happen.
 *    Every other rendering is a convenience on top of it.
 * 2. **The zone is labelled `GMT+3`, never `AST`.** The abbreviation is
 *    ambiguous — Arabia and Atlantic Standard Time share it — and this product
 *    is aimed at MENA operators whose clients sit anywhere. The offset is
 *    measured at the instant in question, so it stays correct across DST.
 * 3. **The viewer's local time appears only when it differs.** A second zone on
 *    every timestamp trains people to read neither; shown only on a genuine
 *    mismatch, it is information rather than noise. The local date comes with
 *    it when the day differs too, because "2:00 AM" on the wrong day is worse
 *    than no second opinion at all.
 *
 * What this component deliberately does NOT claim is the AUDIENCE's time. A
 * connected page has followers in every zone, and the product holds no data
 * about where they are. "Posting time" is the honest name for what it knows.
 */
import { MonoNumber } from '@/components/ab/mono-number'
import { formatDateInZone, formatTimeInZone, zoneAbbreviation } from '@/lib/timezone'
import { cn } from '@/lib/utils'

/** The viewer's own zone, as the browser reports it. */
function viewerZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function PostingTime({
  at,
  zone,
  /** Set false where the surrounding section already names the zone once. */
  showZone = true,
  /** Prefix the date, for places that are not already grouped by day. */
  showDate = false,
  className,
}: {
  /** The instant. Use `slotInstant` for a slot's wall-clock date + time. */
  at: Date | string
  /** The schedule's posting zone. */
  zone: string
  showZone?: boolean
  showDate?: boolean
  className?: string
}) {
  const instant = new Date(at)
  const local = viewerZone()

  const time = formatTimeInZone(instant, zone)
  const date = formatDateInZone(instant, zone)
  const localTime = formatTimeInZone(instant, local)
  const localDate = formatDateInZone(instant, local)

  // Compare what is rendered, not the zone names: two zones on the same offset
  // show the same clock, and repeating it would be pure noise.
  const differs = localTime !== time || localDate !== date

  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-1.5', className)}>
      <MonoNumber value={showDate ? `${date} ${time}` : time} />
      {showZone && (
        <MonoNumber value={zoneAbbreviation(zone, instant)} className="text-muted-foreground" />
      )}
      {differs && (
        <span className="text-muted-foreground">
          · <MonoNumber value={localDate !== date ? `${localDate} ${localTime}` : localTime} />
          <span> your time</span>
        </span>
      )}
    </span>
  )
}
