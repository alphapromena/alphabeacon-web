import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LANES, filesInLane, laneOf } from './lanes'

const e2eDir = join(__dirname, '..', '..', 'e2e')

describe('the two lanes (GATE-0910 §3.2)', () => {
  it('every live spec on disk is laned exactly once, and nothing is laned that does not exist', () => {
    const onDisk = readdirSync(e2eDir)
      .filter((name) => /^live-.*\.spec\.ts$/.test(name))
      .map((name) => name.replace(/\.spec\.ts$/, ''))
      .sort()
    const laned = LANES.map((l) => l.file).sort()
    expect(laned).toEqual(onDisk)
    expect(new Set(laned).size).toBe(laned.length)
  })

  it("carries the founder's rulings: billing in B, wallet in A, the funded-org files in B", () => {
    expect(laneOf('live-billing')?.lane).toBe('B')
    expect(laneOf('e2e/live-wallet.spec.ts')?.lane).toBe('A')
    for (const file of [
      'live-brand-rules',
      'live-generate',
      'live-onboarding',
      'live-create-visual',
    ]) {
      expect(laneOf(file)?.lane, file).toBe('B')
    }
  })

  it('every laned file carries its reason, and the lane lists are the file paths a runner spawns', () => {
    for (const l of LANES) expect(l.reason.length, l.file).toBeGreaterThan(10)
    expect(filesInLane('A').every((f) => f.startsWith('e2e/live-') && f.endsWith('.spec.ts'))).toBe(
      true,
    )
    expect(filesInLane('A').length + filesInLane('B').length).toBe(LANES.length)
  })
})
