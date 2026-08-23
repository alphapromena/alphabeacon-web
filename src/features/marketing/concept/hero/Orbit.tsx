import { useEffect, useRef } from 'react'
import type { MarketingPiece } from '@/features/marketing/concept/lib/content'
import { PostCard } from '../posts'
import { usePrefersReducedMotion, useIsVisible } from '@/features/marketing/concept/useConceptHooks'
import styles from './orbit.module.css'

/**
 * Six finished marketing pieces on one shared orbit.
 *
 * Everything is driven by a single requestAnimationFrame loop writing
 * transforms straight to the DOM — no per-frame React state, no layout reads.
 * Each card sits on the same tilted ellipse around one invisible centre, so
 * they genuinely pass in front of and behind each other rather than floating
 * independently.
 */

/** One full revolution, in milliseconds. */
const REVOLUTION_MS = 29_000
/** Orbit speed while a card is hovered, as a fraction of normal. */
const HOVER_SPEED = 0.16
/** How quickly the speed eases between normal and slowed. */
const SPEED_EASE = 0.055

/** Horizontal radius of the ellipse, in px, at stage scale 1. */
const RADIUS_X = 244
/** Depth radius — how far cards travel toward and away from the viewer. */
const RADIUS_Z = 232
/** Vertical rise and fall that gives the ring its tilt. */
const TILT_Y = 60

/** Scale at the far side of the orbit. */
const SCALE_MIN = 0.78
/** Default scale at the near side. Individual cards raise this — see LAYOUT. */
const SCALE_MAX = 1.02
/** Default opacity at the far side. Individual cards raise this too. */
const OPACITY_MIN = 0.44
const OPACITY_MAX = 1

/**
 * Composition of the orbit, keyed by piece id rather than array index.
 *
 * Four primary outputs carry the hero. The remaining two ride a tighter,
 * dimmer inner path so the cross-channel story stays legible instead of all
 * six competing at once — same shared centre, same revolution.
 */
const BACKGROUND_RADIUS = 0.7
const BACKGROUND_SCALE = 0.82
const BACKGROUND_OPACITY = 0.5

interface OrbitSlot {
  /** Position on the ring, in turns (0–1). */
  phase: number
  width: number
  y: number
  roll: number
  /**
   * Scale at the near side of the orbit. Raising it steepens this card's own
   * near/far curve rather than making it bigger everywhere — the far side is
   * still SCALE_MIN, so the card grows only where it is meant to be read.
   */
  scaleMax?: number
  /**
   * Opacity at the far side. Raised for cards carrying real detail, which
   * should recede rather than drop out of the composition entirely.
   */
  opacityMin?: number
  background?: boolean
}

/**
 * Composition of the orbit.
 *
 * Three things drive the numbers here.
 *
 * Scale and opacity are now per card. The real-company screenshots carry far
 * more detail than a composed card does, so they get a taller near/far curve
 * to be worth reading at the front and a higher opacity floor so they recede
 * rather than drop out. The Arabic card goes the other way: it is the tallest object
 * in the set and was overpowering everything it passed.
 *
 * The primaries are spaced unevenly. Even quarter-turns look tidy in the
 * abstract but resolve, twice a revolution, into two cards at identical depth
 * in front and two identical behind — no hierarchy at all. Offsetting them
 * keeps a clear leader (never below 0.81 depth), a strong second (never below
 * 0.45) and a readable third at every moment of the cycle.
 *
 * And the two strongest images, Shrimp Joint and Inception, sit 169° apart.
 * Adjacent, they crowded the front together and overlapped; opposite, each
 * gets the front to itself.
 *
 * The ring itself is untouched: same shared centre, radii, tilt, revolution,
 * hover response and perspective.
 */
const LAYOUT: Record<string, OrbitSlot> = {
  // Inception DAP — dense packaging creative, needs the size to be worth it.
  'hero-instagram': { phase: 0, width: 192, y: -14, roll: -1.2, scaleMax: 1.19, opacityMin: 0.56 },
  // The X card is the one wide card in a stack of portrait ones, because a
  // feed post on X is wide. It is authored at a real post's width so its
  // internals sit at the right scale, and held at the floor of the near
  // curve — SCALE_MIN, not below it, since a `near` under SCALE_MIN would
  // invert the depth and shrink the card as it came forward. 340 x 0.78
  // lands level with Shrimp Joint's 208 x 1.24, so the two sit beside each
  // other and the photograph still leads on weight.
  'hero-x': { phase: 0.24, width: 340, y: -34, roll: -1, scaleMax: 0.78 },
  // Shrimp Joint — the strongest single image in the set; it leads.
  'hero-facebook': { phase: 0.47, width: 208, y: 30, roll: 1.4, scaleMax: 1.24, opacityMin: 0.56 },
  // Ataccama — the tallest card, so it gains reach through opacity as much as scale.
  'hero-newsletter': { phase: 0.71, width: 200, y: 10, roll: 0.6, scaleMax: 1.18, opacityMin: 0.6 },
  'hero-linkedin-executive': { phase: 0.12, width: 150, y: -26, roll: 0.8, background: true },
  'hero-reel': { phase: 0.6, width: 118, y: 26, roll: -1.6, background: true },
}

