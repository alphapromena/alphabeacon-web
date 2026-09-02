/**
 * Billing — the status → UI mapping and the price words, as pure functions
 * (ORDER BIL-0902). Kept out of the screen so the table Ward's guide states
 * can be unit-tested line by line, and so a status this build has never seen
 * fails VISIBLY: the raw wire word is always rendered beside whatever mode
 * the mapping chose.
 */
import type { BillingFailure, BillingPlan, Subscription, SubscriptionStatus } from '@/data/billing'
import { errorReference } from '@/lib/error-reference'
import { MESSAGES } from '@/lib/messages'
import { formatCents } from '@/lib/money'

/**
 * What the billing page offers, per the guide's table:
 * - `subscribe` — plans with Subscribe (`none`, `canceled`, `incomplete`,
 *   `incomplete_expired`);
 * - `manage` — Manage billing (`active`, `trialing`, `paused`);
 * - `payment_failed` — the banner, then Manage billing (`past_due`, `unpaid`).
 */
export type BillingMode = 'subscribe' | 'manage' | 'payment_failed'

const MODE_BY_STATUS: Record<SubscriptionStatus, BillingMode> = {
  none: 'subscribe',
  canceled: 'subscribe',
  incomplete: 'subscribe',
  incomplete_expired: 'subscribe',
  active: 'manage',
  trialing: 'manage',
  paused: 'manage',
  past_due: 'payment_failed',
  unpaid: 'payment_failed',
}

/**
 * A status outside the table is a Stripe state this build does not know. It
 * is treated as a LIVE subscription (the portal is the tool for anything
 * live) and the word itself is shown, so the gap is seen rather than hidden.
 */
export function billingModeFor(status: SubscriptionStatus | string): BillingMode {
  return MODE_BY_STATUS[status as SubscriptionStatus] ?? 'manage'
}

/** `subscribe` still has a story to tell for the three non-`none` cases. */
export function subscribeNoteFor(subscription: Subscription): string | null {
  switch (subscription.status) {
    case 'canceled':
      return MESSAGES.notices.subscriptionCanceled
    case 'incomplete':
    case 'incomplete_expired':
      return MESSAGES.notices.subscriptionIncomplete
    default:
      return null
  }
}

/**
 * "$500.00 / year". USD is the observed currency and reads as dollars; any
 * other currency is spelled out rather than given a symbol this code would
 * have to guess. Never a float: cents are integers all the way down.
 */
export function formatPlanPrice(plan: Pick<BillingPlan, 'amountCents' | 'currency' | 'interval'>) {
  const amount =
    plan.currency.toLowerCase() === 'usd'
      ? formatCents(plan.amountCents)
      : `${formatCents(plan.amountCents).slice(1)} ${plan.currency.toUpperCase()}`
  return `${amount} / ${plan.interval}`
}

/** The plan's wire name, or its key when the plans list has not answered. */
export function planNameFor(plans: BillingPlan[] | null, planId: string | null): string {
  if (!planId) return ''
  return plans?.find((plan) => plan.plan === planId)?.name ?? planId
}

/**
 * The checkout/portal failure → copy, switched on the envelope's `code`:
 * `conflict` is not an error at all (the page flips to Manage billing — the
 * caller handles it before asking here); `forbidden` names the owner rule;
 * `rate_limited` carries its wait; everything else is generic with the
 * server's reference attached so the report is actionable.
 */
export function billingFailureMessage(
  failure: BillingFailure,
  action: 'checkout' | 'portal',
): string {
  switch (failure.code) {
    case 'forbidden':
      return MESSAGES.errors.billingOwnerOnly
    case 'conflict':
      return MESSAGES.errors.checkoutConflict
    case 'rate_limited':
      return `${MESSAGES.errors.rateLimited} ${failure.retryAfterSeconds ?? 60}s.`
    default: {
      const base =
        action === 'checkout' ? MESSAGES.errors.checkoutFailed : MESSAGES.errors.portalFailed
      const reference = errorReference(failure)
      return reference ? `${base} (${reference})` : base
    }
  }
}
