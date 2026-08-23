import { useCallback, useEffect, useRef, useState } from 'react'
import type { MarketingPiece } from '@/features/marketing/concept/lib/content'
import { PostCard } from '../posts'
import { usePrefersReducedMotion } from '@/features/marketing/concept/useConceptHooks'
import { ArrowRight } from '../icons'
import styles from './cardStack.module.css'

/**
 * The mobile counterpart to the orbit: a deck that advances on its own and
 * can be swiped. Deliberately not a shrunken orbit — small screens get a
 * composition built for a thumb.
 */

const AUTO_MS = 4600
const SWIPE_PX = 56

export function CardStack({
  pieces,
  active = true,
}: {
  pieces: MarketingPiece[]
  active?: boolean
}) {
  const [index, setIndex] = useState(0)
  const [held, setHeld] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const frontRef = useRef<HTMLLIElement | null>(null)
  const dragStart = useRef<number | null>(null)
  const n = pieces.length

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + n) % n), [n])

  useEffect(() => {
    if (!active || held || reducedMotion) return
    const t = window.setInterval(() => go(1), AUTO_MS)
    return () => window.clearInterval(t)
  }, [active, held, reducedMotion, go])

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientX
    setHeld(true)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current == null || !frontRef.current) return
    const dx = e.clientX - dragStart.current
    frontRef.current.style.transform = `translateX(${dx}px) rotate(${dx * 0.02}deg)`
  }

  const endDrag = (e: React.PointerEvent) => {
    if (dragStart.current == null) return
    const dx = e.clientX - dragStart.current
    if (frontRef.current) frontRef.current.style.transform = ''
    dragStart.current = null
    setHeld(false)
    if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1)
  }

  return (
    <div className={styles.wrap}>
      <ul
        className={styles.deck}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {pieces.map((piece, i) => {
          const offset = (i - index + n) % n
          const shown = offset < 3
          return (
            <li
              key={piece.id}
              ref={offset === 0 ? frontRef : undefined}
              className={styles.slot}
              data-offset={offset}
              aria-hidden={offset !== 0}
              style={{
                zIndex: n - offset,
                opacity: shown ? 1 - offset * 0.34 : 0,
                transform: shown
                  ? `translateY(${offset * 15}px) scale(${1 - offset * 0.055})`
                  : 'translateY(45px) scale(0.83)',
                pointerEvents: offset === 0 ? 'auto' : 'none',
              }}
            >
              <PostCard piece={piece} />
            </li>
          )
        })}
      </ul>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => go(-1)}
          aria-label="Previous prepared piece"
        >
          <ArrowRight size={15} style={{ transform: 'rotate(180deg)' }} />
        </button>

        <ul className={styles.dots}>
          {pieces.map((piece, i) => (
            <li key={piece.id}>
              <button
                type="button"
                className={styles.dot}
                data-on={i === index || undefined}
                aria-current={i === index}
                aria-label={`Show ${piece.label}`}
                onClick={() => setIndex(i)}
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={styles.arrow}
          onClick={() => go(1)}
          aria-label="Next prepared piece"
        >
          <ArrowRight size={15} />
        </button>
      </div>

      <p className={styles.status} aria-live="polite">
        {pieces[index].label}
      </p>
    </div>
  )
}
