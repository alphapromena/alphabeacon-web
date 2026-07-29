import { timestampAt } from '@/data/dates'
import type { Asset, Dataset, LedgerEntry, StudioJob } from '@/data/types'
import { buildActiveDataset } from './active'

/**
 * The same tenant as `active`, run down to 6 credits.
 *
 * It exists so the *refusal* paths are reachable: the low-balance treatment on
 * the dashboard, and D4's insufficient-credits state, where the cheapest model
 * still costs more than the balance. Those are the states most likely to be
 * designed once and never looked at again, because nothing in a healthy tenant
 * ever renders them.
 *
 * Built from `active` rather than hand-written, so the queue underneath stays
 * identical and the only variable is the money.
 */
export function buildLowCreditsDataset(): Dataset {
  const world = buildActiveDataset()

  // Balance is always the sum of the ledger, never a stored number — so the
  // way to have fewer credits is to have spent them.
  const spend: LedgerEntry[] = [
    {
      id: 'led_spend_batch',
      at: timestampAt(-4, '11:20'),
      type: 'committed',
      amount: -452,
      ref: { kind: 'job', id: 'job_backfill' },
    },
  ]

  /**
   * The run that spent it.
   *
   * This used to be a charge with no job behind it, which meant the single
   * biggest line on the credits ledger — 452 of the 500 granted — rendered with
   * a blank description. "Where did my credits go" is the one question this
   * screen exists to answer, so the charge has to name the work.
   */
  const backfill: StudioJob = {
    id: 'job_backfill',
    modelId: 'sm_prism',
    kind: 'image',
    prompt: 'Backfill: 38 product shots for the autumn single-origin range',
    credits: 452,
    status: 'succeeded',
    origin: { type: 'standalone' },
    assetId: 'asset_backfill',
    createdAt: timestampAt(-4, '11:02'),
  }

  const backfillAsset: Asset = {
    id: 'asset_backfill',
    jobId: 'job_backfill',
    kind: 'image',
    label: 'Autumn single-origin range — 38 shots',
    createdAt: timestampAt(-4, '11:20'),
  }

  return {
    ...world,
    id: 'low-credits',
    label: 'Low credits',
    description:
      'Atlas Roasters with 6 credits left — the low-balance warning and the insufficient-credits refusal in Studio.',
    ledger: [...world.ledger, ...spend],
    jobs: [backfill, ...world.jobs],
    assets: [backfillAsset, ...world.assets],
    notifications: [
      {
        id: 'notif_low_credits',
        type: 'low_credits',
        message: 'You have 6 credits left. Generating media will need a top-up.',
        at: timestampAt(0, '07:15'),
        read: false,
        href: '/billing',
      },
      ...world.notifications,
    ],
  }
}
