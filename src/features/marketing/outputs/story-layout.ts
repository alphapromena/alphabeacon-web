/**
 * The scroll story's choreography, as data (brief §4, §13): six scenes, six
 * cards, and a pure interpolator the engine samples every frame. Keeping
 * this pure keeps the motion unit-testable — the engine only applies what
 * this module computes, as `transform`/`opacity` only.
 *
 * Units: x in vw, y in vh (relative to the card field's center), r in
 * degrees, s scale, o opacity. z is the stacking order, stepped at scene
 * boundaries rather than interpolated.
 */

export const CARD_IDS = ['instagram', 'company', 'executive', 'arabic', 'newsletter', 'x'] as const
export type CardId = (typeof CARD_IDS)[number]

export interface CardPose {
  x: number
  y: number
  r: number
  s: number
  o: number
  z: number
}

/** Scene boundaries on the eased 0..1 progress. */
export const SCENE_STOPS = [0, 0.18, 0.36, 0.52, 0.68, 0.84, 1] as const

export function sceneFor(progress: number): number {
  for (let index = SCENE_STOPS.length - 2; index >= 0; index--) {
    if (progress >= SCENE_STOPS[index]) return Math.min(index, 5)
  }
  return 0
}

type Layout = Record<CardId, CardPose>

/** S1 — stacked together, a quiet deck. */
const STACKED: Layout = {
  instagram: { x: -1.5, y: -1, r: -4, s: 0.9, o: 1, z: 6 },
  company: { x: 0, y: 0, r: 0, s: 0.92, o: 1, z: 5 },
  executive: { x: 1.5, y: 1, r: 3, s: 0.9, o: 1, z: 4 },
  arabic: { x: -0.5, y: 2, r: -2, s: 0.88, o: 1, z: 3 },
  newsletter: { x: 0.5, y: -2, r: 2, s: 0.88, o: 1, z: 2 },
  x: { x: 0, y: 3, r: 5, s: 0.85, o: 0.9, z: 1 },
}

/** S2 — fanned out so every format is clearly readable. */
const FANNED: Layout = {
  instagram: { x: -24, y: -6, r: -5, s: 0.98, o: 1, z: 4 },
  company: { x: 0, y: -2, r: 0, s: 1, o: 1, z: 6 },
  executive: { x: 24, y: -8, r: 5, s: 0.98, o: 1, z: 4 },
  arabic: { x: -13, y: 12, r: -3, s: 0.95, o: 1, z: 5 },
  newsletter: { x: 13, y: 13, r: 3, s: 0.95, o: 1, z: 5 },
  x: { x: 0, y: 24, r: 0, s: 0.8, o: 0.9, z: 3 },
}

/** S3 — the fan tightens slightly while the memory chips surface. */
const REMEMBERED: Layout = {
  instagram: { x: -21, y: -5, r: -4, s: 0.95, o: 0.95, z: 4 },
  company: { x: 0, y: -2, r: 0, s: 1, o: 1, z: 6 },
  executive: { x: 21, y: -7, r: 4, s: 0.95, o: 0.95, z: 4 },
  arabic: { x: -12, y: 11, r: -2, s: 0.92, o: 0.95, z: 5 },
  newsletter: { x: 12, y: 12, r: 2, s: 0.92, o: 0.95, z: 5 },
  x: { x: 0, y: 22, r: 0, s: 0.78, o: 0.85, z: 3 },
}

/** S4 — a slow, confident drift; nothing new appears, the copy carries it. */
const PROACTIVE: Layout = {
  instagram: { x: -19, y: -4, r: -2, s: 0.93, o: 0.9, z: 4 },
  company: { x: 0, y: -1, r: 0, s: 1.02, o: 1, z: 6 },
  executive: { x: 19, y: -6, r: 2, s: 0.93, o: 0.9, z: 4 },
  arabic: { x: -11, y: 10, r: -1, s: 0.9, o: 0.9, z: 5 },
  newsletter: { x: 11, y: 11, r: 1, s: 0.9, o: 0.9, z: 5 },
  x: { x: 0, y: 21, r: 0, s: 0.76, o: 0.8, z: 3 },
}

/** S5 — the company post comes forward for the approval moment. */
const FOCUSED: Layout = {
  instagram: { x: -28, y: -8, r: -8, s: 0.8, o: 0.35, z: 2 },
  company: { x: 0, y: 0, r: 0, s: 1.06, o: 1, z: 6 },
  executive: { x: 28, y: -10, r: 8, s: 0.8, o: 0.35, z: 2 },
  arabic: { x: -22, y: 14, r: -6, s: 0.78, o: 0.35, z: 1 },
  newsletter: { x: 22, y: 15, r: 6, s: 0.78, o: 0.35, z: 1 },
  x: { x: 0, y: 26, r: 0, s: 0.7, o: 0.25, z: 1 },
}

/** S6 — approved work drifts toward its channels. */
const DISTRIBUTED: Layout = {
  instagram: { x: -26, y: 22, r: 0, s: 0.55, o: 0.9, z: 4 },
  company: { x: -10, y: 21, r: 0, s: 0.6, o: 1, z: 6 },
  executive: { x: 2, y: 22, r: 0, s: 0.55, o: 0.9, z: 4 },
  arabic: { x: -18, y: 23, r: 0, s: 0.52, o: 0.85, z: 3 },
  newsletter: { x: 22, y: 22, r: 0, s: 0.55, o: 0.9, z: 5 },
  x: { x: 12, y: 23, r: 0, s: 0.5, o: 0.7, z: 2 },
}

const LAYOUTS: Layout[] = [STACKED, FANNED, REMEMBERED, PROACTIVE, FOCUSED, DISTRIBUTED, DISTRIBUTED]

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Sample every card's pose at an eased progress in [0, 1]. */
export function posesAt(progress: number): Record<CardId, CardPose> {
  const clamped = Math.min(Math.max(progress, 0), 1)
  let segment = 0
  while (segment < SCENE_STOPS.length - 2 && clamped >= SCENE_STOPS[segment + 1]) segment++
  const span = SCENE_STOPS[segment + 1] - SCENE_STOPS[segment]
  const t = smoothstep(span > 0 ? (clamped - SCENE_STOPS[segment]) / span : 0)
  const from = LAYOUTS[segment]
  const to = LAYOUTS[segment + 1]

  const result = {} as Record<CardId, CardPose>
  for (const id of CARD_IDS) {
    result[id] = {
      x: lerp(from[id].x, to[id].x, t),
      y: lerp(from[id].y, to[id].y, t),
      r: lerp(from[id].r, to[id].r, t),
      s: lerp(from[id].s, to[id].s, t),
      o: lerp(from[id].o, to[id].o, t),
      z: t < 0.5 ? from[id].z : to[id].z,
    }
  }
  return result
}

export function poseTransform(pose: CardPose): string {
  return `translate3d(calc(-50% + ${pose.x.toFixed(2)}vw), calc(-50% + ${pose.y.toFixed(2)}vh), 0) rotate(${pose.r.toFixed(2)}deg) scale(${pose.s.toFixed(3)})`
}
