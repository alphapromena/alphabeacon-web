/**
 * D3 — Draft detail · `/today/:id`.
 *
 * Everything D2's card shows, plus the two things a card has no room for: the
 * timestamped status timeline and the full source list. The timeline is the
 * accountability record — who moved this, and when — and it is built from the
 * draft's own history rather than reconstructed, so it cannot disagree with
 * the status badge beside it.
 */
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { AppShell } from '@/components/ab/app-shell'
import { ClaimChip } from '@/components/ab/claim-chip'
import { ErrorState } from '@/components/ab/error-state'
import { MonoNumber } from '@/components/ab/mono-number'
import { DraftStatusBadge } from '@/components/ab/status-badge'
import { ToneBadge } from '@/components/ab/tone-badge'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  useAssets,
  useBilling,
  useDataDispatch,
  useDrafts,
  useScreenPhase,
  useSlots,
  useTones,
} from '@/data/provider'
import { canTransition } from '@/lib/draft-status'
import { clockTime, relativeTime, shortDate } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import { EditDraftDialog } from './edit-draft-dialog'
import { MediaPanel } from './media-panel'
import { RejectDialog } from './reject-dialog'
import { ScheduleDialog } from './schedule-dialog'

export function DraftDetailScreen() {
  const { id } = useParams()
  const drafts = useDrafts()
  const tones = useTones()
  const slots = useSlots()
  const assets = useAssets()
  const billing = useBilling()
  const dispatch = useDataDispatch()
  const phase = useScreenPhase()

  const [mediaOpen, setMediaOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const draft = drafts.find((d) => d.id === id)

  if (phase === 'error' || (!draft && phase === 'ready')) {
    return (
      <AppShell title="Draft">
        <ErrorState
          title="That draft is not here"
          message="It may have been rejected or it expired. The queue on Today has everything still live."
          onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
        />
      </AppShell>
    )
  }

  if (!draft) {
    return (
      <AppShell title="Draft">
        <p className="text-sm text-muted-foreground">{MESSAGES.errors.screenLoadFailed}</p>
      </AppShell>
    )
  }

  const tone = tones.find((t) => t.id === draft.toneId)
  const slot = slots.find((s) => s.id === draft.slotId)
  const asset = assets.find((a) => a.id === draft.assetId)

  return (
    <AppShell title="Draft" context={tone ? `${tone.name} tone` : undefined}>
      <div className="flex flex-col gap-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
          <Link to="/today">
            <ArrowLeft aria-hidden />
            Back to Today
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="flex flex-col gap-4">
                <p className="text-lg/relaxed">{draft.copy}</p>
                {draft.rationale && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="text-xs tracking-wider text-muted-foreground uppercase">
                        Why this post
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">{draft.rationale}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <section className="flex flex-col gap-2">
              <h2 className="font-display text-sm font-semibold">Media</h2>
              {asset ? (
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <span
                    aria-hidden
                    className="flex size-12 shrink-0 rounded-md bg-[image:var(--signal-gradient)]"
                  />
                  <span className="text-sm">{asset.label}</span>
                  {canTransition(draft.status, 'media_pending') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() => setMediaOpen(true)}
                    >
                      Regenerate
                    </Button>
                  )}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No media yet.
                  {canTransition(draft.status, 'media_pending')
                    ? ' Create an image or video from the actions on the right.'
                    : ' Approve this draft first.'}
                </p>
              )}
            </section>

            {draft.claims.length > 0 && (
              <section className="flex flex-col gap-2">
                <h2 className="font-display text-sm font-semibold">Sources</h2>
                <ul className="flex flex-wrap gap-2">
                  {draft.claims.map((claim) => (
                    <li key={claim.id}>
                      <ClaimChip claim={claim} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
              <DraftStatusBadge status={draft.status} className="self-start" />
              <dl className="flex flex-col gap-2 text-sm">
                {tone && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Tone</dt>
                    <dd>
                      <ToneBadge tone={tone} />
                    </dd>
                  </div>
                )}
                {slot && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Slot</dt>
                    <dd>
                      <MonoNumber value={`${shortDate(slot.date)} ${slot.time}`} />
                    </dd>
                  </div>
                )}
                {typeof draft.judgeScore === 'number' && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Quality score</dt>
                    <dd>
                      <MonoNumber value={draft.judgeScore} className="font-semibold" />
                    </dd>
                  </div>
                )}
              </dl>

              <div className="flex flex-col gap-2">
                {canTransition(draft.status, 'approved') && (
                  <>
                    <Button
                      onClick={() => {
                        dispatch({ type: 'draft/approve', draftId: draft.id })
                        toastSuccess('Approved')
                      }}
                    >
                      Approve
                    </Button>
                    <Button variant="ghost" onClick={() => setEditOpen(true)}>
                      Edit
                    </Button>
                  </>
                )}
                {canTransition(draft.status, 'rejected') && (
                  <Button variant="ghost" onClick={() => setRejectOpen(true)}>
                    Reject
                  </Button>
                )}
                {canTransition(draft.status, 'media_pending') && (
                  <Button variant="outline" onClick={() => setMediaOpen(true)}>
                    Create image or video
                  </Button>
                )}
                {canTransition(draft.status, 'scheduled') && (
                  <Button onClick={() => setScheduleOpen(true)}>Schedule</Button>
                )}
              </div>
            </div>

            <section className="flex flex-col gap-3">
              <h2 className="font-display text-sm font-semibold">Timeline</h2>
              <ol className="flex flex-col gap-3">
                {draft.timeline.map((entry, index) => (
                  <li key={`${entry.status}-${entry.at}`} className="flex gap-3">
                    <span className="flex flex-col items-center">
                      <span aria-hidden className="mt-1 size-2 rounded-full bg-primary" />
                      {index < draft.timeline.length - 1 && (
                        <span aria-hidden className="w-px flex-1 bg-border" />
                      )}
                    </span>
                    <span className="flex flex-col gap-0.5 pb-2">
                      <DraftStatusBadge status={entry.status} className="self-start" />
                      <span className="text-xs text-muted-foreground">
                        <MonoNumber value={clockTime(entry.at)} /> ·{' '}
                        <MonoNumber value={relativeTime(entry.at)} />
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </div>

      <MediaPanel
        draft={draft}
        planTier={billing.planId}
        open={mediaOpen}
        onOpenChange={setMediaOpen}
      />
      <ScheduleDialog draft={draft} open={scheduleOpen} onOpenChange={setScheduleOpen} />
      <RejectDialog draft={draft} open={rejectOpen} onOpenChange={setRejectOpen} />
      <EditDraftDialog draft={draft} open={editOpen} onOpenChange={setEditOpen} />
    </AppShell>
  )
}
