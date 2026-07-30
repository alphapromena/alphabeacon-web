/**
 * The hero scrub's frame store.
 *
 * THE LAW (design.md Part 5 — cinematic layer): the scrub runs on canvas
 * frames, never on a video element's currentTime. Seeking a video is
 * keyframe-quantized and decode-latency-bound — it stutters exactly when the
 * user is paying the most attention. 200 WebP frames drawn to a canvas cost
 * more bytes and scrub perfectly; that trade is the whole point of the
 * pipeline that produced `public/marketing/hero/`.
 *
 * Loading is progressive by stride — every 8th frame, then every 2nd, then
 * all — so the scrub is usable the moment the first coarse pass lands and
 * sharpens as the rest arrive. `nearestLoadedIndex` is what makes the coarse
 * pass workable: a request for frame 37 renders frame 40 until 37 exists.
 */

export const HERO_FRAME_COUNT = 200

export const heroFramePath = (index: number) =>
  `/marketing/hero/frame-${String(index).padStart(3, '0')}.webp`

/** Coarse-to-fine load order: strides 8, 2, 1 — each frame exactly once. */
export function frameLoadOrder(count = HERO_FRAME_COUNT): number[] {
  const seen = new Set<number>()
  const order: number[] = []
  for (const stride of [8, 2, 1]) {
    for (let index = 0; index < count; index += stride) {
      if (!seen.has(index)) {
        seen.add(index)
        order.push(index)
      }
    }
  }
  // The final frame is the resting state; the strides only reach it late, so
  // promote it into the coarse pass right after frame 0.
  const last = count - 1
  const at = order.indexOf(last)
  if (at > 1) {
    order.splice(at, 1)
    order.splice(1, 0, last)
  }
  return order
}

/** The loaded frame nearest to `target`, or -1 while nothing has arrived. */
export function nearestLoadedIndex(loaded: readonly boolean[], target: number): number {
  const count = loaded.length
  if (count === 0) return -1
  const clamped = Math.min(count - 1, Math.max(0, target))
  if (loaded[clamped]) return clamped
  for (let distance = 1; distance < count; distance += 1) {
    if (clamped - distance >= 0 && loaded[clamped - distance]) return clamped - distance
    if (clamped + distance < count && loaded[clamped + distance]) return clamped + distance
  }
  return -1
}

/** Owns the Image elements and the progressive queue. Browser-only. */
export class HeroFrameStore {
  private images: (HTMLImageElement | null)[]
  private loaded: boolean[]
  private queue: number[]
  private inFlight = 0

  constructor(
    count = HERO_FRAME_COUNT,
    private readonly pathOf: (index: number) => string = heroFramePath,
  ) {
    this.images = Array.from({ length: count }, () => null)
    this.loaded = Array.from({ length: count }, () => false)
    this.queue = frameLoadOrder(count)
  }

  start(concurrency = 6) {
    for (let slot = 0; slot < concurrency; slot += 1) this.pump()
  }

  private pump() {
    const next = this.queue.shift()
    if (next === undefined) return
    this.inFlight += 1
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      this.images[next] = image
      this.loaded[next] = true
      this.inFlight -= 1
      this.pump()
    }
    image.onerror = () => {
      // A missing frame is a build defect, not a runtime condition; skip it
      // and let nearestLoadedIndex paper over the gap.
      this.inFlight -= 1
      this.pump()
    }
    image.src = this.pathOf(next)
  }

  /** Nearest decoded frame to `index`, with its actual index. */
  nearest(index: number): { image: HTMLImageElement; index: number } | null {
    const at = nearestLoadedIndex(this.loaded, index)
    const image = at >= 0 ? this.images[at] : null
    return image ? { image, index: at } : null
  }
}
