/**
 * Lenis smooth scroll, marketing page only (decisions.md — the cinematic
 * layer's one dependency).
 *
 * THE GUARD IS THE POINT: under prefers-reduced-motion Lenis is never
 * constructed — not slowed, not configured gentler — so scrolling is the
 * browser's own, exactly as everywhere else in the product. `anchors: true`
 * keeps the header's #hash links working while Lenis owns the scroll.
 */
import Lenis from 'lenis'
import { useEffect } from 'react'

export function useLenis(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const lenis = new Lenis({ autoRaf: true, anchors: true })
    return () => lenis.destroy()
  }, [enabled])
}
