import { dayFromNow, timestampAt } from '@/data/dates'
import type { Dataset } from '@/data/types'
import { buildActiveDataset } from './active'

/**
 * The tenant whose connections have gone wrong in three different ways at once,
 * so B1 shows every status it can render side by side: active, needs re-auth,
 * revoked, and not connected.
 *
 * It also carries the two calendar states that only appear when something is
 * broken — a source that failed to sync (C2's retry) and a published post whose
 * analytics have not arrived (C3/C4's "Syncing…", which must never be drawn as
 * a zero).
 */
export function buildNeedsReauthDataset(): Dataset {
  const world = buildActiveDataset()

  return {
    ...world,
    id: 'needs-reauth',
    label: 'Connections need attention',
    description:
      'Atlas Roasters with a revoked Facebook, a LinkedIn needing re-auth, a calendar that failed to sync, and a post still waiting on its analytics.',

    connections: world.connections.map((connection) => {
      if (connection.platform === 'facebook') {
        // Revoked at the platform end: the account is still named, but nothing
        // it was allowed to do survives.
        return {
          ...connection,
          status: 'revoked' as const,
          permissions: { analytics: false, posting: false },
          lastSyncAt: timestampAt(-6, '04:00'),
        }
      }
      return connection
    }),

    eventSources: world.eventSources.map((source) =>
      source.kind === 'google' ? { ...source, status: 'needs_reauth' as const } : source,
    ),

    // The published post is still here; only its numbers are missing — and
    // missing on EVERY channel, because a post that has reported somewhere is
    // not the state being modelled. Half-reported would show a total, which is
    // exactly the stale-looking number the "Syncing…" rule exists to prevent.
    analytics: world.analytics.map((series) => ({
      ...series,
      synced: false,
      posts: series.posts.map((post) => ({ ...post, metrics: undefined })),
    })),

    notifications: [
      {
        id: 'notif_revoked',
        type: 'reauth_needed',
        message: 'Facebook access was revoked. Reconnect it to keep publishing there.',
        at: timestampAt(0, '05:40'),
        read: false,
        href: '/connections',
      },
      ...world.notifications,
    ],

    // A slot the user skipped today, so C4's undo window is reachable.
    slots: world.slots.map((slot) =>
      slot.id === 'slot_today_17'
        ? { ...slot, status: 'skipped' as const, skippedAt: timestampAt(0, '08:05') }
        : slot,
    ),

    events: [
      ...world.events,
      { id: 'ev_sync_gap', sourceId: 'src_jo_holidays', name: 'Founding Day', date: dayFromNow(3) },
    ],
  }
}
