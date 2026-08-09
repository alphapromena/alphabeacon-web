import { useSyncExternalStore } from 'react'

/**
 * The gate the whole cinematic tier hangs on (design.md Part 5, tier 2): the
 * layer mounts only when the browser AFFIRMS no motion preference. Under
 * prefers-reduced-motion — or anywhere matchMedia cannot answer — the tier-1
 * static page renders unchanged, so the layer can never become load-bearing.
 */
const QUERY = '(prefers-reduced-motion: no-preference)'

function subscribe(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia(QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches
}

export function useCinematicLayer(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot)
}
