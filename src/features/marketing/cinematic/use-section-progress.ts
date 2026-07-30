/**
 * Scroll progress of a tall section, 0 at "section top at viewport top" to 1
 * at "section bottom at viewport bottom" — the number every scroll-driven
 * piece of the cinematic layer keys off.
 *
 * Delivered through a callback on requestAnimationFrame rather than state,
 * deliberately: the hero mutates a canvas and a clock at frame rate, and
 * re-rendering React 60 times a second is how scrubs stop being buttery.
 * Callers that need React state derive DISCRETE values in the callback and
 * set state only when they change.
 */
import { useEffect, type RefObject } from 'react'

export function useSectionProgress(
  ref: RefObject<HTMLElement | null>,
  onProgress: (progress: number) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return
    const element = ref.current
    if (!element || typeof requestAnimationFrame !== 'function') return

    let frame = 0
    const tick = () => {
      const rect = element.getBoundingClientRect()
      const travel = rect.height - window.innerHeight
      const progress = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0
      onProgress(progress)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [ref, onProgress, enabled])
}
