/**
 * C3 — Calendar · `/calendar`. The visual heart of the promise: what is
 * planned, and — once published — how it actually did.
 *
 * Two honesty rules live here.
 *
 * "Syncing…" NEVER shows a stale zero. A published post whose analytics have
 * not arrived yet has no number, and the absence is said out loud rather than
 * filled in with 0 — a zero is a claim that nobody read the post, which is a
 * very different thing from not knowing yet.
 *
 * The generation-delayed indicator is the same idea for the other direction: a
 * slot whose generate-at time has passed with nothing drafted says so, instead
 * of looking indistinguishable from a slot that is simply early.
 */
import { ChevronLeft, ChevronRight, Settings2, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppShell } from '@/components/ab/app-shell'
import { EmptyState } from '@/components/ab/empty-state'
import { ErrorState } from '@/components/ab/error-state'
import { MonoNumber } from '@/components/ab/mono-number'
import { SlotChip } from '@/components/ab/slot-chip'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Link } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAnalytics,
  useCalendarEvents,
  useDataDispatch,
  useDrafts,
  useSchedule,
  useScreenPhase,
  useSlots,
} from '@/data/provider'
import { cn } from '@/lib/utils'
import { SlotSheet } from './slot-sheet'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Monday-first grid covering the month that contains `anchor`. */
function monthGrid(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - offset)
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

