import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HERO_FRAME_COUNT, heroFrameSrc } from './media'

/**
 * The scrub: the assembly clip as a canvas frame sequence, mapped to scroll —
 * scrolling builds the Malaky interface (design.md Part 5, tier 2). Frames on
 * canvas, never `<video currentTime>`: seeking is keyframe-quantized and
 * stutters exactly when attention is highest. Scroll itself stays native —
 * the rAF loop only eases the FRAME INDEX toward the scroll target, so fast
 * wheel flicks settle instead of strobing, while sticky positioning, anchors
 * and assistive tech see an ordinary page.
 *
 * Frames load coarse-to-fine (stride 8 → 2 → 1) so the first paint is
 * immediate and scrubbing never waits on the tail of the sequence.
 */

/** Scroll-progress bands for the pinned copy. */
const STAGE_BANDS = [0.38, 0.72]

function stageFor(progress: number): number {
  if (progress < STAGE_BANDS[0]) return 0
  if (progress < STAGE_BANDS[1]) return 1
  return 2
}

export function ScrubHero({ intro }: { intro: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    if (!section || !canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const frames: (HTMLImageElement | null)[] = Array.from(
      { length: HERO_FRAME_COUNT },
      () => null,
    )
    let disposed = false
    let current = 0
    let target = 0
    let raf = 0
    let running = false
    let drawnIndex = -1

    const nearestLoaded = (index: number): HTMLImageElement | null => {
      for (let distance = 0; distance < HERO_FRAME_COUNT; distance++) {
        const below = frames[index - distance]
        if (below) return below
        const above = frames[index + distance]
        if (above) return above
      }
      return null
    }

    const draw = (index: number) => {
      const frame = nearestLoaded(index)
      if (!frame) return
      const scale = Math.max(canvas.width / frame.naturalWidth, canvas.height / frame.naturalHeight)
      const width = frame.naturalWidth * scale
      const height = frame.naturalHeight * scale
      context.drawImage(frame, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
      drawnIndex = index
    }

    const tick = () => {
      if (disposed) return
      current += (target - current) * 0.16
      if (Math.abs(target - current) < 0.05) current = target
      const index = Math.round(current)
      if (index !== drawnIndex) draw(index)
      if (current !== target) {
        raf = requestAnimationFrame(tick)
      } else {
        running = false
      }
    }

    const kick = () => {
      if (running || disposed) return
      running = true
      raf = requestAnimationFrame(tick)
    }

    const readTarget = () => {
      const rect = section.getBoundingClientRect()
      const span = rect.height - window.innerHeight
      const progress = span > 0 ? Math.min(Math.max(-rect.top / span, 0), 1) : 0
      target = progress * (HERO_FRAME_COUNT - 1)
      setStage(stageFor(progress))
    }

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(canvas.clientWidth * ratio)
      canvas.height = Math.round(canvas.clientHeight * ratio)
      drawnIndex = -1
      readTarget()
      kick()
    }

    const onScroll = () => {
      readTarget()
      kick()
    }

    const loadFrame = (index: number) =>
      new Promise<void>((resolve) => {
        if (frames[index] || disposed) {
          resolve()
          return
        }
        const image = new Image()
        image.decoding = 'async'
        image.onload = () => {
          frames[index] = image
          // A finer frame near the resting point should replace the coarse one.
          if (Math.abs(index - Math.round(current)) < 9) {
            drawnIndex = -1
            kick()
          }
          resolve()
        }
        image.onerror = () => resolve()
        image.src = heroFrameSrc(index)
      })

    const loadPass = (stride: number) => {
      const batch: Promise<void>[] = []
      for (let index = 0; index < HERO_FRAME_COUNT; index += stride) batch.push(loadFrame(index))
      batch.push(loadFrame(HERO_FRAME_COUNT - 1))
      return Promise.all(batch)
    }

    void loadPass(8)
      .then(() => (disposed ? [] : loadPass(2)))
      .then(() => (disposed ? [] : loadPass(1)))

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', resize)
    resize()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative h-[420vh]">
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />
        <div className="relative z-10 mx-auto w-full max-w-3xl px-6">
          <div
            data-mk-stage={stage === 0 ? 'in' : ''}
            inert={stage !== 0 || undefined}
            className="flex flex-col items-center gap-6 rounded-2xl bg-background/60 px-6 py-8 text-center backdrop-blur-sm"
          >
            {intro}
          </div>
          <div
            data-mk-stage={stage === 1 ? 'in' : ''}
            className="absolute inset-0 grid place-items-center"
          >
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-background/60 px-8 py-6 text-center backdrop-blur-sm">
              <p className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Built overnight
              </p>
              <p className="max-w-[40ch] text-lg text-muted-foreground">
                Every morning, the drafts Malaky wrote are already waiting.
              </p>
            </div>
          </div>
          <div
            data-mk-stage={stage === 2 ? 'in' : ''}
            className="absolute inset-0 grid place-items-center"
          >
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-background/60 px-8 py-6 text-center backdrop-blur-sm">
              <p className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                You approve what goes out
              </p>
              <p className="max-w-[40ch] text-lg text-muted-foreground">
                Approve, edit, decline — nothing publishes without your sign-off.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
