/**
 * Every film asset path lives here and ONLY here (verify:w02 — the film-path
 * law). The footage is the 2026-08-09 Seedance 2.0 set: one hero-image
 * reference (nano_banana_pro) drove all three clips, so the object cannot
 * drift between the scrub, the detail macro, and the calm pull-back.
 * Take/job provenance is recorded in decisions.md.
 */

/** Frames extracted from the hero assembly clip (take B), 1536×864 WebP. */
export const HERO_FRAME_COUNT = 193

export function heroFrameSrc(index: number): string {
  return `/film/hero/frame-${String(index + 1).padStart(3, '0')}.webp`
}

/** Ambient clips: H.264 CRF 28, faststart, silent — never shipped raw. */
export const FILM = {
  detail: '/film/detail.mp4',
  detailPoster: '/film/detail-poster.webp',
  calm: '/film/calm.mp4',
  calmPoster: '/film/calm-poster.webp',
} as const
