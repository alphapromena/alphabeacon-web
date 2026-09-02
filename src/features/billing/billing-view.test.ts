/**
 * The status → UI table from Ward's guide, line by line (ORDER BIL-0902),
 * plus the price words and the failure copy switched on `code`.
 */
import { describe, expect, it } from 'vitest'
import type { Subscription, SubscriptionStatus } from '@/data/billing'
import { MESSAGES } from '@/lib/messages'
import {
  billingFailureMessage,
  billingModeFor,
  formatPlanPrice,
  planNameFor,
  subscribeNoteFor,
} from './billing-view'

const at = (status: SubscriptionStatus): Subscription => ({
  plan: status === 'none' ? null : 'base',
  status,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  canceledAt: null,
  updatedAt: null,
})

describe('billingModeFor — the guide’s table', () => {
  it.each([
    ['none', 'subscribe'],
    ['canceled', 'subscribe'],
    ['incomplete', 'subscribe'],
    ['incomplete_expired', 'subscribe'],
    ['active', 'manage'],
    ['trialing', 'manage'],
    ['paused', 'manage'],
    ['past_due', 'payment_failed'],
    ['unpaid', 'payment_failed'],
  ] as const)('%s → %s', (status, mode) => {
    expect(billingModeFor(status)).toBe(mode)
  })

  it('treats a status this build has never seen as a LIVE subscription — visible, not hidden', () => {
    expect(billingModeFor('some_new_stripe_state')).toBe('manage')
  })
})

describe('subscribeNoteFor', () => {
  it('says why the plans are back for the three non-none subscribe cases', () => {
    expect(subscribeNoteFor(at('none'))).toBeNull()
    expect(subscribeNoteFor(at('canceled'))).toBe(MESSAGES.notices.subscriptionCanceled)
    expect(subscribeNoteFor(at('incomplete'))).toBe(MESSAGES.notices.subscriptionIncomplete)
    expect(subscribeNoteFor(at('incomplete_expired'))).toBe(MESSAGES.notices.subscriptionIncomplete)
  })
})

describe('formatPlanPrice', () => {
  it('renders integer cents as dollars for usd, never a float', () => {
    expect(formatPlanPrice({ amountCents: 50000, currency: 'usd', interval: 'year' })).toBe(
      '$500.00 / year',
    )
    expect(formatPlanPrice({ amountCents: 80000, currency: 'USD', interval: 'year' })).toBe(
      '$800.00 / year',
    )
    expect(formatPlanPrice({ amountCents: 1, currency: 'usd', interval: 'month' })).toBe(
      '$0.01 / month',
    )
  })
  it('spells out any other currency rather than guessing a symbol', () => {
    expect(formatPlanPrice({ amountCents: 50000, currency: 'eur', interval: 'year' })).toBe(
      '500.00 EUR / year',
    )
  })
})

describe('planNameFor', () => {
  const plans = [
    {
      plan: 'base' as const,
      name: 'Malaki Base',
      amountCents: 50000,
      currency: 'usd',
      interval: 'year',
    },
  ]
  it('is the WIRE name for a known key, the key itself otherwise, nothing for null', () => {
    expect(planNameFor(plans, 'base')).toBe('Malaki Base')
    expect(planNameFor(plans, 'pro')).toBe('pro')
    expect(planNameFor(null, 'pro')).toBe('pro')
    expect(planNameFor(plans, null)).toBe('')
  })
})

describe('billingFailureMessage — switched on code', () => {
  const failure = (code: string, extra: Record<string, unknown> = {}) => ({
    ok: false as const,
    code: code as never,
    message: 'server words',
    fieldErrors: [],
    ...extra,
  })

  it('names the owner rule on 403', () => {
    expect(billingFailureMessage(failure('forbidden'), 'checkout')).toBe(
      MESSAGES.errors.billingOwnerOnly,
    )
  })
  it('names the existing subscription on 409', () => {
    expect(billingFailureMessage(failure('conflict'), 'checkout')).toBe(
      MESSAGES.errors.checkoutConflict,
    )
  })
  it('carries the wait on 429', () => {
    expect(
      billingFailureMessage(failure('rate_limited', { retryAfterSeconds: 12 }), 'portal'),
    ).toBe(`${MESSAGES.errors.rateLimited} 12s.`)
  })
  it('is generic otherwise, with the server’s reference attached, per action', () => {
    expect(billingFailureMessage(failure('internal', { requestId: 'rid-9' }), 'checkout')).toBe(
      `${MESSAGES.errors.checkoutFailed} (rid-9)`,
    )
    expect(billingFailureMessage(failure('bad_gateway'), 'portal')).toBe(
      `${MESSAGES.errors.portalFailed} (bad_gateway)`,
    )
  })
  it('never quotes the server’s message — the envelope is switched on code', () => {
    for (const code of ['forbidden', 'conflict', 'rate_limited', 'internal']) {
      expect(billingFailureMessage(failure(code), 'checkout')).not.toContain('server words')
    }
  })
})
