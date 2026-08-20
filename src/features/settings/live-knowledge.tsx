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
 *   never proxies bytes); ingestion starts by itself when the object lands,
 *   there is no "complete" call, and the presign expires in 15 minutes;
 * - a URL is fetched by the platform;
 * - pasted TEXT is pushed inline.
 * All three answer 202 and settle through Uploading, Processing, then Ready or
 * Failed - which is why the list polls rather than claiming success on submit.
 */
import { FileText, Link2, Trash2, Upload } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '@/components/ab/confirm-dialog'
import { StatusBadge } from '@/components/ab/status-badge'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EXTRACTABLE_MEDIA_TYPES, useKnowledgeActions, type KnowledgeSource } from '@/data/studio'
import { pluralize } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'

const SETTLING = /^(uploading|processing)$/i

function tone(status: string): 'success' | 'warning' | 'danger' {
  if (/ready/i.test(status)) return 'success'
  if (/failed/i.test(status)) return 'danger'
  return 'warning'
}

export function LiveKnowledge() {
  const knowledge = useKnowledgeActions()
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [sources, setSources] = useState<KnowledgeSource[]>([])
  const [busy, setBusy] = useState(false)
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kn-file">Upload a document</Label>
          <input
            ref={fileInput}
            id="kn-file"
            type="file"
            tabIndex={-1}
            className="sr-only"
            accept={EXTRACTABLE_MEDIA_TYPES.join(',')}
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file || !collectionId) return
              setError(null)
              setBusy(true)
              const mediaType = (EXTRACTABLE_MEDIA_TYPES as readonly string[]).includes(file.type)
                ? file.type
                : 'text/plain'
              report(await knowledge.uploadFile(collectionId, file, mediaType))
              event.target.value = ''
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy || !collectionId}
            onClick={() => fileInput.current?.click()}
          >
            <Upload aria-hidden />
            Choose a file
          </Button>
          <p className="text-xs text-muted-foreground">{MESSAGES.notices.knowledgeAccepts}</p>
        </div>

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
    </div>
  )
}
