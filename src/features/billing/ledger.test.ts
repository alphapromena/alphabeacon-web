/**
 * The credit balance has to be explainable, not just correct.
 *
 * The manual pass reported that H3 "doesn't reconcile": the plan granted 500,
 * the balance read 458, and nothing on screen accounted for the missing 42. The
 * rows did sum correctly — the arithmetic simply was not stated. These tests
 * hold both halves: the identity is true, and it is true in every world, so a
 * dataset whose ledger cannot be explained fails here rather than on screen.
 */
import { describe, expect, it } from 'vitest'
import { DATASETS, buildDataset } from '@/data/datasets'
import { outstandingHolds, reconcileLedger } from '@/features/billing/ledger'

describe.each(DATASETS.map((d) => [d.id, d.build()] as const))('ledger for %s', (_id, world) => {
  it('reconciles: granted − spent − held equals both the balance and the plain sum', () => {
    const sums = reconcileLedger(world.ledger)
    const plainSum = world.ledger.reduce((total, entry) => total + entry.amount, 0)

    // The identity the screen now prints. If this drifts, the four numbers on
    // H3 stop adding up in front of the user.
    expect(sums.granted - sums.spent - sums.held).toBe(sums.balance)
    // And it must agree with the only definition the provider recognises.
    expect(sums.balance).toBe(plainSum)
  })

  it('never reports a negative grant, spend or hold', () => {
    const sums = reconcileLedger(world.ledger)
    expect(sums.granted).toBeGreaterThanOrEqual(0)
    expect(sums.spent).toBeGreaterThanOrEqual(0)
    expect(sums.held).toBeGreaterThanOrEqual(0)
  })

  it('ties every job charge to a job that exists', () => {
    const jobIds = new Set(world.jobs.map((job) => job.id))
    for (const entry of world.ledger) {
      if (entry.ref?.kind !== 'job') continue
      // A charge nobody can trace to a run is exactly the complaint.
      expect(jobIds.has(entry.ref.id), `ledger row ${entry.id} names a job that is not here`).toBe(
        true,
      )
    }
  })
})

describe('the active world, worked through by hand', () => {
  const world = buildDataset('active')

  it('accounts for every credit between the grant and the balance', () => {
    const sums = reconcileLedger(world.ledger)
    expect(sums.granted).toBe(500)
    expect(sums.spent).toBe(12) // job_001 committed
    expect(sums.held).toBe(30) // job_003 still running
    expect(sums.balance).toBe(458)
    // 500 − 12 − 30 = 458, and 12 + 30 = the 42 that was unexplained.
    expect(sums.granted - sums.balance).toBe(sums.spent + sums.held)
  })

  it('counts a hold as outstanding only until it settles either way', () => {
    const holds = outstandingHolds(world.ledger)
    expect(holds).toHaveLength(1)
    expect(holds[0].ref?.id).toBe('job_003')

    // A committed hold is settled, not outstanding — the earlier version only
    // looked for a release and would have kept a committed run held forever.
    const committed = world.ledger.find((entry) => entry.type === 'committed')
    expect(holds.some((hold) => hold.ref?.id === committed?.ref?.id)).toBe(false)
  })
})
