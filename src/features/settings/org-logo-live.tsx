/**
 * The org logo, live (MED-0831, rulings H3 + W1 as re-ruled).
 *
 * THE WIRE IS THE RECORD: the logo is the media asset whose `desc` is
 * exactly `"logo"`, found by reading `GET .../media/assets` when this screen
 * opens (lazy — never the bootstrap) and read-presigning the one row. No
 * sidecar, no local memory: another member sees the same logo because their
 * screen reads the same list. The local FileReader preview only BRIDGES the
 * moment between choosing a file and the wire answering with its own url.
 *
 * More than one `desc: "logo"` row is a fact to SHOW, never to resolve by
 * guessing: every row renders with its own Delete, and Upload/Replace stays
 * disabled until one or zero remains.
 *
 * Replace deletes the old asset FIRST, then uploads — a failed delete stops
 * the replace and says so; nothing retries. The status line beside the
 * buttons says exactly what happened, every time.
 */
import { Trash2, Upload } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  LOGO_ASSET_DESC,
  useStudioActions,
  type MediaAsset,
  type UploadMediaAssetResult,
} from '@/data/studio'
import { MESSAGES } from '@/lib/messages'

const LOGO_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/** What happened, said plainly — the ruled vocabulary is sent / not sent. */
interface LogoStatus {
  tone: 'ok' | 'error'
  text: string
}

function notSent(result: Extract<UploadMediaAssetResult, { ok: false }>): LogoStatus {
  const suffix =
    result.assetId && result.cleanup === 'left'
      ? ` Its reserved slot (asset ${result.assetId}) may remain in the studio's files.`
      : ''
  return { tone: 'error', text: `Not sent — ${result.message}${suffix}` }
}

export function OrgLogoLive({ orgName }: { orgName: string }) {
  const studio = useStudioActions()
  const fileInput = useRef<HTMLInputElement>(null)
  /** The wire's `desc: "logo"` rows; null until the list has answered. */
  const [rows, setRows] = useState<MediaAsset[] | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  /** The single logo's presigned url (~1 h, minted on open and on change). */
  const [url, setUrl] = useState<string | null>(null)
  /** The just-chosen file, until the upload lands and the wire takes over. */
  const [bridge, setBridge] = useState<string | null>(null)
  const [status, setStatus] = useState<LogoStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const cancelled = useRef(false)

  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  const refresh = useCallback(async () => {
    const result = await studio.listAssets()
    if (cancelled.current) return
    if (!result.ok) {
      setRows(null)
      setListError(MESSAGES.errors.mediaListUnavailable)
      return
    }
    setListError(null)
    const logos = result.assets.filter((asset) => asset.desc === LOGO_ASSET_DESC)
    setRows(logos)
    if (logos.length === 1) {
      const minted = await studio.assetUrl(logos[0].assetId)
      if (cancelled.current) return
      setUrl(minted)
      // The wire's own url has taken over; the local preview's job is done.
      if (minted) setBridge(null)
    } else {
      setUrl(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable per org
  }, [studio.orgId])

  // Lazy, by the ruling: this screen opening is the trigger, not bootstrap.
  useEffect(() => {
    void refresh()
  }, [refresh])

  async function pick(file: File) {
    if (!LOGO_MEDIA_TYPES.includes(file.type)) {
      setStatus({ tone: 'error', text: `Not sent — ${MESSAGES.errors.logoType}` })
      return
    }
    setBusy(true)
    setStatus(null)
    const reader = new FileReader()
    reader.onload = () => {
      if (!cancelled.current) setBridge(String(reader.result))
    }
    reader.readAsDataURL(file)

    // Replace = DELETE the old asset FIRST, then upload (H3). A failed
    // delete stops the replace — reported, never retried, never worked
    // around by uploading a second logo beside the first.
    const current = rows?.length === 1 ? rows[0] : null
    if (current) {
      const deleted = await studio.deleteAsset(current.assetId)
      if (cancelled.current) return
      if (!deleted.ok) {
        setBridge(null)
        setBusy(false)
        setStatus({
          tone: 'error',
          text: `Not sent — the previous logo could not be removed. ${deleted.message}`,
        })
        return
      }
    }

    const result = await studio.uploadMediaAsset(file, file.type, LOGO_ASSET_DESC)
    if (cancelled.current) return
    setBusy(false)
    if (result.ok) {
      setStatus({ tone: 'ok', text: 'Sent to the studio.' })
    } else {
      setBridge(null)
      setStatus(notSent(result))
    }
    // Either way the wire has the truth now — show it.
    void refresh()
  }

  async function removeAsset(assetId: string) {
    setBusy(true)
    const result = await studio.deleteAsset(assetId)
    if (cancelled.current) return
    setBusy(false)
    if (!result.ok) {
      setStatus({ tone: 'error', text: `Could not remove it — ${result.message}` })
      return
    }
    setStatus({ tone: 'ok', text: 'Removed.' })
    setUrl(null)
    setBridge(null)
    void refresh()
  }

  const conflict = rows !== null && rows.length > 1
  const shown = bridge ?? url
  // Upload needs to know what it would replace: an unread or conflicted
  // list disables it rather than risking a second logo row.
  const canUpload = !busy && rows !== null && rows.length <= 1

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Avatar className="size-16 rounded-xl">
        {shown && <AvatarImage src={shown} alt="" />}
        <AvatarFallback className="rounded-xl text-lg">{orgName.charAt(0) || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-sm font-medium">Logo</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canUpload}
            onClick={() => fileInput.current?.click()}
          >
            <Upload aria-hidden />
            {rows?.length === 1 || bridge ? 'Replace' : 'Upload'}
          </Button>
          {rows?.length === 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => void removeAsset(rows[0].assetId)}
            >
              <Trash2 aria-hidden />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Square works best. It is kept with your brand files.
        </p>
        {listError && (
          <p role="alert" className="text-xs text-destructive">
            {listError}
          </p>
        )}
        {status && (
          <p
            role={status.tone === 'error' ? 'alert' : 'status'}
            className={
              status.tone === 'error' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'
            }
          >
            {status.text}
          </p>
        )}
        {conflict && (
          <div className="flex flex-col gap-2">
            <p role="alert" className="text-xs text-destructive">
              {MESSAGES.errors.logoConflict}
            </p>
            <ul className="flex flex-col gap-1.5">
              {rows.map((row) => (
                <li key={row.assetId} className="flex items-center justify-between gap-3">
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {row.assetId}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    aria-label={`Delete logo ${row.assetId}`}
                    onClick={() => void removeAsset(row.assetId)}
                  >
                    <Trash2 aria-hidden />
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept={LOGO_MEDIA_TYPES.join(',')}
        className="sr-only"
        // The visible button is the affordance (trap 7): no tab stop of its
        // own, but it keeps its name so it stays operable by control name.
        tabIndex={-1}
        aria-label="Choose a logo image"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void pick(file)
          event.target.value = ''
        }}
      />
    </div>
  )
}
