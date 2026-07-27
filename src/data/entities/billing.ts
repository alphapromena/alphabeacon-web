import { dayFromNow, timestampAt } from '@/data/dates'
import type { Billing, LedgerEntry } from '@/data/types'

export function atlasBilling(): Billing {
  return {
    planId: 'pro',
    status: 'active',
    renewsAt: dayFromNow(12),
    paymentMethod: { brand: 'Visa', last4: '4242' },
    history: [
      { id: 'inv_003', at: dayFromNow(-18), amount: 29, status: 'paid' },
      { id: 'inv_002', at: dayFromNow(-48), amount: 29, status: 'paid' },
      { id: 'inv_001', at: dayFromNow(-78), amount: 29, status: 'paid' },
    ],
  }
}

/**
 * Signed rows; balance = sum(amount). Monthly grant 500 (Pro), then:
 * job_001 succeeded (−12 net via reserve→release→commit), job_002 failed
 * (reserve fully released), job_003 running (outstanding hold −30).
 * Balance: 500 − 12 − 30 = 458.
 */
export function atlasLedger(): LedgerEntry[] {
  return [
    {
      id: 'led_001',
      at: timestampAt(-18, '00:00'),
      type: 'grant',
      amount: 500,
      ref: { kind: 'subscription', id: 'inv_003' },
    },
    {
      id: 'led_002',
      at: timestampAt(-2, '15:20'),
      type: 'reserved',
      amount: -30,
      ref: { kind: 'job', id: 'job_002' },
    },
    {
      id: 'led_003',
      at: timestampAt(-2, '15:24'),
      type: 'released',
      amount: 30,
      ref: { kind: 'job', id: 'job_002' },
    },
    {
      id: 'led_004',
      at: timestampAt(0, '08:50'),
      type: 'reserved',
      amount: -12,
      ref: { kind: 'job', id: 'job_001' },
    },
    {
      id: 'led_005',
      at: timestampAt(0, '08:51'),
      type: 'released',
      amount: 12,
      ref: { kind: 'job', id: 'job_001' },
    },
    {
      id: 'led_006',
      at: timestampAt(0, '08:51'),
      type: 'committed',
      amount: -12,
      ref: { kind: 'job', id: 'job_001' },
    },
    {
      id: 'led_007',
      at: timestampAt(0, '10:05'),
      type: 'reserved',
      amount: -30,
      ref: { kind: 'job', id: 'job_003' },
    },
  ]
}

export function novaBilling(): Billing {
  return {
    planId: 'free',
    status: 'active',
    history: [],
  }
}

/** New account: only the initial grant. */
export function novaLedger(): LedgerEntry[] {
  return [
    {
      id: 'led_nova_001',
      at: timestampAt(0, '00:00'),
      type: 'grant',
      amount: 100,
      ref: { kind: 'subscription', id: 'signup' },
    },
  ]
}
