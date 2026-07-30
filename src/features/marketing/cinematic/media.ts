/**
 * Every cinematic asset the marketing page renders, in one place — the
 * structural check in verify-w02 greps components for stray media paths, so
 * a new asset must enter here or fail the build. All paths are same-origin
 * files under `public/marketing/` (the zero-network law covers media too;
 * the e2e fixture fails any request that leaves the dev server).
 */
export const CINEMATIC_MEDIA = {
  /** Clip 1's resting frame — reduced-motion hero, and the scrub's poster. */
  heroStatic: '/marketing/hero-static.webp',
  /** Clip 1 as a plain loop — the narrow-viewport fallback for the scrub. */
  heroLoop: '/marketing/hero-loop.mp4',
  /** Clip 2 — the macro glide over the queue; THE LOOP's backdrop. */
  signal: '/marketing/signal-macro.mp4',
  signalPoster: '/marketing/signal-poster.webp',
  /** Clip 3 — the morning desk; the bridge into the real product. */
  morning: '/marketing/morning.mp4',
  morningPoster: '/marketing/morning-poster.webp',
  /** Clip 4 — the dawn beacon; the final CTA's backdrop. */
  dawn: '/marketing/dawn-loop.mp4',
  dawnPoster: '/marketing/dawn-poster.webp',
  /** The REAL app: /today recorded from a dev session, not a mockup. */
  product: '/marketing/product-today.mp4',
  productPoster: '/marketing/product-poster.webp',
} as const
