/**
 * I6 in live mode (INT-11) - the org's knowledge collection.
 *
 * ONE collection per org, named `knowledge`, created LAZILY: a duplicate name
 * answers 400 rather than a conflict code, so "create, and fall back to the
 * list" is the entire algorithm. `embeddingModel` is REQUIRED despite api.md
 * marking it optional (the smoke run proved it), and a collection pins it for
 * its lifetime, so it is chosen once and never edited.
 *
 * Three ways in, all honest about what happens next:
 * - a FILE is presigned and PUT straight to storage (D-INT-A - the platform
 *   never proxies bytes). MED-0831 split this by the chosen type
 *   (`knowledgeUploadDoor`): a DOCUMENT goes to the RAG door exactly as
 *   before — ingestion starts by itself when the object lands, there is no
 *   "complete" call, the presign expires in 15 minutes; an IMAGE or VIDEO
 *   goes to the MEDIA door — presign carries the form's description as
 *   `desc`, the PUT lands, and the asset simply exists (no lifecycle, no
 *   registration call — the platform picks it up by itself);
 * - a URL is fetched by the platform;
 * - pasted TEXT is pushed inline.
 * RAG sources answer 202 and settle through Uploading, Processing, then Ready
 * or Failed - which is why that list polls rather than claiming success on
 * submit.
 *
 * The "Files" section is the media uploads, read from the WIRE's asset list
 * and nowhere else (the founder's ruling: no local ledger of any kind). The
 * list is read LAZILY when this screen opens — never in the bootstrap burst —
 * and re-read after every upload and delete.
 */
import { FileText, Link2, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { StatusBadge } from '@/components/ab/status-badge'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  isMediaUploadKind,
  isUploadedMediaFile,
  useKnowledgeActions,
  useStudioActions,
  type KnowledgeSource,
  type UploadMediaAssetResult,
} from '@/data/studio'
import { pluralize } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import { KnowledgeUploadForm } from './knowledge-upload-form'
import { MediaFilesSection, type MediaFileRow } from './media-files-section'

const SETTLING = /^(uploading|processing)$/i

function tone(status: string): 'success' | 'warning' | 'danger' {
  if (/ready/i.test(status)) return 'success'
  if (/failed/i.test(status)) return 'danger'
  return 'warning'
}

/**
 * A media-door failure, worded for the user. The minted asset id travels
 * EITHER WAY (the founder's phantom-row ruling): when the one cleanup DELETE
 * succeeded there is nothing to do; when it failed, the reserved slot is
 * still listed under Files and its Delete is the handle.
 */
function describeMediaUploadFailure(result: Extract<UploadMediaAssetResult, { ok: false }>) {
  if (!result.assetId) return result.message || MESSAGES.errors.generic
  const base =
    result.cleanup === 'deleted'
      ? MESSAGES.errors.mediaUploadFailedCleaned
      : MESSAGES.errors.mediaUploadFailedLeft
  return `${base} (asset ${result.assetId})`
}

