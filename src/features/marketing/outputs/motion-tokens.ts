import type { CSSProperties } from 'react'
import type { CardId } from './story-layout'

/**
 * The hero cards' motion system (founder-directed, final form 2026-08-11):
 * ONE autonomous 3D orbit — a slow rotating product display in a luxury
 * showroom. All six cards sit 60° apart on an invisible elliptical ring
 * and travel around it continuously; scroll never touches the orbit.
 *
 * The ring is elliptical in three dimensions: wide horizontally, shallow
 * vertically, deep front-to-back — cards travel mostly left-to-right while
 * swinging toward and away from the camera. Depth drives everything:
 * scale, opacity, stacking, and shadow all follow how close a card is, so
 * cards naturally pass in front of and behind each other.
 *
 * Cards always face the viewer — orientation changes are subtle (rotateY
 * ≤10°, rotateX ≤3°, rotateZ ≤2°), never a spin around their own axis.
 *
 * `perspective()` lives INSIDE each card's transform rather than as
 * preserve-3d on the field: per-frame opacity makes every slot a grouping
 * element, which would flatten a preserve-3d scene; per-card perspective
 * gives identical foreshortening for all six at these angles.
 *
 * Reduced motion never sees the orbit: the engine mounts only when
 * no-preference is affirmed — the static tier's stable layered
 * composition renders instead. The narrow-viewport swipe strip keeps a
 * light Z-only CSS drift so the headline and buttons are never covered.
 */

export const ORBIT = {
  /** Seconds per full revolution — inside the 22–35 s brief window. */
  periodSeconds: 28,
  perspective: 1500,
  /** Vertical radius, px — the ring's tilt toward the viewer. */
  radiusY: 70,
  /** Depth radius, px — how far cards travel toward/away from camera. */
  radiusZ: 250,
  /** Where each card sits on the ring, deg. 90° = front-center; the
   * company card leads so the anchor greets the visitor first. */
  angles: {
    executive: 30,
    company: 90,
    instagram: 150,
    arabic: 210,
    x: 270,
    newsletter: 330,
  } as Record<CardId, number>,
  /** Horizontal radius resolves from the viewport so the orbit stays in
   * the hero's right side and never crosses far into the headline. */
  radiusXFor(width: number): number {
    return Math.min(430, Math.max(280, width * 0.24))
  },
}

const DEG = Math.PI / 180

export interface OrbitPose {
  transform: string
  opacity: number
  zIndex: number
}

/**
 * The pose for one card at `angleDeg` on the ring. `depth` = sin(angle)
 * runs -1 (farthest) … +1 (front-center): scale 0.90→1.05, opacity
 * 0.72→1, z-index 0→18 (the copy rail sits at z-20 and always stays
 * readable). `lift` is the hovered card's eased 0→1: forward 40 px, +2 %
 * scale, orientation straightened for reading.
 */
export function orbitPose(angleDeg: number, radiusX: number, lift = 0): OrbitPose {
  const a = angleDeg * DEG
  const depth = Math.sin(a)
  const near = (depth + 1) / 2

  const x = radiusX * Math.cos(a)
  const y = ORBIT.radiusY * depth
  const z = ORBIT.radiusZ * depth + lift * 40
  const scale = 0.9 + 0.15 * near + lift * 0.02
  const facing = 1 - lift * 0.6
  const rotY = -10 * Math.cos(a) * facing
  const rotX = -2.5 * depth * facing
  const rotZ = 1.5 * Math.cos(a) * facing

  return {
    transform:
      `perspective(${ORBIT.perspective}px) ` +
      `translate3d(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px), ${z.toFixed(2)}px) ` +
      `rotateX(${rotX.toFixed(3)}deg) rotateY(${rotY.toFixed(3)}deg) rotateZ(${rotZ.toFixed(3)}deg) ` +
      `scale(${scale.toFixed(4)})`,
    opacity: 0.72 + 0.28 * near,
    zIndex: Math.round(9 + depth * 9),
  }
}

/* ------------------------------------------------------------------ */
/* The narrow-viewport swipe strip's light CSS drift (unchanged tier). */

export interface AmbientProfile {
  duration: number
  phase: number
  x: number
  y: number
  rotZ: number
  breathe: number
}

export const AMBIENT: Record<CardId, AmbientProfile> = {
  instagram: { duration: 14, phase: -2, x: 9, y: 14, rotZ: -1.1, breathe: 0.004 },
  company: { duration: 17, phase: -5, x: 5, y: 7, rotZ: 0.4, breathe: 0.003 },
  executive: { duration: 11, phase: -7, x: 10, y: 12, rotZ: 0.9, breathe: 0.005 },
  arabic: { duration: 16, phase: -3.5, x: 7, y: 16, rotZ: -1.3, breathe: 0.004 },
  newsletter: { duration: 12.5, phase: -1, x: 8, y: 13, rotZ: 1.4, breathe: 0.005 },
  x: { duration: 13.5, phase: -8, x: 11, y: 18, rotZ: -1.0, breathe: 0.003 },
}

/** Custom properties for the strip's `mk-ambient-drift` keyframes; the
 * ~0.45 factor keeps phones alive but stable. */
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
