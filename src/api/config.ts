/**
 * The mode switch (decisions.md 2026-07-30 — the static law, amended).
 *
 * `VITE_API_BASE_URL` present → LIVE mode: the entities the AlphaStudio API
 * covers resolve against it through `src/api/`. Absent → the app is exactly
 * what it always was: fully static, datasets, `/dev/datasets`, zero requests.
 * Static mode is not a degraded mode — it is the demo and the test bed, and
 * it must keep working forever.
 *
 * The value comes from `.env.local` (never hardcoded, never committed — repo
 * rule 11 and the guard's http-literal ban both enforce that). Only this file
 * reads it, so "which mode am I in" has exactly one source.
 */
export function apiBaseUrl(): string | null {
  const value = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (!value) return null
  // One canonical form: no trailing slash, so path joins are mechanical.
  return value.replace(/\/+$/, '')
}

/** Live for the covered entities; screens themselves never ask. */
export function isLiveMode(): boolean {
  return apiBaseUrl() !== null
}
