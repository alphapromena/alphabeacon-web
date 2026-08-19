import type { Dataset, DatasetId } from '@/data/types'
import { buildActiveDataset } from './active'
import { buildFreshDataset } from './fresh'
import { buildLowCreditsDataset } from './low-credits'
import { buildNeedsReauthDataset } from './needs-reauth'
import { buildPastDueDataset } from './past-due'
import { buildQuietWeekDataset } from './quiet-week'
import { buildVisitorDataset } from './visitor'

/**
 * The dataset registry — the only way a screen reaches a different world.
 * Each entry is a factory so every switch starts from a pristine copy.
 */
export const DATASETS: { id: DatasetId; build: () => Dataset }[] = [
  { id: 'active', build: buildActiveDataset },
  { id: 'fresh', build: buildFreshDataset },
  { id: 'visitor', build: buildVisitorDataset },
  { id: 'low-credits', build: buildLowCreditsDataset },
  { id: 'needs-reauth', build: buildNeedsReauthDataset },
  { id: 'past-due', build: buildPastDueDataset },
  { id: 'quiet-week', build: buildQuietWeekDataset },
]

/**
 * The world the app boots into when nothing says otherwise.
 *
 * **A PRODUCTION BUILD MUST NEVER BOOT SIGNED-IN.** `active` is a signed-in
 * demo tenant, so with it as the production default `RootGate` renders the
 * dashboard at `/` and a first-time visitor never sees the marketing page at
 * all. That is exactly what happened: production shipped with no environment
 * variables, `VITE_DEFAULT_DATASET` was never set on Vercel, and the site
 * served the demo dashboard to everyone for ten days (decisions.md
 * 2026-08-19).
 *
 * So the default is derived from the BUILD, not from configuration. The env
 * var stays as an explicit override — useful for pinning a preview to a
 * particular world — but nothing depends on it being present any more. A
 * missing variable can no longer change what a stranger sees.
 */
export const DEFAULT_DATASET_ID: DatasetId = import.meta.env.PROD ? 'visitor' : 'active'

/**
 * The boot dataset, deploy-selectable: a deployment can pin the world it opens
 * in via `VITE_DEFAULT_DATASET` (e.g. `active` for a demo preview). Anything
 * not in the registry — a typo, an empty string, an unset var — falls back to
 * the build's own default rather than crashing the boot.
 */
export function resolveInitialDatasetId(requested: string | undefined | null): DatasetId {
  return DATASETS.some((entry) => entry.id === requested)
    ? (requested as DatasetId)
    : DEFAULT_DATASET_ID
}

export function buildDataset(id: DatasetId): Dataset {
  const entry = DATASETS.find((d) => d.id === id)
  if (!entry) throw new Error(`Unknown dataset: ${id}`)
  return entry.build()
}
