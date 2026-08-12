import { cn } from '@/lib/utils'
import type { DemoBrand } from './demo-brands'

/**
 * Tiny vector logo marks for the five fictional demo brands (founder
 * directive 2026-08-11: believable logos, not letter avatars). Drawn
 * inline as SVG so no assets ship; every fill comes from the brand's own
 * palette in demo-brands.ts — no raw colors here, and the Malaky wordmark
 * is untouched. Decorative (`aria-hidden`): the adjacent text names the
 * brand.
 *
 * The marks are deliberately simple and secondary to Malaky:
 * - Falak ("orbit"): an orbit ring around a rising dot, navy/orange.
 * - Bayt Zaytoun: an olive sprig — stem and two leaves.
 * - Nura Living: the arch-window motif its campaign artwork already uses.
 * - Meezan ("scales"): a balance — beam, pivot, two pans.
 * - Orbital Reach: a planet limb with an ascending trajectory and its
 *   satellite at the tip — deliberately unlike Falak's flat orbit ring.
 */
export function BrandLogo({
  brand,
  round = false,
  className,
}: {
  brand: DemoBrand
  /** Round for person-less feed avatars; square-ish for company pages. */
  round?: boolean
  className?: string
}) {
  const { primary, accent, surface } = brand.palette
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden',
        round ? 'rounded-full' : 'rounded-md',
        className ?? 'size-9',
      )}
      style={{ background: primary }}
    >
      {brand.id === 'falak' && (
        <svg viewBox="0 0 24 24" className="size-[70%]">
          <circle cx="12" cy="13" r="4.2" fill={accent} />
          <ellipse
            cx="12"
            cy="12"
            rx="9"
            ry="3.4"
            fill="none"
            stroke={surface}
            strokeWidth="1.6"
            transform="rotate(-18 12 12)"
          />
        </svg>
      )}
      {brand.id === 'zaytoun' && (
        <svg viewBox="0 0 24 24" className="size-[70%]">
          <path
            d="M12 20C12 13 13.5 8.5 17 4.5"
            fill="none"
            stroke={surface}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <ellipse cx="9.2" cy="12.5" rx="3.4" ry="2" fill={surface} transform="rotate(-32 9.2 12.5)" />
          <ellipse cx="16.4" cy="9.5" rx="3.2" ry="1.9" fill={accent} transform="rotate(28 16.4 9.5)" />
        </svg>
      )}
      {brand.id === 'nura' && (
        <svg viewBox="0 0 24 24" className="size-[70%]">
          <path d="M6.5 20v-7.5a5.5 5.5 0 0 1 11 0V20Z" fill={surface} />
          <circle cx="17.5" cy="6.5" r="2.2" fill={accent} />
        </svg>
      )}
      {brand.id === 'orbital' && (
        <svg viewBox="0 0 24 24" className="size-[70%]">
          <path
            d="M3.5 17.5a9.5 9.5 0 0 1 17 0"
            fill="none"
            stroke={surface}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M5 20c5-1.5 10.5-6 13.5-13"
            fill="none"
            stroke={accent}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="18.6" cy="6.6" r="2.1" fill={accent} />
        </svg>
      )}
      {brand.id === 'meezan' && (
        <svg viewBox="0 0 24 24" className="size-[70%]">
          <path d="M12 4v13" stroke={surface} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M5 7h14" stroke={surface} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M5 7l-2 5a3 3 0 0 0 6 0Z" fill={accent} />
          <path d="M19 7l-2 5a3 3 0 0 0 6 0Z" fill={surface} transform="translate(-2 0)" />
          <path d="M8.5 19h7" stroke={surface} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}
    </span>
  )
}
