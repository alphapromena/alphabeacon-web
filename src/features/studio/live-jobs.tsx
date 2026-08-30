/**
 * E3 + E4 in live mode (INT-11).
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
 */
import { Download, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { EmptyState } from '@/components/ab/empty-state'
import { SkeletonList } from '@/components/ab/skeletons'
import { StatusBadge } from '@/components/ab/status-badge'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { isJobTerminal, useStudioActions, type MediaJob } from '@/data/studio'
import { MESSAGES } from '@/lib/messages'
import { useJobPolling } from './use-job-poll'

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
      />
    )
  }

  return (
    <ul className="mx-auto flex w-full max-w-[880px] flex-col gap-3">
      {jobs.map((job) => {
        const isOpen = openId === job.jobId
        const settled = isJobTerminal(job)
        return (
          <li key={job.jobId} className="flex flex-col gap-3 rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{job.capability ?? 'media.generate'}</span>
                <span className="text-xs text-muted-foreground">
                  {/* The platform's answer for which row served it: read-only,
                      and never sent back on a request. */}
                  {[job.modelAlias, job.plan].filter(Boolean).join(' · ')}
                </span>
              </div>
              <StatusBadge
                label={job.status}
                tone={
                  /succeeded/i.test(job.status)
                    ? 'success'
                    : /fail|cancel/i.test(job.status)
                      ? 'danger'
                      : 'warning'
                }
                icon={ImageIcon}
              />
            </div>

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
                  <figure key={asset.assetId} className="flex flex-col gap-2">
                    {assetUrls[asset.assetId] ? (
                      <img
                        src={assetUrls[asset.assetId]}
                        alt=""
                        className="max-h-64 rounded-lg border border-border"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">Opening…</span>
                    )}
                    <figcaption className="flex gap-2">
                      {assetUrls[asset.assetId] && (
                        <Button asChild variant="outline" size="sm">
                          <a
                            href={assetUrls[asset.assetId]}
                            download
                            target="_blank"
                            rel="noreferrer"
                          >
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
                        onConfirm={async () => {
                          const result = await studio.deleteAsset(asset.assetId)
                          if (!result.ok) {
                            toastError(MESSAGES.errors.generic)
                            return
                          }
                          toastSuccess('Asset deleted')
                          void refresh()
                        }}
                      />
                    </figcaption>
                  </figure>
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
