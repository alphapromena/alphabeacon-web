import type { CSSProperties } from 'react'
import type { CardId } from './story-layout'

/**
 * The ambient idle layer for the hero cards: continuous, independent
 * micro-motion so the composition never freezes when scrolling stops.
 *
 * Composition rule (the whole trick): the scroll engine owns `transform` on
 * the OUTER card slot (scroll-story.tsx writes it every rAF), so the drift
 * animates a NESTED inner wrapper — scroll wrapper → ambient wrapper →
 * card. The two systems write to different elements and can never cancel
 * each other.
 *
 * The CSS half is `mk-ambient-drift` in globals.css, parameterized by the
 * custom properties this module emits and living inside the
 * no-preference media query — reduced motion removes the drift entirely.
 */

export interface AmbientProfile {
  /** Seconds for one full drift cycle (8–16). */
  duration: number
  /** Negative seconds into the cycle, so no two cards move in step. */
  phase: number
  /** Horizontal drift amplitude, px (2–5). */
  x: number
  /** Vertical float amplitude, px (3–8). */
  y: number
  /** Rotation amplitude, degrees (0.2–0.8) — a breath, never a wobble. */
  rotate: number
  /** Depth-breathing scale amplitude, as a fraction of 1. */
  breathe: number
}

/**
 * Every card floats to its own beat: different duration, phase, distance
 * and rotation. Amplitudes are deliberately small — objects floating
 * gently in space, not a motion template.
 */
export const AMBIENT: Record<CardId, AmbientProfile> = {
  instagram: { duration: 13, phase: -2, x: 3, y: 6, rotate: 0.7, breathe: 0.004 },
  company: { duration: 16, phase: -5, x: 2, y: 5, rotate: 0.4, breathe: 0.003 },
  executive: { duration: 11, phase: -7, x: 4, y: 7, rotate: 0.8, breathe: 0.005 },
  arabic: { duration: 14.5, phase: -3.5, x: 3, y: 8, rotate: 0.55, breathe: 0.004 },
  newsletter: { duration: 9.5, phase: -1, x: 2.5, y: 5.5, rotate: 0.45, breathe: 0.005 },
  x: { duration: 12.5, phase: -8, x: 3.5, y: 6.5, rotate: 0.65, breathe: 0.003 },
}

/**
 * The custom properties `mk-ambient-drift` samples. `factor` scales the
 * spatial amplitudes only (the mobile swipe strip runs reduced) — time is
 * never scaled, so the room stays quiet.
 */
export function ambientStyle(profile: AmbientProfile, factor = 1): CSSProperties {
  return {
    '--mk-amb-dur': `${profile.duration}s`,
    '--mk-amb-phase': `${profile.phase}s`,
    '--mk-amb-x': `${(profile.x * factor).toFixed(2)}px`,
    '--mk-amb-y': `${(profile.y * factor).toFixed(2)}px`,
    '--mk-amb-r': `${(profile.rotate * factor).toFixed(2)}deg`,
    '--mk-amb-b': (profile.breathe * factor).toFixed(4),
  } as CSSProperties
}