export function LiveKnowledge() {
  const knowledge = useKnowledgeActions()
  const studio = useStudioActions()
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [sources, setSources] = useState<KnowledgeSource[]>([])
  const [files, setFiles] = useState<MediaFileRow[] | null>(null)
  const [filesError, setFilesError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const cancelled = useRef(false)

  // Its own dependency-free effect, per INT-10's latched-guard lesson.
  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  useEffect(() => {
    void knowledge.ensureCollection().then(async (id) => {
      if (cancelled.current || !id) return
      setCollectionId(id)
      const list = await knowledge.listSources(id)
      if (!cancelled.current) setSources(list)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per org
  }, [knowledge.orgId])

  const refresh = useCallback(async () => {
    if (!collectionId) return
    const list = await knowledge.listSources(collectionId)
    if (!cancelled.current) setSources(list)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable per collection
  }, [collectionId])

  /**
   * The Files rows, from the wire and nowhere else. On a refusal the section
   * shows the refusal — there is deliberately no remembered list to fall
   * back on, so stale rows can never masquerade as current ones.
   */
  const refreshFiles = useCallback(async () => {
    const result = await studio.listAssets()
    if (cancelled.current) return
    if (result.ok) {
      setFiles(result.assets.filter(isUploadedMediaFile))
      setFilesError(null)
    } else {
      setFiles(null)
      setFilesError(MESSAGES.errors.mediaListUnavailable)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable per org
  }, [studio.orgId])

  // Read LAZILY — this screen opening is the trigger, never the bootstrap.
  useEffect(() => {
    void refreshFiles()
  }, [refreshFiles])

  // Ingestion is asynchronous, so the list settles on its own rather than a
  // submit claiming a success the platform has not reached yet.
  const settling = sources.filter((source) => SETTLING.test(source.status)).length
  useEffect(() => {
    if (settling === 0) return
    const timer = setTimeout(() => void refresh(), 4000)
    return () => clearTimeout(timer)
  }, [settling, refresh])

  function report(result: { ok: boolean; message?: string }) {
    setBusy(false)
    if (result.ok) {
      toastSuccess('Added — we are reading it now')
      void refresh()
      return
    }
    setError(result.message || MESSAGES.errors.knowledgeUnreadable)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* HSN-04: type + description before the file leaves the browser. The
          file's real MIME is what goes on the presign, checked against the
          chosen type — the old `text/plain` fallback for anything unknown is
          gone, because a relabelled file is a lie the extractor pays for.
          MED-0831 (H1): the chosen type also picks the DOOR — image and
          video are media assets, document is a RAG source, byte-for-byte
          the call it has always been. The media door needs no collection,
          so the form no longer waits on one. */}
      <KnowledgeUploadForm
        disabled={busy}
        onUpload={async (chosen, upload) => {
          const first = chosen[0]
          if (!first) return
          setError(null)
          setBusy(true)
          if (isMediaUploadKind(upload.kind)) {
            const result = await studio.uploadMediaAsset(
              first.file,
              first.mediaType,
              upload.description,
              // MED-0831/R: "logo" when the user marked the image; omitted
              // otherwise — the form computes it, this only forwards.
              upload.role,
            )
            setBusy(false)
            if (result.ok) {
              toastSuccess('Uploaded — the studio has it now')
              void refreshFiles()
            } else {
              setError(describeMediaUploadFailure(result))
            }
            return
          }
          if (!collectionId) {
            // The RAG collection could not be created or found — the one
            // path that still needs it. The media door above never does.
            setBusy(false)
            setError(MESSAGES.errors.generic)
            return
          }
          report(
            await knowledge.uploadFile(
              collectionId,
              first.file,
              first.mediaType,
              upload.description,
            ),
          )
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kn-url">Or add a link</Label>
          <div className="flex gap-2">
            <Input
              id="kn-url"
              value={url}
              disabled={busy}
              placeholder="perfectdailygrind.com/roasting-guide"
              onChange={(event) => setUrl(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={busy || !collectionId || url.trim() === ''}
              onClick={async () => {
                if (!collectionId) return
                setError(null)
                setBusy(true)
                report(
                  await knowledge.addSource(collectionId, {
                    kind: 'url',
                    url: url.trim(),
                    title: url.trim(),
                  }),
                )
                setUrl('')
              }}
            >
              <Link2 aria-hidden />
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="kn-title">Or paste some text</Label>
        <Input
          id="kn-title"
          value={title}
          disabled={busy}
          placeholder="Title, e.g. Roasting notes"
          onChange={(event) => setTitle(event.target.value)}
        />
        <Textarea
          id="kn-text"
          rows={4}
          value={text}
          disabled={busy}
          aria-label="Text to add"
          onChange={(event) => setText(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          className="self-start"
          disabled={busy || !collectionId || text.trim() === '' || title.trim() === ''}
          onClick={async () => {
            if (!collectionId) return
            setError(null)
            setBusy(true)
            report(
              await knowledge.addSource(collectionId, {
                kind: 'push',
                title: title.trim(),
                mediaType: 'text/markdown',
                content: text,
              }),
            )
            setText('')
            setTitle('')
          }}
        >
          <FileText aria-hidden />
          Add text
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {sources.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          {MESSAGES.empty.noKnowledge}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sources.map((source) => (
            <li
              key={source.sourceId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm">{source.title ?? source.sourceId}</span>
                <span className="text-xs text-muted-foreground">
                  {/* `deduped` means identical content already existed: nothing
                      was embedded and nothing was billed. Worth saying. */}
                  {source.deduped
                    ? 'Already in your knowledge — nothing was added twice.'
                    : source.status === 'Ready'
                      ? `${source.chunkCount ?? 0} ${pluralize(source.chunkCount ?? 0, 'passage')}`
                      : (source.failureReason ?? '')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge label={source.status} tone={tone(source.status)} icon={FileText} />
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="sm">
                      <Trash2 aria-hidden />
                      Remove
                    </Button>
                  }
                  title="Remove this document?"
                  consequence="Drafts stop drawing on it from the next generation onwards."
                  confirmLabel="Remove"
                  onConfirm={async () => {
                    const result = await knowledge.removeSource(source.sourceId)
                    if (!result.ok) {
                      toastError(MESSAGES.errors.generic)
                      return
                    }
                    toastSuccess('Removed')
                    void refresh()
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* MED-0831: the media uploads, from the wire's asset list only. */}
      <MediaFilesSection
        files={files}
        error={filesError}
        onOpen={async (assetId) => {
          // A fresh ~1-hour url, minted only because this row was opened.
          const opened = await studio.assetUrl(assetId)
          if (!opened) {
            toastError(MESSAGES.errors.generic)
            return
          }
          window.open(opened, '_blank', 'noopener,noreferrer')
        }}
        onDelete={async (assetId) => {
          const result = await studio.deleteAsset(assetId)
          if (!result.ok) {
            toastError(MESSAGES.errors.generic)
            return
          }
          toastSuccess('Deleted')
          // The wire is the record: what remains is whatever it now lists.
          void refreshFiles()
        }}
      />
    </div>
  )
}
