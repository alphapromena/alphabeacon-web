/**
 * The scroll story's choreography is data plus a pure sampler — so the
 * motion law's mechanical half is testable: poses stay finite and bounded,
 * opacity stays in [0,1], scenes map to their bands, and the sampled
 * transform never leaves translate/rotate/scale (transform-only motion,
 * design.md Part 5 v2).
 */
import { describe, expect, it } from 'vitest'
import {
  CARD_IDS,
  SCENE_STOPS,
  poseTransform,
  posesAt,
  sceneFor,
} from './story-layout'

describe('scene bands', () => {
  it('maps progress to the six scenes, clamped at the edges', () => {
    expect(sceneFor(0)).toBe(0)
    expect(sceneFor(0.999)).toBe(5)
    expect(sceneFor(1)).toBe(5)
    for (let scene = 0; scene < 6; scene++) {
      const mid = (SCENE_STOPS[scene] + SCENE_STOPS[scene + 1]) / 2
      expect(sceneFor(mid), `midpoint of scene ${scene}`).toBe(scene)
    }
  })
})

describe('pose sampling', () => {
  it('yields a finite, bounded pose for every card across the whole scroll', () => {
    for (let step = 0; step <= 100; step++) {
      const poses = posesAt(step / 100)
      for (const id of CARD_IDS) {
        const pose = poses[id]
        for (const value of [pose.x, pose.y, pose.r, pose.s, pose.o]) {
          expect(Number.isFinite(value)).toBe(true)
        }
        expect(pose.o).toBeGreaterThanOrEqual(0)
        expect(pose.o).toBeLessThanOrEqual(1)
        expect(pose.s).toBeGreaterThan(0)
        // The field is a viewport: nothing may fly off it.
        expect(Math.abs(pose.x)).toBeLessThanOrEqual(40)
        expect(Math.abs(pose.y)).toBeLessThanOrEqual(30)
      }
    }
  })

  it('clamps out-of-range progress instead of extrapolating', () => {
    expect(posesAt(-1)).toEqual(posesAt(0))
    expect(posesAt(2)).toEqual(posesAt(1))
  })

  it('the focus scene brings the company card forward, above every other card', () => {
    const s5 = (SCENE_STOPS[4] + SCENE_STOPS[5]) / 2
    const poses = posesAt(s5)
    for (const id of CARD_IDS) {
      if (id === 'company') continue
      expect(poses.company.z).toBeGreaterThan(poses[id].z)
      expect(poses.company.o).toBeGreaterThan(poses[id].o)
    }
  })

  it('samples compose to a transform of translate/rotate/scale only', () => {
    const transform = poseTransform(posesAt(0.5).company)
    expect(transform).toMatch(
      /^translate3d\(calc\(-50% \+ -?[\d.]+vw\), calc\(-50% \+ -?[\d.]+vh\), 0\) rotate\(-?[\d.]+deg\) scale\([\d.]+\)$/,
    )
  })
})
