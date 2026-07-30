/**
 * THE LOOP — DRAFT. APPROVE. PUBLISH. — pinned over clip 2 (the macro glide
 * across the queue, the guardrails story) and revealed one word at a time as
 * the section scrolls through.
 *
 * The kinetic words are `aria-hidden`; the real sentence for assistive tech
 * is plain text. Reduced motion collapses the 300vh pin to one viewport with
 * all three words standing, and the video becomes its poster.
 */
import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { CINEMATIC_MEDIA } from './media'
import { usePrefersReducedMotion } from './use-media-query'
import { useSectionProgress } from './use-section-progress'

const PILLARS = [
  { word: 'DRAFT', line: 'Written before you wake, in your brand’s own tones.' },
  { word: 'APPROVE', line: 'A human reads every post. Nothing goes out without one.' },
  { word: 'PUBLISH', line: 'To every channel you chose, on schedule, art included.' },
]

export function LoopPillars() {
  const reduced = usePrefersReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const [reached, setReached] = useState(reduced ? PILLARS.length : 0)

  const onProgress = useCallback((progress: number) => {
    // A word stands once its third of the travel starts; it never un-reveals.
    const count = Math.min(PILLARS.length, Math.floor(progress * 3) + (progress > 0.02 ? 1 : 0))
    setReached((previous) => (count > previous ? count : previous))
  }, [])

  useSectionProgress(sectionRef, onProgress, !reduced)

  const active = Math.max(0, Math.min(PILLARS.length, reached) - 1)

  return (
    <section
      id="the-loop"
      ref={sectionRef}
      className={cn('dark relative bg-background text-foreground', !reduced && 'h-[300vh]')}
    >
      <div
        className={cn(
          'top-0 flex h-svh flex-col items-center justify-center overflow-hidden',
          !reduced && 'sticky',
        )}
      >
        {reduced ? (
          <img
            src={CINEMATIC_MEDIA.signalPoster}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <video
            className="absolute inset-0 size-full object-cover"
            src={CINEMATIC_MEDIA.signal}
            poster={CINEMATIC_MEDIA.signalPoster}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          />
        )}
        {/* Scrim so the words never fight the beam for contrast. */}
        <div aria-hidden className="absolute inset-0 bg-background/70" />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-10 px-6 text-center">
          <h2 className="text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
            The loop
            <span className="sr-only">: draft, approve, publish — every morning</span>
          </h2>

          {reduced ? (
            // The whole loop at once: word + meaning, standing still.
            <div className="flex flex-col items-center gap-8">
              {PILLARS.map((pillar) => (
                <div key={pillar.word} className="flex flex-col items-center gap-2">
                  <p className="font-display text-[clamp(2.25rem,7vw,5rem)] leading-none font-bold tracking-[0.06em] uppercase">
                    {pillar.word}
                    <span className="text-brand">.</span>
                  </p>
                  <p className="max-w-md text-sm text-muted-foreground sm:text-base">
                    {pillar.line}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div aria-hidden className="flex flex-col items-center gap-2">
                {PILLARS.map((pillar, index) => {
                  const shown = index < reached
                  return (
                    <p
                      key={pillar.word}
                      data-shown={shown}
                      className={cn(
                        'font-display text-[clamp(2.75rem,8vw,6.5rem)] leading-[1.05] font-bold tracking-[0.06em] uppercase',
                        'transition-all duration-700',
                        shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
                        shown && index !== active && 'text-muted-foreground',
                      )}
                    >
                      {pillar.word}
                      <span className="text-brand">.</span>
                    </p>
                  )
                })}
              </div>

              <p className="min-h-12 max-w-md text-base text-muted-foreground sm:text-lg">
                {reached > 0 ? PILLARS[active].line : ''}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
