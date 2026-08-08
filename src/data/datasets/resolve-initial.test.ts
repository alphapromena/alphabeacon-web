import { describe, expect, it } from 'vitest'
import { DATASETS, DEFAULT_DATASET_ID, resolveInitialDatasetId } from '@/data/datasets'

describe('resolveInitialDatasetId', () => {
  it('accepts every id the registry knows', () => {
    for (const { id } of DATASETS) {
      expect(resolveInitialDatasetId(id)).toBe(id)
    }
  })

  it('falls back to the default for anything else', () => {
    expect(resolveInitialDatasetId('not-a-world')).toBe(DEFAULT_DATASET_ID)
    expect(resolveInitialDatasetId('')).toBe(DEFAULT_DATASET_ID)
    expect(resolveInitialDatasetId(undefined)).toBe(DEFAULT_DATASET_ID)
    expect(resolveInitialDatasetId(null)).toBe(DEFAULT_DATASET_ID)
  })
})