function weekGrid(anchor: Date): Date[] {
  const offset = (anchor.getDay() + 6) % 7
  const start = new Date(anchor)
  start.setDate(anchor.getDate() - offset)
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function CalendarScreen() {
  const slots = useSlots()
  const drafts = useDrafts()
  const events = useCalendarEvents()
  const analytics = useAnalytics()
  const schedule = useSchedule()
  const dispatch = useDataDispatch()
  const phase = useScreenPhase()

  const [view, setView] = useState<'month' | 'week'>('month')
  const [anchor, setAnchor] = useState(() => new Date())
  // The ID, not the object: a snapshot goes stale the moment the slot is
  // mutated (skipping it left the sheet rendering its pre-skip self), so the
  // open sheet is always re-derived from the live data.
  const [openSlotId, setOpenSlotId] = useState<string | null>(null)
  const openSlot = slots.find((slot) => slot.id === openSlotId) ?? null

  const days = useMemo(
    () => (view === 'month' ? monthGrid(anchor) : weekGrid(anchor)),
    [view, anchor],
  )
  const today = iso(new Date())

  /**
   * A published draft's headline metric, or the honest absence of one.
   * `undefined` metrics mean "not reported yet" — never rendered as 0.
   */
  const metricFor = (draftId: string): { label: string; syncing: boolean } | undefined => {
    const posts = analytics.flatMap((series) => series.posts).filter((p) => p.draftId === draftId)
    if (posts.length === 0) return undefined
    const reported = posts.filter((p) => p.metrics)
    if (reported.length === 0) return { label: 'Syncing…', syncing: true }
    const reach = reported.reduce((sum, post) => sum + (post.metrics?.reach ?? 0), 0)
    return { label: `${reach.toLocaleString('en-US')} reach`, syncing: false }
  }

  const shift = (direction: -1 | 1) => {
    const next = new Date(anchor)
    if (view === 'month') next.setMonth(anchor.getMonth() + direction)
    else next.setDate(anchor.getDate() + direction * 7)
    setAnchor(next)
  }

  const title = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(anchor)

  return (
    <AppShell title="Calendar" context={`${title} · ${schedule.timezone.replace('_', ' ')}`}>
      {phase === 'loading' ? (
        <div className="grid grid-cols-7 gap-2" aria-busy="true" aria-label="Loading calendar">
          {Array.from({ length: 21 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : phase === 'error' ? (
        <ErrorState
          message="We could not load your calendar. Your schedule is unaffected — try again."
          onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
        />
      ) : slots.length === 0 ? (
        <EmptyState
          icon={TriangleAlert}
          title="Nothing scheduled yet"
          description="Once your pipeline is running, every slot shows up here — and once posts go out, how they did."
          action={
            <Button asChild>
              <Link to="/calendar/settings">Set your posting rhythm</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" aria-label="Previous" onClick={() => shift(-1)}>
                <ChevronLeft aria-hidden />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setAnchor(new Date())}>
                Today
              </Button>
              <Button variant="ghost" size="icon" aria-label="Next" onClick={() => shift(1)}>
                <ChevronRight aria-hidden />
              </Button>
              <h2 className="ml-2 font-display text-lg font-semibold">{title}</h2>
            </div>

            <div className="flex items-center gap-2">
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(next) => next && setView(next as 'month' | 'week')}
                aria-label="Calendar view"
              >
                <ToggleGroupItem value="month" className="text-xs">
                  Month
                </ToggleGroupItem>
                <ToggleGroupItem value="week" className="text-xs">
                  Week
                </ToggleGroupItem>
              </ToggleGroup>
              {/* Without this the schedule was only reachable from the empty
                  state — i.e. unreachable for anyone who already has one. */}
              <Button asChild variant="outline" size="sm">
                <Link to="/calendar/settings">
                  <Settings2 aria-hidden />
                  Schedule settings
                </Link>
              </Button>
            </div>
          </div>

          {/* The legend earns its place: the dots and the trend marker mean
              nothing without it, and colour alone never carries either. */}
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {[
              ['Pending', 'bg-muted-foreground'],
              ['Generating', 'bg-primary'],
              ['Needs review', 'bg-primary'],
              ['Done', 'bg-success'],
              ['Skipped', 'bg-muted-foreground'],
            ].map(([label, dot]) => (
              <li key={label} className="flex items-center gap-1.5">
                <span aria-hidden className={cn('size-1.5 rounded-full', dot)} />
                {label}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <span aria-hidden>↗</span> Published, with reach
            </li>
          </ul>

          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="bg-card px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
              >
                {label}
              </div>
            ))}

            {days.map((day) => {
              const key = iso(day)
              const daySlots = slots.filter((slot) => slot.date === key).slice(0, 3)
              const dayEvent = events.find((event) => event.date === key)
              const inMonth = view === 'week' || day.getMonth() === anchor.getMonth()

              return (
                <div
                  key={key}
                  className={cn(
                    'flex min-h-24 flex-col gap-1 bg-card p-1.5',
                    // Out-of-month days recede via the SURFACE, not opacity —
                    // dimming real text is how a calendar quietly drops below
                    // AA (axe measured 2.37:1 on the date numerals).
                    !inMonth && 'bg-muted',
                    dayEvent && 'bg-accent',
                    view === 'week' && 'min-h-48',
                  )}
                >
                  <div className="flex items-baseline justify-between gap-1">
                    <MonoNumber
                      value={day.getDate()}
                      className={cn(
                        'text-xs',
                        key === today
                          ? 'rounded-full bg-primary px-1.5 py-0.5 font-semibold text-primary-foreground'
                          : 'text-muted-foreground',
                      )}
                    />
                    {dayEvent && (
                      <span className="truncate text-[0.65rem] font-medium text-primary">
                        {dayEvent.name}
                      </span>
                    )}
                  </div>

                  {daySlots.map((slot) => {
                    const slotDrafts = slot.draftIds
                      .map((id) => drafts.find((d) => d.id === id))
                      .filter(Boolean)
                    const published = slotDrafts.find((d) => d?.status === 'published')
                    const metric = published ? metricFor(published.id) : undefined
                    const delayed = slot.status === 'pending' && key < today

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setOpenSlotId(slot.id)}
                        className="rounded-md text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <SlotChip
                          time={slot.time}
                          status={slot.status}
                          eventName={view === 'week' ? dayEvent?.name : undefined}
                          metric={metric?.label}
                        />
                        {delayed && (
                          <span className="mt-0.5 flex items-center gap-1 text-[0.65rem] text-warning">
                            <TriangleAlert aria-hidden className="size-2.5" />
                            Generation delayed
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <SlotSheet
        slot={openSlot}
        open={openSlot !== null}
        onOpenChange={(next) => !next && setOpenSlotId(null)}
      />
    </AppShell>
  )
}
