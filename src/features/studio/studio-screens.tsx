/**
 * Creative Studio — E1 gallery, E2 composer, E3 jobs, E4 asset detail.
 *
 * Studio is the company's general creative hub, not a feature of the review
 * queue: everything here works with no draft in sight, and the same composer
 * serves both (see `composer.tsx`). The job list is where the two modes become
 * visible to a user, via the origin tag on every row.
 */
import { ArrowLeft, ImageIcon, Sparkles, Trash2, Video } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { AppShell } from '@/components/ab/app-shell'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { EmptyState } from '@/components/ab/empty-state'
import { ErrorState } from '@/components/ab/error-state'
import { MonoNumber } from '@/components/ab/mono-number'
import { BeaconDot } from '@/components/ab/motion'
import { SkeletonCardGrid, SkeletonList } from '@/components/ab/skeletons'
import { JobStatusBadge } from '@/components/ab/status-badge'
import { toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  useAssets,
  useBilling,
  useCreditBalance,
  useDataDispatch,
  useDrafts,
  useJobs,
  useLiveMode,
  useScreenPhase,
  useStudioModels,
} from '@/data/provider'
import { LiveComposer } from './live-composer'
import { LiveGallery } from './live-gallery'
import { LiveJobs } from './live-jobs'
import { canTransition } from '@/lib/draft-status'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ComposerBody, ComposerSubmit } from './composer'
import { useComposer, TIER_RANK } from './use-composer'

// ---------------------------------------------------------------------------
// E1 — Model gallery
// ---------------------------------------------------------------------------

export function StudioGalleryScreen() {
  const live = useLiveMode()
  // LIVE: the gallery is the CATALOG (INT-11). Nothing about which models
  // exist is knowable statically, so the live half reads them rather than
  // rendering the demo's model records.
  if (live) {
    return (
      <AppShell title="Studio" context="What your workspace can render">
        <LiveGallery />
      </AppShell>
    )
  }
  return <StaticStudioGalleryScreen />
}

