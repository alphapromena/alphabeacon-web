/**
 * W3's verify, at the level the rules actually live: the reducer.
 *
 * The queue's guarantees are not per-screen behaviours — they are properties of
 * the state machine and the ledger. Testing them here means D2, D3 and D4 all
 * inherit them, and a fourth screen added later cannot quietly opt out.
 */
import { describe, expect, it } from 'vitest'
import { buildDataset } from '@/data/datasets'
import { dataReducer, type DataState } from '@/data/provider'
import type { Draft } from '@/data/types'
import { DRAFT_STATUSES, canTransition, type DraftStatus } from '@/lib/draft-status'

function active(): DataState {
  return { datasetId: 'active', world: buildDataset('active'), devForce: 'none' }
}

const find = (state: DataState, id: string) => state.world.drafts.find((d) => d.id === id) as Draft

const balanceOf = (state: DataState) =>
  state.world.ledger.reduce((sum, entry) => sum + entry.amount, 0)

/** A draft in each status, so every legal edge can be exercised from a real world. */
function draftIn(status: DraftStatus): { state: DataState; id: string } {
  const state = active()
  const draft = state.world.drafts.find((d) => d.status === status)
  if (!draft) throw new Error(`the active dataset has no draft in ${status}`)
  return { state, id: draft.id }
}

describe('the state machine drives the queue', () => {
  it('every status the active dataset ships is reachable and known', () => {
    const statuses = new Set(active().world.drafts.map((d) => d.status))
    for (const status of statuses) expect(DRAFT_STATUSES).toContain(status)
    // The queue is only a useful fixture if it spans the machine.
    expect(statuses.size).toBeGreaterThanOrEqual(5)
  })

  it('applies every legal transition and refuses every illegal one', () => {
    for (const from of DRAFT_STATUSES) {
      const draft = active().world.drafts.find((d) => d.status === from)
      if (!draft) continue
      for (const to of DRAFT_STATUSES) {
        const state = active()
        const next = dataReducer(state, { type: 'draft/transition', draftId: draft.id, to })
        if (canTransition(from, to)) {
          expect(find(next, draft.id).status, `${from} -> ${to} should apply`).toBe(to)
        } else {
          expect(next, `${from} -> ${to} must be refused`).toBe(state)
        }
      }
    }
  })

  it('records every move on the timeline, so the history cannot disagree with the badge', () => {
    const { state, id } = draftIn('pending_review')
    const approved = dataReducer(state, { type: 'draft/approve', draftId: id })
    const draft = find(approved, id)
    expect(draft.timeline.at(-1)?.status).toBe('approved')
    expect(draft.status).toBe(draft.timeline.at(-1)?.status)
  })
})

describe('the approval gate', () => {
  it('offers no media path before approval — the button cannot exist', () => {
    expect(canTransition('pending_review', 'media_pending')).toBe(false)
    const { state, id } = draftIn('pending_review')
    const forced = dataReducer(state, {
      type: 'media/start',
      draftId: id,
      jobId: 'job_x',
      modelId: 'sm_spark',
      prompt: 'anything',
    })
    // Refused outright, and — critically — no credits were reserved for it.
    expect(forced).toBe(state)
    expect(balanceOf(forced)).toBe(balanceOf(state))
  })

  it('opens the media path exactly at approval', () => {
    const { state, id } = draftIn('pending_review')
    const approved = dataReducer(state, { type: 'draft/approve', draftId: id })
    expect(canTransition(find(approved, id).status, 'media_pending')).toBe(true)
  })
})

