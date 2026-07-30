import { describe, expect, it } from 'vitest'
import {
  HERO_FRAME_COUNT,
  frameLoadOrder,
  heroFramePath,
  nearestLoadedIndex,
} from './hero-frames'

describe('heroFramePath', () => {
  it('zero-pads to the on-disk names', () => {
    expect(heroFramePath(0)).toBe('/marketing/hero/frame-000.webp')
    expect(heroFramePath(42)).toBe('/marketing/hero/frame-042.webp')
    expect(heroFramePath(199)).toBe('/marketing/hero/frame-199.webp')
  })
})

describe('frameLoadOrder', () => {
  it('covers every frame exactly once', () => {
    const order = frameLoadOrder(HERO_FRAME_COUNT)
    expect(order).toHaveLength(HERO_FRAME_COUNT)
    expect(new Set(order).size).toBe(HERO_FRAME_COUNT)
  })

  it('loads coarse first: the early slice spans the whole clip', () => {
    const order = frameLoadOrder(HERO_FRAME_COUNT)
    const coarse = order.slice(0, 26)
    // Strides of 8 mean the first pass reaches deep into the sequence…
    expect(Math.max(...coarse)).toBeGreaterThanOrEqual(192)
    // …and the resting frame is promoted right behind frame 0, because the
    // static end state is what a slow connection must show first.
    expect(order[0]).toBe(0)
    expect(order[1]).toBe(HERO_FRAME_COUNT - 1)
  })
})

describe('nearestLoadedIndex', () => {
  it('returns the target itself when loaded', () => {
    const loaded = [false, true, false]
    expect(nearestLoadedIndex(loaded, 1)).toBe(1)
  })

  it('falls back to the closest loaded neighbour while the fine pass lands', () => {
    const loaded = Array.from({ length: 20 }, (_, index) => index % 8 === 0)
    expect(nearestLoadedIndex(loaded, 5)).toBe(8)
    expect(nearestLoadedIndex(loaded, 3)).toBe(0)
  })

  it('reports -1 only while nothing at all has arrived', () => {
    expect(nearestLoadedIndex([false, false], 1)).toBe(-1)
    expect(nearestLoadedIndex([], 0)).toBe(-1)
  })

  it('clamps a target beyond the sequence', () => {
    const loaded = [true, false, false]
    expect(nearestLoadedIndex(loaded, 99)).toBe(0)
  })
})
