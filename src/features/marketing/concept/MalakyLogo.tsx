import styles from './MalakyLogo.module.css'

/**
 * The Malaky identity, in one place.
 *
 * Every Malaky logo placement on the site renders through this component, so
 * sizing and behaviour stay consistent and the artwork is referenced exactly
 * once.
 *
 * The artwork is the supplied file, used as-is: never recoloured, redrawn,
 * cropped or reproportioned. It is sized by height, with width derived from
 * the file's own intrinsic dimensions so the aspect ratio cannot drift.
 */
const LOGO_ASSET = '/brand/malaky-logo-gold.png'

/**
 * Intrinsic pixel dimensions of the supplied PNG (750 x 370, RGBA).
 * Used only to derive width from height and to reserve layout space — the
 * file itself is untouched.
 */
const INTRINSIC = { width: 750, height: 370 } as const

/** Rendered height per placement, in px. */
const SIZES = {
  nav: 52,
  footer: 56,
} as const

export type LogoSize = keyof typeof SIZES

export function MalakyLogo({
  size = 'nav',
  /** True when the brand name is already exposed accessibly next to this. */
  decorative = false,
  className,
}: {
  size?: LogoSize
  decorative?: boolean
  className?: string
}) {
  const height = SIZES[size]
  const width = Math.round((height * INTRINSIC.width) / INTRINSIC.height)
  const classes = [styles.logo, styles[size], className].filter(Boolean).join(' ')

  return (
    /* A plain <img>: this is a small fixed-size brand asset, and
       height-with-derived-width is exactly what must not be overridden by an
       optimiser. width/height are set to reserve layout space; CSS controls
       the painted size. (Upstream said "rather than next/image"; this build
       has no image component to decline.) */
    <img
      src={LOGO_ASSET}
      alt={decorative ? '' : 'Malaky'}
      aria-hidden={decorative || undefined}
      width={width}
      height={height}
      className={classes}
      draggable={false}
    />
  )
}

export { LOGO_ASSET }
