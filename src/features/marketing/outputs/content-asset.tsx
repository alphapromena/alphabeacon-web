/**
 * The one creative slot (Phase 2 §26): every campaign visual on the
 * marketing site renders through this component, so the day an approved
 * asset arrives (Docs/brief/asset-manifest-phase2.md — stills first, then
 * the one Reel), it slots in as data, not as a redesign.
 *
 * Types:
 *   css      — today's palette-driven lockups (children render as-is).
 *   image    — a single still.
 *   carousel — a swipeable strip of stills (scroll-snap, no JS engine).
 *   video    — poster-first, muted, looped; downloads and plays ONLY when
 *              near the viewport AND the cinematic layer is on. Reduced
 *              motion sees the poster, full stop.
 *
 * Performance is part of the contract (§5, §22): `loading="lazy"` on every
 * still, `preload="none"` + in-view src assignment on video, and the
 * aspect ratio is set from data so nothing ever reflows on arrival.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useCinematicLayer } from './use-media'

export type ContentAssetSpec =
  | { type: 'css'; children: ReactNode }
  | { type: 'image'; src: string; alt: string; aspectRatio: string }
  | { type: 'carousel'; slides: { src: string; alt: string }[]; aspectRatio: string }
  | {
      type: 'video'
      src: string
      poster: string
      alt: string
      aspectRatio: string
      durationSeconds?: number
    }

export function ContentAsset({ asset, className }: { asset: ContentAssetSpec; className?: string }) {
  if (asset.type === 'css') return <div className={className}>{asset.children}</div>

  if (asset.type === 'image') {
    return (
      <img
        src={asset.src}
        alt={asset.alt}
        loading="lazy"
        decoding="async"
        className={cn('w-full object-cover', className)}
        style={{ aspectRatio: asset.aspectRatio }}
      />
    )
  }

  if (asset.type === 'carousel') {
    return (
      <div
        role="group"
        aria-label={`Carousel, ${asset.slides.length} slides`}
        className={cn('flex snap-x snap-mandatory overflow-x-auto', className)}
      >
        {asset.slides.map((slide) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            loading="lazy"
            decoding="async"
            className="w-full shrink-0 snap-center object-cover"
            style={{ aspectRatio: asset.aspectRatio }}
          />
        ))}
      </div>
    )
  }

  return <AssetVideo asset={asset} className={className} />
}

function AssetVideo({
  asset,
  className,
}: {
  asset: Extract<ContentAssetSpec, { type: 'video' }>
  className?: string
}) {
  const cinematic = useCinematicLayer()
  const ref = useRef<HTMLVideoElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || !cinematic) return
    if (typeof IntersectionObserver !== 'function') {
      setNear(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          observer.disconnect()
        }
      },
      // Start fetching one viewport early so playback is ready on arrival.
      { rootMargin: '100% 0%' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [cinematic])

  // Reduced motion (or no observer yet): the poster is the experience.
  if (!cinematic) {
    return (
      <img
        src={asset.poster}
        alt={asset.alt}
        loading="lazy"
        decoding="async"
        className={cn('w-full object-cover', className)}
        style={{ aspectRatio: asset.aspectRatio }}
      />
    )
  }

  return (
    <video
      ref={ref}
      // src attaches only near the viewport, so far-away videos cost 0 bytes.
      src={near ? asset.src : undefined}
      poster={asset.poster}
      aria-label={asset.alt}
      muted
      loop
      playsInline
      autoPlay={near}
      preload="none"
      className={cn('w-full object-cover', className)}
      style={{ aspectRatio: asset.aspectRatio }}
    />
  )
}
