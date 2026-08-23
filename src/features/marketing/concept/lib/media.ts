/**
 * Media model for every marketing creative in the concept.
 *
 * The rule this file exists to enforce: a creative belongs to one channel.
 * Nothing re-crops a single artwork across six formats any more — each
 * channel resolves its own asset, and only falls back to a generated scene
 * while no real asset has been supplied.
 *
 * Assets are described, never assumed: type, aspect ratio, alt text and an
 * optional focal point travel with the asset, so framing is a property of the
 * creative rather than of whichever component happens to render it.
 */

import type { CampaignCreativeId } from './campaign-creative'

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

/**
 * Concept creative, drawn by Malaky.
 *
 * Every scene here is neutral by construction: none carries a customer's
 * colours, marks or photography, because we hold none of those and inventing
 * them would turn a real customer back into a fictional one.
 *
 * So a scene is named for what it depicts, never for whose it is. Assigning
 * one to a concept execution is a composition decision — it is not a claim
 * that the customer's own creative looks like this, and every card carrying
 * one is labelled as prepared work.
 */
export type MediaScene =
  /** Abstract lattice of records and links — data, governance, monitoring. */
  | 'data-lattice'
  /** Abstract flow across a wide frame — pipelines, movement, throughput. */
  | 'signal-flow'
  /** A working office at dusk — professional services subjects. */
  | 'office'
  /** A long table laid for service — dining and hospitality subjects. */
  | 'long-table'
  /** A close still life — product and food subjects. */
  | 'still-life'

export type AspectRatio = '1:1' | '4:5' | '16:9' | '9:16' | '3:2'

export const ASPECT_CSS: Record<AspectRatio, string> = {
  '1:1': '1 / 1',
  '4:5': '4 / 5',
  '16:9': '16 / 9',
  '9:16': '9 / 16',
  '3:2': '3 / 2',
}

/**
 * The part of the frame that must survive cropping, as fractions of the
 * asset's own width and height. Defaults to dead centre, which reproduces
 * the previous behaviour exactly.
 */
export interface FocalPoint {
  x: number
  y: number
}

export const CENTRE: FocalPoint = { x: 0.5, y: 0.5 }

/* ------------------------------------------------------------------ *
 * Media
 * ------------------------------------------------------------------ */

interface MediaCommon {
  /** Descriptive alt text. Required — a creative always describes itself. */
  alt: string
  aspect: AspectRatio
  /** Where to anchor the crop. Omit for centre. */
  focal?: FocalPoint
  /** Text set into the creative, as a real campaign image would carry. */
  overline?: string
  caption?: string
  /** Malaky-drawn concept creative, used where no real asset is supplied. */
  scene?: MediaScene
  /**
   * Campaign creative composed in the customer's own design language, from a
   * campaign they really published. Takes precedence over `scene`.
   * See ./campaign-creative.
   */
  creative?: CampaignCreativeId
}

export interface ImageMedia extends MediaCommon {
  /** Optional so existing content is valid unchanged; defaults to "image". */
  type?: 'image'
  /** Public path, e.g. /brand/customers/ataccama/linkedin-16x9.jpg. */
  src?: string
  /** Density or format alternatives, passed straight to srcset. */
  srcSet?: string
}

export interface VideoMedia extends MediaCommon {
  type: 'video'
  /** Public path to the video file. */
  src?: string
  /** Still frame shown before playback, and the whole story under
   *  reduced motion. */
  poster?: string
  /** Displayed duration, e.g. "0:18". */
  durationLabel?: string
}

/**
 * A single creative. The union is deliberately open at the edges — adding
 * `CarouselMedia` later is additive and needs no rewrite of consumers, which
 * narrow on `type`.
 */
export type PieceMedia = ImageMedia | VideoMedia

export function isVideo(media: PieceMedia): media is VideoMedia {
  return media.type === 'video'
}

/** True once a real asset exists; false while the generated scene stands in. */
export function hasRealAsset(media: PieceMedia): boolean {
  return Boolean(media.src)
}

/* ------------------------------------------------------------------ *
 * Framing
 * ------------------------------------------------------------------ */

/** CSS object-position for a raster asset. */
export function focalToObjectPosition(focal: FocalPoint = CENTRE): string {
  return `${(focal.x * 100).toFixed(1)}% ${(focal.y * 100).toFixed(1)}%`
}

/**
 * SVG preserveAspectRatio alignment for a generated scene.
 *
 * Scenes are authored square and sliced into five formats, so without this
 * every non-square crop takes the middle of the artwork whether or not the
 * subject is there. A centre focal point yields "xMidYMid slice", which is
 * exactly the previous behaviour.
 */
export function focalToPreserveAspectRatio(focal: FocalPoint = CENTRE): string {
  const x = focal.x < 0.34 ? 'xMin' : focal.x > 0.66 ? 'xMax' : 'xMid'
  const y = focal.y < 0.34 ? 'YMin' : focal.y > 0.66 ? 'YMax' : 'YMid'
  return `${x}${y} slice`
}

/* ------------------------------------------------------------------ *
 * Channels
 * ------------------------------------------------------------------ */

/** Every surface a brand can publish to in this concept. */
export type ChannelKey =
  'linkedin-company' | 'instagram' | 'linkedin-executive' | 'x' | 'newsletter' | 'reel'

/** The format each channel publishes in, unless an asset overrides it. */
export const CHANNEL_ASPECT: Record<ChannelKey, AspectRatio> = {
  'linkedin-company': '16:9',
  instagram: '1:1',
  'linkedin-executive': '16:9',
  x: '16:9',
  newsletter: '3:2',
  reel: '9:16',
}

/**
 * A brand's creative set — one purpose-built asset per channel.
 *
 * Partial by design: a brand supplies assets as they are produced, and any
 * channel without one falls back to the brand's placeholder scene.
 */
export type BrandMediaSet = Partial<Record<ChannelKey, PieceMedia>>

/**
 * Resolves the creative for one channel.
 *
 * Order of precedence:
 *   1. the asset assigned to this specific channel
 *   2. the brand's placeholder scene, framed for this channel's aspect
 *
 * This is the seam that replaced the shared-scene argument. Supplying a real
 * asset for a channel is a data change; no component needs touching.
 */
export function resolveChannelMedia(
  channel: ChannelKey,
  set: BrandMediaSet | undefined,
  fallback: { scene: MediaScene; alt: string },
): PieceMedia {
  const assigned = set?.[channel]
  if (assigned) {
    return { ...assigned, aspect: assigned.aspect ?? CHANNEL_ASPECT[channel] }
  }
  return {
    type: 'image',
    scene: fallback.scene,
    alt: fallback.alt,
    aspect: CHANNEL_ASPECT[channel],
  }
}
