/**
 * The hero: scrolling sweeps the noise into the queue.
 *
 * Three renderings of one scene, chosen by capability, never by degradation:
 *
 * - **Scrub** (motion allowed, wide viewport): a 420vh section pins a canvas
 *   for ~3 viewport-heights of travel; scroll progress picks one of 200 WebP
 *   frames extracted from clip 1, eased toward the target so fast flicks
 *   settle instead of strobing. ALPHABEACON tracks in letter by letter, the
 *   HUD clock walks 06:58 → 07:00, and at 07:00 the assembled queue holds and
 *   "Your drafts are ready." lands.
 * - **Loop** (motion allowed, narrow viewport): the same clip as a plain
 *   autoplay loop — a phone has neither the scroll travel nor the decode
 *   budget the scrub wants.
 * - **Still** (prefers-reduced-motion): the finished frame as an image, all
 *   copy present, clock resting at 07:00:00. The story is told in its end
 *   state rather than animated to it.
 *
 * The scrub NEVER drives a <video> element's currentTime — that is the law
 * this component exists to uphold (design.md Part 5), and verify-w02 greps
 * for it structurally.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { MonoNumber } from '@/components/ab/mono-number'
import { cn } from '@/lib/utils'
import { HERO_FRAME_COUNT, HeroFrameStore } from './hero-frames'
import { hudClock } from './hud-clock'
import { CINEMATIC_MEDIA } from './media'
import { useIsNarrowViewport, usePrefersReducedMotion } from './use-media-query'
import { useSectionProgress } from './use-section-progress'

const TITLE = 'ALPHABEACON'
const SUBTITLE = "Your marketing team's AI co-pilot"
const READY_LINE = 'Your drafts are ready.'

/** Letter i of the wordmark is in once progress passes this. */
const letterThreshold = (index: number) => 0.03 + index * 0.02

export function HeroScrub() {
  const reduced = usePrefersReducedMotion()
  const narrow = useIsNarrowViewport()

  if (reduced) return <HeroStill />
  if (narrow) return <HeroLoop />
  return <HeroScrubbed />
}

/** Shared overlay copy so the three renderings cannot drift apart. */
function HeroCopy({
  lettersShown,
  titleFaded,
  subtitleShown,
  arrived,
  clock,
}: {
  lettersShown: number
  titleFaded: boolean
  subtitleShown: boolean
  arrived: boolean
  clock: string
}) {
  return (
    <>
      {/* HUD — a fixed mono clock, the scrub's odometer. */}
      <div className="absolute top-20 right-6 z-10 text-right sm:right-10">
        <MonoNumber value={clock} className="text-sm text-foreground/90 sm:text-base" />
        <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          Tomorrow, this morning
        </p>
      </div>

      <div
        className={cn(
          'relative z-10 mx-auto flex min-h-svh max-w-5xl flex-col items-center justify-center px-6 text-center',
          'transition-opacity duration-500 motion-reduce:transition-none',
          titleFaded && 'opacity-0',
        )}
      >
        {/* A soft ink well behind the type so it clears the beam's haze. */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-1/2 h-80 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,var(--ab-ink)_0%,transparent_70%)]"
        />
        <h1 className="relative font-display font-bold tracking-[0.14em] uppercase">
          <span className="sr-only">AlphaBeacon</span>
          {/* The clamp floor must keep all 11 tracked letters on one line at
              320px — the wordmark never wraps. */}
          <span
            aria-hidden
            className="block text-[clamp(1.9rem,10vw,8rem)] leading-none whitespace-nowrap"
          >
            {TITLE.split('').map((letter, index) => (
              <span
                key={index}
                className={cn(
                  'inline-block transition-all duration-500 motion-reduce:transition-none',
                  index < lettersShown
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-[0.3em] opacity-0',
                )}
                style={{ transitionDelay: `${(index % 4) * 40}ms` }}
              >
                {letter}
              </span>
            ))}
          </span>
        </h1>
        <p
          className={cn(
            'relative mt-6 text-lg text-muted-foreground transition-opacity duration-700 motion-reduce:transition-none sm:text-xl',
            subtitleShown ? 'opacity-100' : 'opacity-0',
          )}
        >
          {SUBTITLE}
        </p>
      </div>

      {/* 07:00 — the queue is assembled and the page says so. */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-[12svh] z-10 flex flex-col items-center gap-5 px-6 text-center',
          'transition-all duration-700 motion-reduce:transition-none',
          arrived ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        )}
      >
        <p className="font-display text-2xl font-semibold text-balance sm:text-3xl">
          {READY_LINE}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/signup" tabIndex={arrived ? undefined : -1}>
              Start free
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#pricing" tabIndex={arrived ? undefined : -1}>
              See pricing
            </a>
          </Button>
        </div>
      </div>
    </>
  )
}

