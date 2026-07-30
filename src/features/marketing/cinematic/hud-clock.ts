/**
 * The hero HUD clock: 06:58:00 → 07:00:00, driven by scroll progress.
 *
 * Two minutes of wall clock mapped onto the scrub, because the product's
 * promise is a TIME — the queue is ready before the workday starts — and the
 * scrub is the user dragging that morning forward themselves. 07:00 is when
 * the assembled queue locks and "Your drafts are ready." lands.
 */

const START_SECONDS = 6 * 3600 + 58 * 60
const SPAN_SECONDS = 120

export function hudClock(progress: number): string {
  const clamped = Math.min(1, Math.max(0, progress))
  const at = START_SECONDS + Math.round(clamped * SPAN_SECONDS)
  const pad = (value: number) => String(value).padStart(2, '0')
  const hours = Math.floor(at / 3600)
  const minutes = Math.floor((at % 3600) / 60)
  const seconds = at % 60
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}
