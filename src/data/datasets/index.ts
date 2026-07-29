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

export const DEFAULT_DATASET_ID: DatasetId = 'active'

export function buildDataset(id: DatasetId): Dataset {
  const entry = DATASETS.find((d) => d.id === id)
  if (!entry) throw new Error(`Unknown dataset: ${id}`)
  return entry.build()
}
