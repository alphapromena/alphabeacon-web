/**
 * Malaky customers — the factual layer.
 *
 * Every company shown anywhere in this concept is a real Malaky customer,
 * confirmed by the founder. This file holds what is **true** about them and
 * nothing else. The marketing shown on the page is Malaky-prepared concept
 * work and lives separately, in ./content, so the two can never be confused
 * for one another in the code any more than they may be on the page.
 *
 * ## The rule this file exists to enforce
 *
 * A real customer name does not license a real-world claim. Every entry in
 * `facts` carries the source it came from, and a claim without a source does
 * not go in. No revenue, no results, no ROI, no launch we did not read about,
 * no date, no partnership, no statistic, no quotation, and no executive who
 * has not publicly identified themselves in that role.
 *
 * Where a field is unknown it is `null`, and the interface renders the absence
 * rather than filling it. That is why `logo`, `handle` and `portrait` are all
 * nullable: an invented mark, an invented social handle and an invented face
 * are the three easiest ways to turn a real customer into a fictional one.
 *
 * ## Logos
 *
 * `logo: null` is a slot, not a gap to be papered over. The official artwork
 * is supplied by the customer; until it arrives the interface shows a neutral
 * placeholder that is visibly not a logo. Nothing here is drawn, traced,
 * lettered, recoloured or approximated — see public/brand/customers/README.md
 * for the exact files still outstanding.
 */

export type CustomerId =
  'ataccama' | 'baker-tilly-sa' | 'inception-dap' | 'shrimp-joint' | 'ila' | 'alpha-pro'

/**
 * A statement about a real company, and where it came from.
 *
 * `source` is not decoration. It is the reason the claim is allowed to appear,
 * and scripts/customer-qa.mjs fails if any fact is missing one.
 */
export interface VerifiedFact {
  claim: string
  source: string
}

/**
 * Official artwork, exactly as supplied. Never generated, and never edited.
 *
 * `background` is the one thing presentation has to know, and it describes the
 * file rather than changing it. Three of these six are knockout artwork on
 * transparency and sit straight on the graphite. The other three arrived with
 * their own white plate baked in, which is how the customer supplied them — so
 * the container gives them a light surface to sit on instead of anyone
 * cutting the background out. Editing the artwork to suit our page is exactly
 * what we do not do.
 */
export interface LogoAsset {
  src: string
  /** Intrinsic pixels, so it is placed at its own ratio and never distorted. */
  width: number
  height: number
  /**
   * "transparent" — knockout artwork, placed directly on the dark surface.
   * "light" — the file carries its own light background; the container
   * supplies a matching plate so it does not sit on graphite as a raw square.
   */
  background: 'transparent' | 'light'
  alt: string
}

export interface Customer {
  id: CustomerId
  /** The company's own name for itself. */
  name: string
  /** What they do, in our words, supportable from `facts`. */
  category: string
  /** Two or three words, for a caption under a logo. */
  shortCategory: string
  /** Official site, or null where we have not confirmed one. */
  website: string | null
  /**
   * Social handle — only where we have seen it. Never guessed from the
   * company name, which is how a real customer acquires a fake account.
   */
  handle: string | null
  /** Official artwork, or null while it is outstanding. */
  logo: LogoAsset | null
  facts: VerifiedFact[]
}

/* ------------------------------------------------------------------ *
 * The customers
 * ------------------------------------------------------------------ */

