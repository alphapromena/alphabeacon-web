/**
 * MOMENT 2 (ORDER MOTION-0914/B) — first light.
 *
 * The beacon draws outward once, the core lights, the product says the
 * person's own name, and it resolves into the app. It is the largest of the
 * four moments and it happens once in the life of an account.
 *
 * ## Under two seconds, and the clock is the scale's
 *
 * `--motion-slow` (900ms) is the ring, and the whole thing is held for
 * `FIRST_LIGHT_MS` before it dismisses itself. Both are well inside the
 * two-second ceiling the order sets, and the total is asserted rather than
 * eyeballed (`first-light.test.tsx`).
 *
 * The clock starts at the overlay's FIRST PAINT — two animation frames after
 * mount, the frame the browser has actually shown — not at mount and never at
 * arming (NIGHT-0916 order 4, item 82; D-NIGHT-0916-D). Live, the workspace
 * sync lands inside the moment, and a clock started at mount ran 2.2–2.3 s
 * measured paint to removal (TEST-0915-2): the mount effect itself waited on
 * the first commit, and the dismissal's re-render queued behind the sync's.
 * So at the clock's end the overlay takes itself off the screen FIRST — the
 * node is hidden synchronously — and only then tells the app; the sync can
 * delay the unmount, never the leaving.
 *
 * ## Skippable, and skipping lands in the same place
 *
 * Any click, any key. There is exactly one exit path — `finish()` — so
 * "skipped" and "waited" cannot diverge: both clear the overlay and leave the
 * app exactly as it was underneath. The overlay never navigates, which is what
 * makes that guarantee structural rather than a thing to remember.
 *
 * ## Reduced motion
 *
 * It is not mounted at all. The end state of first light is "you are in the
 * product", and that is where somebody who asked for stillness starts. This is
 * the JS half of the guarantee for the same reason `useCountUp` has one: CSS
 * can stop an animation but it cannot stop a timer, and an invisible overlay
 * that still swallowed two seconds of clicks would be worse than the
 * animation.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { markFirstLightSeen } from '@/lib/first-light'

/** How long the whole moment is on screen, from its first paint. The order's ceiling is 2000ms. */
export const FIRST_LIGHT_MS = 1_800

export function FirstLight({
  /** Shown as typed at signup; the greeting uses the first word of it. */
  name,
  /** The account this is being recorded against. */
  email,
  onDone,
}: {
  name: string
  email: string
  onDone: () => void
}) {
  const done = useRef(false)
  const overlay = useRef<HTMLDivElement>(null)
  // The words arrive after the beacon rather than with it, and they arrive by
  // being rendered — never by fading, which is what put text under AA in
  // phase A (D-MOTION-0914-H).
  const [lit, setLit] = useState(false)

  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    // Off the screen now, in this very task; the unmount follows whenever the
    // app gets to it (a landing sync may be rendering first).
    if (overlay.current) overlay.current.hidden = true
    onDone()
  }, [onDone])

  useEffect(() => {
    // Marked at the START: a reload halfway through must not replay it.
    markFirstLightSeen(email)
    let light = 0
    let close = 0
    let secondFrame = 0
    // First paint: the second animation frame after mount is the first one
    // the browser has shown. The clock runs from there.
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        light = window.setTimeout(() => setLit(true), 420)
        close = window.setTimeout(finish, FIRST_LIGHT_MS)
      })
    })
    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
      window.clearTimeout(light)
      window.clearTimeout(close)
    }
  }, [email, finish])

  useEffect(() => {
    const skip = () => finish()
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [finish])

  const firstName = name.trim().split(/\s+/)[0] || 'there'

  return (
    <div
      ref={overlay}
      data-slot="first-light"
      /*
       * `role="status"` rather than `dialog`: nothing here is to be decided,
       * and a dialog would demand focus management for a surface that exists
       * for under two seconds and traps nothing. The button below is the
       * accessible skip, and any key or click does the same.
       */
      role="status"
      aria-label={`Welcome to Malaky, ${firstName}`}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background"
    >
      <div className="relative flex size-32 items-center justify-center">
        {/* Two rings on one figure — decoration in full, so both carry
            `data-ab-motion` and neither exists under reduced motion. */}
        <span
          data-ab-motion="first-light-ring"
          aria-hidden
          className="absolute size-16 rounded-full border border-brand"
        />
        <span
          data-ab-motion="first-light-ring"
          data-ring="2"
          aria-hidden
          className="absolute size-16 rounded-full border border-brand"
        />
        <span
          data-ab-motion="first-light-core"
          aria-hidden
          className="size-3 rounded-full bg-brand"
        />
      </div>

      {lit && (
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <img src="/brand/malaky-logo-white.png" alt="" aria-hidden className="h-8 w-auto" />
          <p className="font-display text-2xl font-semibold tracking-tight text-balance">
            Welcome to Malaky, {firstName}
          </p>
          {/* The same rule §5.7 draws, at the largest scale it is used at. */}
          <span
            data-ab-motion="first-light-rule"
            aria-hidden
            className="h-px w-24 rounded-full bg-brand"
          />
        </div>
      )}

      {/* A real control, because "skippable" should be discoverable and not
          only a thing you find by hitting a key. */}
      <button
        type="button"
        onClick={finish}
        className="absolute bottom-8 rounded-lg px-3 py-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        Skip
      </button>
    </div>
  )
}
