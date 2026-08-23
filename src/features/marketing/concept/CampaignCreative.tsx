import {
  ALPHA_PRO_BRAND,
  SHRIMP_JOINT_BRAND,
  getCampaignCreative,
  type CampaignCreativeId,
} from '@/features/marketing/concept/lib/campaign-creative'
import { getCustomer } from '@/features/marketing/concept/lib/customers'
import styles from './CampaignCreative.module.css'

/**
 * A campaign creative composed on the customer's own image.
 *
 * The photograph or render is theirs, reframed and otherwise untouched. The
 * logo is the supplied artwork, placed. The colours are sampled from their
 * published work rather than chosen. What is ours is the arrangement and, on
 * an Arabic card, the Arabic — and the sections these sit in say so.
 *
 * It scales with its frame rather than at fixed sizes: the same composition
 * serves a ~270px card in the fan-out and a much larger campaign panel, so
 * type is set in container-query units against the creative's own box.
 */
export function CampaignCreative({ id }: { id: CampaignCreativeId }) {
  const creative = getCampaignCreative(id)
  const customer = getCustomer(creative.customerId)
  const rtl = creative.dir === 'rtl'
  const brand = creative.customerId === 'shrimp-joint' ? SHRIMP_JOINT_BRAND : ALPHA_PRO_BRAND
  const ar = rtl ? styles.ar : ''

  return (
    <div
      className={`${styles.creative} ${styles[creative.layout]}`}
      dir={creative.dir}
      role="img"
      aria-label={creative.alt}
      style={{ '--ground': brand.ground, '--accent': brand.accent } as React.CSSProperties}
    >
      {/* Their own image, cropped from their published creative and reframed —
          the hero the composition is built around. The scrim over it is what
          resolves it into the ground; it changes nothing about the image. */}
      <img
        className={styles.photo}
        src={creative.photo.src}
        alt=""
        aria-hidden="true"
        /* PORT ADDITION (M2): the same lazy/async hints the port's other
           <img> tags already carry. These four customer photographs are the
           largest assets on the site, and without a hint every one of them
           downloaded on first paint whether or not the visitor had scrolled
           to it. An image already in the viewport still loads immediately. */
        loading="lazy"
        decoding="async"
        style={{ objectPosition: creative.photo.focal }}
      />
      <span className={styles.scrim} aria-hidden="true" />

      {customer.logo && (
        <img
          className={styles.logo}
          src={customer.logo.src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      )}

      <p className={`${styles.kicker} ${ar}`}>{creative.kicker}</p>

      <p className={`${styles.headline} ${rtl ? styles.headlineAr : ''}`}>
        {creative.headline}
        <span className={styles.accent}>{creative.headlineAccent}</span>
      </p>

      <span className={styles.rule} aria-hidden="true" />

      {creative.cta ? (
        <div className={styles.orderRow}>
          <span className={`${styles.cta} ${ar}`}>{creative.cta}</span>
          <span className={`${styles.productName} ${ar}`}>{creative.productName}</span>
        </div>
      ) : (
        creative.productName && (
          <p className={`${styles.productName} ${styles.standalone} ${ar}`}>
            {creative.productName}
          </p>
        )
      )}

      {/* The markets the customer names on their own creative, in their words. */}
      {creative.markets && <p className={`${styles.markets} ${ar}`}>{creative.markets}</p>}
    </div>
  )
}
