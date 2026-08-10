import { useSyncExternalStore } from 'react'

/**
 * Positive media-query subscription. Anywhere matchMedia cannot answer
 * (jsdom, old browsers) the answer is false — features gate on an AFFIRMED
 * match, never on the absence of one.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
  )
}

/**
 * The gate the whole cinematic tier hangs on (design.md Part 5, tier 2 v2):
 * the scroll engine mounts only when the browser AFFIRMS no motion
 * preference. Under prefers-reduced-motion the static tier-1 layout renders
 * — the engine never mounts, so it can never become load-bearing.
 */
export function useCinematicLayer(): boolean {
  return useMediaQuery('(prefers-reduced-motion: no-preference)')
}
