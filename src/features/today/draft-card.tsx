/**
 * The draft card (D2), and the one place the approval gate is enforced in the
 * UI.
 *
 * The action row is computed from `canTransition`, never from a hand-written
 * `if (status === …)`. That is what makes the gate honest: media generation is
 * ABSENT before approval — not disabled, not greyed, not a tooltip explaining
 * why you cannot have it — because a control you can see but never use is a
 * tease, and the plan calls that out by name.
 *
 * The same rule quietly gives us the rest for free: a rejected draft grows no
 * buttons, a published one is terminal, and a failed publish offers exactly
 * one way forward.
 */
import { ChevronDown, ImageIcon, Pencil, Send, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ClaimChip } from '@/components/ab/claim-chip'
import { MonoNumber } from '@/components/ab/mono-number'
import { PostingTime } from '@/components/ab/posting-time'
import { SignalSweep } from '@/components/ab/motion'
import { DraftStatusBadge } from '@/components/ab/status-badge'
import { ToneBadge } from '@/components/ab/tone-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { CalendarEvent, Draft, Tone } from '@/data/types'
import { canTransition } from '@/lib/draft-status'
import { cn } from '@/lib/utils'

export function DraftCard({
  draft,
  zone,
  tone,
  event,
  assetLabel,
  onApprove,
  onReject,
  onEdit,
  onCreateMedia,
  onSchedule,
  onRetry,
}: {
  draft: Draft
  /** The schedule's posting zone — every time on this card is read in it. */
  zone: string
  tone?: Tone
  event?: CalendarEvent
  /** Present once media exists — the card shows it rather than describing it. */
  assetLabel?: string
  onApprove: () => void
  onReject: () => void
  onEdit: () => void
  onCreateMedia: () => void
  onSchedule: () => void
  onRetry: () => void
}) {
  const [showRationale, setShowRationale] = useState(false)

  // Every affordance below is a question asked of the state machine.
  const canApprove = canTransition(draft.status, 'approved')
  const canReject = canTransition(draft.status, 'rejected')
  const canCreateMedia = canTransition(draft.status, 'media_pending')
  const canSchedule = canTransition(draft.status, 'scheduled')
  const generating = draft.status === 'media_pending'
  const failed = draft.status === 'publish_failed'

  return (
    <Card className={cn('relative overflow-hidden', generating && 'ring-1 ring-primary/40')}>
      <SignalSweep active={generating} />
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <DraftStatusBadge status={draft.status} />
          {tone && <ToneBadge tone={tone} />}
          {event && (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {event.name}
            </span>
          )}
          {typeof draft.judgeScore === 'number' && (
            <span className="ml-auto text-xs text-muted-foreground">
              Quality <MonoNumber value={draft.judgeScore} />
            </span>
          )}
        </div>

        <p className="text-lg/relaxed">{draft.copy}</p>

        {draft.rationale && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 h-auto px-2 py-1 text-xs"
              aria-expanded={showRationale}
              onClick={() => setShowRationale((open) => !open)}
            >
              <ChevronDown
                aria-hidden
                className={cn('size-3 transition-transform', showRationale && 'rotate-180')}
              />
              Why this post
            </Button>
            {showRationale && (
              <p className="mt-1 text-sm text-muted-foreground">{draft.rationale}</p>
            )}
          </div>
        )}

        {draft.claims.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {draft.claims.map((claim) => (
              <li key={claim.id}>
                <ClaimChip claim={claim} />
              </li>
            ))}
          </ul>
        )}

        {assetLabel && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand"
            />
            <span className="text-sm">{assetLabel}</span>
          </div>
        )}

        {draft.scheduledFor && (
          <p className="text-sm text-muted-foreground">
            Scheduled for <PostingTime at={draft.scheduledFor} zone={zone} showDate />
          </p>
        )}

        {failed && draft.failureReason && (
          <p role="alert" className="text-sm text-destructive">
            {draft.failureReason}
          </p>
        )}

        {draft.publishResults && draft.publishResults.length > 0 && (
          <ul className="flex flex-wrap gap-2 text-xs">
            {draft.publishResults.map((result) => (
              <li
                key={result.platform}
                className={cn(
                  'rounded-full px-2 py-0.5 capitalize',
                  result.ok ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                )}
              >
                {result.platform} — {result.ok ? 'published' : (result.reason ?? 'failed')}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {canApprove && (
            <Button size="sm" onClick={onApprove}>
              <ThumbsUp aria-hidden />
              Approve
            </Button>
          )}
          {canApprove && (
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Pencil aria-hidden />
              Edit
            </Button>
          )}
          {canReject && (
            <Button size="sm" variant="ghost" onClick={onReject}>
              <ThumbsDown aria-hidden />
              Reject
            </Button>
          )}
          {/* Absent before approval — the whole point of the gate. */}
          {canCreateMedia && (
            <Button size="sm" variant="outline" onClick={onCreateMedia}>
              <ImageIcon aria-hidden />
              Create image or video
            </Button>
          )}
          {canSchedule && (
            <Button size="sm" variant={draft.assetId ? 'default' : 'outline'} onClick={onSchedule}>
              <Send aria-hidden />
              Schedule
            </Button>
          )}
          {failed && (
            <Button size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
          {generating && (
            <span className="text-sm text-muted-foreground">
              Generating… usually takes about 30 seconds.
            </span>
          )}
          <Button asChild size="sm" variant="ghost" className="ml-auto">
            <Link to={`/today/${draft.id}`}>Open</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