export const CUSTOMERS: Record<CustomerId, Customer> = {
  ataccama: {
    id: 'ataccama',
    name: 'Ataccama',
    category: 'Enterprise data management and governance',
    shortCategory: 'Enterprise data',
    website: 'ataccama.com',
    handle: null,
    logo: {
      src: '/brand/customers/ataccama/ataccama-logo.svg',
      width: 1266,
      height: 180,
      background: 'transparent',
      alt: 'Ataccama',
    },
    facts: [
      {
        claim:
          'Ataccama offers data observability as part of its Ataccama ONE platform, monitoring data in pipelines alongside data quality on data at rest.',
        source:
          'Ataccama product page “Data Observability Tools: AI-Powered Monitoring” (ataccama.com/platform/data-observability).',
      },
      {
        claim:
          'Ataccama publicly announced Agentic Data Observability in Ataccama ONE on 26 February 2026.',
        source:
          'Press release “Ataccama Launches Agentic Data Observability to Extend Market-Leading Data Trust Platform”, GlobeNewswire, 26 February 2026; also carried by BigDATAwire, Techzine and ITBrief.',
      },
      {
        claim:
          'The announced capabilities include AI-driven anomaly detection, reuse of existing Ataccama data quality rules across pipelines and persisted datasets, and unified alerting routed through email, Slack or Microsoft Teams.',
        source:
          'Same announcement, as reported by GlobeNewswire, BigDATAwire and ITBrief, February 2026.',
      },
      {
        claim: 'Ataccama describes itself as an agentic data trust company.',
        source: 'Ataccama corporate boilerplate, ataccama.com.',
      },
    ],
  },

  'baker-tilly-sa': {
    id: 'baker-tilly-sa',
    name: 'Baker Tilly Saudi Arabia',
    category: 'Audit, tax and advisory',
    shortCategory: 'Audit & advisory',
    website: 'bakertilly.sa',
    handle: null,
    logo: {
      src: '/brand/customers/baker-tilly-saudi/baker-tilly-logo.svg',
      width: 151,
      height: 40,
      background: 'transparent',
      alt: 'Baker Tilly',
    },
    facts: [
      {
        claim:
          'Baker Tilly Saudi Arabia provides audit and assurance, consulting and tax services, and is an independent member firm of Baker Tilly International.',
        source: 'bakertilly.sa — firm profile and services.',
      },
      {
        claim: 'Its audit and assurance practice operates from Riyadh, Jeddah and Khobar.',
        source: 'bakertilly.sa — Audit & Assurance.',
      },
      {
        claim: 'IFRS 18 readiness is a service the firm publicly offers.',
        source:
          "bakertilly.sa service page “IFRS 18 readiness | Bakertilly Saudi Arabia”, and the firm's own published LinkedIn post on IFRS 18 readiness held in this repository.",
      },
    ],
  },

  'inception-dap': {
    id: 'inception-dap',
    name: 'Inception DAP',
    category: 'Branding and production',
    shortCategory: 'Branding & production',
    website: 'inceptiondap.com',
    handle: null,
    logo: {
      src: '/brand/customers/inception-dap/inception-dap.png',
      width: 1248,
      height: 722,
      background: 'light',
      alt: 'Inception DAP — for design, advertising and printing',
    },
    /**
     * Deliberately short. Nothing beyond their own published post could be
     * independently confirmed, so nothing beyond it is claimed.
     */
    facts: [
      {
        claim:
          'Inception DAP describes itself as providing end-to-end branding and production solutions, and is based in Jeddah.',
        source:
          "Inception DAP's own published Instagram post, held in this repository at public/brand/real-posts/inception-dap/.",
      },
      {
        claim: 'Its own logo lockup reads “for design, advertising and printing”.',
        source:
          'The official artwork the customer supplied, at public/brand/customers/inception-dap/.',
      },
    ],
  },

  'shrimp-joint': {
    id: 'shrimp-joint',
    name: 'Shrimp Joint',
    category: 'Casual seafood dining',
    shortCategory: 'Restaurant',
    website: null,
    handle: null,
    logo: {
      src: '/brand/customers/shrimp-joint/shrimp-joint-logo.jpg',
      width: 960,
      height: 960,
      background: 'light',
      alt: 'Shrimp Joint',
    },
    /**
     * Same restraint. Their published post is the only source we can reach, so
     * no city, no branch count and no menu beyond what the post itself shows.
     */
    facts: [
      {
        claim:
          'Shrimp Joint is a seafood restaurant that markets a crispy fish sandwich, with a short, direct, appetite-led voice.',
        source:
          "Shrimp Joint's own published Facebook post “Crispy. Hot. Loaded.”, held in this repository at public/brand/real-posts/shrimp-joint/.",
      },
    ],
  },

  ila: {
    id: 'ila',
    name: 'International Language Academy',
    category: 'English-language education',
    shortCategory: 'Education',
    website: 'ila.edu',
    handle: null,
    /**
     * The official knockout lockup, supplied by the customer and used exactly
     * as delivered: the ring, the ILA monogram with its globe, the ® and the
     * full descriptor. White artwork on transparency, which is why it is the
     * right file for this site's graphite surfaces and looks blank on a white
     * one. Placed at its own 1:1 ratio and never recoloured.
     */
    logo: {
      src: '/brand/customers/ila/ila-logo.png',
      width: 500,
      height: 500,
      background: 'transparent',
      alt: 'International Language Academy of Washington D.C.',
    },
    facts: [
      {
        claim:
          'The International Language Academy of Washington D.C. teaches English and prepares students to study at American universities and to enter the U.S. workforce.',
        source: 'ila.edu — About, mission statement.',
      },
      {
        claim: 'It is based in McLean, Virginia.',
        source: "ila.edu, and the academy's LinkedIn company page.",
      },
    ],
  },

  'alpha-pro': {
    id: 'alpha-pro',
    name: 'Alpha Pro MENA',
    category: 'Data governance, enterprise AI and banking advisory',
    shortCategory: 'Data & AI consulting',
    website: 'alphapromena.com',
    handle: null,
    logo: {
      src: '/brand/customers/alpha-pro-mena/alpha-pro-logo.jpg',
      width: 4899,
      height: 4899,
      background: 'light',
      alt: 'Alpha Pro MENA',
    },
    facts: [
      {
        claim:
          'Alpha Pro MENA is an Ataccama certified partner across MENA, working in data governance, enterprise AI and advisory for regulated institutions including banking and finance.',
        source:
          'alphapromena.com — site title and positioning, “Alpha Pro MENA | Ataccama Certified Partner · Data Governance & Enterprise AI”.',
      },
      {
        claim:
          "Alpha Pro's Ataccama practice covers data catalog and profiling, data quality management, master data management, reference data management and data integration.",
        source: 'alphaproconsulting.com — Ataccama overview.',
      },
    ],
  },
}

