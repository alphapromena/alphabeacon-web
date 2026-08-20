/**
 * D2 — Today · `/today`. The screen the product is judged on.
 *
 * Drafts are grouped by the slot they belong to, because that is the unit
 * people actually think in ("the 9am post"), and because a slot that failed to
 * generate must not take its siblings down with it — each group renders its own
 * error and the rest of the queue keeps working.
 */
import { Inbox, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/ab/empty-state'
import { ErrorState } from '@/components/ab/error-state'
import { PostingTime } from '@/components/ab/posting-time'
import { BeaconDot } from '@/components/ab/motion'
import { SkeletonList } from '@/components/ab/skeletons'
import { AppShell } from '@/components/ab/app-shell'
import { Button } from '@/components/ui/button'
import {
  useAssets,
  useCalendarEvents,
  useDataDispatch,
  useDrafts,
  useLiveMode,
  useSchedule,
  useScreenPhase,
  useSlots,
  useTones,
} from '@/data/provider'
import type { Draft } from '@/data/types'
import { LiveToday } from './live-today'
import { pluralize } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import { slotInstant } from '@/lib/timezone'
import { DraftCard } from './draft-card'
import { DraftDialogs } from './draft-dialogs'
import { useDraftActions } from './use-draft-actions'

export function TodayScreen() {
  const live = useLiveMode()

  // LIVE: the queue is the proposals ledger, joined to its runs (D-INT-J).
  // Not a different data source for the same screen — a different screen, for
  // the same reason F1 branched: the static half edits and schedules drafts it
  // owns, and neither of those exists on the wire yet.
  if (live) {
    return (
      <AppShell title="Today" context="What is waiting on you">
        <LiveToday />
      </AppShell>
    )
  }
  return <StaticTodayScreen />
}

function StaticTodayScreen() {
  const drafts = useDrafts()
  const slots = useSlots()
  const tones = useTones()
  const events = useCalendarEvents()
  const assets = useAssets()
  const schedule = useSchedule()
  const dispatch = useDataDispatch()
  const phase = useScreenPhase()
  const actions = useDraftActions()

  const today = new Date().toISOString().slice(0, 10)
  const todaySlots = slots.filter((slot) => slot.date === today)
  const awaiting = drafts.filter((d) => d.status === 'pending_review').length

  const context =
    awaiting > 0
      ? `${awaiting} ${pluralize(awaiting, 'draft')} ready across ${todaySlots.length} ${pluralize(todaySlots.length, 'slot')}`
      : 'Nothing waiting on you right now'

  return (
    <AppShell title="Today" context={context}>
      {phase === 'loading' ? (
        <SkeletonList rows={4} label="Loading today's queue" />
      ) : phase === 'error' ? (
        <ErrorState
          message={MESSAGES.errors.screenLoadFailed}
          onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {/* The shell's top bar already carries this screen's h1, so the
              in-page header is an h2 — one h1 per page, and the queue summary
              reads as a section of it rather than a second title. */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs tracking-wider text-muted-foreground uppercase">Today</p>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {awaiting > 0
                  ? `${awaiting} ${pluralize(awaiting, 'draft')} ready for review`
                  : 'Your queue is clear'}
              </h2>
              {todaySlots.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Across {todaySlots.length} {pluralize(todaySlots.length, 'slot')}. Approve what
                  fits, then create the art.
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <BeaconDot
                live={awaiting > 0}
                label={awaiting > 0 ? 'Drafts need review' : undefined}
              />
              <Button asChild variant="outline" size="sm">
                <Link to="/generate">
                  <Plus aria-hidden />
                  Generate one now
                </Link>
              </Button>
            </div>
          </div>

          {todaySlots.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {todaySlots.map((slot) => (
                <span key={slot.id} className="rounded-full border border-border px-2 py-0.5">
                  <PostingTime
                    at={slotInstant(slot.date, slot.time, schedule.timezone)}
                    zone={schedule.timezone}
                    showZone={false}
                  />
                </span>
              ))}
            </div>
          )}

          {todaySlots.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No drafts yet"
              description={
                schedule.started
                  ? `Your next slot generates at ${schedule.generateAt}.`
                  : MESSAGES.empty.dashboardFresh
              }
              action={
                <Button asChild>
                  <Link to={schedule.started ? '/generate' : '/onboarding'}>
                    {schedule.started ? 'Generate one now' : 'Finish setup'}
                  </Link>
                </Button>
              }
            />
          ) : (
            todaySlots.map((slot) => {
              const slotDrafts = slot.draftIds
                .map((id) => drafts.find((d) => d.id === id))
                .filter((d): d is Draft => Boolean(d))
              const event = events.find((e) => e.id === slot.eventId)

              return (
                <section key={slot.id} className="flex flex-col gap-3">
                  <h2 className="flex flex-wrap items-center gap-2 font-display text-sm font-semibold">
                    <PostingTime
                      at={slotInstant(slot.date, slot.time, schedule.timezone)}
                      zone={schedule.timezone}
                    />
                    {event && <span className="text-muted-foreground">· {event.name}</span>}
                  </h2>

                  {/* One slot's failure is its own — the others still render. */}
                  {slotDrafts.length === 0 ? (
                    <ErrorState
                      title="This slot did not generate"
                      message="Nothing was drafted for this time. The other slots are unaffected — try generating one by hand."
                    />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {slotDrafts.map((draft) => (
                        <DraftCard
                          key={draft.id}
                          draft={draft}
                          zone={schedule.timezone}
                          tone={tones.find((t) => t.id === draft.toneId)}
                          event={events.find((e) => e.id === draft.eventId)}
                          assetLabel={assets.find((a) => a.id === draft.assetId)?.label}
                          {...actions.handlersFor(draft)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )
            })
          )}
        </div>
      )}

      <DraftDialogs actions={actions} />
    </AppShell>
  )
}
