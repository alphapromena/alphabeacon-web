import type { CSSProperties } from 'react'
import type { CardId } from './story-layout'

/**
 * The ambient 3D layer for the hero cards (founder-directed 2026-08-11):
 * physical pieces of premium printed material floating in a quiet gallery.
 * Scroll never moves the cards — this is their only motion.
 *
 * Two tiers share these profiles:
 *
 * - The desktop engine composes a pose per frame from per-axis sine waves
 *   (`ambientTransform`). Each card has its own base duration and phase,
 *   and every axis runs at an incommensurate frequency multiple of it, so
 *   a card's motion never visibly repeats and no two cards ever move in
 *   step. Sine composition is inherently smooth ease-in-out — no bounce,
 *   no snapping.
 * - The mobile swipe strip keeps the light CSS drift (`ambientStyle` feeds
 *   the `mk-ambient-drift` keyframes) at reduced amplitude.
 *
 * `perspective()` lives INSIDE each card's transform rather than on the
 * field container: a slot with opacity < 1 (the X card) is a grouping
 * element that would flatten `preserve-3d`, silently dropping the
 * foreshortening for that card only. Per-card perspective keeps all six
 * cards visibly in the same physical space at these small angles.
 *
 * Reduced motion never sees any of this: the engine mounts only when
 * no-preference is affirmed, and the strip keyframes live inside the same
 * media query.
 */

export interface AmbientProfile {
  /** Base seconds for one cycle of the slowest axis — 11–17, per card. */
  duration: number
  /** Seconds of phase offset, so no two cards start in step. */
  phase: number
  /** Horizontal drift amplitude, px. */
  x: number
  /** Vertical float amplitude, px. */
  y: number
  /** Depth (translateZ) breathing amplitude, px. */
  z: number
  /** Rotation amplitudes, deg. Signs mix the direction per card. */
  rotX: number
  rotY: number
  rotZ: number
  /** Static translateZ offset, px — the card's depth layer in the fan. */
  depth: number
  /** Scale-breathing amplitude — the CSS strip only. */
  breathe: number
}

/**
 * Per-card character. The company card is the composition's anchor and
 * moves least (≤ ~1° rotation, single-digit drift); outer cards move
 * more, with mixed rotation directions so the field never reads as one
 * synchronized mechanism.
 */
export const AMBIENT: Record<CardId, AmbientProfile> = {
  instagram: { duration: 14, phase: -2, x: 9, y: 14, z: 20, rotX: 1.6, rotY: 2.4, rotZ: -1.1, depth: 8, breathe: 0.004 },
  company: { duration: 17, phase: -5, x: 5, y: 7, z: 8, rotX: 0.6, rotY: 0.9, rotZ: 0.4, depth: 26, breathe: 0.003 },
  executive: { duration: 11, phase: -7, x: 10, y: 12, z: 18, rotX: 1.8, rotY: -2.6, rotZ: 0.9, depth: 8, breathe: 0.005 },
  arabic: { duration: 16, phase: -3.5, x: 7, y: 16, z: 14, rotX: 1.2, rotY: 2.0, rotZ: -1.3, depth: 16, breathe: 0.004 },
  newsletter: { duration: 12.5, phase: -1, x: 8, y: 13, z: 16, rotX: -1.5, rotY: 1.8, rotZ: 1.4, depth: 16, breathe: 0.005 },
  x: { duration: 13.5, phase: -8, x: 11, y: 18, z: 12, rotX: 1.4, rotY: 2.8, rotZ: -1.0, depth: -18, breathe: 0.003 },
}

const TAU = Math.PI * 2

/**
 * Each axis runs at its own irrational-feeling multiple of the card's base
 * frequency — the whole point: the six-axis pose never returns to a state
 * it has shown before within any watchable window.
 */
const FREQ = { x: 1, y: 0.777, z: 1.31, rotX: 0.9, rotY: 1.19, rotZ: 0.68 } as const
const PHASE = { x: 0, y: 1.7, z: 3.9, rotX: 5.1, rotY: 2.6, rotZ: 0.9 } as const

function wave(t: number, base: number, mult: number, phase: number): number {
  return Math.sin((TAU * mult * t) / base + phase)
}

/**
 * The engine's per-frame pose. `damp` scales every amplitude (hover and
 * the approval moment ease it toward ~0.3, which also straightens the
 * rotation); `lift` eases 0→1 on hover, bringing the card forward ~26px
 * and up ~1.5% in scale. Both are eased by the caller frame-over-frame, so
 * nothing ever snaps.
 */
export function ambientTransform(p: AmbientProfile, t: number, damp = 1, lift = 0): string {
  const tt = t + p.phase
  const x = p.x * damp * wave(tt, p.duration, FREQ.x, PHASE.x)
  const y = p.y * damp * wave(tt, p.duration, FREQ.y, PHASE.y)
  const z = p.depth + p.z * damp * wave(tt, p.duration, FREQ.z, PHASE.z) + lift * 26
  const rx = p.rotX * damp * wave(tt, p.duration, FREQ.rotX, PHASE.rotX)
  const ry = p.rotY * damp * wave(tt, p.duration, FREQ.rotY, PHASE.rotY)
  const rz = p.rotZ * damp * wave(tt, p.duration, FREQ.rotZ, PHASE.rotZ)
  const s = 1 + lift * 0.015
  return `perspective(1400px) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${s.toFixed(4)})`
}

/**
 * The custom properties the CSS strip keyframes sample (mobile / static
 * tier). `factor` scales the spatial amplitudes only — ~0.45 keeps the
 * strip alive but stable, per the mobile rule; rotation there is Z-only.
 */
export function ambientStyle(profile: AmbientProfile, factor = 1): CSSProperties {
  return {
    '--mk-amb-dur': `${profile.duration}s`,
    '--mk-amb-phase': `${profile.phase}s`,
    '--mk-amb-x': `${(profile.x * factor).toFixed(2)}px`,
    '--mk-amb-y': `${(profile.y * factor).toFixed(2)}px`,
    '--mk-amb-r': `${(profile.rotZ * factor).toFixed(2)}deg`,
    '--mk-amb-b': (profile.breathe * factor).toFixed(4),
  } as CSSProperties
}
