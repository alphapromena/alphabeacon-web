/* eslint-disable ab/no-raw-color -- D5 (design.md Part 5): demo-brand
   palettes are CUSTOMER content, the exact point of the hero story. The
   exemption is scoped to this module; verify:w02 fails any other marketing
   file that borrows this disable. */
/**
 * The four persistent demo brands (brief §31): logistics, restaurant,
 * retail, professional services. Every mock output on the marketing route
 * draws from THIS module, so the site reads as one product demo rather than
 * a collage. All names are invented; domains use .example; no real
 * trademarks. Arabic strings await native review (open-items 16).
 *
 * Palette exemption (design.md Part 5, D5): these colors appear ONLY inside
 * mock-post artwork — never on Malaky chrome.
 */

export interface DemoPerson {
  name: string
  role: string
  initials: string
}

export interface DemoBrand {
  id: 'falak' | 'zaytoun' | 'nura' | 'meezan'
  /** Latin name, as the brand writes it. */
  name: string
  /** Arabic name — the brand's own mark, not a translation artifact. */
  nameAr: string
  sector: string
  /** The sector as the brand would say it in Arabic (native, not translated). */
  sectorAr: string
  monogram: string
  /** The brand's own colors — card interiors only (D5). */
  palette: {
    primary: string
    accent: string
    surface: string
    ink: string
  }
  /** The one campaign this brand runs across the whole site (§31). */
  narrative: string
  person: DemoPerson
}

export const DEMO_BRANDS: Record<DemoBrand['id'], DemoBrand> = {
  falak: {
    id: 'falak',
    name: 'Falak Logistics',
    nameAr: 'فلك للشحن',
    sector: 'Logistics',
    sectorAr: 'شركة شحن',
    monogram: 'FL',
    palette: { primary: '#1F3A5F', accent: '#E8823A', surface: '#EEF2F7', ink: '#14263C' },
    narrative: 'Launching a same-day delivery lane between Riyadh and Jeddah.',
    person: { name: 'Omar Suleiman', role: 'Founder, Falak Logistics', initials: 'OS' },
  },
  zaytoun: {
    id: 'zaytoun',
    name: 'Bayt Zaytoun',
    nameAr: 'بيت زيتون',
    sector: 'Restaurant',
    sectorAr: 'مطبخ شامي',
    monogram: 'BZ',
    palette: { primary: '#5A6B3B', accent: '#A63D2F', surface: '#F4F1E7', ink: '#2F3520' },
    narrative: 'A family iftar set menu for Ramadan, and an Eid feast to follow.',
    person: { name: 'Rania Khalil', role: 'Owner, Bayt Zaytoun', initials: 'RK' },
  },
  nura: {
    id: 'nura',
    name: 'Nura Living',
    nameAr: 'نورا ليفينج',
    sector: 'Retail',
    sectorAr: 'تجارة تجزئة',
    monogram: 'N',
    palette: { primary: '#8D5A78', accent: '#E0B084', surface: '#F6EFF3', ink: '#3D2635' },
    narrative: 'The summer home collection drops — linen, clay, and light.',
    person: { name: 'Noor Al-Sayegh', role: 'Creative Director, Nura Living', initials: 'NA' },
  },
  meezan: {
    id: 'meezan',
    name: 'Meezan Advisory',
    nameAr: 'ميزان للاستشارات',
    sector: 'Professional services',
    sectorAr: 'استشارات مهنية',
    monogram: 'M',
    palette: { primary: '#23616B', accent: '#7FB6BF', surface: '#EBF2F3', ink: '#12333A' },
    narrative: 'Guiding clients through the Q3 VAT filing deadline, calmly.',
    person: { name: 'Layla Haddad', role: 'Managing Partner, Meezan Advisory', initials: 'LH' },
  },
}

export const DEMO_BRAND_LIST: DemoBrand[] = Object.values(DEMO_BRANDS)
