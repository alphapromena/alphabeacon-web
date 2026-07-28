/**
 * D4 — Media generation, opened from an approved draft.
 *
 * This is not a second feature: screens4.md is explicit that it is Creative
 * Studio's composer in draft-scoped mode. W5 extracts the shared composer for
 * E2; until then this holds the contract it must satisfy — the same model
 * gallery, the same credit math, the same states.
 *
 * The moment credits get spent, so the arithmetic is on screen before the
 * button is pressed: cost, balance, and balance-after. When the balance is
 * short the primary action does not run and the prompt is preserved, because
 * losing what someone typed is a worse failure than the one being reported.
 */
import { useEffect, useRef, useState } from 'react'
import { Lock, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { SignalSweep } from '@/components/ab/motion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useCreditBalance, useDataDispatch, useStudioModels } from '@/data/provider'
import type { Draft, PlanTier } from '@/data/types'
import { cn } from '@/lib/utils'

const TIER_RANK: Record<PlanTier, number> = { free: 0, pro: 1, studio: 2 }

/** How long the scripted job runs before it lands. */
const RUN_MS = 2200

export function MediaPanel({
  draft,
  planTier,
  open,
  onOpenChange,
}: {
  draft: Draft | null
  planTier: PlanTier
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const models = useStudioModels()
  const balance = useCreditBalance()
  const dispatch = useDataDispatch()

  const [kind, setKind] = useState<'image' | 'video'>('image')
  const [modelId, setModelId] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [phase, setPhase] = useState<'compose' | 'generating' | 'failed'>('compose')
  const [failure, setFailure] = useState('')
  const timer = useRef<number | undefined>(undefined)

  const visible = models.filter((model) => model.kind === kind)
  const selected = models.find((model) => model.id === modelId) ?? visible[0]
  const locked = selected ? TIER_RANK[selected.tier] > TIER_RANK[planTier] : false
  const cost = selected?.credits ?? 0
  const short = cost > balance

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // A closed dialog must forget everything except what the user typed — they
  // may be closing it to go top up credits and come straight back.
  useEffect(() => {
    if (!open) {
      setPhase('compose')
      window.clearTimeout(timer.current)
    }
  }, [open])

  if (!draft) return null

  const start = () => {
    if (!selected || short || locked) return
    const jobId = `job_${draft.id}_${Date.now()}`
    dispatch({ type: 'media/start', draftId: draft.id, jobId, modelId: selected.id, prompt })
    setPhase('generating')
    timer.current = window.setTimeout(() => {
      // The scripted outcome: an empty prompt is the one that fails, so the
      // credits-released path is reachable on purpose rather than by luck.
      if (prompt.trim().length === 0) {
        const reason = 'The model could not work from an empty prompt. Your credits were released.'
        dispatch({ type: 'media/fail', jobId, reason })
        setFailure(reason)
        setPhase('failed')
        return
      }
      dispatch({ type: 'media/succeed', jobId, assetId: `asset_${jobId}` })
      onOpenChange(false)
    }, RUN_MS)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create image or video</DialogTitle>
          <DialogDescription>Creative Studio, attached to this draft.</DialogDescription>
        </DialogHeader>

        {/* The draft stays pinned: the art is for this post, not in general. */}
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          {draft.copy.slice(0, 140)}
          {draft.copy.length > 140 ? '…' : ''}
        </p>

        {phase === 'generating' ? (
          <div className="relative overflow-hidden rounded-lg border border-border p-6 text-center">
            <SignalSweep active />
            <p className="text-sm font-medium">Generating…</p>
            <p className="mt-1 text-sm text-muted-foreground">Usually takes about 30 seconds.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {phase === 'failed' && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {failure}
              </p>
            )}

            <ToggleGroup
              type="single"
              value={kind}
              onValueChange={(next) => {
                if (next) {
                  setKind(next as 'image' | 'video')
                  setModelId('')
                }
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="image">Image</ToggleGroupItem>
              <ToggleGroupItem value="video">Video</ToggleGroupItem>
            </ToggleGroup>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium">Model</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {visible.map((model) => {
                  const modelLocked = TIER_RANK[model.tier] > TIER_RANK[planTier]
                  const active = selected?.id === model.id
                  return (
                    <label
                      key={model.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm',
                        active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
                        modelLocked && 'cursor-not-allowed opacity-70',
                      )}
                    >
                      <input
                        type="radio"
                        name="studio-model"
                        className="mt-1 accent-primary"
                        checked={active}
                        disabled={modelLocked}
                        onChange={() => setModelId(model.id)}
                      />
                      <span className="flex flex-1 flex-col gap-0.5">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-muted-foreground">
                          <MonoNumber value={model.credits} /> credits
                        </span>
                        {modelLocked && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock aria-hidden className="size-3" />
                            Needs the {model.tier} plan
                          </span>
                        )}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <label htmlFor="media-prompt" className="text-sm font-medium">
                Prompt
              </label>
              <Textarea
                id="media-prompt"
                rows={3}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Overhead flat-lay of a pour-over station, morning light, editorial style"
              />
            </div>

            <p className="rounded-lg bg-muted px-3 py-2 text-sm">
              This will use <MonoNumber value={cost} className="font-semibold" /> credits · Balance
              after: <MonoNumber value={Math.max(0, balance - cost)} className="font-semibold" />
            </p>

            {short && (
              // The upsell replaces the action rather than sitting beside a
              // button that would fail — and the prompt above is untouched.
              <div
                role="alert"
                className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
              >
                <span className="font-medium text-warning">
                  Not enough credits — this needs <MonoNumber value={cost} />, you have{' '}
                  <MonoNumber value={balance} />.
                </span>
                <span className="text-muted-foreground">
                  Your prompt is saved. Top up and come straight back to it.
                </span>
                <Button asChild size="sm" variant="outline" className="self-start">
                  <Link to="/billing">See plans</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={start} disabled={phase === 'generating' || short || locked || !selected}>
            <Sparkles aria-hidden />
            {phase === 'generating' ? 'Generating…' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
