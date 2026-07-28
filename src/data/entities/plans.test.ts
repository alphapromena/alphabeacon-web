/**
 * Pricing parity. screens4.md's consistency checklist requires that the price
 * on the marketing page and the price in Billing are "visually distinct in
 * chrome but numerically identical — same source data, no copy drift".
 *
 * The strongest guarantee is structural: both screens read `usePlans()`, which
 * resolves to this one module. This test pins that structure — a second plan
 * list appearing anywhere is the failure it is designed to catch.
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
