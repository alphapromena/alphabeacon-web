import { describe, expect, it } from 'vitest'
import { hudClock } from './hud-clock'

describe('hudClock', () => {
  it('walks 06:58:00 → 07:00:00 across the scrub', () => {
    expect(hudClock(0)).toBe('06:58:00')
    expect(hudClock(0.5)).toBe('06:59:00')
    expect(hudClock(1)).toBe('07:00:00')
  })

  it('clamps out-of-range progress instead of inventing times', () => {
    expect(hudClock(-0.4)).toBe('06:58:00')
    expect(hudClock(1.7)).toBe('07:00:00')
  })

  it('never runs backwards as progress rises', () => {
    let previous = hudClock(0)
    for (let step = 1; step <= 100; step += 1) {
      const next = hudClock(step / 100)
      expect(next >= previous).toBe(true)
      previous = next
    }
  })
})
