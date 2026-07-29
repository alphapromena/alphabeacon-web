/**
 * C4 — Slot detail, slid over the calendar.
 *
 * One day's slot, in full: the event it is attached to, its drafts with a way
 * into the queue, the skip (with a same-day undo), and — for anything already
 * published — how it did.
 *
 * The undo window is deliberate. Skipping is cheap to do by accident and
 * expensive to discover later, so it is reversible for the rest of the day and
 * then it is not; a permanent undo would keep a slot in limbo forever.
 */
import { CalendarDays, ExternalLink, Undo2 } from 'lucide-react'
import { Link } from 'react-router'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { MonoNumber } from '@/components/ab/mono-number'
import { PostingTime } from '@/components/ab/posting-time'
import { DraftStatusBadge } from '@/components/ab/status-badge'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  useAnalytics,
  useCalendarEvents,
  useDataDispatch,
  useDrafts,
  useSchedule,
} from '@/data/provider'
import type { Slot } from '@/data/types'
import { slotInstant } from '@/lib/timezone'
import { canUndoSkip } from './skip-window'

export function SlotSheet({
  slot,
  open,
  onOpenChange,
}: {
  slot: Slot | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const drafts = useDrafts()
  const events = useCalendarEvents()
  const analytics = useAnalytics()
  const schedule = useSchedule()
  const dispatch = useDataDispatch()

  if (!slot) return null

  const slotDrafts = slot.draftIds.map((id) => drafts.find((d) => d.id === id)).filter(Boolean)
  const event = events.find((e) => e.id === slot.eventId)
  const published = slotDrafts.filter((d) => d?.status === 'published')

  const performance = published.flatMap((draft) =>
    analytics.flatMap((series) =>
      series.posts
        .filter((post) => post.draftId === draft?.id)
        .map((post) => ({ connectionId: series.connectionId, post })),
    ),
  )
  const reported = performance.filter((entry) => entry.post.metrics)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>
            <PostingTime
              at={slotInstant(slot.date, slot.time, schedule.timezone)}
              zone={schedule.timezone}
              showDate
            />
          </SheetTitle>
          {/* NOT "the time your audience sees" — that was false. A connected
              page has followers in every zone and this product holds no data
              about where they are. What it knows is where it posts FROM. */}
          <SheetDescription>
            Posting time, in {schedule.timezone.replace('_', ' ')}.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-6">
          {event && (
            <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
              <CalendarDays aria-hidden className="size-4 shrink-0 text-primary" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{event.name}</span>
                <span className="text-xs text-muted-foreground">
                  Drafts for this slot are written around this event.
                </span>
              </div>
            </div>
          )}

          {slot.status === 'skipped' ? (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted p-4">
              <p className="text-sm">
                This slot is skipped. Nothing will be drafted or published for it.
              </p>
              {canUndoSkip(slot) ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-fit"
                  onClick={() => {
                    dispatch({ type: 'slot/unskip', slotId: slot.id })
                    toastSuccess('Slot restored', { description: 'It will generate as usual.' })
                  }}
                >
                  <Undo2 aria-hidden />
                  Undo skip
                </Button>
              ) : (
                // Says why the button is gone, rather than leaving a hole.
                <p className="text-xs text-muted-foreground">
                  Undo was available on the day it was skipped. Change the schedule to bring this
                  time back.
                </p>
              )}
            </div>
          ) : slotDrafts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nothing drafted yet — generation starts at <MonoNumber value={schedule.generateAt} />.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {slotDrafts.map(
                (draft) =>
                  draft && (
                    <li
                      key={draft.id}
                      className="flex flex-col gap-2 rounded-lg border border-border p-3"
                    >
                      <DraftStatusBadge status={draft.status} className="self-start" />
                      <p className="line-clamp-3 text-sm">{draft.copy}</p>
                      <Button asChild size="sm" variant="ghost" className="w-fit">
                        <Link to={`/today/${draft.id}`}>
                          Open in queue
                          <ExternalLink aria-hidden />
                        </Link>
                      </Button>
                    </li>
                  ),
              )}
            </ul>
          )}

          {published.length > 0 && (
            <>
              <Separator />
              <section className="flex flex-col gap-3">
                <h3 className="font-display text-sm font-semibold">Performance</h3>

                {reported.length === 0 ? (
                  // The honest micro-state: no number is not the same as zero.
                  <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                    Syncing… this platform has not reported numbers for the post yet. They usually
                    arrive within a few hours.
                  </p>
                ) : (
                  <dl className="grid grid-cols-2 gap-3">
                    <Stat
                      label="Reach"
                      value={reported.reduce((sum, e) => sum + (e.post.metrics?.reach ?? 0), 0)}
                    />
                    <Stat
                      label="Engagement"
                      value={reported.reduce(
                        (sum, e) => sum + (e.post.metrics?.engagement ?? 0),
                        0,
                      )}
                    />
                  </dl>
                )}

                {/* Per screens4.md G2, a post's link lands on the CHANNEL that
                    reported it, not on the org-wide overview. With no reporting
                    channel there is nothing specific to open, so it falls back
                    to the overview rather than to a guess. */}
                <Button asChild variant="ghost" size="sm" className="w-fit">
                  <Link
                    to={performance[0] ? `/analytics/${performance[0].connectionId}` : '/analytics'}
                  >
                    View full analytics →
                  </Link>
                </Button>
              </section>
            </>
          )}

          {slot.status !== 'skipped' && slotDrafts.length === 0 && (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm" className="w-fit">
                  Skip this slot
                </Button>
              }
              title="Skip this slot?"
              consequence="Nothing will be drafted or published at this time. You can undo it for the rest of today; after that, changing the schedule is how you bring the time back."
              confirmLabel="Skip slot"
              onConfirm={() => {
                dispatch({ type: 'slot/skip', slotId: slot.id })
                toastSuccess('Slot skipped', { description: 'You can undo this today.' })
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border px-3 py-2">
      <dt className="text-xs tracking-wider text-muted-foreground uppercase">{label}</dt>
      <dd>
        <MonoNumber value={value} className="text-lg font-semibold" />
      </dd>
    </div>
  )
}
