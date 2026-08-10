import { useState } from 'react'
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
 * Today's workspace, as marketing proof (brief §5) — NOT the in-app Today
 * screen; the app is untouched. The five rows are the brief's table
 * verbatim, rendered with the demo brands and the same mock components:
 * pick a row, see the actual output. Workflow states, never engagement
 * numbers.
 */

interface WorkspaceRow {
  id: string
  type: string
  state: WorkflowState
  stateLabel?: string
  metadata: string
  card: React.ReactNode
}

const ROWS: WorkspaceRow[] = [
  {
    id: 'company',
    type: 'Company LinkedIn',
    state: 'needsReview',
    stateLabel: 'Ready for review',
    metadata: 'Updated from previous approval',
    card: <LinkedInCompanyCard brand={DEMO_BRANDS.falak} state="needsReview" stateLabel="Ready for review" />,
  },
  {
    id: 'executive',
    type: 'CEO LinkedIn',
    state: 'needsReview',
    stateLabel: 'Needs your decision',
    metadata: 'Suggested from previous executive content',
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

export function WorkspaceSection() {
  const [selected, setSelected] = useState(ROWS[0].id)
  const row = ROWS.find((candidate) => candidate.id === selected) ?? ROWS[0]

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
                <StatusChip state={candidate.state} label={candidate.stateLabel} />
                <span className="w-full text-xs text-muted-foreground sm:ml-auto sm:w-auto sm:text-right">
                  {candidate.metadata}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div aria-live="polite" className="mx-auto w-full max-w-xs lg:mx-0">
        {row.card}
      </div>
    </div>
  )
}