export const CUSTOMER_LIST: Customer[] = [
  CUSTOMERS.ila,
  CUSTOMERS['alpha-pro'],
  CUSTOMERS['inception-dap'],
  CUSTOMERS['baker-tilly-sa'],
  CUSTOMERS['shrimp-joint'],
  CUSTOMERS.ataccama,
]

export function getCustomer(id: CustomerId): Customer {
  return CUSTOMERS[id]
}

/** Customers still waiting on official artwork. Reported, never worked around. */
export function customersMissingLogos(): Customer[] {
  return CUSTOMER_LIST.filter((c) => c.logo === null)
}

/* ------------------------------------------------------------------ *
 * People
 * ------------------------------------------------------------------ */

/**
 * A named executive may appear only where that person has publicly identified
 * themselves in that role, and only ever as the subject of a draft Malaky
 * prepared — never as the author of a quotation we wrote for them.
 */
export interface CustomerExecutive {
  id: string
  name: string
  role: string
  customerId: CustomerId
  source: string
  /** Official photograph, or null. No generated face stands in for a real one. */
  portrait: { src: string; alt: string } | null
}

export const EXECUTIVES: Record<string, CustomerExecutive> = {
  dana: {
    id: 'dana',
    name: 'Dana Saif',
    role: 'Founder & Executive Director, International Language Academy',
    customerId: 'ila',
    source:
      "ila.edu and Dana Saif's own LinkedIn profile, both identifying her as Founder & Executive Director of the International Language Academy of Washington D.C.",
    portrait: null,
  },
}

export function getExecutive(id: string): CustomerExecutive {
  const exec = EXECUTIVES[id]
  if (!exec) throw new Error(`Unknown executive: ${id}`)
  return exec
}
