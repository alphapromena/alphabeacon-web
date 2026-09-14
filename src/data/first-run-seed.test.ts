/**
 * The first-run seed is demo data, so what is worth asserting is not its
 * content but its COHERENCE: a world a stranger walks must not contain a
 * draft pointing at a slot that is not there, a tone nobody has, or a claim
 * about publishing that this product cannot back.
 *
 * These are the invariants that would make the review world embarrassing if
 * they broke, and every one of them broke in some dataset at some point.
 */
import { describe, expect, it } from 'vitest'
import { buildVisitorDataset } from '@/data/datasets/visitor'
import { applyFirstRunSeed } from '@/data/first-run-seed'
import { deriveReadiness } from '@/data/readiness'
import { dayFromNow } from '@/data/dates'

const seeded = applyFirstRunSeed({
  ...buildVisitorDataset(),
  org: { ...buildVisitorDataset().org, name: 'Probe Co', exists: true },
})

describe('applyFirstRunSeed', () => {
  it('gives Today a real queue — drafts waiting, on slots dated today', () => {
    const todaySlots = seeded.slots.filter((slot) => slot.date === dayFromNow(0))
    expect(todaySlots.length).toBeGreaterThan(1)

    const awaiting = seeded.drafts.filter((draft) => draft.status === 'pending_review')
    expect(awaiting.length).toBeGreaterThan(1)
    for (const draft of awaiting) {
      const slot = seeded.slots.find((s) => s.id === draft.slotId)
      expect(slot?.date, `${draft.id} must wait on a slot dated today`).toBe(dayFromNow(0))
    }
  })

  it('every draft belongs to a slot that claims it back', () => {
    for (const draft of seeded.drafts) {
      const slot = seeded.slots.find((s) => s.id === draft.slotId)
      expect(slot, `${draft.id} points at a slot that is not seeded`).toBeDefined()
      expect(slot?.draftIds).toContain(draft.id)
    }
    // …and no slot promises a draft that does not exist, which is the fault
    // that renders Today's "This slot did not generate" on a healthy world.
    for (const slot of seeded.slots) {
      for (const id of slot.draftIds) {
        expect(
          seeded.drafts.some((d) => d.id === id),
          `${slot.id} lists a missing draft`,
        ).toBe(true)
      }
    }
  })

  it('writes only in tones the workspace actually has', () => {
    const toneIds = new Set(seeded.tones.map((tone) => tone.id))
    for (const draft of seeded.drafts) expect(toneIds.has(draft.toneId)).toBe(true)
    for (const id of seeded.schedule.toneIds) expect(toneIds.has(id)).toBe(true)
  })

  it('never claims a post was published, because nothing can publish', () => {
    for (const draft of seeded.drafts) {
      expect(draft.status).not.toBe('published')
      expect(draft.status).not.toBe('publish_failed')
      expect(draft.publishResults).toBeUndefined()
    }
    expect(seeded.connections.every((connection) => connection.status === 'not_connected')).toBe(
      true,
    )
  })

  it('touches nothing that bills — no plan, no invoice, no wallet movement', () => {
    const before = buildVisitorDataset()
    expect(seeded.billing).toEqual(before.billing)
    expect(seeded.ledger).toEqual(before.ledger)
    expect(seeded.plans).toEqual(before.plans)
  })

  it('attaches media only where the render that made it exists', () => {
    for (const draft of seeded.drafts) {
      if (!draft.assetId) continue
      const asset = seeded.assets.find((a) => a.id === draft.assetId)
      expect(asset, `${draft.id} attaches an asset that is not seeded`).toBeDefined()
      expect(seeded.jobs.some((job) => job.id === asset?.jobId)).toBe(true)
    }
    // A job left running never finishes in a static world, and reads as a
    // hang to the one person this seed exists for.
    expect(seeded.jobs.some((job) => job.status === 'running')).toBe(false)
  })

  it('leaves the workspace able to generate — no outstanding checklist row', () => {
    const readiness = deriveReadiness({
      known: true,
      brandVoice: seeded.org.brandVoice,
      toneCount: seeded.tones.length,
      sourceCount: seeded.followedSources.length,
      topicCount: seeded.topics.length,
      country: seeded.org.country,
      activeDayCount: seeded.schedule.activeDays.length,
    })
    expect(readiness.canGenerate).toBe(true)
    expect(readiness.items.every((item) => item.done)).toBe(true)
  })

  it('does not invent claims about the business — the org profile stays theirs', () => {
    expect(seeded.org.offer).toBe('')
    expect(seeded.org.differentiators).toEqual([])
    expect(seeded.org.ctaText).toBe('')
    expect(seeded.org.name).toBe('Probe Co')
  })

  it('keeps the timezone the world booted with', () => {
    const before = buildVisitorDataset()
    expect(seeded.schedule.timezone).toBe(before.schedule.timezone)
  })
})
