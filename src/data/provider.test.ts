import { describe, expect, it } from 'vitest'
import { buildDataset } from '@/data/datasets'
import { dataReducer, type DataState } from '@/data/provider'

function initialState(): DataState {
  return {
    datasetId: 'active',
    world: buildDataset('active'),
    devForce: 'none',
    connectivity: 'auto',
  }
}

describe('dataReducer', () => {
  it('switches datasets to a pristine world', () => {
    const next = dataReducer(initialState(), { type: 'dataset/switch', id: 'fresh' })
    expect(next.datasetId).toBe('fresh')
    expect(next.world.drafts).toHaveLength(0)
    expect(next.world.org.name).toBe('Nova Skincare')
  })

  it('applies a legal draft transition and appends to the timeline', () => {
    const state = initialState()
    const next = dataReducer(state, {
      type: 'draft/transition',
      draftId: 'draft_001',
      to: 'approved',
    })
    const draft = next.world.drafts.find((d) => d.id === 'draft_001')
    expect(draft?.status).toBe('approved')
    expect(draft?.timeline.at(-1)?.status).toBe('approved')
  })

  it('ignores an illegal transition — the state machine is law', () => {
    const state = initialState()
    const next = dataReducer(state, {
      type: 'draft/transition',
      draftId: 'draft_001', // pending_review
      to: 'published',
    })
    expect(next).toBe(state)
  })

  it('marks all notifications read', () => {
    const next = dataReducer(initialState(), { type: 'notifications/markAllRead' })
    expect(next.world.notifications.every((n) => n.read)).toBe(true)
  })

  it('resets in-session mutations when the dataset is rebuilt (the refresh contract)', () => {
    const approved = dataReducer(initialState(), {
      type: 'draft/transition',
      draftId: 'draft_001',
      to: 'approved',
    })
    const reset = dataReducer(approved, { type: 'dataset/switch', id: 'active' })
    expect(reset.world.drafts.find((d) => d.id === 'draft_001')?.status).toBe('pending_review')
  })
})