describe('credits are held, not spent, until a job lands', () => {
  it('a successful generation commits the cost once', () => {
    const { state, id } = draftIn('approved')
    const before = balanceOf(state)
    const started = dataReducer(state, {
      type: 'media/start',
      draftId: id,
      jobId: 'job_ok',
      modelId: 'sm_spark',
      prompt: 'a flat-lay',
    })
    // Held while running: the balance already reflects the reservation.
    expect(balanceOf(started)).toBe(before - 8)
    expect(find(started, id).status).toBe('media_pending')

    const done = dataReducer(started, {
      type: 'media/succeed',
      jobId: 'job_ok',
      assetId: 'asset_ok',
    })
    expect(balanceOf(done)).toBe(before - 8)
    expect(find(done, id).status).toBe('media_ready')
    expect(find(done, id).assetId).toBe('asset_ok')
    expect(done.world.assets.some((a) => a.id === 'asset_ok')).toBe(true)
  })

  it('a failed generation costs nothing and returns the draft to approved', () => {
    const { state, id } = draftIn('approved')
    const before = balanceOf(state)
    const started = dataReducer(state, {
      type: 'media/start',
      draftId: id,
      jobId: 'job_bad',
      modelId: 'sm_motion',
      prompt: '',
    })
    expect(balanceOf(started)).toBe(before - 30)

    const failed = dataReducer(started, {
      type: 'media/fail',
      jobId: 'job_bad',
      reason: 'The model could not complete this run. Your credits were released.',
    })
    expect(balanceOf(failed)).toBe(before)
    // Back where it started, with the media entry point still available.
    expect(find(failed, id).status).toBe('approved')
    expect(canTransition(find(failed, id).status, 'media_pending')).toBe(true)
  })
})

describe('publishing reports per channel', () => {
  it('publishes the healthy channels and fails only the one that cannot', () => {
    const { state, id } = draftIn('approved')
    const scheduled = dataReducer(state, {
      type: 'draft/schedule',
      draftId: id,
      scheduledFor: new Date().toISOString(),
      // linkedin is `needs_reauth` in this world; the other two are active.
      platforms: ['facebook', 'instagram', 'linkedin'],
    })
    const published = dataReducer(scheduled, { type: 'draft/publish', draftId: id })
    const results = find(published, id).publishResults ?? []

    expect(results.find((r) => r.platform === 'facebook')?.ok).toBe(true)
    expect(results.find((r) => r.platform === 'instagram')?.ok).toBe(true)
    expect(results.find((r) => r.platform === 'linkedin')?.ok).toBe(false)
    // A partial failure is a failure of the post, but the record keeps both.
    expect(find(published, id).status).toBe('publish_failed')
    expect(canTransition('publish_failed', 'scheduled')).toBe(true)
  })

  it('publishes cleanly when every channel is healthy', () => {
    const { state, id } = draftIn('approved')
    const scheduled = dataReducer(state, {
      type: 'draft/schedule',
      draftId: id,
      scheduledFor: new Date().toISOString(),
      platforms: ['facebook', 'instagram'],
    })
    const published = dataReducer(scheduled, { type: 'draft/publish', draftId: id })
    expect(find(published, id).status).toBe('published')
    expect(find(published, id).publishResults?.every((r) => r.ok)).toBe(true)
  })
})

describe('the dashboard cannot disagree with the queue', () => {
  it('counts the same drafts D1 and D2 each derive from the dataset', () => {
    const state = active()
    const awaiting = state.world.drafts.filter((d) => d.status === 'pending_review').length
    const scheduled = state.world.drafts.filter((d) => d.status === 'scheduled').length

    // Both screens compute from `world.drafts`; this pins the arithmetic they
    // share, so approving in one can never leave the other stale.
    const approved = dataReducer(state, {
      type: 'draft/approve',
      draftId: state.world.drafts.find((d) => d.status === 'pending_review')!.id,
    })
    expect(approved.world.drafts.filter((d) => d.status === 'pending_review')).toHaveLength(
      awaiting - 1,
    )
    expect(approved.world.drafts.filter((d) => d.status === 'scheduled')).toHaveLength(scheduled)
  })

  it('low-credits is a real world, not a flag: the balance comes from the ledger', () => {
    const low = buildDataset('low-credits')
    const balance = low.ledger.reduce((sum, entry) => sum + entry.amount, 0)
    expect(balance).toBeLessThan(50)
    expect(balance).toBeGreaterThanOrEqual(0)
    // Cheapest image model still costs more than the balance, so D4's refusal
    // is reachable rather than theoretical.
    const cheapest = Math.min(...low.studioModels.map((m) => m.credits))
    expect(cheapest).toBeGreaterThan(balance)
  })
})
