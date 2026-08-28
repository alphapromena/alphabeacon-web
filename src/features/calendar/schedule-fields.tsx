/**
 * The pipeline configuration controls for C1, the schedule editor.
 *
 * They were extracted so the onboarding wizard's step 4 and C1 could render
 * the SAME fields rather than two copies that drift. **The wizard is gone**
 * (ORDER ONB-0827, D-ONB-C): setup happens in Settings and the posting rhythm
 * happens here, so C1 is now the only surface these fields serve and they live
 * beside it. The extraction stays because the shape is still worth naming, and
 * because `verify:w06` reads it to prove C1 has not grown a tone picker of its
 * own.
 *
 * The summary sentence is the honesty check: it restates the whole
 * configuration in one line with mono figures, so nobody starts a pipeline
 * without seeing what they just asked for.
 */
import { Lock, Plus } from 'lucide-react'
import { MonoNumber } from '@/components/ab/mono-number'
import { ToneBadge } from '@/components/ab/tone-badge'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { GenerationModel, PlanTier, Tone, Weekday } from '@/data/types'
import { MAX_POSTS_PER_DAY } from '@/data/types'
import { cn } from '@/lib/utils'

const DAYS: { value: Weekday; label: string; full: string }[] = [
  { value: 'mon', label: 'M', full: 'Monday' },
  { value: 'tue', label: 'T', full: 'Tuesday' },
  { value: 'wed', label: 'W', full: 'Wednesday' },
  { value: 'thu', label: 'T', full: 'Thursday' },
  { value: 'fri', label: 'F', full: 'Friday' },
  { value: 'sat', label: 'S', full: 'Saturday' },
  { value: 'sun', label: 'S', full: 'Sunday' },
]

const TIER_RANK: Record<PlanTier, number> = { free: 0, pro: 1, studio: 2 }

export function ActiveDaysField({
  value,
  onChange,
}: {
  value: Weekday[]
  onChange: (next: Weekday[]) => void
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">Active days</legend>
      <p className="text-sm text-muted-foreground">Drafts are generated on the days you pick.</p>
      <ToggleGroup
        type="multiple"
        value={value}
        onValueChange={(next) => onChange(next as Weekday[])}
        className="mt-1 justify-start gap-1.5"
      >
        {DAYS.map((day) => (
          <ToggleGroupItem
            key={day.value}
            value={day.value}
            aria-label={day.full}
            className="size-9 rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {day.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </fieldset>
  )
}

export function PostsPerDayField({
  value,
  onChange,
}: {
  value: number
  onChange: (next: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium" id="posts-per-day-label">
        Posts per day
      </span>
      {/* The cap is stated, not just enforced — a stepper that silently stops
          reads as broken (screens4.md: "hard-capped at 3, cap visible"). */}
      <p className="text-sm text-muted-foreground">
        At most <MonoNumber value={MAX_POSTS_PER_DAY} /> a day, so the queue stays reviewable.
      </p>
      <div className="mt-1 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="One fewer post per day"
          disabled={value <= 1}
          onClick={() => onChange(Math.max(1, value - 1))}
        >
          −
        </Button>
        <output
          aria-labelledby="posts-per-day-label"
          className="w-8 text-center font-mono text-lg font-semibold tabular-nums"
        >
          {value}
        </output>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="One more post per day"
          disabled={value >= MAX_POSTS_PER_DAY}
          onClick={() => onChange(Math.min(MAX_POSTS_PER_DAY, value + 1))}
        >
          +
        </Button>
      </div>
    </div>
  )
}

export function GenerationModelField({
  models,
  value,
  planTier,
  onChange,
}: {
  models: GenerationModel[]
  value: string
  planTier: PlanTier
  onChange: (id: string) => void
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">Generation model</legend>
      <p className="text-sm text-muted-foreground">Which model drafts your copy.</p>
      <div className="mt-1 grid gap-2">
        {models.map((model) => {
          const locked = TIER_RANK[model.tier] > TIER_RANK[planTier]
          return (
            <label
              key={model.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                value === model.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
                locked && 'cursor-not-allowed opacity-70',
              )}
            >
              <input
                type="radio"
                name="generation-model"
                value={model.id}
                checked={value === model.id}
                disabled={locked}
                onChange={() => onChange(model.id)}
                className="mt-1 accent-primary"
              />
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {model.name}
                  {locked && (
                    <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                      <Lock aria-hidden className="size-3" />
                      {model.tier === 'pro' ? 'Pro plan' : 'Studio plan'}
                    </span>
                  )}
                </span>
                <span className="text-sm text-muted-foreground">{model.description}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function TonesField({
  tones,
  value,
  onChange,
  onCreate,
}: {
  tones: Tone[]
  value: string[]
  onChange: (next: string[]) => void
  onCreate: () => void
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">Tones</legend>
      <p className="text-sm text-muted-foreground">
        Drafts rotate through the tones you pick. Custom tones sit alongside the presets.
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {tones.map((tone) => {
          const selected = value.includes(tone.id)
          return (
            <button
              key={tone.id}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                onChange(selected ? value.filter((id) => id !== tone.id) : [...value, tone.id])
              }
              className={cn(
                'rounded-full ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
                selected && 'ring-2 ring-primary ring-offset-2',
              )}
            >
              {/* Preset and custom render through the same badge, so a tone the
                  user wrote never looks second-class. */}
              <ToneBadge tone={tone} />
            </button>
          )
        })}
        <Button type="button" variant="ghost" size="sm" onClick={onCreate}>
          <Plus aria-hidden />
          Create custom tone
        </Button>
      </div>
    </fieldset>
  )
}

/** The live restatement of the whole configuration, in one sentence. */
export function PipelineSummary({
  activeDays,
  postsPerDay,
  toneCount,
  modelName,
}: {
  activeDays: number
  postsPerDay: number
  toneCount: number
  modelName: string
}) {
  return (
    <p className="rounded-lg bg-muted px-4 py-3 text-sm">
      Up to <MonoNumber value={activeDays * postsPerDay} className="font-semibold" /> drafts a week,
      in <MonoNumber value={toneCount} className="font-semibold" />{' '}
      {toneCount === 1 ? 'tone' : 'tones'}, drafted by{' '}
      <span className="font-semibold">{modelName || '—'}</span>.
    </p>
  )
}
