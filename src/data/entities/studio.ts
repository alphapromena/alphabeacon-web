import { timestampAt } from '@/data/dates'
import type { Asset, StudioJob } from '@/data/types'

/** Studio history for the active tenant: one draft-scoped success, one
 *  standalone failure (credits released), one standalone still running. */
export function atlasJobs(): StudioJob[] {
  return [
    {
      id: 'job_001',
      modelId: 'sm_prism',
      kind: 'image',
      prompt:
        'Overhead flat-lay of a washed-process coffee station, morning light, editorial style',
      credits: 12,
      status: 'succeeded',
      origin: { type: 'draft', draftId: 'draft_004' },
      assetId: 'asset_001',
      createdAt: timestampAt(0, '08:50'),
    },
    {
      id: 'job_002',
      modelId: 'sm_motion',
      kind: 'video',
      prompt: 'Slow push-in on a roasting drum mid-roast, warm tones, 10 seconds',
      credits: 30,
      status: 'failed',
      origin: { type: 'standalone' },
      createdAt: timestampAt(-2, '15:20'),
      failureReason: 'The model could not complete this run. Your credits were released.',
    },
    {
      id: 'job_003',
      modelId: 'sm_motion',
      kind: 'video',
      prompt: 'Steam rising from a fresh pour-over, macro, 10 seconds, loopable',
      credits: 30,
      status: 'running',
      origin: { type: 'standalone' },
      createdAt: timestampAt(0, '10:05'),
    },
  ]
}

export function atlasAssets(): Asset[] {
  return [
    {
      id: 'asset_001',
      jobId: 'job_001',
      kind: 'image',
      label: 'Washed-process station flat-lay',
      createdAt: timestampAt(0, '08:51'),
    },
  ]
}
