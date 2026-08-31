/**
 * Create visual — the capability popup (HSN-02, decisions.md 2026-08-30).
 *
 * ONE modal, two entry points: a generated draft on the Generate page and a
 * draft card on Today. It submits the `social-posts.media` request for THAT
 * draft — one post, `params` `{}`, `collection.use` true (H5) — and follows the
 * job through the Studio's own poller. Everything a user can change is a
 * form field here; everything else is derived and never rendered as an input.
 *
 * The readiness gate reaches this dialog too (ORDER ONB-0827, D-ONB-D): a
 * media job is a generation job. It sits INSIDE the dialog, as D4's does, so
 * the entry point still opens — onto the checklist that says what is missing.
 *
 * What it must never do: retry on its own (a failure waits for a fresh press),
 * claim success without a job to show for it, or hide that a retry may bill
 * again. The wording for every failure carries that last fact.
 */
import { Download, Plus, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { InsufficientBalance } from '@/components/ab/insufficient-balance'
import { SignalSweep } from '@/components/ab/motion'
import { GenerationBlocked } from '@/components/ab/setup-checklist'
import { SkeletonForm } from '@/components/ab/skeletons'
import { ToneBadge } from '@/components/ab/tone-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useTones } from '@/data/provider'
import { useReadiness } from '@/data/readiness'
import { IMG_STYLES, MAX_VISUAL_GUIDANCE, type MediaPlan } from '@/data/studio'
import { useWallet } from '@/data/wallet'
import { MESSAGES } from '@/lib/messages'
import {
  useCreateVisual,
  type CreateVisualState,
  type VisualForm,
  type VisualSubject,
} from './use-create-visual'

/** The plan vocabulary for media jobs (D-INT-D) — a grade the platform resolves to a model row. */
const PLANS: { id: MediaPlan; label: string }[] = [
  { id: 'precise', label: 'Precise' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'creative', label: 'Creative' },
]

const SELECT_CLASS = 'h-9 rounded-lg border border-input bg-background px-3 text-sm'

export function CreateVisualDialog({
  subject,
  open,
  onOpenChange,
}: {
  subject: VisualSubject | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const tones = useTones()
  const readiness = useReadiness()
  const wallet = useWallet()
  // The tone is read back LIVE by id (trap 4), never carried as a snapshot.
  const tone = tones.find((entry) => entry.id === subject?.toneId)
  const visual = useCreateVisual({ subject, tone })

  if (!subject) return null

  // Every in-dialog Cancel/Close/Done goes through here. Radix reports only
  // an open-change IT initiated (Escape, the overlay), so a controlled close
  // from a button must reset the machine itself — found by the HSN-FINAL
  // gate: without it the next draft's popup opened on the last one's result.
  const close = () => {
    visual.reset()
    onOpenChange(false)
  }
  const busy = visual.phase === 'submitting'
  const snippet = `${subject.content.slice(0, 140)}${subject.content.length > 140 ? '…' : ''}`

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) visual.reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create a visual</DialogTitle>
          <DialogDescription>
            One image or video for this draft, made from its text and tone.
          </DialogDescription>
        </DialogHeader>

        {!readiness.known ? (
          <SkeletonForm fields={3} label="Loading your setup" />
        ) : !readiness.canGenerate ? (
          <>
            <GenerationBlocked />
            <DialogFooter>
              <Button variant="ghost" onClick={close}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : !tone ? (
          <>
            <p role="alert" className="text-sm text-destructive">
              {MESSAGES.errors.visualToneMissing}
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={close}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2 rounded-lg bg-muted px-3 py-2">
              <ToneBadge tone={tone} />
              <p className="text-sm text-muted-foreground">{snippet}</p>
            </div>

            {(visual.phase === 'form' || busy) && <VisualFields visual={visual} disabled={busy} />}
            {visual.phase === 'running' && <Running visual={visual} />}
            {visual.phase === 'done' && <Done visual={visual} />}
            {visual.phase === 'failed' &&
              (visual.shortBalance ? (
                <InsufficientBalance wallet={wallet} />
              ) : (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {visual.error}
                </p>
              ))}

            <DialogFooter>
              {(visual.phase === 'form' || busy) && (
                <>
                  <Button variant="ghost" onClick={close} disabled={busy}>
                    Cancel
                  </Button>
                  {/* Single flight: disabled ONLY while the request is out. A
                      failure never re-sends by itself — see `backToForm`. */}
                  <Button onClick={() => void visual.submit()} disabled={busy}>
                    <Sparkles aria-hidden />
                    {busy ? 'Sending…' : 'Create visual'}
                  </Button>
                </>
              )}
              {visual.phase === 'running' && (
                <Button variant="ghost" onClick={close}>
                  Close
                </Button>
              )}
              {visual.phase === 'done' && <Button onClick={close}>Done</Button>}
              {visual.phase === 'failed' && (
                <>
                  <Button variant="ghost" onClick={close}>
                    Close
                  </Button>
                  <Button variant="outline" onClick={visual.backToForm}>
                    Back to the form
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * The user-editable half of the envelope, and nothing else: capability,
 * posts, params and collection are derived and never rendered as inputs.
 */
function VisualFields({ visual, disabled }: { visual: CreateVisualState; disabled: boolean }) {
  const { form, patch } = visual
  const kindMissing = visual.error === MESSAGES.errors.visualKindRequired

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="visual-kind">Image or video</Label>
          {/* REQUIRED with NO default: the two kinds are priced differently,
              so the choice is the user's every time. */}
          <select
            id="visual-kind"
            value={form.kind}
            required
            disabled={disabled}
            aria-invalid={kindMissing ? true : undefined}
            onChange={(event) => patch({ kind: event.target.value as VisualForm['kind'] })}
            className={SELECT_CLASS}
          >
            <option value="">Choose one</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Images and videos are priced differently, so this is never chosen for you.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="visual-plan">Quality</Label>
          <select
            id="visual-plan"
            value={form.plan}
            disabled={disabled}
            onChange={(event) => patch({ plan: event.target.value as MediaPlan })}
            className={SELECT_CLASS}
          >
            {PLANS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">The platform picks the model from this.</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="visual-style">Style</Label>
        <select
          id="visual-style"
          value={form.imgStyle}
          disabled={disabled}
          onChange={(event) => patch({ imgStyle: event.target.value })}
          className={SELECT_CLASS}
        >
          {IMG_STYLES.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label
          htmlFor="visual-text"
          className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
        >
          Include text on the visual
          <Switch
            id="visual-text"
            checked={form.text}
            disabled={disabled}
            onCheckedChange={(checked) => patch({ text: checked })}
          />
        </label>
        <label
          htmlFor="visual-logo"
          className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
        >
          Include the logo
          <Switch
            id="visual-logo"
            checked={form.logo}
            disabled={disabled}
            onCheckedChange={(checked) => patch({ logo: checked })}
          />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Guidance (optional)</legend>
        <p className="text-xs text-muted-foreground">
          Up to six short instructions, passed along exactly as written.
        </p>
        {form.guidance.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              aria-label={`Guidance ${index + 1}`}
              value={entry}
              maxLength={500}
              disabled={disabled}
              placeholder="Show the logo on a dark background"
              onChange={(event) => visual.setGuidance(index, event.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => visual.removeGuidance(index)}
            >
              Remove
            </Button>
          </div>
        ))}
        {form.guidance.length < MAX_VISUAL_GUIDANCE && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            disabled={disabled}
            onClick={visual.addGuidance}
          >
            <Plus aria-hidden />
            Add guidance
          </Button>
        )}
      </fieldset>

      {visual.error && (
        <p role="alert" className="text-sm text-destructive">
          {visual.error}
        </p>
      )}
    </div>
  )
}

/** Honest progress: the job's own status word, and where it keeps going if this closes. */
function Running({ visual }: { visual: CreateVisualState }) {
  return (
    <div
      role="status"
      className="relative overflow-hidden rounded-lg border border-border p-6 text-center"
    >
      <SignalSweep active />
      <p className="text-sm font-medium">Rendering…</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {visual.job ? `Status: ${visual.job.status}. ` : ''}
        {MESSAGES.notices.visualRunning}
      </p>
      {visual.timedOut && visual.job && (
        <p className="mt-2 text-sm">
          {MESSAGES.notices.visualStillRunning}{' '}
          <Link
            className="underline underline-offset-4"
            to={`/studio/jobs?job=${visual.job.jobId}`}
          >
            Open Studio renders
          </Link>
        </p>
      )}
    </div>
  )
}

/**
 * What the job made. Live: a preview per asset from its 1-hour url, and a
 * download. Static: the simulation, named as such, and the asset it recorded.
 * Neither attaches anything to the draft — this order attaches nothing.
 */
function Done({ visual }: { visual: CreateVisualState }) {
  if (!visual.live) {
    return (
      <div className="flex flex-col gap-3">
        <p role="status" className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          {MESSAGES.notices.visualSimulated}
        </p>
        <p className="text-xs text-muted-foreground">{MESSAGES.notices.visualNotAttached}</p>
        {visual.simulatedAssetId && (
          <Button asChild variant="outline" className="self-start">
            <Link to={`/studio/assets/${visual.simulatedAssetId}`}>Open the asset</Link>
          </Button>
        )}
      </div>
    )
  }

  const job = visual.job
  const assets = job?.assets ?? []
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {assets.map((asset) => {
          const url = visual.assetUrls[asset.assetId]
          return (
            <figure key={asset.assetId} className="flex flex-col gap-2">
              {url ? (
                asset.kind === 'video' ? (
                  <video
                    controls
                    preload="metadata"
                    src={url}
                    aria-label="The rendered video"
                    className="max-h-64 rounded-lg border border-border"
                  />
                ) : (
                  <img
                    src={url}
                    alt="The rendered visual"
                    className="max-h-64 rounded-lg border border-border"
                  />
                )
              ) : (
                <span className="text-xs text-muted-foreground">Opening…</span>
              )}
              {url && (
                <figcaption>
                  <Button asChild variant="outline" size="sm">
                    <a href={url} download target="_blank" rel="noreferrer">
                      <Download aria-hidden />
                      Download
                    </a>
                  </Button>
                </figcaption>
              )}
            </figure>
          )
        })}
        {assets.length === 0 && (
          <p className="text-sm text-muted-foreground">This job produced no assets.</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {MESSAGES.notices.visualNotAttached}
        {job && (
          <>
            {' '}
            <Link className="underline underline-offset-4" to={`/studio/jobs?job=${job.jobId}`}>
              Open Studio renders
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
