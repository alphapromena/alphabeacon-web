/**
 * The reference input (ORDER HSN-0910/A): an asset of OURS — uploaded here
 * through the SAME door Knowledge and the org logo use (`uploadMediaAsset`:
 * presign → PUT → done; a failed PUT deletes its own phantom row and carries
 * the id, ruling H1), or picked from what the org already holds, by kind.
 *
 * The control holds asset ids only. A `url` field mints each read url at
 * submit time (an hour's grace starts then, not at pick); an `id` field sends
 * the ids as they are. Static mode: the demo's assets plus a local pick —
 * nothing leaves the browser, and the pick is listed under Knowledge › Files
 * the way MED-0831's demo upload is.
 */
import { Check, FolderOpen, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toastError } from '@/components/ab/toast'
import { Button } from '@/components/ui/button'
import { useAssets, useDataDispatch, useLiveMode, useMediaFiles } from '@/data/provider'
import { useStudioActions } from '@/data/studio'
import { MESSAGES } from '@/lib/messages'

const ACCEPT: Record<'image' | 'video', string> = {
  image: 'image/png,image/jpeg,image/webp',
  video: 'video/mp4',
}

interface Choice {
  assetId: string
  label: string
  /** A render of ours, not an upload — the cheaper motion source (the document's pricing trap). */
  rendered: boolean
}

export function AssetPicker({
  id,
  label,
  hint,
  assetKind,
  min,
  max,
  value,
  disabled,
  onChange,
}: {
  id: string
  label: string
  hint?: string
  assetKind: 'image' | 'video'
  min: number
  max: number
  value: string[]
  disabled?: boolean
  onChange: (next: string[]) => void
}) {
  const live = useLiveMode()
  const studio = useStudioActions()
  const dispatch = useDataDispatch()
  const demoAssets = useAssets()
  const demoFiles = useMediaFiles()
  const fileInput = useRef<HTMLInputElement>(null)
  const [choices, setChoices] = useState<Choice[] | null>(null)
  const [browsing, setBrowsing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [known, setKnown] = useState<Record<string, string>>({})

  const full = value.length >= max
  const labelOf = (assetId: string) => known[assetId] ?? assetId

  async function browse() {
    if (browsing) {
      setBrowsing(false)
      return
    }
    setBrowsing(true)
    if (choices !== null) return
    if (!live) {
      const local: Choice[] = [
        ...demoFiles
          .filter((file) => file.kind === assetKind)
          .map((file) => ({ assetId: file.assetId, label: file.desc, rendered: false })),
        ...demoAssets
          .filter((asset) => asset.kind === assetKind)
          .map((asset) => ({ assetId: asset.id, label: asset.label, rendered: true })),
      ]
      setChoices(local)
      remember(local)
      return
    }
    const result = await studio.listAssets()
    if (!result.ok) {
      setChoices([])
      toastError(MESSAGES.errors.mediaListUnavailable)
      return
    }
    const listed: Choice[] = result.assets
      .filter((asset) => asset.kind === assetKind)
      .map((asset) => ({
        assetId: asset.assetId,
        label: asset.desc || (asset.meta?.synthetic === true ? 'Rendered here' : asset.assetId),
        rendered: asset.meta?.synthetic === true,
      }))
    setChoices(listed)
    remember(listed)
  }

  function remember(list: Choice[]) {
    setKnown((current) => {
      const next = { ...current }
      for (const choice of list) next[choice.assetId] = choice.label
      return next
    })
  }

  function pick(choice: Choice) {
    if (value.includes(choice.assetId)) {
      onChange(value.filter((entry) => entry !== choice.assetId))
      return
    }
    if (full) return
    remember([choice])
    onChange([...value, choice.assetId])
  }

  async function upload(file: File) {
    if (full) return
    const accepted = ACCEPT[assetKind].split(',')
    if (!file.type || !accepted.includes(file.type)) {
      toastError(MESSAGES.errors.knowledgeTypeMismatch)
      return
    }
    if (!live) {
      // The demo: a local record, listed under Files like MED-0831's demo upload.
      const assetId = `local_${Date.now()}`
      dispatch({ type: 'media/upload', file: { assetId, desc: file.name, kind: assetKind } })
      remember([{ assetId, label: file.name, rendered: false }])
      setChoices(null)
      onChange([...value, assetId])
      return
    }
    setBusy(true)
    const result = await studio.uploadMediaAsset(file, file.type, `Studio reference — ${file.name}`)
    setBusy(false)
    if (!result.ok) {
      toastError(
        result.cleanup === 'left'
          ? `${MESSAGES.errors.mediaUploadFailedLeft} (${result.assetId ?? 'no id'})`
          : MESSAGES.errors.mediaUploadFailedCleaned,
      )
      return
    }
    remember([{ assetId: result.assetId, label: file.name, rendered: false }])
    setChoices(null)
    onChange([...value, result.assetId])
  }

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={hint ? `${id}-hint` : undefined}>
      <legend className="text-sm font-medium">
        {label}
        {min > 0 && (
          <>
            <span aria-hidden className="text-muted-foreground">
              {' '}
              *
            </span>
            <span className="sr-only">(required)</span>
          </>
        )}
      </legend>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={`${label}, chosen`}>
          {value.map((assetId) => (
            <li
              key={assetId}
              className="flex items-center gap-1 rounded-full border border-border py-1 pr-1 pl-3 text-xs"
            >
              <span className="max-w-[16rem] truncate">{labelOf(assetId)}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1"
                disabled={disabled}
                aria-label={`Remove ${labelOf(assetId)}`}
                onClick={() => onChange(value.filter((entry) => entry !== assetId))}
              >
                <Trash2 aria-hidden className="size-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || busy || full}
          onClick={() => fileInput.current?.click()}
        >
          <Upload aria-hidden />
          {busy ? 'Uploading…' : `Upload ${assetKind === 'image' ? 'an image' : 'a video'}`}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          aria-expanded={browsing}
          aria-controls={`${id}-choices`}
          onClick={() => void browse()}
        >
          <FolderOpen aria-hidden />
          Choose from your files
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT[assetKind]}
          className="sr-only"
          tabIndex={-1}
          aria-label={`Choose ${assetKind === 'image' ? 'an image' : 'a video'} for ${label}`}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
            event.target.value = ''
          }}
        />
      </div>

      {browsing && (
        <div id={`${id}-choices`} className="rounded-lg border border-border p-2">
          {choices === null ? (
            <p className="p-2 text-sm text-muted-foreground">Reading your files…</p>
          ) : choices.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">{MESSAGES.empty.noStudioAssets}</p>
          ) : (
            <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
              {choices.map((choice) => {
                const chosen = value.includes(choice.assetId)
                return (
                  <li key={choice.assetId}>
                    <button
                      type="button"
                      disabled={disabled || (!chosen && full)}
                      aria-pressed={chosen}
                      onClick={() => pick(choice)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center">
                        {chosen && <Check aria-hidden className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{choice.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {choice.rendered ? 'rendered here' : 'uploaded'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </fieldset>
  )
}
