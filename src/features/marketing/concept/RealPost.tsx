import {
  getRealPost,
  type RealPost,
  type RealPostId,
} from '@/features/marketing/concept/lib/real-posts'
import styles from './RealPost.module.css'

/**
 * A brand-approved concept example for a real company, rendered as itself.
 *
 * The one rule this component exists to hold: nothing is drawn around the
 * image. These screenshots already contain their own platform chrome, caption,
 * engagement row and creative — putting them inside InstagramPost,
 * LinkedInCompanyPost, NewsletterPreview or any other post component would
 * frame a platform inside a second platform.
 *
 * The image is laid out by width and lets its own intrinsic ratio set the
 * height, so it can never be stretched, letterboxed or cropped. `width` and
 * `height` come from the asset itself, which also gives the browser the ratio
 * before the bytes arrive and keeps the orbit from reflowing on load.
 */
export function RealPostCard({
  post,
  id,
  sizes,
  eager = false,
  className,
}: {
  post?: RealPost
  id?: RealPostId
  /** Layout hint for the browser; the asset is served at one size. */
  sizes?: string
  /** Hero cards are visible immediately, so they skip lazy loading. */
  eager?: boolean
  className?: string
}) {
  const resolved = post ?? (id ? getRealPost(id) : undefined)
  if (!resolved) return null

  return (
    <div className={[styles.card, className].filter(Boolean).join(' ')}>
      <img
        className={styles.shot}
        src={resolved.src}
        width={resolved.width}
        height={resolved.height}
        sizes={sizes}
        alt={resolved.alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
    </div>
  )
}
