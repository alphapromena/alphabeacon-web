import { useEffect, useRef, useState } from 'react'

/** Matches a media query, false until mounted so SSR output stays stable. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [query])

  return matches
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/**
 * Fires once when an element scrolls into view. Used to start section
 * animations rather than running everything from page load.
 */
export function useInView<T extends HTMLElement>(
  options: IntersectionObserverInit = { threshold: 0.25 },
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setInView(true)
        io.disconnect()
      }
    }, options)
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [ref, inView]
}

/**
 * Scroll reveal that degrades safely.
 *
 * Returns "idle" until the component has mounted, so server-rendered markup
 * is fully visible with no JavaScript. Only once armed does CSS hide the
 * content and wait for it to scroll into view.
 */
export function useReveal<T extends HTMLElement>(
  options: IntersectionObserverInit = { threshold: 0.15 },
): [React.RefObject<T | null>, 'idle' | 'armed' | 'in'] {
  const ref = useRef<T>(null)
  const [state, setState] = useState<'idle' | 'armed' | 'in'>('idle')

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setState('in')
      return
    }
    setState('armed')
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setState('in')
        io.disconnect()
      }
    }, options)
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [ref, state]
}

/**
 * Tracks whether an element is on screen, continuously. The orbit uses this
 * to stop its animation frame loop when it scrolls away.
 */
export function useIsVisible<T extends HTMLElement>(): [
  React.RefObject<T | null>,
  React.RefObject<boolean>,
] {
  const ref = useRef<T>(null)
  const visible = useRef(true)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        visible.current = entries[0]?.isIntersecting ?? true
      },
      { threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return [ref, visible]
}
