import { timestampAt } from '@/data/dates'
import type { Dataset, LedgerEntry } from '@/data/types'
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

  return {
    ...world,
    id: 'low-credits',
    label: 'Low credits',
    description:
      'Atlas Roasters with 6 credits left — the low-balance warning and the insufficient-credits refusal in Studio.',
    ledger: [...world.ledger, ...spend],
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
