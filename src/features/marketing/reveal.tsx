import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Tier-1 motion, the base page's whole budget (design.md Part 5): fade in
 * and settle when the block first enters the viewport. The CSS lives in
 * globals.css behind prefers-reduced-motion: no-preference, so reduced
 * motion never sees an intermediate state — this component only flips the
 * attribute.
 */
export function Reveal({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver !== 'function') {
      node.setAttribute('data-mk-reveal', 'in')
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.setAttribute('data-mk-reveal', 'in')
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} data-mk-reveal="" className={className}>
      {children}
    </div>
  )
}
