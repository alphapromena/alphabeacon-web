/**
 * Notification adapter (INT-5): the per-user inbox → the bell's model.
 *
 * Two defensive rules straight from the contract:
 * - `kind` is free-form and owned by the producing feature — the five kinds
 *   this UI knows get their icons; anything else renders as `generic`,
 *   never a crash.
 * - `action` is optional and the subject may have been deleted since; only a
 *   value that looks like an in-app route becomes a link target, and a dead
 *   route lands on the designed 404, which is exactly what N2 is for.
 */
import type { ApiNotification } from '@/api/types'
import type { AppNotification, NotificationType } from '@/data/types'

const KNOWN_KINDS: Record<string, NotificationType> = {
  'connection.reauth_needed': 'reauth_needed',
  'billing.low_credits': 'low_credits',
  'generation.failed': 'generation_failed',
  // BIL-0902: the two kinds the billing backend raises, both with
  // `action: "/billing"` (Ward's guide) — the adapter's rooted-path rule
  // below turns that into the link.
  'billing.payment_failed': 'payment_failed',
  'billing.wallet_credited': 'wallet_credited',
  'content.drafts_ready': 'drafts_ready',
  // The bare forms, in case the producing features use them unqualified.
  reauth_needed: 'reauth_needed',
  low_credits: 'low_credits',
  generation_failed: 'generation_failed',
  payment_failed: 'payment_failed',
  wallet_credited: 'wallet_credited',
  drafts_ready: 'drafts_ready',
}

export function adaptNotification(wire: ApiNotification): AppNotification {
  const action = wire.action
  return {
    id: wire.id,
    type: KNOWN_KINDS[wire.kind] ?? 'generic',
    message:
      wire.title && wire.message ? `${wire.title} — ${wire.message}` : wire.message || wire.title,
    at: wire.createdAt,
    read: wire.seenAt !== null,
    // Only a rooted path is a route; a label or null goes home instead.
    href: action && action.startsWith('/') ? action : '/',
  }
}

export function adaptNotifications(items: ApiNotification[]): AppNotification[] {
  return items.map(adaptNotification)
}