function HeroScrubbed() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const storeRef = useRef<HeroFrameStore | null>(null)
  const scrubRef = useRef({ target: 0, current: 0, drawnIndex: -1 })

  const [lettersShown, setLettersShown] = useState(0)
  const [subtitleShown, setSubtitleShown] = useState(false)
  const [titleFaded, setTitleFaded] = useState(false)
  const [arrived, setArrived] = useState(false)
  const [cueFaded, setCueFaded] = useState(false)
  const [clock, setClock] = useState(hudClock(0))

  // Discrete UI state derives from progress; setState only on change so the
  // rAF stream never becomes a render stream.
  const onProgress = useCallback((progress: number) => {
    scrubRef.current.target = progress
    setLettersShown((previous) => {
      let shown = 0
      while (shown < TITLE.length && progress > letterThreshold(shown)) shown += 1
      return shown === previous ? previous : shown
    })
    setSubtitleShown(progress > 0.3)
    setTitleFaded(progress > 0.62)
    setArrived(progress > 0.94)
    setCueFaded(progress > 0.05)
    setClock((previous) => {
      const next = hudClock(progress)
      return next === previous ? previous : next
    })
  }, [])

  useSectionProgress(sectionRef, onProgress)

  // The draw loop: ease toward the target frame, draw only on frame change.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const store = new HeroFrameStore()
    storeRef.current = store
    store.start()

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(canvas.clientWidth * ratio)
      canvas.height = Math.round(canvas.clientHeight * ratio)
      scrubRef.current.drawnIndex = -1
    }
    resize()
    window.addEventListener('resize', resize)

    let frame = 0
    const draw = () => {
      const scrub = scrubRef.current
      scrub.current += (scrub.target - scrub.current) * 0.16
      if (Math.abs(scrub.target - scrub.current) < 0.0015) scrub.current = scrub.target

      const wanted = Math.round(scrub.current * (HERO_FRAME_COUNT - 1))
      const nearest = store.nearest(wanted)
      if (nearest && nearest.index !== scrub.drawnIndex) {
        const { image } = nearest
        const scale = Math.max(
          canvas.width / image.naturalWidth,
          canvas.height / image.naturalHeight,
        )
        const width = image.naturalWidth * scale
        const height = image.naturalHeight * scale
        context.drawImage(
          image,
          (canvas.width - width) / 2,
          (canvas.height - height) / 2,
          width,
          height,
        )
        scrub.drawnIndex = nearest.index
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      storeRef.current = null
    }
  }, [])

  return (
    <section ref={sectionRef} className="dark relative h-[420vh] bg-background text-foreground">
      <div className="sticky top-0 h-svh overflow-hidden">
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 size-full bg-[var(--ab-ink)]"
        />
        <span aria-hidden className="ab-grain" />
        <HeroCopy
          lettersShown={lettersShown}
          titleFaded={titleFaded}
          subtitleShown={subtitleShown}
          arrived={arrived}
          clock={clock}
        />
        {/* The invitation to do the sweeping. */}
        <p
          className={cn(
            'absolute inset-x-0 bottom-6 z-10 text-center text-xs tracking-[0.3em] text-muted-foreground uppercase',
            'transition-opacity duration-500 motion-reduce:transition-none',
            cueFaded && 'opacity-0',
          )}
        >
          Scroll to sweep the noise
        </p>
      </div>
    </section>
  )
}

/** Narrow viewports: the same film, playing itself. */
function HeroLoop() {
  return (
    <section className="dark relative bg-background text-foreground">
      <div className="relative min-h-svh overflow-hidden">
        <video
          className="absolute inset-0 size-full object-cover"
          src={CINEMATIC_MEDIA.heroLoop}
          poster={CINEMATIC_MEDIA.heroStatic}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
        <span aria-hidden className="ab-grain" />
        <HeroCopy
          lettersShown={TITLE.length}
          titleFaded={false}
          subtitleShown
          arrived
          clock={hudClock(1)}
        />
      </div>
    </section>
  )
}

/** Reduced motion: the end state, immediately — never a slower animation. */
function HeroStill() {
  return (
    <section className="dark relative bg-background text-foreground">
      <div className="relative min-h-svh overflow-hidden">
        <img
          src={CINEMATIC_MEDIA.heroStatic}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <span aria-hidden className="ab-grain" />
        <HeroCopy
          lettersShown={TITLE.length}
          titleFaded={false}
          subtitleShown
          arrived
          clock={hudClock(1)}
        />
      </div>
    </section>
  )
}
