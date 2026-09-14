/**
 * D2 — Today · `/today`. The screen the product is judged on.
 *
 * Drafts are grouped by the slot they belong to, because that is the unit
 * people actually think in ("the 9am post"), and because a slot that failed to
 * generate must not take its siblings down with it — each group renders its own
 * error and the rest of the queue keeps working.
 */
import { CalendarClock, Clock, Plus, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/ab/empty-state'
import { useReadiness } from '@/data/readiness'
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
  const readiness = useReadiness()
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

  /*
   * §5.7 — did the queue just become clear?
   *
   * Only a TRANSITION counts. A queue that was already empty when the screen
   * mounted has not been finished, it has merely been arrived at, and marking
   * that would make the moment meaningless within a day. `clearedAt` keys the
   * element so a second clearing re-runs the animation rather than React
   * reusing a node whose animation has already played.
   */
  const previousAwaiting = useRef(awaiting)
  const [clearedAt, setClearedAt] = useState(0)
  useEffect(() => {
    if (previousAwaiting.current > 0 && awaiting === 0) setClearedAt(Date.now())
    previousAwaiting.current = awaiting
  }, [awaiting])
  const cleared = clearedAt > 0 && Date.now() - clearedAt < 2000

  /**
   * Why Today is empty, and the one thing that fixes it. Ordered by what
   * blocks first: a workspace that cannot generate is told that before it is
   * told about a rhythm, and a workspace with a rhythm is simply waiting.
   * `Clock` rather than `Inbox` for the waiting case — an inbox says "empty",
   * a clock says "not yet", which is the truth.
   */
  const emptyState = !readiness.canGenerate
    ? {
        icon: Sparkles,
        title: 'Malaky needs your brand voice first',
        description: MESSAGES.empty.todayNeedsSetup,
        action: 'Finish setup',
        href: '/generate',
      }
    : schedule.started
      ? {
          icon: Clock,
          title: 'Your next drafts are on the way',
          description: MESSAGES.empty.todayWaiting.replace('{time}', schedule.generateAt),
          action: 'Generate one now',
          href: '/generate',
        }
      : {
          icon: CalendarClock,
          title: 'Tell Malaky when to post',
          description: MESSAGES.empty.todayNoRhythm,
          action: 'Set your posting rhythm',
          href: '/calendar/settings',
        }

  /**
   * §4 — when the header's control and the empty state's control are the same
   * link, the header's goes. Both empty-state branches that point at
   * `/generate` produce that collision; the "tell Malaky when to post" branch
   * points at the calendar instead and is a real second route, so it keeps it.
   */
  const headerActionIsDuplicate = todaySlots.length === 0 && emptyState.href === '/generate'

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
              reads as a section of it rather than a second title.
              The tracked-out uppercase eyebrow that sat above this heading is
              gone (ORDER THEME-0913): read once on a landing page it is a
              signpost, read hourly it is noise, and it repeated the word the
              top bar already says. The heading carries the meaning alone. */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="relative flex flex-col gap-1">
              {/*
               * §5.7 — the one memorable moment, and the only one. A gold rule
               * draws once when the LAST draft is approved. It is earned: it
               * cannot fire on load, on navigation, or on any queue that still
               * has work in it, so it marks finishing rather than arriving.
               * Removed entirely under prefers-reduced-motion (globals.css).
               */}
              {cleared && (
                <span
                  key={clearedAt}
                  data-ab-motion="queue-clear"
                  aria-hidden
                  className="absolute inset-x-0 -top-2 h-px rounded-full bg-brand"
                />
              )}
              <h2 className="font-display text-2xl font-semibold tracking-tight text-balance">
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
              {/*
               * ONE route, not two (ORDER DEMO-0914 §4).
               *
               * This button and the empty state below it were both rendering,
               * both pointing at `/generate`, and in the "waiting" branch with
               * the SAME words on them — two controls, one destination, on a
               * screen whose whole content was those two controls. The empty
               * state's is the one that survives: it is the primary action, it
               * sits under the sentence that explains why it is there, and
               * LIVE Today has only ever had that one (`live-today.tsx`), so
               * dropping this one makes the two halves of Today agree.
               *
               * It still renders whenever it is NOT a duplicate: with a queue
               * on screen it is the only way to add to it, and when the empty
               * state sends you to the calendar instead this offers the other,
               * genuinely different, route.
               *
               * The affordance never lies about what pressing it will do
               * (ORDER ONB-0827, D-ONB-D). It stays a real link — `/generate`
               * renders the checklist honestly, so this is never a dead
               * button — but a workspace that cannot generate is told so
               * here rather than one click later.
               */}
              {headerActionIsDuplicate ? null : (
                <Button asChild variant="outline" size="sm">
                  <Link to="/generate">
                    <Plus aria-hidden />
                    {readiness.canGenerate ? 'Generate one now' : 'Finish setup to generate'}
                  </Link>
                </Button>
              )}
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
            /*
             * Today's empty state, in the three shapes it can honestly take
             * (ORDER THEME-0913 §5.1 — pulled forward into Phase 1 because
             * this is the screen Abdallah reviews first and a stub would make
             * that review meaningless).
             *
             * "No drafts yet" was a defect by the design law: it named neither
             * what would appear here, nor why nothing had, nor what to do. The
             * three branches below are the three reasons Today can be empty,
             * in the order they block — brand setup first (nothing runs
             * without it), then the posting rhythm, then simply waiting — and
             * each names all three things. The destinations are unchanged.
             */
            <EmptyState
              icon={emptyState.icon}
              title={emptyState.title}
              description={emptyState.description}
              action={
                <Button asChild>
                  <Link to={emptyState.href}>{emptyState.action}</Link>
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
