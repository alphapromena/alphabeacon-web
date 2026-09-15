/**
 * MOMENT 1 (ORDER MOTION-0914/B) — the sample post that rewrites itself.
 *
 * It sits beside the tone picker, and when the picked tone changes the line
 * changes with it. That is the whole idea: a marketer judges the output, and
 * this is the earliest place in the product where output exists to judge.
 *
 * ## The rewrite is a transition, not a swap — and not a fade
 *
 * A gold rule crosses the card and the words change under it. Phase A learned
 * why this cannot be an opacity fade: compositing text at 95% put the
 * product's tightest colour pairs under AA and axe found 58 violations of it
 * (D-MOTION-0914-H). So the text is only ever at full opacity, and the motion
 * is carried by a rule that has no contrast duty at all.
 *
 * It is the same gesture §5.7 draws when the queue empties and the same one an
 * approved card draws, at a smaller scale — one figure, four intensities.
 *
 * ## Reduced motion
 *
 * The rule carries `data-ab-motion`, so it is REMOVED — and removing it takes
 * nothing away, because the words have already changed. The card is not
 * `data-ab-motion` and never could be: that attribute carries
 * `display: none !important`.
 */
import { useEffect, useRef, useState } from 'react'
import { useDrafts, useTones } from '@/data/provider'
import { toneSample } from '@/lib/tone-sample'
import { cn } from '@/lib/utils'

/** What the footnote says about where the words came from. */
const SOURCE_NOTE = {
  draft: 'A draft this workspace has already written in this tone.',
  example: 'The example line saved with this tone.',
  description: 'Composed from the tone itself — nothing was generated.',
} as const

export function ToneSampleCard({
  toneId,
  className,
}: {
  /** The tone being shown. `undefined` while nothing is picked. */
  toneId: string | undefined
  className?: string
}) {
  const tones = useTones()
  const drafts = useDrafts()
  const tone = tones.find((entry) => entry.id === toneId)
  const sample = toneSample(tone, drafts)

  /*
   * A key that changes only when the LINE changes, so the rule draws on a
   * rewrite and not on every re-render of the screen around it. Re-keying the
   * element is what restarts a CSS animation; without it the second pick of
   * the same session would change the words in silence.
   */
  const [sweepKey, setSweepKey] = useState(0)
  const previous = useRef<string | null>(null)
  useEffect(() => {
    const copy = sample?.copy ?? null
    if (previous.current !== null && previous.current !== copy) setSweepKey((n) => n + 1)
    previous.current = copy
  }, [sample?.copy])

  if (!tone || !sample) return null

  return (
    <figure
      data-slot="tone-sample"
      className={cn(
        'relative m-0 flex flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card p-4',
        className,
      )}
    >
      {/* The rewrite, drawn once per change. `key` restarts it; `sweepKey` of
          0 is the first render, which must not draw — nothing was rewritten. */}
      {sweepKey > 0 && (
        <span
          key={sweepKey}
          data-ab-motion="tone-rewrite"
          aria-hidden
          className="absolute inset-x-0 top-0 h-px rounded-full bg-brand"
        />
      )}

      <figcaption className="text-xs text-muted-foreground">
        A sample post in <span className="font-medium text-foreground">{tone.name}</span>
      </figcaption>

      {/*
       * `aria-live="polite"`: the line changes under the user's own click and
       * a screen-reader user gets the same answer a sighted one does. Polite
       * rather than assertive — it is an answer, not an alarm.
       */}
      <p aria-live="polite" className="text-sm/relaxed text-pretty">
        {sample.copy}
      </p>

      <p className="text-xs text-subtle-foreground">{SOURCE_NOTE[sample.source]}</p>
    </figure>
  )
}
