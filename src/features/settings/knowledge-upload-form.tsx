/**
 * The Knowledge upload form (ORDER HSN-04, decisions.md 2026-08-30) — ONE
 * implementation for the live screen and the static demo.
 *
 * Before any file leaves the browser the user says WHAT it is (image, video
 * or document) and DESCRIBES it. The type filters the picker's `accept` list
 * and then validates the chosen file's real MIME against it — a mismatch is
 * an inline error, never a silent coercion (the old live path quietly relabelled
 * anything unknown as `text/plain`; it no longer does). The description is
 * required because it travels with the file: `desc` on the presign body, per
 * Hasan's 2026-08-28 envelope.
 *
 * The button is the keyboard path; the dropzone is a target, not a control, so
 * it stays out of the tab order. The hidden input keeps its id and label so the
 * existing specs still find it — they will need to choose a type and describe
 * the file first, which is the point.
 */
import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { KNOWLEDGE_UPLOAD_KINDS, checkKnowledgeFile, isReservedMediaDesc } from '@/data/studio'
import type { KnowledgeUploadKind } from '@/data/types'
import { MESSAGES } from '@/lib/messages'
import { cn } from '@/lib/utils'

/** A file that passed the type check, with the MIME the wire will be told. */
export interface CheckedFile {
  file: File
  mediaType: string
}

export function KnowledgeUploadForm({
  multiple = false,
  disabled = false,
  onUpload,
}: {
  /** The static demo takes a batch; the live screen sends one file at a time. */
  multiple?: boolean
  disabled?: boolean
  onUpload: (
    files: CheckedFile[],
    upload: { kind: KnowledgeUploadKind; description: string },
  ) => void | Promise<void>
}) {
  const [kind, setKind] = useState<'' | KnowledgeUploadKind>('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const spec = KNOWLEDGE_UPLOAD_KINDS.find((entry) => entry.kind === kind)
  const ready = kind !== '' && description.trim().length > 0

  function submit(chosen: File[]) {
    if (chosen.length === 0) return
    if (!kind || !spec) {
      setError(MESSAGES.errors.knowledgeKindRequired)
      return
    }
    if (description.trim().length === 0) {
      setError(MESSAGES.errors.knowledgeDescriptionRequired)
      return
    }
    // MED-0831: "logo" is the organization logo's marker on the wire — a
    // Knowledge file wearing it would be indistinguishable from the logo.
    if (isReservedMediaDesc(description)) {
      setError(MESSAGES.errors.knowledgeDescReserved)
      return
    }
    const checked: CheckedFile[] = []
    for (const file of chosen) {
      const verdict = checkKnowledgeFile(kind, file)
      if (!verdict.ok) {
        // The whole batch stops at the first file that is not what was chosen:
        // sending the rest would be a partial success nobody asked for.
        const base =
          verdict.reason === 'unknown-type'
            ? MESSAGES.errors.knowledgeTypeUnknown
            : MESSAGES.errors.knowledgeTypeMismatch
        setError(`${base} (${file.name}${file.type ? `, ${file.type}` : ''})`)
        return
      }
      checked.push({ file, mediaType: verdict.mediaType })
    }
    setError(null)
    void onUpload(checked, { kind, description: description.trim() })
    // The next upload is a different thing and needs its own description.
    setDescription('')
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">What are you uploading?</legend>
        <ToggleGroup
          type="single"
          value={kind}
          disabled={disabled}
          onValueChange={(next) => {
            if (!next) return
            setKind(next as KnowledgeUploadKind)
            setError(null)
          }}
          className="justify-start"
          aria-label="Upload type"
        >
          {KNOWLEDGE_UPLOAD_KINDS.map((entry) => (
            <ToggleGroupItem key={entry.kind} value={entry.kind}>
              {entry.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          {spec ? spec.hint : 'Pick one first — it decides which files can be chosen.'}
        </p>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="kn-desc">What is it?</Label>
        <Input
          id="kn-desc"
          value={description}
          maxLength={500}
          disabled={disabled}
          placeholder="Our spring price list, valid until June"
          aria-invalid={error === MESSAGES.errors.knowledgeDescriptionRequired ? true : undefined}
          onChange={(event) => {
            setDescription(event.target.value)
            if (error) setError(null)
          }}
        />
        <p className="text-xs text-muted-foreground">
          Required — it travels with the file so drafts know when to use it.
          {multiple ? ' Applies to every file in this upload.' : ''}
        </p>
      </div>

      <div
        // A dropzone is a target, not a control: the button inside it is the
        // keyboard path, so the div itself stays out of the tab order.
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (disabled) return
          submit(Array.from(event.dataTransfer.files))
        }}
        className={cn(
          'flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-8 text-center transition-colors',
          dragging && 'border-primary bg-primary/5',
        )}
      >
        <Upload aria-hidden className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium">
          {spec ? `Drop ${spec.label.toLowerCase()} files here` : 'Drop files here'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !ready}
          onClick={() => fileInput.current?.click()}
        >
          {multiple ? 'Browse files' : 'Choose a file'}
        </Button>
        <input
          ref={fileInput}
          id="kn-file"
          type="file"
          multiple={multiple}
          accept={spec?.mediaTypes.join(',')}
          className="sr-only"
          // "Browse files" is the affordance; this must not hold a tab stop of
          // its own that renders no focus indicator.
          tabIndex={-1}
          aria-label="Choose documents to upload"
          onChange={(event) => {
            submit(Array.from(event.target.files ?? []))
            event.target.value = ''
          }}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
