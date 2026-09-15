/**
 * "Has this person asked for stillness?" — asked in ONE place.
 *
 * CSS carries the guarantee for anything CSS can reach: the scale collapses to
 * 0ms and `[data-ab-motion]` is removed, both in one block in `globals.css`.
 * But CSS cannot stop a `requestAnimationFrame` counter and it cannot stop a
 * `setTimeout`, so a handful of moments have to ask in JavaScript — and by the
 * third caller (`use-count-up`, `use-number-transition`, `FirstLight`) the
 * same eight lines existed three times.
 *
 * `matchMedia` is absent in jsdom and in any non-browser render. Treating that
 * as "motion allowed" keeps the guard from silently disabling motion in
 * environments that simply cannot answer the question — a test that wants the
 * other answer stubs it, which several do.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
