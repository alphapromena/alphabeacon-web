/**
 * The inbox adapter (INT-5), and the two billing kinds BIL-0902 taught it:
 * `billing.wallet_credited` and `billing.payment_failed`, both with
 * `action: "/billing"` per Ward's guide — a rooted path, so they link.
 */
import { describe, expect, it } from 'vitest'
import type { ApiNotification } from '@/api/types'
import { adaptNotification } from './notification-adapter'

const wire = (over: Partial<ApiNotification>): ApiNotification => ({
  id: 'n1',
  orgId: '1670',
  userId: 'u1',
  kind: 'x',
  title: '',
  message: '',
  action: null,
  relatedType: null,
  relatedId: null,
  seenAt: null,
  createdAt: '2026-09-02T10:00:00.000Z',
  updatedAt: '2026-09-02T10:00:00.000Z',
  ...over,
})

describe('adaptNotification — the billing kinds', () => {
  it('billing.wallet_credited links to /billing and reads as a wallet credit', () => {
    const item = adaptNotification(
      wire({
        kind: 'billing.wallet_credited',
        title: 'Wallet credited',
        message: '$599.00 was added to your wallet from your Malaky Business plan payment.',
        action: '/billing',
      }),
    )
    expect(item.type).toBe('wallet_credited')
    expect(item.href).toBe('/billing')
    expect(item.message).toBe(
      'Wallet credited — $599.00 was added to your wallet from your Malaky Business plan payment.',
    )
    expect(item.read).toBe(false)
  })

  it('billing.payment_failed links to /billing', () => {
    const item = adaptNotification(
      wire({ kind: 'billing.payment_failed', message: 'Charge failed', action: '/billing' }),
    )
    expect(item.type).toBe('payment_failed')
    expect(item.href).toBe('/billing')
  })

  it('a kind this build does not know renders generically, and a label is not a route', () => {
    const item = adaptNotification(
      wire({ kind: 'billing.something_new', message: 'x', action: 'Open' }),
    )
    expect(item.type).toBe('generic')
    expect(item.href).toBe('/')
  })
})
