import type { Customer, CustomerExecutive } from '@/features/marketing/concept/lib/customers'
import styles from './BrandMark.module.css'

/**
 * A customer's own logo, placed exactly as supplied.
 *
 * Nothing here edits artwork. It is not recoloured, not traced, not lettered,
 * not cropped and not cut out of its background — the whole reason the
 * fictional brand ecosystem was retired is that an invented mark makes a real
 * customer look made up, and a *modified* mark is the same problem wearing a
 * better disguise.
 *
 * Two things about the files therefore have to be solved in the container
 * rather than in the file.
 *
 * **Shape.** Three of these are wordmark lockups, not square avatars —
 * Ataccama's is seven times wider than it is tall. Forcing one into a square
 * would shrink it to an unreadable smear, so the box takes the artwork's own
 * ratio up to a cap and stays square for anything roughly square. The rows
 * these sit in are flex, so a wider mark shifts the text along and nothing
 * else moves.
 *
 * **Background.** Three arrived with a light plate baked in, which is how the
 * customer supplied them. Rather than knock the background out, the container
 * gives them a light surface to sit on. That reads as a logo on its own card,
 * which is a normal way to place a mark on a dark page.
 */

/** Past this, a mark is a wordmark and gets a wider box. */
const WORDMARK_RATIO = 1.6
/** No lockup gets more than this much width, however wide the file is. */
const MAX_RATIO = 3.2

/**
 * True when the supplied artwork is a lockup that already spells the company
 * out — Ataccama, Baker Tilly and Inception DAP all do.
 *
 * Account rows use this to avoid printing the name twice. A square badge like
 * ILA's needs the name beside it; a wordmark is the name, and setting it again
 * next to itself reads as a mistake.
 */
export function isWordmark(customer: Customer): boolean {
  const logo = customer.logo
  return !!logo && logo.width / logo.height > WORDMARK_RATIO
}

export function CustomerLogo({ customer, size = 32 }: { customer: Customer; size?: number }) {
  if (customer.logo) {
    const { logo } = customer
    const ratio = logo.width / logo.height
    const wide = ratio > WORDMARK_RATIO
    const boxWidth = wide ? Math.round(size * Math.min(ratio, MAX_RATIO)) : size
    const light = logo.background === 'light'

    /* Proportional to the box, computed here rather than in CSS: a percentage
       padding would resolve against the row's width, not the mark's. */
    const inset = light ? Math.max(2, Math.round(size * 0.09)) : 0

    return (
      <span
        className={`${styles.mark} ${light ? styles.plate : ''}`}
        style={{ width: boxWidth, height: size, padding: inset || undefined }}
      >
        {/* contain, always: the artwork keeps its own proportions. */}
        <img
          src={logo.src}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </span>
    )
  }

  /* No artwork yet. A neutral tile that reads as a reserved slot rather than
     as anyone's identity — never a drawn mark standing in for a real one. */
  return (
    <span
      className={`${styles.mark} ${styles.pending}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${customer.name} — logo not yet supplied`}
      title={`${customer.name} — official logo pending`}
    >
      <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
        <rect
          x="3.5"
          y="3.5"
          width="25"
          height="25"
          rx="5"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.5"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
      </svg>
    </span>
  )
}

/**
 * An executive's avatar.
 *
 * `portrait` is null for everyone in this concept, and a generated face would
 * be a likeness we invented for a real person. So the placeholder is a
 * monogram on a neutral surface — a convention every reader understands as
 * "no photograph", and not a claim about how anybody looks.
 */
export function ExecutiveAvatar({
  executive,
  size = 40,
}: {
  executive: CustomerExecutive
  size?: number
}) {
  if (executive.portrait) {
    return (
      <span className={styles.portrait} style={{ width: size, height: size }}>
        <img
          src={executive.portrait.src}
          alt={executive.portrait.alt}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </span>
    )
  }

  const initials = executive.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

  return (
    <span
      className={`${styles.portrait} ${styles.monogram}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      role="img"
      aria-label={executive.name}
    >
      {initials}
    </span>
  )
}
