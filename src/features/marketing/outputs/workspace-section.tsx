import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DEMO_BRANDS } from './demo-brands'
import {
  ArabicSocialCard,
  InstagramCard,
  LinkedInCompanyCard,
  LinkedInExecutiveCard,
  NewsletterCard,
  StatusChip,
  type WorkflowState,
} from './post-cards'

/**
 * Today's workspace, as an interactive marketing demo (production pass,
 * 2026-08-11) — NOT the in-app Today screen; the app is untouched. Queue
 * on the left, the selected row's actual output on the right, and a real
 * approval loop on reviewable rows: Approve walks Ready for review →
 * Approved → Scheduled · 18:00, then the "Memory updated ✓" touch —
 * the control loop, the publishing workflow, and the learning in one
 * gesture. Front-end demonstration only: state is local, nothing calls
 * publishing, and a page refresh forgets everything.
 */

interface WorkspaceRow {
  id: string
  type: string
  state: WorkflowState
  stateLabel?: string
  metadata: string
  /** Rows that carry the Approve · Edit · Decline loop. */
  reviewable?: boolean
  card: React.ReactNode
}

const ROWS: WorkspaceRow[] = [
  {
    id: 'company',
    type: 'Company LinkedIn',
    state: 'needsReview',
    stateLabel: 'Ready for review',
    metadata: 'Updated from previous approval',
    reviewable: true,
    card: <LinkedInCompanyCard brand={DEMO_BRANDS.falak} state="needsReview" stateLabel="Ready for review" />,
  },
  {
    id: 'executive',
    type: 'CEO LinkedIn',
    state: 'needsReview',
    stateLabel: 'Needs your decision',
    metadata: 'Suggested from previous executive content',
    reviewable: true,
    card: (
      <LinkedInExecutiveCard
        brand={DEMO_BRANDS.meezan}
        state="needsReview"
        stateLabel="Needs your decision"
      />
    ),
  },
  {
    id: 'instagram',
    type: 'Instagram',
    state: 'scheduled',
    stateLabel: 'Scheduled · 18:00',
    metadata: 'Recommended audience · Riyadh & Jeddah',
    card: <InstagramCard brand={DEMO_BRANDS.nura} state="scheduled" stateLabel="Scheduled · 18:00" />,
  },
  {
    id: 'arabic',
    type: 'Arabic Social',
    state: 'needsReview',
    stateLabel: 'Ready for review',
    metadata: 'Ramadan calendar',
    reviewable: true,
    card: <ArabicSocialCard brand={DEMO_BRANDS.zaytoun} state="needsReview" stateLabel="Ready for review" />,
  },
  {
    id: 'newsletter',
    type: 'Newsletter',
    state: 'approved',
    metadata: 'Generated this morning',
    card: <NewsletterCard brand={DEMO_BRANDS.falak} state="approved" />,
  },
]

/** The demo approval loop's phases, per row id. */
type RowPhase = 'approved' | 'scheduled' | 'declined' | 'editing'

export function WorkspaceSection() {
  const [selected, setSelected] = useState(ROWS[0].id)
  const [phases, setPhases] = useState<Record<string, RowPhase>>({})
  const scheduleTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const row = ROWS.find((candidate) => candidate.id === selected) ?? ROWS[0]
  const phase = phases[row.id]

  useEffect(() => () => clearTimeout(scheduleTimer.current), [])

  const approve = () => {
    const id = row.id
    setPhases((current) => ({ ...current, [id]: 'approved' }))
    clearTimeout(scheduleTimer.current)
    scheduleTimer.current = setTimeout(() => {
      setPhases((current) => (current[id] === 'approved' ? { ...current, [id]: 'scheduled' } : current))
    }, 900)
  }

  const chipFor = (candidate: WorkspaceRow) => {
    const rowPhase = phases[candidate.id]
    if (rowPhase === 'approved') return <StatusChip state="approved" />
    if (rowPhase === 'scheduled') return <StatusChip state="scheduled" label="Scheduled · 18:00" />
    if (rowPhase === 'declined') return <StatusChip state="needsReview" label="Declined" />
    if (rowPhase === 'editing') return <StatusChip state="needsReview" label="Editing" />
    return <StatusChip state={candidate.state} label={candidate.stateLabel} />
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-[var(--shadow-soft-lg)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <span className="text-sm font-medium">Today</span>
          <span className="text-xs text-muted-foreground">5 items prepared · 3 need review</span>
        </div>
        <ul className="flex flex-col divide-y divide-border">
          {ROWS.map((candidate) => (
            <li key={candidate.id}>
              <button
                type="button"
                aria-pressed={candidate.id === selected}
                onClick={() => setSelected(candidate.id)}
                className={cn(
                  'flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-left',
                  'motion-safe:transition-colors hover:bg-muted/50',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:-outline-offset-2',
                  candidate.id === selected && 'bg-muted/60',
                )}
              >
                <span className="min-w-32 text-sm font-medium">{candidate.type}</span>
                {chipFor(candidate)}
                <span className="w-full text-xs text-muted-foreground sm:ml-auto sm:w-auto sm:text-right">
                  {candidate.metadata}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div aria-live="polite" className="mx-auto flex w-full max-w-xs flex-col gap-3 lg:mx-0">
        <div className={cn(phase === 'editing' && 'rounded-[1.25rem] ring-2 ring-primary')}>
          {row.card}
        </div>

        {row.reviewable && (
          <div className="flex flex-col gap-2">
            {phase !== 'approved' && phase !== 'scheduled' && (
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={approve}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPhases((current) => {
                      const next = { ...current }
                      if (next[row.id] === 'editing') delete next[row.id]
                      else next[row.id] = 'editing'
                      return next
                    })
                  }
                >
                  {phase === 'editing' ? 'Done editing' : 'Edit'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPhases((current) => ({ ...current, [row.id]: 'declined' }))}
                >
                  Decline
                </Button>
              </div>
            )}
            <p className="min-h-5 text-xs/relaxed text-muted-foreground">
              {phase === 'scheduled' && (
                <span className="font-medium text-success">Memory updated ✓</span>
              )}
              {phase === 'approved' && 'Approved — scheduling…'}
              {phase === 'editing' && 'Edit in place — your words, then your approval.'}
              {phase === 'declined' && (
                <>
                  Declined — Malaky asks why, and remembers the answer.{' '}
                  <button
                    type="button"
                    className="font-medium text-foreground underline underline-offset-2"
                    onClick={() =>
                      setPhases((current) => {
                        const next = { ...current }
                        delete next[row.id]
                        return next
                      })
                    }
                  >
                    Undo
                  </button>
                </>
              )}
              {!phase && 'A demo of the review loop — nothing is published.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
