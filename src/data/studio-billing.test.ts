/**
 * W5's verify at the level the rules live.
 *
 * The ledger one matters most: "ledger entries sum to the displayed balance
 * (computed, never a stored literal)". A stored balance is the classic way
 * money UIs go quietly wrong, so the property is asserted directly and after
 * every kind of mutation that touches credits.
 */
import { describe, expect, it } from 'vitest'
import { buildDataset, DATASETS } from '@/data/datasets'
import { dataReducer, type DataState } from '@/data/provider'
import type { DatasetId } from '@/data/types'

function world(id: DatasetId): DataState {
  return { datasetId: id, world: buildDataset(id), devForce: 'none' }
}

const balanceOf = (state: DataState) =>
  state.world.ledger.reduce((sum, entry) => sum + entry.amount, 0)

describe('the balance is the ledger, always', () => {
  it('is never stored anywhere it could drift from', () => {
    for (const dataset of DATASETS) {
      const built = dataset.build()
      // If a `balance` field ever appears on billing, this is the reminder
      // that two sources of truth is one too many.
      expect(built.billing).not.toHaveProperty('balance')
      expect(built).not.toHaveProperty('credits')
    }
  })

  it('survives a full generate cycle: reserve, release, commit', () => {
    const state = world('active')
    const start = balanceOf(state)
    const draftId = state.world.drafts.find((d) => d.status === 'approved')!.id

    const running = dataReducer(state, {
      type: 'media/start',
      draftId,
      jobId: 'job_led',
      modelId: 'sm_spark',
      prompt: 'a cup',
    })
    expect(balanceOf(running)).toBe(start - 8)

    const done = dataReducer(running, {
      type: 'media/succeed',
      jobId: 'job_led',
      assetId: 'asset_led',
    })
    // Reserved -8, released +8, committed -8 nets to a single -8.
    expect(balanceOf(done)).toBe(start - 8)
    expect(done.world.ledger.filter((e) => e.ref?.id === 'job_led')).toHaveLength(3)
  })

  it('returns every credit when a run fails', () => {
    const state = world('active')
    const start = balanceOf(state)
    const draftId = state.world.drafts.find((d) => d.status === 'approved')!.id

    const running = dataReducer(state, {
      type: 'media/start',
      draftId,
      jobId: 'job_bad',
      modelId: 'sm_cinema',
      prompt: '',
    })
    const failed = dataReducer(running, {
      type: 'media/fail',
      jobId: 'job_bad',
      reason: 'nope',
    })
    expect(balanceOf(failed)).toBe(start)
  })

  it('grants a plan change through the ledger rather than by assignment', () => {
    const state = world('active')
    const start = balanceOf(state)
    const next = dataReducer(state, { type: 'billing/changePlan', planId: 'studio' })
    expect(next.world.billing.planId).toBe('studio')
    expect(balanceOf(next)).toBe(start + 1500)
    expect(next.world.ledger.at(-1)).toMatchObject({ type: 'grant', amount: 1500 })
  })
})

describe('standalone Studio runs', () => {
  it('creates a job with no draft, and still holds credits', () => {
    const state = world('active')
    const start = balanceOf(state)
    const running = dataReducer(state, {
      type: 'media/start',
      draftId: '',
      jobId: 'job_solo',
      modelId: 'sm_prism',
      prompt: 'a poster',
      params: { aspect_ratio: '4:5' },
    })
    const job = running.world.jobs.find((j) => j.id === 'job_solo')
    expect(job?.origin).toEqual({ type: 'standalone' })
    expect(job?.params).toEqual({ aspect_ratio: '4:5' })
    expect(balanceOf(running)).toBe(start - 12)

    const done = dataReducer(running, {
      type: 'media/succeed',
      jobId: 'job_solo',
      assetId: 'asset_solo',
    })
    expect(done.world.assets.some((a) => a.id === 'asset_solo')).toBe(true)
    // No draft was harmed in the making of this asset.
    expect(done.world.drafts.every((d) => d.assetId !== 'asset_solo')).toBe(true)
  })

  it('attaches a standalone asset only to a draft that has earned media', () => {
    const state = world('active')
    const approved = state.world.drafts.find((d) => d.status === 'approved')!
    const pending = state.world.drafts.find((d) => d.status === 'pending_review')!

    const attached = dataReducer(state, {
      type: 'asset/attach',
      assetId: 'asset_001',
      draftId: approved.id,
    })
    expect(attached.world.drafts.find((d) => d.id === approved.id)?.assetId).toBe('asset_001')
    expect(attached.world.drafts.find((d) => d.id === approved.id)?.status).toBe('media_ready')

    // The picker filters these out; the reducer refuses them too.
    const refused = dataReducer(state, {
      type: 'asset/attach',
      assetId: 'asset_001',
      draftId: pending.id,
    })
    expect(refused.world.drafts.find((d) => d.id === pending.id)?.status).toBe('pending_review')
  })

  it('deleting an asset leaves no draft pointing at a ghost', () => {
    const state = world('active')
    const holder = state.world.drafts.find((d) => d.assetId === 'asset_001')
    expect(holder).toBeDefined()

    const deleted = dataReducer(state, { type: 'asset/delete', assetId: 'asset_001' })
    expect(deleted.world.assets.some((a) => a.id === 'asset_001')).toBe(false)
    expect(deleted.world.drafts.find((d) => d.id === holder!.id)?.assetId).toBeUndefined()
  })
})

describe('past due gates the product, not a screen', () => {
  it('is reachable as its own world, with the rest of the tenant intact', () => {
    const pastDue = buildDataset('past-due')
    const active = buildDataset('active')
    expect(pastDue.billing.status).toBe('past_due')
    // Only the money differs — a difference anywhere else would make the
    // world useless for judging what past_due alone does.
    expect(pastDue.drafts).toEqual(active.drafts)
    expect(pastDue.slots).toEqual(active.slots)
  })

  it('records the failed charge, so the banner has something behind it', () => {
    const pastDue = buildDataset('past-due')
    expect(pastDue.billing.history.some((invoice) => invoice.status === 'failed')).toBe(true)
    expect(pastDue.notifications.some((n) => n.type === 'payment_failed')).toBe(true)
  })

  it('clears completely once resolved', () => {
    const resolved = dataReducer(world('past-due'), { type: 'billing/resolvePastDue' })
    expect(resolved.world.billing.status).toBe('active')
  })
})

describe('plan gating', () => {
  it('the free plan cannot reach the models it does not pay for', () => {
    const free = buildDataset('visitor')
    expect(free.billing.planId).toBe('free')
    const rank = { free: 0, pro: 1, studio: 2 } as const
    const reachable = free.studioModels.filter(
      (model) => rank[model.tier] <= rank[free.billing.planId],
    )
    expect(reachable.length).toBeGreaterThan(0)
    expect(reachable.length).toBeLessThan(free.studioModels.length)
  })

  it('every plan in the catalog states what it grants', () => {
    for (const plan of buildDataset('active').plans) {
      expect(plan.entitlements.modelTiers.length).toBeGreaterThan(0)
      expect(plan.entitlements.features.length).toBeGreaterThan(0)
    }
  })
})
