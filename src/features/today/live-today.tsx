/**
 * D1/D2 in live mode (INT-12, decisions.md D-INT-J/K/L).
 *
 * Today is DERIVED FROM THE LEDGER, not from anything this browser remembers.
 * That is what makes a reload, a second device, and a run the frontend never
 * started all show the same queue — and it is why INT-10's localStorage run
 * ledger is retired.
 *
 * Three deviations from screens4 D2, each because the wire cannot back it:
 * - **Edit is absent** (D-INT-L): there is no drafts store, so an edit could
 *   not be persisted or reflected in what the platform learns from.
 * - **Approve records as posted** (D-INT-K): no publishing exists, so approve
 *   is the whole act and the copy says so rather than implying a send.
 * - **No Undo**: decisions are changeable (approve a declined one later), but
 *   there is no un-decide, so nothing pretends otherwise.
 */
import { Check, Copy, Image as ImageIcon, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { EmptyState } from '@/components/ab/empty-state'
import { SkeletonList } from '@/components/ab/skeletons'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { ToneBadge } from '@/components/ab/tone-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useProposalActions, type ProposalState, type ReviewItem } from '@/data/proposals'
import { useTones } from '@/data/provider'
import { useReadiness } from '@/data/readiness'
import { CreateVisualDialog } from '@/features/studio/create-visual-dialog'
import { shortDate } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import { Inbox } from 'lucide-react'

const TABS: { state: ProposalState; label: string }[] = [
  { state: 'pending', label: 'Needs review' },
  { state: 'approved', label: 'Approved' },
  { state: 'declined', label: 'Declined' },
]

const EMPTY: Record<ProposalState, string> = {
  pending: MESSAGES.empty.noReview,
  approved: MESSAGES.empty.noApproved,
  declined: MESSAGES.empty.noDeclined,
}

export function LiveToday() {
  const readiness = useReadiness()
  const proposals = useProposalActions()
  const [tab, setTab] = useState<ProposalState>('pending')
  const [items, setItems] = useState<ReviewItem[] | null>(null)
  const [more, setMore] = useState(false)
  const [pages, setPages] = useState(5)
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [declining, setDeclining] = useState<ReviewItem | null>(null)
  const [reason, setReason] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  // Held by id and read back live (trap 4): the card's draft is what the body carries.
  const [visualFor, setVisualFor] = useState<string | null>(null)
  const cancelled = useRef(false)

  // Its own dependency-free effect (the INT-10 latched-guard lesson).
  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  const load = useCallback(async () => {
    const result = await proposals.review(tab, pages)
    if (cancelled.current) return
    setItems(result.items)
    setMore(result.more)
    if (tab === 'pending') setPendingCount(result.items.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tab + depth are the inputs
  }, [tab, pages, proposals.orgId])

  useEffect(() => {
    setItems(null)
    void load()
  }, [load])

  // The header count is the ledger's, so it is right even before this tab is
  // the pending one.
  useEffect(() => {
    if (tab === 'pending') return
    void proposals.review('pending', 1).then((result) => {
      if (!cancelled.current) setPendingCount(result.items.length)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh alongside the tab
  }, [tab])

  async function decide(item: ReviewItem, action: 'approve' | 'decline', why?: string) {
    const id = item.proposal.proposalId
    setBusyId(id)
    const result =
      action === 'approve' ? await proposals.approve(id) : await proposals.decline(id, why)
    setBusyId(null)
    if (!result.ok) {
      toastError(
        result.code === 'conflict'
          ? MESSAGES.errors.approveConflict
          : result.code === 'not_found'
            ? MESSAGES.errors.proposalGone
            : result.code === 'bad_gateway'
              ? MESSAGES.errors.upstreamUnavailable
              : MESSAGES.errors.decisionFailed,
      )
      // Even a failure re-reads: the ledger is the truth, not this component.
      void load()
      return
    }
    toastSuccess(action === 'approve' ? MESSAGES.notices.recordedAsPosted : 'Declined', {
      description:
        action === 'approve'
          ? 'Copy the text to publish it yourself.'
          : 'Malaky will avoid writing anything like it.',
    })
    void load()
  }

  const visualItem = visualFor
    ? items?.find((item) => item.proposal.proposalId === visualFor)
    : undefined

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-4">
      <p className="text-sm text-muted-foreground" role="status">
        {pendingCount === null
          ? 'Reading your queue…'
          : `${pendingCount} need${pendingCount === 1 ? 's' : ''} review`}
      </p>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by decision">
        {TABS.map((entry) => (
          <Button
            key={entry.state}
            size="sm"
            variant={tab === entry.state ? 'default' : 'outline'}
            aria-pressed={tab === entry.state}
            onClick={() => {
              setPages(5)
              setTab(entry.state)
            }}
          >
            {entry.label}
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{MESSAGES.notices.publishingComingSoon}</p>

      {items === null ? (
        <SkeletonList rows={3} label="Loading your queue" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing here"
          description={EMPTY[tab]}
          // "generate posts to start" was the only route to F1 for a while, and
          // it was prose rather than a link (E2E-0820 F3). The invitation is
          // the whole point of an empty state, so on the tab that copy belongs
          // to it is a real control.
          action={
            tab === 'pending' ? (
              <Button asChild>
                <Link to="/generate">
                  {readiness.canGenerate ? 'Generate posts' : 'Finish setup to generate'}
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <ReviewCard
              key={item.proposal.proposalId}
              item={item}
              busy={busyId === item.proposal.proposalId}
              onApprove={() => void decide(item, 'approve')}
              onDecline={() => {
                setReason('')
                setDeclining(item)
              }}
              onCreateVisual={() => setVisualFor(item.proposal.proposalId)}
            />
          ))}
        </ul>
      )}

      {more && (
        <Button variant="outline" className="self-start" onClick={() => setPages((n) => n + 5)}>
          Load more
        </Button>
      )}

      <Dialog open={declining !== null} onOpenChange={(open) => !open && setDeclining(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline this draft?</DialogTitle>
            <DialogDescription>{MESSAGES.notices.declineTeaches}</DialogDescription>
          </DialogHeader>
          <Textarea
            aria-label="Why are you declining this?"
            rows={3}
            maxLength={500}
            value={reason}
            placeholder="Too promotional for a Tuesday"
            onChange={(event) => setReason(event.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeclining(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const item = declining
                setDeclining(null)
                if (item) void decide(item, 'decline', reason)
              }}
            >
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HSN-02: one modal for every card in the queue. The proposal id is the
          post's `ref`, which is what the platform echoes back as `origin.ref`. */}
      <CreateVisualDialog
        subject={
          visualItem?.draft
            ? {
                ref: visualItem.proposal.proposalId,
                content: visualItem.draft.content,
                toneId: visualItem.draft.toneId,
              }
            : null
        }
        open={visualFor !== null}
        onOpenChange={(next) => !next && setVisualFor(null)}
      />
    </div>
  )
}

/**
 * One reviewable draft. Flags, attributions and rationale are always visible —
 * a guardrail finding that is hidden is worse than no guardrail, and the
 * upstream terms require sources to stay visible.
 */
function ReviewCard({
  item,
  busy,
  onApprove,
  onDecline,
  onCreateVisual,
}: {
  item: ReviewItem
  busy: boolean
  onApprove: () => void
  onDecline: () => void
  onCreateVisual: () => void
}) {
  const tones = useTones()
  const { proposal, draft } = item
  const tone = tones.find((entry) => entry.id === draft?.toneId)

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {tone ? (
          <ToneBadge tone={tone} />
        ) : (
          draft?.toneId && <span className="text-xs text-muted-foreground">{draft.toneId}</span>
        )}
        {proposal.state === 'approved' && proposal.decidedAt && (
          <span className="text-xs text-muted-foreground">
            {MESSAGES.notices.recordedAsPosted} · {shortDate(proposal.decidedAt)}
          </span>
        )}
        {proposal.state === 'declined' && proposal.decidedAt && (
          <span className="text-xs text-muted-foreground">
            Declined · {shortDate(proposal.decidedAt)}
          </span>
        )}
      </div>

      {draft ? (
        <p className="text-sm whitespace-pre-wrap">{draft.content}</p>
      ) : (
        // The ledger row exists but its run could not be read. Saying so beats
        // dropping the row, which would quietly shrink the queue.
        <p className="text-sm text-muted-foreground">
          We could not load this draft&apos;s text just now. Refresh to try again.
        </p>
      )}

      {(draft?.flags.length ?? 0) > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border border-warning/60 bg-warning/10 p-3">
          <p className="text-xs font-medium">Flagged for review</p>
          <ul className="flex flex-col gap-1 text-xs">
            {draft!.flags.map((flag, index) => (
              <li key={index}>{typeof flag === 'string' ? flag : JSON.stringify(flag)}</li>
            ))}
          </ul>
        </div>
      )}

      {(draft?.attributions.length ?? 0) > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">Sources</p>
          <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
            {draft!.attributions.map((attribution, index) => (
              <li key={index}>
                {typeof attribution === 'string' ? attribution : JSON.stringify(attribution)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {draft?.rationale && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Why it wrote this: </span>
          {draft.rationale}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {proposal.state !== 'approved' && (
          <ConfirmDialog
            trigger={
              <Button size="sm" disabled={busy || !draft}>
                <Check aria-hidden />
                Approve
              </Button>
            }
            title="Record this as posted?"
            consequence={MESSAGES.notices.approveConfirm}
            confirmLabel="Approve"
            onConfirm={onApprove}
          />
        )}
        {proposal.state !== 'declined' && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={onDecline}>
            <X aria-hidden />
            Decline
          </Button>
        )}
        {/* HSN-02: beside Approve and Decline on every card that has a draft
            to build the body from. Never disabled — a failure inside the
            dialog waits for a fresh press, it never re-sends. */}
        {draft && (
          <Button size="sm" variant="outline" onClick={onCreateVisual}>
            <ImageIcon aria-hidden />
            Create visual
          </Button>
        )}
        {draft && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void navigator.clipboard
                .writeText(draft.content)
                .then(() => toastSuccess('Draft copied'))
                .catch(() => toastError(MESSAGES.errors.generic))
            }}
          >
            <Copy aria-hidden />
            Copy
          </Button>
        )}
      </div>

      {/* D-INT-L: editing needs a drafts store that does not exist yet. */}
      <p className="text-xs text-muted-foreground">
        {proposal.state === 'pending'
          ? MESSAGES.notices.approveRecordsAsPosted
          : MESSAGES.notices.editComingWithScheduling}
      </p>
    </li>
  )
}
