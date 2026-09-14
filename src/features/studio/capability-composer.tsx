/**
 * E2 (ORDER HSN-0910/A): ONE composer for the 13 capabilities, drawn from the
 * table — only that capability's fields, its plan selector only when the
 * catalog says `selectable`, its cost line when the catalog carries a price,
 * its wallet 402 as the existing Billing CTA. Every control here comes from a
 * table row; no capability is named in this file's markup.
 *
 * The validation law: the document's refusals are refused here, before any
 * round-trip; a 400 that still arrives renders as itself, request-id beside
 * it, because the wire's sentence names no field (open-item 49).
 */
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import type { MediaPlan } from '@/data/studio'
import { EmptyState } from '@/components/ab/empty-state'
import { InsufficientBalance } from '@/components/ab/insufficient-balance'
import { MonoNumber } from '@/components/ab/mono-number'
import { SignalSweep } from '@/components/ab/motion'
import { SkeletonForm } from '@/components/ab/skeletons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  asCharacter,
  asGuidance,
  asIds,
  asScenes,
  MEDIA_PLANS,
  type CapabilityField,
  type MediaCapability,
} from '@/data/media-capabilities'
import { MESSAGES } from '@/lib/messages'
import { formatUsdString } from '@/lib/money'
import { AssetPicker } from './asset-picker'
import { GuidanceEditor } from './guidance-editor'
import { ScenesEditor } from './scenes-editor'
import { useCapabilityComposer, type CapabilityComposerState } from './use-capability-composer'

const PLAN_LABEL: Record<MediaPlan, string> = {
  balanced: 'Balanced',
  creative: 'Creative',
  precise: 'Precise',
}

const UNIT_WORD: Record<string, string> = {
  images: 'image',
  video_seconds: 'second',
  audio_text_units: 'unit',
}

/** The cheapest price on a row's cost table, for the plan chips. */
function chipPrice(cost: Record<string, unknown> | undefined): string | null {
  if (!cost) return null
  for (const unit of ['images', 'video_seconds', 'audio_text_units']) {
    const price = cost[unit]
    if (typeof price === 'string') return `${formatUsdString(price)} / ${UNIT_WORD[unit]}`
  }
  return null
}

export function CapabilityComposer({ capability }: { capability: MediaCapability }) {
  const composer = useCapabilityComposer(capability)
  const prefix = 'cap'

  if (composer.unread) return <SkeletonForm label="Loading the studio" />
  if (!composer.granted) {
    return (
      <EmptyState
        icon={Sparkles}
        title={capability.name}
        description={MESSAGES.errors.studioNotGranted}
        action={
          <Button asChild variant="outline">
            <Link to="/studio">Back to the studio</Link>
          </Button>
        }
      />
    )
  }

  const busy = composer.phase !== 'compose'
  const disabled = busy || composer.pastDue

  if (composer.phase === 'rendering') {
    return (
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
        <div className="relative overflow-hidden rounded-lg border border-border p-8 text-center">
          <SignalSweep active />
          <p className="text-sm font-medium">Rendering…</p>
          <p className="mt-1 text-sm text-muted-foreground">{MESSAGES.notices.studioDemoRender}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="-ms-2 self-start">
        <Link to="/studio">
          <ArrowLeft aria-hidden />
          Back to the studio
        </Link>
      </Button>

      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium">{capability.name}</h2>
        <p className="text-sm text-muted-foreground">{capability.usecase}</p>
        {composer.model?.displayHint && (
          <p className="text-sm text-muted-foreground">
            Rendering on {composer.model.displayHint}
            {!composer.selectable && ' — a fixed model, no quality to choose'}.
          </p>
        )}
      </div>

      {composer.selectable && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Quality</legend>
          <div className="flex flex-wrap gap-2">
            {MEDIA_PLANS.map((option) => {
              const price = chipPrice(composer.priceForPlan(option))
              return (
                <Button
                  key={option}
                  size="sm"
                  variant={composer.plan === option ? 'default' : 'outline'}
                  aria-pressed={composer.plan === option}
                  disabled={disabled}
                  onClick={() => composer.setPlan(option)}
                >
                  {PLAN_LABEL[option]}
                  {price && <span className="font-mono text-xs opacity-80">{price}</span>}
                </Button>
              )
            })}
          </div>
        </fieldset>
      )}

      {capability.note && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          {capability.note}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {composer.fields.map((field) => (
          <Field
            key={field.key}
            field={field}
            composer={composer}
            prefix={prefix}
            disabled={disabled}
          />
        ))}
      </div>

      <CostLine composer={composer} />

      {composer.touched && composer.issues.length > 0 && (
        <ul
          role="alert"
          className="flex flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {composer.issues.map((issue, index) => (
            <li key={`${issue.key}-${index}`}>{issue.message}</li>
          ))}
        </ul>
      )}

      {composer.failure && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {composer.failure.message}
          {composer.failure.requestId && (
            <span className="block font-mono text-xs opacity-80">
              request {composer.failure.requestId}
            </span>
          )}
        </p>
      )}

      {composer.shortBalance && <InsufficientBalance wallet={composer.wallet} />}

      {composer.pastDue && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
        >
          <span className="font-medium text-destructive">{MESSAGES.errors.generatePaused}</span>
          <span className="text-muted-foreground">
            Nothing you have typed is lost. Update your payment method and come back to it.
          </span>
          <Button asChild size="sm" variant="outline" className="self-start">
            <Link to={composer.live ? '/billing' : '/billing/subscription'}>
              Update payment method
            </Link>
          </Button>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={() => void composer.submit()} disabled={disabled}>
          <Sparkles aria-hidden />
          {composer.phase === 'sending' ? 'Sending…' : 'Render'}
        </Button>
      </div>
    </div>
  )
}

