import { useEffect, useRef } from 'react'

/**
 * Ambient film: decorative, silent, and honest about it — aria-hidden with a
 * poster, muted and inline, playing only while its section is on screen. The
 * clip is never content; the copy above it carries everything.
 */
export function AmbientClip({
  src,
  poster,
  className,
}: {
  src: string
  poster: string
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (typeof IntersectionObserver !== 'function') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      playsInline
      loop
      preload="metadata"
      aria-hidden
      tabIndex={-1}
      className={className}
    />
  )
}
