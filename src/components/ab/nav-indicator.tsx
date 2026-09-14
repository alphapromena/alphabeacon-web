/**
 * The gold navigation indicator — ONE element, which travels.
 *
 * ORDER MOTION-0914/A §3. Before this, the indicator was a `::before` on the
 * rail's active row and an `::after` on the settings sub-nav's selected tab.
 * A pseudo-element belongs to its row, so moving between rows could only ever
 * be one blinking out and another blinking in — measured at `0s`, it did not
 * even fade. Nothing about that construction can slide.
 *
 * So both navigations render a single indicator and MEASURE the active row
 * against the container. That is the only shape that can move, and it is the
 * reason this is a component rather than more CSS.
 *
 * Both call sites are navigation chrome, which is why this lives in `ab/` and
 * is fixed once: the rail and the settings tabs are the only two places in the
 * product where a gold rule marks "you are here".
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

interface Geometry {
  /** Distance along the axis, from the container's own edge. */
  offset: number
  /** Length along the axis. */
  length: number
}

export function NavIndicator({
  containerRef,
  activeSelector,
  orientation,
  /** Re-measure whenever this changes — the route, normally. */
  activeKey,
}: {
  containerRef: React.RefObject<HTMLElement | null>
  /** How to find the current row inside the container. */
  activeSelector: string
  orientation: 'vertical' | 'horizontal'
  activeKey: string
}) {
  const [geometry, setGeometry] = useState<Geometry | null>(null)
  /** First placement is silent; every move after it animates (globals.css). */
  const placed = useRef(false)

  const measure = useCallback(() => {
    const container = containerRef.current
    const active = container?.querySelector<HTMLElement>(activeSelector)
    if (!container || !active) {
      setGeometry(null)
      return
    }
    // Rect deltas rather than offsetTop: the measured row and the container
    // need not share an offsetParent, and on the rail they do not.
    const box = active.getBoundingClientRect()
    const frame = container.getBoundingClientRect()
    setGeometry(
      orientation === 'vertical'
        ? { offset: box.top - frame.top, length: box.height }
        : { offset: box.left - frame.left, length: box.width },
    )
  }, [containerRef, activeSelector, orientation])

  // Before paint, so the indicator is never seen at the previous row's place.
  useLayoutEffect(() => {
    measure()
  }, [measure, activeKey])

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    // The rail collapses, the sub-nav scrolls, the window resizes — all of
    // which move the row without changing the route.
    const observer = new ResizeObserver(() => measure())
    observer.observe(container)
    for (const child of Array.from(container.children)) observer.observe(child)
    return () => observer.disconnect()
  }, [containerRef, measure])

  useEffect(() => {
    if (geometry) placed.current = true
  }, [geometry])

  if (!geometry) return null

  // 2px on the cross axis — the width the `::before` drew, kept exactly.
  const style: React.CSSProperties =
    orientation === 'vertical'
      ? {
          insetInlineStart: 0,
          top: 0,
          width: 2,
          height: geometry.length - 8,
          transform: `translateY(${geometry.offset + 4}px)`,
        }
      : {
          left: 0,
          bottom: -1,
          height: 2,
          // inset-x-3 is what the `::after` used, so the rule sits under the
          // label rather than under the padding. Kept to the pixel.
          width: Math.max(geometry.length - 24, 0),
          transform: `translateX(${geometry.offset + 12}px)`,
        }

  return (
    <div
      aria-hidden
      data-slot="nav-indicator"
      data-placed={placed.current ? 'true' : 'false'}
      style={style}
    />
  )
}
