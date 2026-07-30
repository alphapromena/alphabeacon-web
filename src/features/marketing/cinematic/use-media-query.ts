/**
 * Live media-query hooks for the cinematic layer.
 *
 * `usePrefersReducedMotion` mirrors `useCountUp`'s stance (design.md Part 5):
 * an environment that cannot answer the question — jsdom, a non-browser
 * render — is treated as "motion allowed", so the guard never silently
 * disables signature motion where it could never run anyway. Unlike the
 * count-up's one-shot check this one subscribes, because the marketing page
 * is long-lived and Playwright flips the preference mid-session to assert
 * the fallback.
 */
import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)
    onChange()
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/** The scrub needs real scroll travel; small screens get the loop instead. */
export function useIsNarrowViewport(): boolean {
  return useMediaQuery('(max-width: 767px)')
}
