/**
 * The composer's body and submit control — ONE implementation, two modes.
 *
 * screens4.md's consistency checklist requires that "D4 and E2 are visually and
 * functionally the same composer": a reviewer flipping between "create media
 * for this draft" and "open Studio directly" should recognise one tool. D4
 * renders this inside a dialog, E2 renders it on a page; nothing else differs,
 * which is what makes the promise structural rather than a matter of care.
 *
 * The credit arithmetic is on screen before the button is pressed, and a short
 * balance or a failed payment REPLACES the action rather than sitting beside a
 * button that would fail — with everything typed left untouched.
 */
import { Lock, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { MonoNumber } from '@/components/ab/mono-number'
import { SignalSweep } from '@/components/ab/motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { ParamsForm } from './params-form'
import { TIER_RANK, type ComposerState } from './use-composer'

/**
 * The composer's body. Rendered inside a dialog for draft-scoped mode (D4) and
 * inline on the Studio page (E2) — same markup either way, which is what makes
 * the "one tool" promise structural rather than a matter of discipline.
 */
export function ComposerBody({
  composer,
  idPrefix,
  contextSnippet,
}: {
  composer: ComposerState
  idPrefix: string
  /** Draft-scoped mode pins the post's copy above the form. */
  contextSnippet?: string
}) {
  const {
    kind,
    chooseKind,
    models,
    selected,
    chooseModel,
    prompt,
    setPrompt,
    params,
    setParams,
    phase,
    failure,
    balance,
    cost,
    short,
    missing,
    pastDue,
  } = composer

  if (phase === 'generating') {
    return (
      <div className="relative overflow-hidden rounded-lg border border-border p-8 text-center">
        <SignalSweep active />
        <p className="text-sm font-medium">Generating…</p>
        <p className="mt-1 text-sm text-muted-foreground">Usually takes about 30 seconds.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {contextSnippet && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          {contextSnippet.slice(0, 140)}
          {contextSnippet.length > 140 ? '…' : ''}
        </p>
      )}

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
        onValueChange={(next) => next && chooseKind(next as 'image' | 'video')}
        className="justify-start"
        aria-label="What to create"
      >
        <ToggleGroupItem value="image">Image</ToggleGroupItem>
        <ToggleGroupItem value="video">Video</ToggleGroupItem>
      </ToggleGroup>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Model</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {models.map((model) => {
            const modelLocked = TIER_RANK[model.tier] > TIER_RANK[composer.planTier]
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
                  name={`${idPrefix}-model`}
                  className="mt-1 accent-primary"
                  checked={active}
                  disabled={modelLocked}
                  onChange={() => chooseModel(model)}
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
        <label htmlFor={`${idPrefix}-prompt`} className="text-sm font-medium">
          Prompt
        </label>
        <Textarea
          id={`${idPrefix}-prompt`}
          rows={3}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Overhead flat-lay of a pour-over station, morning light, editorial style"
        />
      </div>

      {/* Generated from the model's own schema — no per-model UI exists. */}
      <ParamsForm
        schema={selected?.paramsSchema}
        values={params}
        onChange={setParams}
        idPrefix={idPrefix}
      />

      <p className="rounded-lg bg-muted px-3 py-2 text-sm">
        This will use <MonoNumber value={cost} className="font-semibold" /> credits · Balance after:{' '}
        <MonoNumber value={Math.max(0, balance - cost)} className="font-semibold" />
      </p>

      {missing.length > 0 && (
        <p className="text-sm text-muted-foreground">Still needed: {missing.join(', ')}.</p>
      )}

      {pastDue && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
        >
          <span className="font-medium text-destructive">
            Generation is paused while your payment is unresolved.
          </span>
          <span className="text-muted-foreground">
            Nothing you have typed is lost. Update your payment method and come back to it.
          </span>
          <Button asChild size="sm" variant="outline" className="self-start">
            <Link to="/billing/subscription">Update payment method</Link>
          </Button>
        </div>
      )}

      {short && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
        >
          <span className="font-medium text-warning">
            Not enough credits — this needs <MonoNumber value={cost} />, you have{' '}
            <MonoNumber value={balance} />.
          </span>
          <span className="text-muted-foreground">
            Your prompt and settings are saved. Top up and come straight back to them.
          </span>
          <Button asChild size="sm" variant="outline" className="self-start">
            <Link to="/billing/plans">See plans</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

export function ComposerSubmit({ composer }: { composer: ComposerState }) {
  const { phase, short, locked, selected, missing, pastDue, start } = composer
  return (
    <Button
      onClick={start}
      disabled={
        phase === 'generating' || short || locked || pastDue || !selected || missing.length > 0
      }
    >
      <Sparkles aria-hidden />
      {phase === 'generating' ? 'Generating…' : 'Generate'}
    </Button>
  )
}
