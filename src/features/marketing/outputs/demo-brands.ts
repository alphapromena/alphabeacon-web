/* eslint-disable ab/no-raw-color -- D5 (design.md Part 5): demo-brand
   palettes are CUSTOMER content, the exact point of the hero story. The
   exemption is scoped to this module; verify:w02 fails any other marketing
   file that borrows this disable. */
/**
 * The five persistent demo brands (brief §31): logistics, restaurant,
 * retail, professional services, and — added with the founder's approved
 * campaign photography — satellite connectivity, which is what the
 * text-first X post announces. Every mock output on the marketing route
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
  id: 'falak' | 'zaytoun' | 'nura' | 'meezan' | 'orbital'
  /** Latin name, as the brand writes it. */
  name: string
  /** Arabic name — the brand's own mark, not a translation artifact. */
  nameAr: string
  sector: string
  /** The sector as the brand would say it in Arabic (native, not translated). */
  sectorAr: string
  monogram: string
  /** Follower line the LinkedIn-style headers show — demo data. */
  followers: string
  /** The brand's own colors — card interiors only (D5). */
  palette: {
    primary: string
    accent: string
    surface: string
    ink: string
  }
  /** The one campaign this brand runs across the whole site (§31). */
  narrative: string
  /** How this brand writes — the line a real brand-voice setting would
   * hold, so any future card can be generated from data alone. */
  brandVoice: string
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
    followers: '12,480 followers',
    palette: { primary: '#1F3A5F', accent: '#E8823A', surface: '#EEF2F7', ink: '#14263C' },
    narrative: 'Launching a same-day delivery lane between Riyadh and Jeddah.',
    brandVoice: 'Confident and operational. Short sentences, concrete promises, no hype.',
    person: { name: 'Omar Suleiman', role: 'Founder, Falak Logistics', initials: 'OS' },
  },
  zaytoun: {
    id: 'zaytoun',
    name: 'Bayt Zaytoun',
    nameAr: 'بيت زيتون',
    sector: 'Restaurant',
    sectorAr: 'مطبخ شامي',
    monogram: 'BZ',
    followers: '9,120 followers',
    palette: { primary: '#5A6B3B', accent: '#A63D2F', surface: '#F4F1E7', ink: '#2F3520' },
    narrative: 'A family iftar set menu for Ramadan, and an Eid feast to follow.',
    brandVoice: 'Warm and hospitable. Family-first, generous, never salesy.',
    person: { name: 'Rania Khalil', role: 'Owner, Bayt Zaytoun', initials: 'RK' },
  },
  nura: {
    id: 'nura',
    name: 'Nura Living',
    nameAr: 'نورا ليفينج',
    sector: 'Retail',
    sectorAr: 'تجارة تجزئة',
    monogram: 'N',
    followers: '28.4K followers',
    palette: { primary: '#8D5A78', accent: '#E0B084', surface: '#F6EFF3', ink: '#3D2635' },
    narrative: 'The summer home collection drops — linen, clay, and light.',
    brandVoice: 'Calm editorial. Quiet luxury, tactile nouns, plenty of white space.',
    person: { name: 'Noor Al-Sayegh', role: 'Creative Director, Nura Living', initials: 'NA' },
  },
  meezan: {
    id: 'meezan',
    name: 'Meezan Advisory',
    nameAr: 'ميزان للاستشارات',
    sector: 'Professional services',
    sectorAr: 'استشارات مهنية',
    monogram: 'M',
    followers: '4,306 followers',
    palette: { primary: '#23616B', accent: '#7FB6BF', surface: '#EBF2F3', ink: '#12333A' },
    narrative: 'Guiding clients through the Q3 VAT filing deadline, calmly.',
    brandVoice: 'Precise and reassuring. Plain language about complicated rules.',
    person: { name: 'Layla Haddad', role: 'Managing Partner, Meezan Advisory', initials: 'LH' },
  },
  orbital: {
    id: 'orbital',
    name: 'Orbital Reach',
    nameAr: 'أوربيتال ريتش',
    sector: 'Satellite connectivity',
    sectorAr: 'فضاء واتصالات',
    monogram: 'OR',
    followers: '184K followers',
    palette: { primary: '#0B1B2E', accent: '#4DA3E8', surface: '#E8EEF5', ink: '#08131F' },
    narrative: 'Aurora-1 reaches orbit and deploys the first twelve satellites.',
    brandVoice: 'Understated engineering pride. Facts first, wonder second.',
    person: { name: 'Dana Kassar', role: 'Chief Engineer, Orbital Reach', initials: 'DK' },
  },
}

export const DEMO_BRAND_LIST: DemoBrand[] = Object.values(DEMO_BRANDS)

/**
 * Platform interface hues for the mock posts (founder-directed realism
 * pass, 2026-08-11): generic UI colors that make a LinkedIn post read as
 * LinkedIn and an Instagram heart read as a heart — colors only, never
 * imported logo assets (D6 stands). Scoped here because this module holds
 * the marketing route's one raw-color exemption.
 */
export const PLATFORM = {
  linkedin: {
    like: '#378FE9',
    love: '#DF704D',
    celebrate: '#6DAE4F',
  },
  instagram: { heart: '#FF3040' },
} as const

/**
 * The full interface palette per platform (founder pass 2026-08-12).
 *
 * Why this exists: the cards used to inherit Malaky's warm ivory `bg-card`,
 * so every "post" read as one more Malaky panel — the exact "generic SaaS
 * mockup" failure the founder called out. A real feed is the PLATFORM's
 * surface, not the tool's: Instagram and LinkedIn are white on near-black
 * type, X is black on near-white. Rendering each post on its own surface
 * is what makes the platform recognizable before any label is read.
 *
 * D6 still stands: colors, chrome and layout only — no imported or traced
 * third-party logo assets. See open-items 20 for the trademark question.
 */
export const PLATFORM_UI = {
  instagram: {
    name: 'Instagram',
    surface: '#FFFFFF',
    ink: '#131313',
    muted: '#737373',
    border: '#DBDBDB',
    accent: '#FF3040',
    chrome: '#FFFFFF',
  },
  linkedin: {
    name: 'LinkedIn',
    surface: '#FFFFFF',
    ink: '#1B1B1B',
    muted: '#5E5E5E',
    border: '#E0E0E0',
    accent: '#0A66C2',
    chrome: '#FFFFFF',
  },
  facebook: {
    name: 'Facebook',
    surface: '#FFFFFF',
    ink: '#080809',
    muted: '#65676B',
    border: '#CED0D4',
    accent: '#1877F2',
    chrome: '#FFFFFF',
  },
  x: {
    name: 'X',
    surface: '#000000',
    ink: '#E7E9EA',
    muted: '#71767B',
    border: '#2F3336',
    accent: '#1D9BF0',
    chrome: '#000000',
  },
  newsletter: {
    name: 'Email',
    surface: '#FFFFFF',
    ink: '#1B1B1B',
    muted: '#5E5E5E',
    border: '#DDDDDD',
    accent: '#0A66C2',
    /** The mail client's own header band, behind From/Subject. */
    chrome: '#F5F6F7',
  },
} as const

export type PlatformId = keyof typeof PLATFORM_UI

/** Facebook's reaction hues — the three-dot cluster under a post. */
export const FACEBOOK_REACTIONS = {
  like: '#1877F2',
  love: '#F33E58',
  wow: '#F7B125',
} as const