const FALLBACK_SLOT: OrbitSlot = { phase: 0, width: 180, y: 0, roll: 0 }

interface CardState extends OrbitSlot {
  outer: HTMLDivElement
  radiusScale: number
  scaleMul: number
  opacityMul: number
  near: number
  far: number
}

export function Orbit({ pieces, active = true }: { pieces: MarketingPiece[]; active?: boolean }) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [stageRef, isVisible] = useIsVisible<HTMLDivElement>()
  const hoverCount = useRef(0)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const cards: CardState[] = []
    cardRefs.current.forEach((outer, i) => {
      if (!outer) return
      const slot = LAYOUT[pieces[i]?.id ?? ''] ?? FALLBACK_SLOT
      cards.push({
        ...slot,
        outer,
        phase: slot.phase * Math.PI * 2,
        radiusScale: slot.background ? BACKGROUND_RADIUS : 1,
        scaleMul: slot.background ? BACKGROUND_SCALE : 1,
        opacityMul: slot.background ? BACKGROUND_OPACITY : 1,
        near: slot.scaleMax ?? SCALE_MAX,
        far: slot.opacityMin ?? OPACITY_MIN,
      })
    })
    if (!cards.length) return

    const place = (theta: number) => {
      for (const c of cards) {
        const a = theta + c.phase
        const sin = Math.sin(a)
        const cos = Math.cos(a)

        const x = RADIUS_X * c.radiusScale * sin
        const z = RADIUS_Z * c.radiusScale * cos
        const y = c.y + TILT_Y * c.radiusScale * cos

        // 0 at the far side, 1 nearest the viewer.
        const depth = (cos + 1) / 2
        const scale = (SCALE_MIN + (c.near - SCALE_MIN) * depth) * c.scaleMul
        const opacity = (c.far + (OPACITY_MAX - c.far) * depth) * c.opacityMul

        // Cards stay mostly square to the viewer — just enough yaw to read
        // as dimensional.
        const rotY = -sin * 11
        const rotX = cos * 3.5

        c.outer.style.transform =
          `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) ` +
          `rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg) ` +
          `rotateZ(${c.roll}deg) scale(${scale.toFixed(3)}) translate(-50%, -50%)`
        c.outer.style.opacity = opacity.toFixed(3)
        c.outer.style.zIndex = String(Math.round(depth * 1000) - (c.background ? 1200 : 0))
      }
    }

    if (reducedMotion || !active) {
      // A composed, readable still — no motion at all.
      place(-0.55)
      return
    }

    let raf = 0
    let last = performance.now()
    let theta = -0.55
    let speed = 1

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      // Clamp so a backgrounded tab doesn't jump the orbit on return.
      const dt = Math.min(now - last, 64)
      last = now

      if (!isVisible.current || document.hidden) return

      const target = hoverCount.current > 0 ? HOVER_SPEED : 1
      speed += (target - speed) * SPEED_EASE

      theta += (dt / REVOLUTION_MS) * Math.PI * 2 * speed
      place(theta)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pieces, reducedMotion, active, isVisible])

  const onEnter = () => {
    hoverCount.current += 1
  }
  const onLeave = () => {
    hoverCount.current = Math.max(0, hoverCount.current - 1)
  }

  return (
    <div className={styles.viewport}>
      <div className={styles.stage} ref={stageRef}>
        {/* Orbit trails — they share the cards' 3D space, so cards pass
            in front of and behind them. */}
        <span className={`${styles.ring} ${styles.ringOuter}`} aria-hidden="true" />
        <span className={`${styles.ring} ${styles.ringInner}`} aria-hidden="true" />
        <span className={styles.core} aria-hidden="true" />

        <div
          className={styles.cards}
          role="group"
          aria-label="Marketing Malaky prepared across six channels"
        >
          {pieces.map((piece, i) => (
            <div
              key={piece.id}
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              className={styles.card}
              data-background={LAYOUT[piece.id]?.background || undefined}
              style={{ width: (LAYOUT[piece.id] ?? FALLBACK_SLOT).width }}
              onPointerEnter={onEnter}
              onPointerLeave={onLeave}
            >
              <div className={styles.cardInner}>
                <PostCard piece={piece} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className={styles.plinth} aria-hidden="true" />
    </div>
  )
}
