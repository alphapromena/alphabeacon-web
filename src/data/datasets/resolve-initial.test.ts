/**
 * The boot world, in both build modes.
 *
 * This file exists because of a real incident, not a hypothetical: production
 * shipped with no environment variables, `VITE_DEFAULT_DATASET` was never set
 * on Vercel, and every visitor to `/` got the signed-in demo dashboard for ten
 * days. The default is derived from the BUILD now, so the test has to prove
 * both sides of that — a dev build still opening in `active` is as much a
 * requirement as production opening in `visitor`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DATASETS, DEFAULT_DATASET_ID, resolveInitialDatasetId } from '@/data/datasets'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

/**
 * `DEFAULT_DATASET_ID` is evaluated at module load, so the module has to be
 * re-imported after the env is stubbed — mutating the env afterwards would
 * leave the already-computed constant untouched and the test would pass while
 * proving nothing.
 */
async function defaultUnder(prod: boolean): Promise<string> {
  vi.resetModules()
  vi.stubEnv('PROD', prod)
  const module = await import('@/data/datasets')
  return module.DEFAULT_DATASET_ID
}

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

describe('the boot world is decided by the BUILD, not by configuration', () => {
  it('a PRODUCTION build with no env boots into visitor, never signed-in', async () => {
    // The incident, encoded: an unset variable must not be able to put a
    // stranger inside someone else's workspace.
    expect(await defaultUnder(true)).toBe('visitor')
  })

  it('a dev/test build still boots into active, so the demo keeps working', async () => {
    expect(await defaultUnder(false)).toBe('active')
  })

  it('resolves undefined to the production default under a production build', async () => {
    vi.resetModules()
    vi.stubEnv('PROD', true)
    const module = await import('@/data/datasets')
    expect(module.resolveInitialDatasetId(undefined)).toBe('visitor')
    expect(module.resolveInitialDatasetId('')).toBe('visitor')
  })

  it('still lets an explicit override win in production', async () => {
    // The variable is an override now, not a dependency — it must still work.
    vi.resetModules()
    vi.stubEnv('PROD', true)
    const module = await import('@/data/datasets')
    expect(module.resolveInitialDatasetId('active')).toBe('active')
  })
})
