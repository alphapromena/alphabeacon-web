/**
 * Campaign photography for the demo brands (founder-approved pass,
 * 2026-08-11). Each still is the CREATIVE ONLY — no platform chrome, no
 * third-party logos, no real brands, no recognisable people — generated
 * for these fictional brands and served locally from `public/campaigns/`
 * through the §26 ContentAsset slot.
 *
 * Cards layer their type lockups ON TOP in live HTML, so photography
 * carries the mood while the words stay crisp at every size, translatable,
 * and editable without regenerating an asset. That split is the point: it
 * is also how Malaky itself composes a creative.
 */
import type { DemoBrand } from './demo-brands'

export const CAMPAIGN_PHOTOS: Partial<Record<DemoBrand['id'], string>> = {
  falak: '/campaigns/falak-truck.webp',
  nura: '/campaigns/nura-interior.webp',
  zaytoun: '/campaigns/zaytoun-iftar.webp',
  // meezan is deliberately text-first — advisory work has no product shot,
  // and its executive post is stronger without one.
}

/** The still that belongs to a brand, so a card never has to be told. */
export const photoFor = (brand: DemoBrand): string | undefined => CAMPAIGN_PHOTOS[brand.id]
