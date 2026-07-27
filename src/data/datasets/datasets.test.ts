import { describe, expect, it } from 'vitest'
import { DATASETS } from '@/data/datasets'

describe.each(DATASETS.map((d) => [d.id, d.build()] as const))('dataset %s', (_id, world) => {
  it('has internally consistent references', () => {
    const toneIds = new Set(world.tones.map((t) => t.id))
    const draftIds = new Set(world.drafts.map((d) => d.id))
    const slotIds = new Set(world.slots.map((s) => s.id))
    const eventIds = new Set(world.events.map((e) => e.id))

    for (const draft of world.drafts) {
      expect(toneIds.has(draft.toneId)).toBe(true)
      if (draft.slotId) expect(slotIds.has(draft.slotId)).toBe(true)
      if (draft.eventId) expect(eventIds.has(draft.eventId)).toBe(true)
    }
    for (const slot of world.slots) {
      for (const id of slot.draftIds) expect(draftIds.has(id)).toBe(true)
    }
    expect(world.schedule.toneIds.every((id) => toneIds.has(id))).toBe(true)
    expect(world.users.some((u) => u.id === world.session.userId)).toBe(true)
  })

  it('keeps the static law: no URL schemes inside committed records', () => {
    expect(JSON.stringify(world)).not.toMatch(/https?:\/\//)
  })

  it('derives the credit balance from the ledger, never below zero here', () => {
    const balance = world.ledger.reduce((sum, entry) => sum + entry.amount, 0)
    expect(balance).toBeGreaterThanOrEqual(0)
  })

  it('caps posts per day at 3', () => {
    expect(world.schedule.postsPerDay).toBeLessThanOrEqual(3)
    for (const date of new Set(world.slots.map((s) => s.date))) {
      expect(world.slots.filter((s) => s.date === date).length).toBeLessThanOrEqual(3)
    }
  })
})
