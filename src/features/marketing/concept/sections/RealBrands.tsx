import { useCallback, useEffect, useRef, useState } from 'react'
import { GALLERY_POSTS } from '@/features/marketing/concept/lib/real-posts'
import { useReveal } from '@/features/marketing/concept/useConceptHooks'
import { RealPostCard } from '../RealPost'
import { SectionHead, Stop } from '../ui'
import { ArrowRight } from '../icons'
import styles from './realBrands.module.css'

/**
 * Malaky customers, at a size where the work can actually be read.
 *
 * This is the one section where the work is not ours to compose. Everything
 * here is marketing these companies really published — shown whole, at its own
 * aspect ratio, with no chrome drawn around it and nothing written over it.
 * Elsewhere on the page the cards are Malaky-prepared concept executions and
 * say so; here they are not, and that difference is the point of the section.
 *
 * The caption underneath is two lines and no more: the company, then sector
 * and channel. It states the range Malaky covers rather than reviewing the
 * creative, and it makes no claim about results.
 *
 * The rail is a native horizontal scroller: it works with a trackpad, a
 * touch drag, the arrow keys and the buttons, and needs no JavaScript to be
 * usable at all.
 */
export function RealBrands() {
  const railRef = useRef<HTMLUListElement>(null)
  const [ref, reveal] = useReveal<HTMLDivElement>({ threshold: 0.08 })
  const [edge, setEdge] = useState<'start' | 'middle' | 'end'>('start')

  const syncEdge = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    const max = rail.scrollWidth - rail.clientWidth
    // Left-to-right and right-to-left both report distance travelled; the
    // sign differs, so compare on magnitude.
    const x = Math.abs(rail.scrollLeft)
    setEdge(max <= 1 ? 'start' : x < 8 ? 'start' : x > max - 8 ? 'end' : 'middle')
  }, [])

  useEffect(() => {
    syncEdge()
    window.addEventListener('resize', syncEdge)
    return () => window.removeEventListener('resize', syncEdge)
  }, [syncEdge])

  const nudge = (direction: 1 | -1) => {
    const rail = railRef.current
    if (!rail) return
    const step = rail.firstElementChild?.clientWidth ?? rail.clientWidth * 0.7
    rail.scrollBy({ left: (step + 24) * direction, behavior: 'smooth' })
  }

  return (
    <section className={styles.section} id="real-brands" aria-labelledby="real-brands-title">
      <div className="shell">
        <SectionHead
          id="real-brands-title"
          title={
            <>
              See Malaky across real brands
              <Stop />
            </>
          }
          lead="Different industries. Different channels. One system that adapts to the brand."
        >
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.arrow}
              onClick={() => nudge(-1)}
              disabled={edge === 'start'}
              aria-label="Show previous brands"
            >
              <ArrowRight size={15} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <button
              type="button"
              className={styles.arrow}
              onClick={() => nudge(1)}
              disabled={edge === 'end'}
              aria-label="Show more brands"
            >
              <ArrowRight size={15} />
            </button>
          </div>
        </SectionHead>
      </div>

      <div className={styles.railWrap} ref={ref} data-reveal={reveal} data-edge={edge}>
        <ul
          className={styles.rail}
          ref={railRef}
          onScroll={syncEdge}
          tabIndex={0}
          /* PORT FIX (M2): upstream carried role="group" here, which strips
             the list role from every child and makes each <li> an orphan
             (axe: "List item parent element has a role that is not
             role=list"). A focusable, labelled <ul> keeps the keyboard
             affordance AND the list semantics. */
          aria-label="Published marketing from five Malaky customers"
        >
          {GALLERY_POSTS.map((post, i) => (
            <li
              key={post.id}
              className={styles.item}
              /* The column is sized from the screenshot's own ratio, so every
                 card lands on one shared height without anything being
                 scaled non-uniformly. */
              style={
                {
                  '--i': i,
                  '--ratio': post.width / post.height,
                } as React.CSSProperties
              }
            >
              <RealPostCard
                post={post}
                sizes="(max-width: 700px) 78vw, (max-width: 1100px) 46vw, 360px"
              />
              <div className={styles.meta}>
                <p className={styles.company}>{post.company}</p>
                <p className={styles.channel}>
                  {post.industry}
                  <span aria-hidden="true"> · </span>
                  {post.platform}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="shell">
        {/* Truthful and quiet. They are customers, which the founder has
            confirmed — so the line says customers, and says nothing about
            results, which nobody has measured here. */}
        <p className={styles.note}>
          Malaky customer examples across education, technology, professional services, branding and
          hospitality.
        </p>
      </div>
    </section>
  )
}
