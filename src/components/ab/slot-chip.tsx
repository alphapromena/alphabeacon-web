/**
 * The calendar day-cell chip (C3). A month grid has room for a dot, not a
 * badge, so this is the one place where the status color is the only *visible*
 * signal — and it pays for that by always carrying the status word in the
 * accessible name (`sr-only`), so the meaning is never locked inside a hue.
 *
 * Everything else about it is a density decision: one line, mono time and
 * metric so columns align down the week, and only the event name is allowed to
 * truncate — a clipped tone or metric would read as a different value.
 */
import { CalendarDays } from 'lucide-react'
import { MonoNumber } from '@/components/ab/mono-number'
import type { Slot } from '@/data/types'
import { cn } from '@/lib/utils'

const SLOT_STATUS: Record<Slot['status'], { word: string; dot: string }> = {
  pending: { word: 'Pending', dot: 'bg-muted-foreground' },
  generating: { word: 'Generating…', dot: 'bg-primary' },
  review: { word: 'Needs review', dot: 'bg-primary' },
  done: { word: 'Done', dot: 'bg-success' },
  skipped: { word: 'Skipped', dot: 'bg-muted-foreground' },
}

export function SlotChip({
  time,
  status,
  eventName,
  toneName,
  metric,
  className,
}: {
  /** 24h "HH:mm", local to the schedule's timezone. */
  time: string
  status: Slot['status']
  eventName?: string
  toneName?: string
  /** Published slots only, e.g. "1.2k reach". */
  metric?: string
  className?: string
}) {
  const { word, dot } = SLOT_STATUS[status]

  return (
    <span
      className={cn(
        'flex w-full items-center gap-1.5 overflow-hidden rounded-md border border-border bg-card px-1.5 py-1 text-xs whitespace-nowrap',
        className,
      )}
    >
      <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', dot)} />
      <span className="sr-only">{word}</span>
      <MonoNumber value={time} className="shrink-0 text-muted-foreground" />
      {eventName && (
        <span className="flex min-w-0 items-center gap-1">
          <CalendarDays aria-hidden className="size-3 shrink-0 text-muted-foreground" />
          <span className="truncate">{eventName}</span>
        </span>
      )}
      {toneName && <span className="shrink-0 text-muted-foreground">{toneName}</span>}
      {metric && <MonoNumber value={metric} className="ml-auto shrink-0 text-muted-foreground" />}
    </span>
  )
}
