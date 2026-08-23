import { useEffect, useRef } from 'react'
import { focalToObjectPosition, type FocalPoint } from '@/features/marketing/concept/lib/media'
import { usePrefersReducedMotion } from '@/features/marketing/concept/useConceptHooks'
import styles from './BrandMedia.module.css'

/**
 * Video playback for a marketing creative.
 *
 * Deliberately restrained, because a page full of autoplaying video is the
 * failure mode we are avoiding:
 *
 * - muted, looping, inline — never takes over the page or makes sound
 * - plays only while at least half the frame is on screen, pauses otherwise
 * - `preload="none"` so nothing downloads until it is nearly in view
 * - under prefers-reduced-motion the video is never mounted at all and the
 *   poster carries the whole story
 *
 * The poster is required in practice: it is what the visitor sees before
 * playback, offscreen, and under reduced motion.
 */
export function BrandVideo({
  src,
  poster,
  focal,
}: {
  src: string
  poster?: string
  focal?: FocalPoint
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const objectPosition = focalToObjectPosition(focal)

  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion) return
    if (typeof IntersectionObserver === 'undefined') return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // play() rejects if the browser blocks it; nothing to recover.
          void el.play().catch(() => {})
        } else {
          el.pause()
        }
      },
      { threshold: 0.5 },
    )
    io.observe(el)

    const onVisibility = () => {
      if (document.hidden) el.pause()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      el.pause()
    }
  }, [reducedMotion])

  // Reduced motion: the poster is the creative. No video element is mounted.
  if (reducedMotion) {
    return poster ? (
      <img
        className={styles.canvas}
        src={poster}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ objectFit: 'cover', objectPosition }}
      />
    ) : null
  }

  return (
    <video
      ref={ref}
      className={styles.canvas}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      // Decorative here: the wrapper carries role="img" and the alt text.
      aria-hidden="true"
      tabIndex={-1}
      style={{ objectFit: 'cover', objectPosition }}
    />
  )
}
