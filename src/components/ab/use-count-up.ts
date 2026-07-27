/**
 * The count-up behind ClaimChip's figures — a number that arrives rather than
 * simply appears, so a cited figure reads as measured instead of asserted.
 *
 * It lives in JS, not CSS, because JS is the only place this motion can live:
 * `styles/globals.css` can strip a `@keyframes` under `prefers-reduced-motion`,
 * but it cannot stop a counter. So the hook owns that guarantee itself, and it
 * REMOVES the motion rather than shortening it — under reduced motion the
 * target is returned on the very first render and no frame is ever scheduled.
 * Someone who asked for stillness gets the fact immediately, never a slower
 * animation of it.
 */
import { useEffect, useState } from 'react'

/** Long enough to register as counting, short enough to never delay a fact. */
const DEFAULT_DURATION_MS = 700

/** Decelerating, so the figure settles onto its target instead of hitting it. */
const easeOut = (progress: number) => 1 - (1 - progress) ** 3

/**
 * jsdom and any non-browser render have no `matchMedia`. Treating that as
 * "motion allowed" keeps the guard from silently disabling signature motion in
 * environments that simply cannot answer the question.
 */
function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Anything that cannot animate shows the finished number. The figure is the
 * point; the count is the flourish, so the flourish is what gets dropped.
 */
function shouldSkipAnimation(durationMs: number) {
  return prefersReducedMotion() || durationMs <= 0 || typeof requestAnimationFrame !== 'function'
}

export function useCountUp(target: number, options?: { durationMs?: number }): number {
  const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS
  // Seeded rather than corrected afterwards: when motion is off there is no
  // frame in which the wrong number was ever on screen.
  const [value, setValue] = useState(() => (shouldSkipAnimation(durationMs) ? target : 0))

  useEffect(() => {
    if (shouldSkipAnimation(durationMs)) {
      setValue(target)
      return
    }

    // rAF timestamps share performance.now()'s time origin, so this is the same
    // clock the frames report in.
    const startedAt = performance.now()
    let frame = 0
    const step = (now: number) => {
      const progress = Math.min((now - startedAt) / durationMs, 1)
      setValue(Math.round(target * easeOut(progress)))
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs])

  return value
}
