/**
 * Pricing parity. Billing (H1) reads `usePlans()`, which resolves to this one
 * module — a second plan list appearing anywhere is the failure this test is
 * designed to catch. (The marketing page no longer renders plans at all:
 * Pricing left the V1 flow on 2026-08-10, decisions.md D3. If the founder
 * flips D3, the seam in features/marketing/pricing-section.tsx re-links the
 * SAME `usePlans()` source, and this test's guarantee covers it again.)
 */
import { describe, expect, it } from 'vitest'
import { DATASETS } from '@/data/datasets'
import { PLANS } from '@/data/entities/plans'

describe('plans are one source', () => {
  it('every dataset serves the same plan records to marketing and billing', () => {
    for (const dataset of DATASETS) {
      const world = dataset.build()
      expect(world.plans, `${dataset.id} plans`).toEqual(PLANS)
    }
  })

  it('describes each tier completely enough for both surfaces to render it', () => {
    for (const plan of PLANS) {
      expect(plan.name).toBeTruthy()
      expect(plan.priceMonthly).toBeGreaterThanOrEqual(0)
      expect(plan.credits).toBeGreaterThan(0)
      expect(plan.entitlements.features.length).toBeGreaterThan(0)
      expect(plan.entitlements.slotsPerDay).toBeLessThanOrEqual(3)
    }
  })

  it('prices increase with the tier, so the cards read in one direction', () => {
    const prices = PLANS.map((plan) => plan.priceMonthly)
    expect([...prices].sort((a, b) => a - b)).toEqual(prices)
    const credits = PLANS.map((plan) => plan.credits)
    expect([...credits].sort((a, b) => a - b)).toEqual(credits)
  })
})
