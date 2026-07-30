/**
 * The tone system, interactively: the five REAL preset tone chips — read from
 * `useTones()`, the same provider hook the product renders from — morphing
 * one sample sentence on hover, focus, or tap.
 *
 * Chips render `ToneBadge` inside a real button (W6's law: every screen that
 * shows a tone renders ToneBadge), with `aria-pressed` carrying the selected
 * state and a ring carrying it visually — never color alone. The sentence is
 * `aria-live="polite"`, and its word-by-word arrival is applied only when
 * motion is allowed; reduced motion swaps the text plainly.
 */
import { useState } from 'react'
import { ToneBadge } from '@/components/ab/tone-badge'
import { useTones } from '@/data/provider'
import { cn } from '@/lib/utils'
import { TONE_SAMPLE_FALLBACK, TONE_SAMPLES } from './tone-samples'
import { usePrefersReducedMotion } from './use-media-query'

export function ToneMorph() {
  const tones = useTones()
  const reduced = usePrefersReducedMotion()
  const presets = tones.filter((tone) => tone.kind === 'preset')
  const [activeName, setActiveName] = useState<string | null>(null)

  if (presets.length === 0) return null

  const active = presets.find((tone) => tone.name === activeName) ?? presets[0]
  const sample = TONE_SAMPLES[active.name] ?? TONE_SAMPLE_FALLBACK
  // The word-by-word arrival exists for MORPHS. First paint renders plainly:
  // an entrance fade would put transiently low-contrast text on screen for
  // anyone (and any scanner) looking at the section as it mounts.
  const animate = !reduced && activeName !== null

  return (
    <section id="tones" className="mx-auto max-w-4xl scroll-mt-20 px-6 py-24 text-center">
      <h2 className="text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
        The tone system
      </h2>
      <p className="mx-auto mt-4 max-w-2xl font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        One post, five voices — pick who your brand is today.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-2" role="group" aria-label="Tones">
        {presets.map((tone) => {
          const pressed = tone.name === active.name
          return (
            <button
              key={tone.id}
              type="button"
              aria-pressed={pressed}
              onClick={() => setActiveName(tone.name)}
              onMouseEnter={() => setActiveName(tone.name)}
              onFocus={() => setActiveName(tone.name)}
              className={cn(
                'rounded-full transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none',
                pressed && 'ring-2 ring-primary',
              )}
            >
              <ToneBadge
                tone={tone}
                className={cn('px-3 py-1 text-sm', pressed && 'border-primary text-primary')}
              />
            </button>
          )
        })}
      </div>

      <p
        aria-live="polite"
        className="mx-auto mt-10 min-h-24 max-w-2xl font-display text-xl text-balance sm:text-2xl"
      >
        {animate
          ? sample.split(' ').map((word, index) => (
              <span
                key={`${active.id}-${index}`}
                className="ab-word-in inline-block whitespace-pre"
                style={{ animationDelay: `${index * 28}ms` }}
              >
                {word}
                {index < sample.split(' ').length - 1 ? ' ' : ''}
              </span>
            ))
          : sample}
      </p>

      <p className="mt-6 text-sm text-muted-foreground">
        Five presets, plus the custom tones you write yourself — drafts arrive already speaking
        your language.
      </p>
    </section>
  )
}
