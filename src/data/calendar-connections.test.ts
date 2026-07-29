/**
 * W4's verify, at the level the rules live.
 *
 * Two of these are honesty rules rather than behaviours, and they are the ones
 * most likely to rot: a missing metric must never render as 0, and a skipped
 * slot must stop being undoable once its day is over.
 */
import { describe, expect, it } from 'vitest'
import { buildDataset, DATASETS } from '@/data/datasets'
import { dataReducer, type DataState } from '@/data/provider'
import { canUndoSkip } from '@/features/calendar/skip-window'
import type { Dataset, DatasetId, Slot } from '@/data/types'

function world(id: DatasetId): DataState {
  return { datasetId: id, world: buildDataset(id), devForce: 'none' }
}

describe('every connection status is reachable from the datasets', () => {
  it('covers active, needs_reauth, revoked and not_connected across the worlds', () => {
    const seen = new Set(
      DATASETS.flatMap((dataset) => dataset.build().connections.map((c) => c.status)),
    )
    for (const status of ['active', 'needs_reauth', 'revoked', 'not_connected'] as const) {
      expect(seen, `no dataset renders ${status}`).toContain(status)
    }
  })

  it('reconnecting restores a revoked connection without inventing permissions', () => {
    const state = world('needs-reauth')
    const before = state.world.connections.find((c) => c.platform === 'facebook')
    expect(before?.status).toBe('revoked')
    expect(before?.permissions.posting).toBe(false)

    const next = dataReducer(state, { type: 'connection/reconnect', platform: 'facebook' })
    const after = next.world.connections.find((c) => c.platform === 'facebook')
    expect(after?.status).toBe('active')
    // Reconnecting is not a grant: the user still chooses what it may do.
    expect(after?.permissions.posting).toBe(false)
  })

  it('permissions toggle independently — analytics without posting is a real choice', () => {
    const state = world('active')
    const off = dataReducer(state, {
      type: 'connection/setPermission',
      platform: 'instagram',
      key: 'posting',
      value: false,
    })
    const instagram = off.world.connections.find((c) => c.platform === 'instagram')
    expect(instagram?.permissions.posting).toBe(false)
    expect(instagram?.permissions.analytics).toBe(true)
  })

  it('the Facebook page picker publishes only to the pages chosen', () => {
    const state = world('active')
    const next = dataReducer(state, {
      type: 'connection/setPages',
      platform: 'facebook',
      pageIds: ['page_events'],
    })
    const pages = next.world.connections.find((c) => c.platform === 'facebook')?.pages ?? []
    expect(pages.find((p) => p.id === 'page_events')?.selected).toBe(true)
    expect(pages.find((p) => p.id === 'page_main')?.selected).toBe(false)
  })
})

describe('skip has a window, and the window closes', () => {
  const skippedAt = (iso: string): Slot => ({
    id: 'slot_x',
    date: '2026-07-20',
    time: '09:00',
    status: 'skipped',
    draftIds: [],
    skippedAt: iso,
  })

  it('offers undo on the day it was skipped', () => {
    const now = new Date('2026-07-20T18:00:00Z')
    expect(canUndoSkip(skippedAt('2026-07-20T08:05:00Z'), now)).toBe(true)
  })

  it('withdraws undo once the day is over', () => {
    const now = new Date('2026-07-21T00:30:00Z')
    expect(canUndoSkip(skippedAt('2026-07-20T08:05:00Z'), now)).toBe(false)
  })

  it('never offers undo for a slot that was not skipped', () => {
    const pending: Slot = {
      id: 's',
      date: '2026-07-20',
      time: '09:00',
      status: 'pending',
      draftIds: [],
    }
    expect(canUndoSkip(pending, new Date('2026-07-20T10:00:00Z'))).toBe(false)
  })

  it('skipping then undoing returns the slot to pending, with no residue', () => {
    const state = world('active')
    const slotId = state.world.slots[0].id
    const skipped = dataReducer(state, { type: 'slot/skip', slotId })
    expect(skipped.world.slots.find((s) => s.id === slotId)?.status).toBe('skipped')
    expect(skipped.world.slots.find((s) => s.id === slotId)?.skippedAt).toBeTruthy()

    const restored = dataReducer(skipped, { type: 'slot/unskip', slotId })
    expect(restored.world.slots.find((s) => s.id === slotId)?.status).toBe('pending')
    expect(restored.world.slots.find((s) => s.id === slotId)?.skippedAt).toBeUndefined()
  })
})

