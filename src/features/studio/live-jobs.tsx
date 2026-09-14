/**
 * E3 + E4 in live mode (INT-11; HSN-0910 for the other asset kinds).
 *
 * The list deliberately arrives WITHOUT presigned urls - minting one per asset
 * across a page is a signing call per row for links most people never open - so
 * a url is minted only for the asset actually opened, and it is good for an
 * hour. That is the wire's design, and this screen follows it rather than
 * pre-fetching everything.
 *
 * Polling uses the MEDIA JOB vocabulary (`succeeded`), never a run's
 * (`completed`). Sharing one predicate between them would poll forever. The
 * schedule itself lives in `use-job-poll.ts` (HSN-02), so this list and the
 * Create-visual dialog follow a job through one machinery.
 *
 * HSN-0910: a job can carry `image`, `video`, `audio` and `document` assets
 * (a voice is an audio track plus a timestamps document; a film up to all
 * three). An image shows, a video plays, and audio and document render
 * DEFENSIVELY — a row with Open and Download, no player claims — until the
 * envelopes are seen more than once. The film's named failures render as
 * their own messages.
 */
import { Download, ExternalLink, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { EmptyState } from '@/components/ab/empty-state'
import { SkeletonList } from '@/components/ab/skeletons'
import { StatusBadge } from '@/components/ab/status-badge'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { isMediaCapabilityId, mediaCapability } from '@/data/media-capabilities'
import { isJobTerminal, useStudioActions, type MediaAsset, type MediaJob } from '@/data/studio'
import { MESSAGES } from '@/lib/messages'
import { useJobPolling } from './use-job-poll'

/** The capability's own name where the table knows it; the wire's id otherwise. */
function jobTitle(job: MediaJob): string {
  const id = job.capability ?? 'media.generate'
  return isMediaCapabilityId(id) ? mediaCapability(id).name : id
}

/**
 * The film's named failures (the document): `reference_refused`,
 * `output_refused`, `script_unfit`. Anything else is the wire's own words.
 */
function failureMessage(error: unknown): string | null {
  if (error === undefined || error === null) return null
  const text = typeof error === 'string' ? error : JSON.stringify(error)
  if (/reference_refused/.test(text)) return MESSAGES.errors.filmReferenceRefused
  if (/output_refused/.test(text)) return MESSAGES.errors.filmOutputRefused
  if (/script_unfit/.test(text)) return MESSAGES.errors.filmScriptUnfit
  if (typeof error === 'object') {
    const record = error as { message?: unknown; code?: unknown }
    if (typeof record.message === 'string') return record.message
    if (typeof record.code === 'string') return record.code
  }
  return text
}

export function LiveJobs() {
  const studio = useStudioActions()
  const [params] = useSearchParams()

  const [jobs, setJobs] = useState<MediaJob[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(params.get('job'))
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({})
  const cancelled = useRef(false)

  // The unmount guard is its own dependency-free effect - sharing it with a
  // data effect latches it on the first dependency change (INT-10's bug).
  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  const refresh = useCallback(async () => {
    const list = await studio.listJobs()
    if (!cancelled.current) setJobs(list)
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable per org
  }, [studio.orgId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const statusKey = (jobs ?? []).map((job) => job.status).join(',')

  // Poll only while something is genuinely in flight — the Studio's one
  // poller, shared with the Create-visual dialog since HSN-02.
  useJobPolling(jobs, refresh)

  // Arriving from the composer names a job in the query string, so it is
  // already "open" and its Open button never renders — which means nothing
  // would ever mint its asset urls and the render would sit there invisible.
  // Opening it as soon as it settles is what the user came here for.
  useEffect(() => {
    if (!openId || !jobs) return
    const watched = jobs.find((job) => job.jobId === openId)
    if (!watched || !isJobTerminal(watched)) return
    const assets = watched.assets ?? []
    if (assets.length > 0 && assets.every((asset) => assetUrls[asset.assetId])) return
    void open(watched)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when it settles
  }, [openId, statusKey])

  async function open(job: MediaJob) {
    setOpenId(job.jobId)
    const full = await studio.readJob(job.jobId)
    if (!full || cancelled.current) return
    setJobs((current) =>
      (current ?? []).map((entry) => (entry.jobId === full.jobId ? full : entry)),
    )
    // Mint a url per asset, only now that one is actually being looked at.
    for (const asset of full.assets ?? []) {
      const url = asset.url ?? (await studio.assetUrl(asset.assetId))
      if (url && !cancelled.current) {
        setAssetUrls((current) => ({ ...current, [asset.assetId]: url }))
      }
    }
  }

  if (jobs === null) return <SkeletonList rows={3} label="Loading your renders" />
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="Nothing rendered yet"
        description={MESSAGES.empty.noJobs}
        action={
          <Button asChild>
            <Link to="/studio">Open the studio</Link>
          </Button>
        }
      />
    )
  }

  return (
    <ul className="mx-auto flex w-full max-w-[880px] flex-col gap-3">
      {jobs.map((job) => {
        const isOpen = openId === job.jobId
        const settled = isJobTerminal(job)
        const failed = /fail|cancel/i.test(job.status)
        const failure = failed ? failureMessage(job.error) : null
        return (
          <li key={job.jobId} className="flex flex-col gap-3 rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{jobTitle(job)}</span>
                <span className="text-xs text-muted-foreground">
                  {/* The platform's answer for which row served it: read-only,
                      and never sent back on a request. */}
                  {[job.capability, job.modelAlias, job.plan].filter(Boolean).join(' · ')}
                </span>
              </div>
              <StatusBadge
                label={job.status}
                tone={/succeeded/i.test(job.status) ? 'success' : failed ? 'danger' : 'warning'}
                icon={ImageIcon}
              />
            </div>

            {failure && (
              <p role="alert" className="text-sm text-destructive">
                {failure}
              </p>
            )}

            {!isOpen && settled && (
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => void open(job)}
              >
                Open
              </Button>
            )}

            {isOpen && (
              <div className="flex flex-wrap gap-3">
                {(job.assets ?? []).map((asset) => (
                  <AssetFigure
                    key={asset.assetId}
                    asset={asset}
                    url={assetUrls[asset.assetId]}
                    onDelete={async () => {
                      const result = await studio.deleteAsset(asset.assetId)
                      if (!result.ok) {
                        toastError(MESSAGES.errors.generic)
                        return
                      }
                      toastSuccess('Asset deleted')
                      void refresh()
                    }}
                  />
                ))}
                {(job.assets ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {settled ? 'This job produced no assets.' : 'Still rendering…'}
                  </p>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** One asset, by kind: an image shows, a video plays, anything else opens. */
function AssetFigure({
  asset,
  url,
  onDelete,
}: {
  asset: MediaAsset
  url: string | undefined
  onDelete: () => Promise<void>
}) {
  const kind = asset.kind ?? 'image'
  const seconds = typeof asset.meta?.durationS === 'number' ? asset.meta.durationS : null
  return (
    <figure className="flex flex-col gap-2">
      {!url ? (
        <span className="text-xs text-muted-foreground">Opening…</span>
      ) : kind === 'image' ? (
        <img src={url} alt="" className="max-h-64 rounded-lg border border-border" />
      ) : kind === 'video' ? (
        <video src={url} controls className="max-h-64 rounded-lg border border-border" />
      ) : (
        <p className="rounded-lg border border-border px-3 py-2 text-sm">
          <span className="font-medium capitalize">{kind}</span>
          {seconds !== null && (
            <span className="text-muted-foreground">
              {' '}
              · <span className="font-mono tabular-nums">{seconds.toFixed(1)}</span> s
            </span>
          )}
        </p>
      )}
      <figcaption className="flex flex-wrap gap-2">
        {url && kind !== 'image' && kind !== 'video' && (
          <Button asChild variant="outline" size="sm">
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden />
              Open
            </a>
          </Button>
        )}
        {url && (
          <Button asChild variant="outline" size="sm">
            <a href={url} download target="_blank" rel="noreferrer">
              <Download aria-hidden />
              Download
            </a>
          </Button>
        )}
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm">
              <Trash2 aria-hidden />
              Delete
            </Button>
          }
          title="Delete this asset?"
          consequence="The file is removed from storage as well as from this list, and cannot be recovered."
          confirmLabel="Delete asset"
          onConfirm={onDelete}
        />
      </figcaption>
    </figure>
  )
}
