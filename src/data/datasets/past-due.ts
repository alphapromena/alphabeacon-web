import { dayFromNow, timestampAt } from '@/data/dates'
import type { Dataset } from '@/data/types'
import { buildActiveDataset } from './active'

/**
 * The tenant whose payment failed.
 *
 * `past_due` is the one status that gates the product rather than a screen:
 * the banner is global, and the actions that would spend money or publish are
 * refused until it clears. It is built from `active` so the only variable is
 * the billing state — if something else breaks in this world, billing is why.
 */
export function buildPastDueDataset(): Dataset {
  const world = buildActiveDataset()

  return {
    ...world,
    id: 'past-due',
    label: 'Payment past due',
    description:
      'Atlas Roasters after a failed charge — the global banner, and the actions that stop until it is fixed.',
    billing: {
      ...world.billing,
      status: 'past_due',
      renewsAt: dayFromNow(-3),
      history: [
        { id: 'inv_004', at: dayFromNow(-3), amount: 29, status: 'failed' },
        ...world.billing.history,
      ],
    },
    notifications: [
      {
        id: 'notif_payment_failed',
        type: 'payment_failed',
        message: 'Your payment failed. Update your payment method to keep posting.',
        at: timestampAt(-3, '02:10'),
        read: false,
        href: '/billing/subscription',
      },
      ...world.notifications,
    ],
  }
}
