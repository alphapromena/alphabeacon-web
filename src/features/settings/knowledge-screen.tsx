/**
 * I6 — Knowledge docs · `/settings/knowledge`.
 *
 * The design problem here is a BATCH: four files in four different states at
 * once, none of them blocking the others. So status is per row, the list never
 * reorders while work is in flight, and a failure explains itself in place
 * instead of collapsing the whole upload.
 *
 * Retry appears only on failures a retry could actually clear. A file we cannot
 * read at all offers Remove and the reason, because a button that can never
 * succeed is worse than no button.
 */
import { CheckCircle2, FileText, TriangleAlert, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/ab/empty-state'
import { MonoNumber } from '@/components/ab/mono-number'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { useDataDispatch, useKnowledgeDocs, useLiveMode, useMediaFiles } from '@/data/provider'
import { isMediaUploadKind } from '@/data/studio'
import { KnowledgeUploadForm } from './knowledge-upload-form'
import { LiveKnowledge } from './live-knowledge'
import { MediaFilesSection } from './media-files-section'
import type { KnowledgeDoc } from '@/data/types'
import { MESSAGES } from '@/lib/messages'
import { useKnowledgeUpload } from './use-knowledge-upload'

/** "2.3 MB" — sizes read mono, like every other figure. */
function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const STATUS_WORD: Record<KnowledgeDoc['status'], string> = {
  uploading: 'Uploading',
  processing: 'Processing',
  ready: 'Ready',
  failed: 'Failed',
}

export function KnowledgeScreen() {
  const live = useLiveMode()
  // LIVE: the org's real RAG collection (INT-11). The static demo keeps its
  // own upload lifecycle, which has no server behind it.
  if (live) return <LiveKnowledge />
  return <StaticKnowledgeScreen />
}

function StaticKnowledgeScreen() {
  const docs = useKnowledgeDocs()
  const mediaFiles = useMediaFiles()
  const dispatch = useDataDispatch()
  const { accept, retry } = useKnowledgeUpload()

  return (
    <>
      {/* HSN-04: the same type + description form the live screen runs; the
          verdict below is the demo's, and it says so. MED-0831 (H1): the
          chosen type picks the DOOR here too — image and video become
          simulated media files (the media door has no lifecycle, so the row
          lands whole), documents keep the ingestion simulation. */}
      <KnowledgeUploadForm
        multiple
        onUpload={(files, upload) => {
          // A const so the guard's narrowing survives into the callback.
          const kind = upload.kind
          if (isMediaUploadKind(kind)) {
            files.forEach((_, index) => {
              dispatch({
                type: 'media/upload',
                file: {
                  assetId: `md_${Date.now()}_${index}`,
                  desc: upload.description,
                  kind,
                },
              })
            })
            return
          }
          accept(
            files.map((entry) => entry.file),
            upload,
          )
        }}
      />
      <p className="text-xs text-muted-foreground">{MESSAGES.notices.knowledgeSimulated}</p>

      {docs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description={MESSAGES.empty.noKnowledge}
        />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {docs.map((doc) => (
            <li key={doc.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{doc.filename}</span>
                    {doc.description && (
                      <span className="truncate text-xs text-muted-foreground">
                        {doc.kind ? `${doc.kind} · ` : ''}
                        {doc.description}
                      </span>
                    )}
                    <MonoNumber
                      value={fileSize(doc.sizeBytes)}
                      className="text-xs text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <StatusPill status={doc.status} />
                  {doc.status === 'failed' &&
                    doc.failureReason !== MESSAGES.errors.knowledgeUnreadable && (
                      <Button variant="outline" size="sm" onClick={() => retry(doc.id)}>
                        Retry
                      </Button>
                    )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${doc.filename}`}
                    onClick={() => dispatch({ type: 'knowledge/remove', docId: doc.id })}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </div>

              {doc.status === 'uploading' && (
                <Progress
                  value={doc.progress ?? 0}
                  aria-label={`Uploading ${doc.filename}`}
                  className="h-1.5"
                />
              )}

              {doc.status === 'failed' && doc.failureReason && (
                <p role="alert" className="text-sm text-destructive">
                  {doc.failureReason}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* MED-0831: the simulated media uploads. No Open in the demo — it
          keeps no bytes, and a control that could never work is the
          disabled-teasing the design law forbids. */}
      <MediaFilesSection
        files={mediaFiles}
        onDelete={(assetId) => dispatch({ type: 'media/delete', assetId })}
      />
    </>
  )
}

/** Icon + word, never colour alone — the same law StatusBadge holds elsewhere. */
function StatusPill({ status }: { status: KnowledgeDoc['status'] }) {
  const word = STATUS_WORD[status]
  if (status === 'ready') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
        <CheckCircle2 aria-hidden className="size-3.5" />
        {word}
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
        <TriangleAlert aria-hidden className="size-3.5" />
        {word}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      <Spinner aria-hidden className="size-3.5" />
      {word}
    </span>
  )
}