function CostLine({ composer }: { composer: CapabilityComposerState }) {
  const cost = composer.cost
  if (!cost) {
    return (
      <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
        {MESSAGES.notices.chargedToBalance}
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted px-3 py-2 text-sm">
      <p>
        <MonoNumber value={cost.units} /> {cost.unitLabel}
        {cost.units === 1 ? '' : 's'} · <MonoNumber value={formatUsdString(cost.unitPrice)} /> each
        · this costs <MonoNumber value={formatUsdString(cost.total)} className="font-semibold" />
      </p>
      {cost.note && <p className="text-xs text-muted-foreground">{cost.note}</p>}
    </div>
  )
}

function Field({
  field,
  composer,
  prefix,
  disabled,
}: {
  field: CapabilityField
  composer: CapabilityComposerState
  prefix: string
  disabled: boolean
}) {
  const id = `${prefix}-${field.key}`
  const hintId = field.hint ? `${id}-hint` : undefined
  const value = composer.values[field.key]
  const set = (next: Parameters<typeof composer.setValue>[1]) => composer.setValue(field.key, next)
  const required = field.required ? (
    <>
      <span aria-hidden className="text-muted-foreground">
        {' '}
        *
      </span>
      <span className="sr-only">(required)</span>
    </>
  ) : null
  const hint = field.hint ? (
    <p id={hintId} className="text-sm text-muted-foreground">
      {field.hint}
    </p>
  ) : null

  switch (field.kind) {
    case 'text': {
      const text = typeof value === 'string' ? value : ''
      const Control = field.multiline ? Textarea : Input
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor={id}>
            {field.label}
            {required}
          </Label>
          {hint}
          <Control
            id={id}
            value={text}
            maxLength={field.max}
            disabled={disabled}
            aria-describedby={hintId}
            aria-required={field.required || undefined}
            onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              set(event.target.value)
            }
            {...(field.multiline ? { rows: field.max > 600 ? 4 : 3 } : {})}
          />
          {field.max <= 600 && (
            <p className="text-xs text-muted-foreground">
              <MonoNumber value={text.length} /> of <MonoNumber value={field.max} />
            </p>
          )}
        </div>
      )
    }
    case 'enum': {
      const chosen = typeof value === 'string' ? value : ''
      if (field.options.length === 0) {
        return (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{field.label}</p>
            <p className="text-sm text-muted-foreground">
              No option for this quality is on offer — the platform lists none.
            </p>
          </div>
        )
      }
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor={id}>
            {field.label}
            {required}
          </Label>
          {hint}
          <select
            id={id}
            value={chosen}
            disabled={disabled}
            aria-describedby={hintId}
            onChange={(event) => set(event.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            {!field.required && <option value="">None</option>}
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )
    }
    case 'integer':
    case 'number': {
      const number = typeof value === 'number' ? value : undefined
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor={id}>
            {field.label}
            {required}
          </Label>
          {hint}
          <Input
            id={id}
            type="number"
            inputMode={field.kind === 'integer' ? 'numeric' : 'decimal'}
            min={field.min}
            max={field.max}
            step={field.kind === 'integer' ? 1 : field.step}
            value={number === undefined || Number.isNaN(number) ? '' : String(number)}
            disabled={disabled}
            aria-describedby={hintId}
            onChange={(event) =>
              set(event.target.value === '' ? undefined : Number(event.target.value))
            }
          />
          <p className="text-xs text-muted-foreground">
            Between <MonoNumber value={field.min} /> and <MonoNumber value={field.max} />
          </p>
        </div>
      )
    }
    case 'boolean':
      return (
        <div className="flex items-center gap-3">
          <Switch
            id={id}
            checked={Boolean(value)}
            disabled={disabled}
            aria-describedby={hintId}
            onCheckedChange={(next) => set(next)}
          />
          <div className="flex flex-col">
            <Label htmlFor={id}>{field.label}</Label>
            {hint}
          </div>
        </div>
      )
    case 'assets':
      return (
        <AssetPicker
          id={id}
          label={field.label}
          hint={field.hint}
          assetKind={field.assetKind}
          min={field.min}
          max={field.max}
          value={asIds(value)}
          disabled={disabled}
          onChange={(next) => set(next)}
        />
      )
    case 'guidance':
      return (
        <GuidanceEditor
          id={id}
          label={field.label}
          hint={field.hint}
          items={asGuidance(value)}
          min={field.min}
          max={field.max}
          disabled={disabled}
          onChange={(next) => set(next)}
        />
      )
    case 'scenes': {
      const total = typeof composer.values.sec === 'number' ? composer.values.sec : 0
      return (
        <ScenesEditor
          id={id}
          scenes={asScenes(value)}
          total={total}
          plan={composer.selectable ? composer.plan : null}
          disabled={disabled}
          onChange={(next) => set(next)}
        />
      )
    }
    case 'character': {
      const character = asCharacter(value)
      const mode =
        character.source === '' ? 'none' : character.source === 'generate' ? 'generate' : 'asset'
      return (
        <fieldset className="flex flex-col gap-2" aria-describedby={hintId}>
          <legend className="text-sm font-medium">{field.label}</legend>
          {hint}
          <select
            id={id}
            value={mode}
            disabled={disabled}
            aria-label={field.label}
            onChange={(event) => {
              const next = event.target.value
              set({
                source:
                  next === 'none'
                    ? ''
                    : next === 'generate'
                      ? 'generate'
                      : character.source === 'generate'
                        ? ''
                        : character.source,
                desc: character.desc,
              })
            }}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="none">No presenter</option>
            <option value="generate">A described person the platform generates</option>
            <option value="asset">One of my assets</option>
          </select>
          {mode === 'asset' && (
            <AssetPicker
              id={`${id}-asset`}
              label="The presenter's asset"
              assetKind="image"
              min={1}
              max={1}
              value={character.source && character.source !== 'generate' ? [character.source] : []}
              disabled={disabled}
              onChange={(next) => set({ source: next[0] ?? '', desc: character.desc })}
            />
          )}
          {mode !== 'none' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-desc`}>Who they are</Label>
              <Textarea
                id={`${id}-desc`}
                rows={2}
                maxLength={600}
                value={character.desc}
                disabled={disabled}
                onChange={(event) => set({ source: character.source, desc: event.target.value })}
              />
            </div>
          )}
        </fieldset>
      )
    }
  }
}
