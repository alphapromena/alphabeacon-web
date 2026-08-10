import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DEMO_BRANDS } from './demo-brands'
import { LinkedInCompanyCard, type WorkflowState } from './post-cards'

/**
 * The control-loop moment (brief §4 scene 5, §23): one realistic post with
 * working Approve · Edit · Decline and a "Why Malaky suggested this" note.
 * Approve animates the card into its Scheduled state and fires the
 * "Memory updated from your approval" touch (§21). Every button does a
 * visible, honest thing — no dead affordances.
 *
 * `floating` positions the controls below the card without adding to its
 * transform box (the scroll engine animates the card as one object);
 * `active` shows/hides the controls — inert while hidden so nothing
 * invisible can take focus.
 */

type DemoPhase = 'review' | 'editing' | 'scheduled' | 'declined'

const CARD_STATE: Record<DemoPhase, { state: WorkflowState; label?: string }> = {
  review: { state: 'needsReview' },
  editing: { state: 'needsReview', label: 'Editing' },
  scheduled: { state: 'scheduled', label: 'Scheduled · Mon 09:00' },
  declined: { state: 'needsReview', label: 'Declined' },
}

export function ApprovalDemo({
  className,
  floating = false,
  active = true,
}: {
  className?: string
  floating?: boolean
  active?: boolean
}) {
  const [phase, setPhase] = useState<DemoPhase>('review')
  const card = CARD_STATE[phase]

  const controls: ReactNode = (
    <>
      {phase !== 'scheduled' && (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setPhase('scheduled')}>
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPhase(phase === 'editing' ? 'review' : 'editing')}
          >
            {phase === 'editing' ? 'Done editing' : 'Edit'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPhase('declined')}>
            Decline
          </Button>
        </div>
      )}
      <div aria-live="polite" className="min-h-10 text-xs/relaxed text-muted-foreground">
        {phase === 'review' && (
          <details>
            <summary className="cursor-pointer font-medium text-foreground">
              Why Malaky suggested this
            </summary>
            <p className="mt-1 max-w-[44ch]">
              The lane opens Monday, and your last three approved announcements went out on
              launch mornings. Suggested from your calendar and your past approvals.
            </p>
          </details>
        )}
        {phase === 'editing' && <p>Edit in place — your words, then your approval.</p>}
        {phase === 'scheduled' && (
          <p>
            <span className="font-medium text-success">Memory updated from your approval.</span>{' '}
            Launch-morning announcements are now part of how Malaky writes for Falak.
          </p>
        )}
        {phase === 'declined' && (
          <p>
            Declined — Malaky asks why, and remembers the answer.{' '}
            <button
              type="button"
              className="font-medium text-foreground underline underline-offset-2"
              onClick={() => setPhase('review')}
            >
              Undo
            </button>
          </p>
        )}
      </div>
    </>
  )

  return (
    <div className={cn('relative flex w-full flex-col gap-3', className)}>
      <LinkedInCompanyCard
        brand={DEMO_BRANDS.falak}
        state={card.state}
        stateLabel={card.label}
        className={cn(phase === 'editing' && 'ring-2 ring-primary')}
      />
      {floating ? (
        <div
          data-mk-stage={active ? 'in' : ''}
          inert={!active || undefined}
          className="absolute inset-x-0 top-full flex flex-col gap-3 pt-3"
        >
          {controls}
        </div>
      ) : (
        active && controls
      )}
    </div>
  )
}
