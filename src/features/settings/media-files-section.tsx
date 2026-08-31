/**
 * The Knowledge "Files" section (MED-0831) — the org's media uploads.
 *
 * LIVE: rows come from `GET .../media/assets` and NOWHERE else — the wire is
 * the only record, by the founder's ruling, so when the list refuses, this
 * section says so instead of showing a remembered one. The wire row carries
 * `desc` and `kind` only — no date and no exact media type until the
 * platform adds them — so that is exactly what a row shows. Open mints a
 * fresh ~1-hour url on click; Delete removes the asset and the caller
 * re-reads the list.
 *
 * STATIC: the demo passes its simulated rows. There is no Open there — the
 * demo keeps no bytes, and an affordance that could never work would be the
 * disabled-teasing the design law forbids.
 */
import { ExternalLink, Film, Image as ImageIcon, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { SkeletonList } from '@/components/ab/skeletons'
import { Button } from '@/components/ui/button'
import { MESSAGES } from '@/lib/messages'

export interface MediaFileRow {
  assetId: string
  desc?: string
  kind?: string
  /**
   * MED-0831/R (A2/A3): shown as a badge ONLY when the wire row carries
   * `role === "logo"` — whether the list echoes the presign's role is
   * unknown, so absence hides nothing and claims nothing.
   */
  role?: string
}

const KIND_WORD: Record<string, string> = { image: 'Image', video: 'Video' }

export function MediaFilesSection({
  files,
  error = null,
  onOpen,
  onDelete,
}: {
  /** `null` while the first read is in flight (live). */
  files: MediaFileRow[] | null
  /** The list's own refusal (live) — rendered, never papered over. */
  error?: string | null
  /** Live only: mint a fresh url and show the file. Absent in the demo. */
  onOpen?: (assetId: string) => void | Promise<void>
  onDelete: (assetId: string) => void | Promise<void>
}) {
  return (
    <section aria-labelledby="media-files-heading" className="flex flex-col gap-2">
      <h3 id="media-files-heading" className="text-sm font-medium">
        Files
      </h3>

      {error ? (
        <p role="alert" className="rounded-lg border border-border p-4 text-sm text-destructive">
          {error}
        </p>
      ) : files === null ? (
        <SkeletonList rows={2} label="Loading your files" />
      ) : files.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          {MESSAGES.empty.noMediaFiles}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {files.map((file) => {
            const name = file.desc || file.assetId
            const Icon = file.kind === 'video' ? Film : ImageIcon
            return (
              <li
                key={file.assetId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-col">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-sm">{name}</span>
                      {file.role === 'logo' && (
                        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tracking-wide text-muted-foreground uppercase">
                          logo
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {KIND_WORD[file.kind ?? ''] ?? file.kind ?? 'File'}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {onOpen && (
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Open ${name}`}
                      onClick={() => void onOpen(file.assetId)}
                    >
                      <ExternalLink aria-hidden />
                      Open
                    </Button>
                  )}
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="sm" aria-label={`Delete ${name}`}>
                        <Trash2 aria-hidden />
                        Delete
                      </Button>
                    }
                    title="Delete this file?"
                    consequence="The studio forgets it — visuals stop drawing on it from the next render onwards."
                    confirmLabel="Delete"
                    onConfirm={() => void onDelete(file.assetId)}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