describe('"Syncing…" never shows a stale zero', () => {
  it('models an unreported metric as absent, not as 0', () => {
    const pending = buildDataset('needs-reauth')
    const instagram = pending.analytics.find((series) => series.connectionId === 'conn_ig')
    expect(instagram?.synced).toBe(false)
    for (const post of instagram?.posts ?? []) {
      // The distinction the whole rule rests on: undefined, never 0.
      expect(post.metrics).toBeUndefined()
    }
  })

  it('a synced series carries real numbers, so the two states are distinguishable', () => {
    const healthy = buildDataset('active')
    const instagram = healthy.analytics.find((series) => series.connectionId === 'conn_ig')
    expect(instagram?.synced).toBe(true)
    for (const post of instagram?.posts ?? []) {
      expect(post.metrics?.reach).toBeGreaterThan(0)
    }
  })
})

describe('event sources survive a lost token', () => {
  it('keeps the selected calendars when a Google source needs re-auth', () => {
    const state = world('needs-reauth')
    const google = state.world.eventSources.find((s) => s.kind === 'google')
    expect(google?.status).toBe('needs_reauth')
    // Losing a token must not lose a configuration.
    expect(google?.calendars?.some((c) => c.enabled)).toBe(true)

    const retried = dataReducer(state, { type: 'eventSources/retry', sourceId: google!.id })
    expect(retried.world.eventSources.find((s) => s.id === google!.id)?.status).toBe('active')
  })

  it('toggling one calendar leaves its siblings alone', () => {
    const state = world('active')
    const google = state.world.eventSources.find((s) => s.kind === 'google')!
    const target = google.calendars![0]
    const next = dataReducer(state, {
      type: 'eventSources/toggleCalendar',
      sourceId: google.id,
      calendarId: target.id,
      enabled: false,
    })
    const after = next.world.eventSources.find((s) => s.id === google.id)!
    expect(after.calendars!.find((c) => c.id === target.id)?.enabled).toBe(false)
    expect(after.calendars!.filter((c) => c.enabled).length).toBe(
      google.calendars!.filter((c) => c.enabled).length - 1,
    )
  })
})

describe('every W4 state is reachable from some dataset', () => {
  const worlds = DATASETS.map((dataset) => dataset.build())

  /**
   * A screen can only be reviewed in a state some dataset actually reaches.
   * This is the check that would have caught "no slot in any world can be
   * skipped" — which is exactly how W4's skip test failed the first time.
   */
  it.each([
    ['connection: active', (w: Dataset) => w.connections.some((c) => c.status === 'active')],
    [
      'connection: needs_reauth',
      (w: Dataset) => w.connections.some((c) => c.status === 'needs_reauth'),
    ],
    ['connection: revoked', (w: Dataset) => w.connections.some((c) => c.status === 'revoked')],
    [
      'connection: not_connected',
      (w: Dataset) => w.connections.some((c) => c.status === 'not_connected'),
    ],
    [
      'a skippable slot (pending, nothing drafted)',
      (w: Dataset) => w.slots.some((s) => s.status === 'pending' && s.draftIds.length === 0),
    ],
    [
      'an already-skipped slot inside its undo window',
      (w: Dataset) => w.slots.some((s) => s.status === 'skipped' && Boolean(s.skippedAt)),
    ],
    [
      'a published post still awaiting analytics',
      (w: Dataset) => w.analytics.some((a) => a.posts.some((p) => !p.metrics)),
    ],
    [
      'an event source needing re-auth',
      (w: Dataset) => w.eventSources.some((s) => s.status === 'needs_reauth'),
    ],
    ['a day carrying an event', (w: Dataset) => w.events.length > 0],
  ])('%s', (_label, reached) => {
    expect(worlds.some((world) => reached(world))).toBe(true)
  })
})
