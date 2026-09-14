/**
 * A number that CHANGES travels to its new value instead of being replaced.
 *
 * ORDER MOTION-0914/A §3. Measured, no figure in the product animated at all:
 * `MonoNumber` is the single component every credit, count, metric and
 * timestamp renders through, and it wrote a new text node. A balance going
 * 40 → 0 and a queue going 3 → 2 both simply blinked, which is the one case
 * where a changing number most wants to be noticed.
 *
 * ## Why this is not `use-count-up.ts`
 *
 * That hook counts from ZERO on mount — an arrival, used once, by ClaimChip,
 * to make a cited figure read as measured rather than asserted. This one
 * animates from the PREVIOUS value on change and does nothing at all on the
 * first render. The difference is the whole point: counting up from zero every
 * time a screen mounts is a decorative entrance, and §5's law bans those. Two
 * different jobs, two hooks; neither is a generalisation of the other.
 *
 * ## Reduced motion
 *
 * In JS, because CSS cannot stop a counter — the same reasoning `use-count-up`
 * records. The motion is REMOVED, not shortened: the new value is returned on
 * the very first render and no frame is ever scheduled. Someone who asked for
 * stillness gets the fact immediately, never a slower animation of it.
 */
import { useEffect, useRef, useState } from 'react'

/**
 * The scale's MEDIUM, in milliseconds.
 *
 * A number changing is a state change, which is what medium is for. It cannot
 * read `var(--motion-medium)` — this is a JS counter, not a CSS transition —
 * so the one place the scale crosses into JS is here, named and pointed at its
 * token. `motion-scale.test.ts` asserts the two never drift.
 */
export const NUMBER_TRANSITION_MS = 220

/** Decelerating, the curve `--ease-out` describes: it settles, never lands. */
const easeOut = (progress: number) => 1 - (1 - progress) ** 3

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function cannotAnimate(durationMs: number) {
  return prefersReducedMotion() || durationMs <= 0 || typeof requestAnimationFrame !== 'function'
}

/**
 * `target` on the first render, always. After that, the value travelling
 * towards `target` from wherever it was.
 */
export function useNumberTransition(target: number, options?: { durationMs?: number }): number {
  const durationMs = options?.durationMs ?? NUMBER_TRANSITION_MS
  const [value, setValue] = useState(target)
  // What is on screen right now, read inside the frame loop without making the
  // effect depend on it — a dependency there would restart the tween on every
  // frame it schedules.
  const shown = useRef(target)
  shown.current = value
  const first = useRef(true)

  useEffect(() => {
    // First render is not a change. Nothing animates INTO existence here.
    if (first.current) {
      first.current = false
      setValue(target)
      return
    }
    const from = shown.current
    if (from === target) return
    if (cannotAnimate(durationMs)) {
      setValue(target)
      return
    }

    const startedAt = performance.now()
    let frame = 0
    const step = () => {
      /*
       * `performance.now()` READ HERE, not the timestamp rAF hands in, and the
       * progress CLAMPED at both ends.
       *
       * In a browser the rAF timestamp shares `performance.now()`'s time
       * origin. In jsdom it does not, so `now - startedAt` came out large and
       * negative, `easeOut` of a negative progress is unbounded, and a counter
       * asked to go 94 → 93 was measured leaping to 332 before decaying onto
       * its target. `use-count-up.ts` has the same latent fault and never
       * showed it: counting up from zero, the overshoot lands off-screen at
       * the bottom and its tests only assert the endpoints.
       *
       * Reading one clock and clamping to [0, 1] is correct in both, and makes
       * the tween incapable of leaving the interval it was given.
       */
      const elapsed = performance.now() - startedAt
      const progress = Math.min(Math.max(elapsed / durationMs, 0), 1)
      setValue(Math.round(from + (target - from) * easeOut(progress)))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs])

  return value
}