function StaticStudioGalleryScreen() {
  const models = useStudioModels()
  const billing = useBilling()
  const balance = useCreditBalance()
  const dispatch = useDataDispatch()
  const phase = useScreenPhase()
  const [kind, setKind] = useState<'all' | 'image' | 'video'>('all')
  const [tier, setTier] = useState<'all' | 'available'>('all')

  const visible = models
    .filter((model) => kind === 'all' || model.kind === kind)
    .filter((model) => tier === 'all' || TIER_RANK[model.tier] <= TIER_RANK[billing.planId])

  return (
    <AppShell title="Creative Studio" context="Images and video for anything your company needs">
      {phase === 'loading' ? (
        <SkeletonCardGrid cards={4} columns={3} label="Loading models" />
      ) : phase === 'error' ? (
        <ErrorState
          message="We could not load the model gallery. Try again in a moment."
          onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <ToggleGroup
                type="single"
                value={kind}
                onValueChange={(next) => next && setKind(next as typeof kind)}
                aria-label="Filter by kind"
              >
                <ToggleGroupItem value="all" className="text-xs">
                  All
                </ToggleGroupItem>
                <ToggleGroupItem value="image" className="text-xs">
                  Image
                </ToggleGroupItem>
                <ToggleGroupItem value="video" className="text-xs">
                  Video
                </ToggleGroupItem>
              </ToggleGroup>
              <ToggleGroup
                type="single"
                value={tier}
                onValueChange={(next) => next && setTier(next as typeof tier)}
                aria-label="Filter by plan"
              >
                <ToggleGroupItem value="all" className="text-xs">
                  Every model
                </ToggleGroupItem>
                <ToggleGroupItem value="available" className="text-xs">
                  On my plan
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full border border-border px-3 py-1 text-xs">
                <MonoNumber value={balance} /> credits
              </span>
              <Button asChild variant="ghost" size="sm">
                <Link to="/studio/jobs">My jobs →</Link>
              </Button>
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No models match these filters"
              description="Widen the filters, or upgrade to reach the models above your plan."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setKind('all')
                    setTier('all')
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((model) => {
                const locked = TIER_RANK[model.tier] > TIER_RANK[billing.planId]
                return (
                  <Card key={model.id}>
                    <CardContent className="flex flex-col gap-3">
                      {/* A rendered sample, not a stock image: the gradient is
                          the brand's, and it never pretends to be output. */}
                      <span
                        aria-hidden
                        className="flex h-28 items-center justify-center rounded-lg bg-brand text-primary-foreground"
                      >
                        {model.kind === 'video' ? (
                          <Video className="size-8 opacity-80" />
                        ) : (
                          <ImageIcon className="size-8 opacity-80" />
                        )}
                      </span>

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {model.kind}
                          </span>
                        </div>
                        <span className="text-sm">
                          <MonoNumber value={model.credits} /> cr
                        </span>
                      </div>

                      {locked ? (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-muted-foreground">
                            Needs the {model.tier} plan
                          </span>
                          <Button asChild size="sm" variant="outline">
                            <Link to="/billing/plans">See plans</Link>
                          </Button>
                        </div>
                      ) : (
                        <Button asChild size="sm">
                          <Link to={`/studio/new?model=${model.id}`}>Use this model</Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </AppShell>
  )
}

// ---------------------------------------------------------------------------
// E2 — Composer (standalone mode)
// ---------------------------------------------------------------------------

export function StudioComposerScreen() {
  const live = useLiveMode()
  if (live) {
    return (
      <AppShell title="Create" context="A visual, on demand">
        <LiveComposer />
      </AppShell>
    )
  }
  return <StaticStudioComposerScreen />
}

function StaticStudioComposerScreen() {
  const billing = useBilling()
  const navigate = useNavigate()
  const [params] = useState(() => new URLSearchParams(window.location.search))
  const composer = useComposer({
    planTier: billing.planId,
    initialModelId: params.get('model') ?? undefined,
    onSucceeded: (assetId) => navigate(`/studio/assets/${assetId}`),
  })

  return (
    <AppShell title="New generation" context="Creative Studio">
      <div className="mx-auto flex max-w-[720px] flex-col gap-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
          <Link to="/studio">
            <ArrowLeft aria-hidden />
            Back to the gallery
          </Link>
        </Button>

        {/* The same body D4 renders inside its dialog. */}
        <ComposerBody composer={composer} idPrefix="e2" />

        <div className="flex justify-end gap-2">
          <Button asChild variant="ghost">
            <Link to="/studio">Cancel</Link>
          </Button>
          <ComposerSubmit composer={composer} />
        </div>
      </div>
    </AppShell>
  )
}

// ---------------------------------------------------------------------------
// E3 — Job list
// ---------------------------------------------------------------------------

export function StudioJobsScreen() {
  const live = useLiveMode()
  if (live) {
    return (
      <AppShell title="Your renders" context="Everything this workspace has made">
        <LiveJobs />
      </AppShell>
    )
  }
  return <StaticStudioJobsScreen />
}

function StaticStudioJobsScreen() {
  const jobs = useJobs()
  const models = useStudioModels()
  const drafts = useDrafts()
  const dispatch = useDataDispatch()
  const phase = useScreenPhase()
  const [filter, setFilter] = useState<'all' | 'running' | 'succeeded' | 'failed'>('all')

  const visible = jobs.filter((job) => filter === 'all' || job.status === filter)

  return (
    <AppShell title="My jobs" context="Every generation, standalone or for a draft">
      {phase === 'loading' ? (
        <SkeletonList rows={4} label="Loading jobs" />
      ) : phase === 'error' ? (
        <ErrorState
          message="We could not load your jobs. Nothing was lost — try again."
          onRetry={() => dispatch({ type: 'dev/force', mode: 'none' })}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(next) => next && setFilter(next as typeof filter)}
            className="justify-start"
            aria-label="Filter jobs"
          >
            {(['all', 'running', 'succeeded', 'failed'] as const).map((value) => (
              <ToggleGroupItem key={value} value={value} className="text-xs capitalize">
                {value}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {visible.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Nothing generated yet"
              description="Pick a model from the gallery and make something."
              action={
                <Button asChild>
                  <Link to="/studio">Open the gallery</Link>
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
              {visible.map((job) => {
                const model = models.find((m) => m.id === job.modelId)
                const origin = job.origin
                const draft =
                  origin.type === 'draft' ? drafts.find((d) => d.id === origin.draftId) : undefined
                return (
                  <li key={job.id} className="flex flex-wrap items-center gap-3 p-3">
                    <span
                      aria-hidden
                      className={cn(
                        'flex size-12 shrink-0 items-center justify-center rounded-lg',
                        job.status === 'succeeded' ? 'bg-brand' : 'bg-muted',
                      )}
                    >
                      {job.status === 'running' ? (
                        // The beacon language, not a spinner (design.md Part 5).
                        <BeaconDot live />
                      ) : job.kind === 'video' ? (
                        <Video className="size-5 opacity-70" />
                      ) : (
                        <ImageIcon className="size-5 opacity-70" />
                      )}
                    </span>

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{model?.name ?? job.modelId}</span>
                        <JobStatusBadge status={job.status} />
                        {/* The origin tag is how a user tells the two modes
                            apart at a glance (screens4.md E3). */}
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                          {origin.type === 'standalone'
                            ? 'Standalone'
                            : `For draft: ${draft?.copy.slice(0, 24) ?? 'removed'}…`}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{job.prompt}</p>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">
                        <MonoNumber value={job.credits} /> cr
                      </span>
                      <MonoNumber
                        value={relativeTime(job.createdAt)}
                        className="text-xs text-muted-foreground"
                      />
                      {job.assetId && (
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/studio/assets/${job.assetId}`}>Open</Link>
                        </Button>
                      )}
                    </div>

                    {job.failureReason && (
                      <p className="w-full text-sm text-destructive">{job.failureReason}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </AppShell>
  )
}

// ---------------------------------------------------------------------------
// E4 — Asset detail
// ---------------------------------------------------------------------------

export function StudioAssetScreen() {
  const { id } = useParams()
  const assets = useAssets()
  const jobs = useJobs()
  const models = useStudioModels()
  const drafts = useDrafts()
  const dispatch = useDataDispatch()
  const navigate = useNavigate()
  const [attachOpen, setAttachOpen] = useState(false)

  const asset = assets.find((a) => a.id === id)
  const job = jobs.find((j) => j.id === asset?.jobId)
  const model = models.find((m) => m.id === job?.modelId)

  if (!asset) {
    return (
      <AppShell title="Asset">
        <ErrorState
          title="That asset is not here"
          message="It may have been deleted. Everything you still have is in My jobs."
        />
      </AppShell>
    )
  }

  const standalone = job?.origin.type === 'standalone'
  // The gate, again: only drafts that have earned media may receive it.
  const attachable = drafts.filter((draft) => canTransition(draft.status, 'media_ready'))

  return (
    <AppShell title="Asset" context={model?.name}>
      <div className="flex flex-col gap-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
          <Link to="/studio/jobs">
            <ArrowLeft aria-hidden />
            Back to my jobs
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div
            aria-label={asset.label}
            className="flex aspect-video items-center justify-center rounded-xl bg-brand text-primary-foreground"
          >
            {asset.kind === 'video' ? (
              <Video aria-hidden className="size-16 opacity-80" />
            ) : (
              <ImageIcon aria-hidden className="size-16 opacity-80" />
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <dl className="flex flex-col gap-3 rounded-xl border border-border p-4 text-sm">
              <Meta label="Model" value={model?.name ?? '—'} />
              <Meta label="Credits" value={<MonoNumber value={job?.credits ?? 0} />} />
              <Meta label="Created" value={<MonoNumber value={relativeTime(asset.createdAt)} />} />
              <Meta label="Origin" value={standalone ? 'Standalone' : 'For a draft'} />
            </dl>

            {job?.params && Object.keys(job.params).length > 0 && (
              <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
                <h2 className="text-xs tracking-wider text-muted-foreground uppercase">
                  Parameters
                </h2>
                <dl className="flex flex-col gap-1 text-sm">
                  {Object.entries(job.params).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">{key}</dt>
                      <dd>
                        <MonoNumber value={String(value)} className="text-xs" />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {standalone && (
                <Button variant="outline" onClick={() => setAttachOpen(true)}>
                  Attach to a draft
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to={`/studio/new?model=${job?.modelId ?? ''}`}>Generate similar</Link>
              </Button>
              <ConfirmDialog
                trigger={
                  <Button variant="destructive">
                    <Trash2 aria-hidden />
                    Delete asset
                  </Button>
                }
                title="Delete this asset?"
                consequence="It is removed from your jobs, and any draft using it goes back to having no media. The credits it cost are not refunded."
                confirmLabel="Delete asset"
                onConfirm={() => {
                  dispatch({ type: 'asset/delete', assetId: asset.id })
                  toastSuccess('Asset deleted')
                  navigate('/studio/jobs')
                }}
              />
            </div>
          </aside>
        </div>

        {job?.prompt && (
          <>
            <Separator />
            <section className="flex flex-col gap-2">
              <h2 className="font-display text-sm font-semibold">Prompt</h2>
              <p className="max-w-prose text-sm text-muted-foreground">{job.prompt}</p>
            </section>
          </>
        )}
      </div>

      <Dialog open={attachOpen} onOpenChange={setAttachOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Attach to a draft</DialogTitle>
            <DialogDescription>
              Only approved drafts can take media — the same rule the queue enforces.
            </DialogDescription>
          </DialogHeader>

          {attachable.length === 0 ? (
            // The honest empty state: says why the list is empty and what to do.
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No approved drafts yet — approve one from Today first, and it will show up here.
            </p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {attachable.map((draft) => (
                <li key={draft.id}>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'asset/attach', assetId: asset.id, draftId: draft.id })
                      toastSuccess('Attached', { description: 'The draft now has its media.' })
                      setAttachOpen(false)
                    }}
                    className="w-full rounded-lg border border-border p-3 text-left text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {draft.copy.slice(0, 90)}…
                  </button>
                </li>
              ))}
            </ul>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAttachOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
