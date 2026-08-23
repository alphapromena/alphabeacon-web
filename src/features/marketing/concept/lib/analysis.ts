/**
 * Customer analysis — the replaceable layer behind "See Malaky with your brand".
 *
 * `analyzeBrand(domain)` is the seam. Today it is a pure, synchronous mock:
 * nothing is fetched, no request leaves the page, and no website is read. It
 * returns a `BrandAnalysis`, and every presentation component in the section
 * consumes only that shape — no component reads BRANDS directly or hardcodes
 * a company.
 *
 * Because nothing is read, the result carries a `mode`, and that mode governs
 * what the UI is allowed to say:
 *
 *   "authored"     — one of the four demo companies. Every value was written
 *                    by hand for a fictional business, so the section may
 *                    present it as something Malaky worked out.
 *   "illustrative" — any other domain, including a visitor's own. Nothing was
 *                    read, so nothing may be presented as discovered. No
 *                    country, market, product, customer segment, executive
 *                    identity or business event is asserted; every value is
 *                    labelled as an example, and the opportunity is an
 *                    illustration rather than a detection.
 *
 * The distinction is enforced here rather than in the components: the labels
 * travel with the data, so a presentation layer cannot accidentally state an
 * example as a fact.
 *
 * To connect real ingestion later, replace the body of `analyzeBrand` with a
 * call that returns the same shape (see `analyzeBrandAsync`) and return
 * mode: "authored" for anything genuinely read from a source.
 *
 * The result is deliberately plain data — serialisable, so a future
 * /preview/<slug> route could rehydrate a saved analysis. Sharing is not
 * built here.
 */

import {
  CUSTOMERS,
  EXECUTIVES,
  type Customer,
  type CustomerExecutive,
  type CustomerId,
} from './customers'
import type { MarketingPiece } from './content'
import { resolveChannelMedia, type BrandMediaSet, type MediaScene } from './media'

/* ------------------------------------------------------------------ *
 * Shape
 * ------------------------------------------------------------------ */

/**
 * Whether the values in a result were authored for a demo company or are
 * standing in for a real analysis that has not happened.
 */
export type AnalysisMode = 'authored' | 'illustrative'

export interface Opportunity {
  /**
   * Carried with the data so the two cases can never be confused:
   * "Opportunity detected" for an authored scenario, "Illustrative
   * opportunity" when nothing was read.
   */
  label: string
  title: string
  detail: string
}

/** One row of the intelligence table, already labelled for its mode. */
export interface AnalysisFact {
  label: string
  value: string
}

/** Channels this section can present. Drives the selector, in this order. */
export type AnalysisChannel = 'linkedin-company' | 'instagram' | 'linkedin-executive' | 'newsletter'

export interface AnalysisOutput {
  channel: AnalysisChannel
  /** Short label for the channel selector. */
  label: string
  piece: MarketingPiece
}

export interface BrandAnalysis {
  mode: AnalysisMode
  company: {
    name: string
    domain: string
    /**
     * Customer-shaped identity: mark, palette and handle. Named `logo` to match
     * the analysis contract — it is what CustomerMark and the post chrome draw.
     */
    logo: Customer
  }
  /**
   * Sits under the company name. In illustrative mode this must not be a
   * factual claim — no industry, no country.
   */
  subtitle: string
  /** Hex values, most dominant first. */
  palette: string[]
  paletteLabel: string
  /** The intelligence table, in order. Labels already reflect the mode. */
  facts: AnalysisFact[]
  opportunity: Opportunity
  outputs: AnalysisOutput[]
}

/* ------------------------------------------------------------------ *
 * Domain handling
 * ------------------------------------------------------------------ */

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/

/**
 * Reduces what a person actually types to a bare host.
 * "www.Ataccama.com/about?x=1", scheme and all, → "ataccama.com".
 * (Upstream spelled the scheme out here; guard-static bans an http(s) literal
 * anywhere under src/, comments included, so the example drops it.)
 * Returns null when the input could not be a website address.
 */
export function normalizeDomain(input: string): string | null {
  let value = (input ?? '').trim().toLowerCase()
  if (!value) return null

  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '') // scheme
  value = value.replace(/^www\./, '')
  value = value.split(/[/?#]/)[0] // path, query, fragment
  value = value.replace(/:\d+$/, '') // port
  value = value.replace(/\.$/, '') // trailing dot
  value = value.replace(/\s+/g, '')

  if (!value || value.length > 253) return null
  if (!DOMAIN_RE.test(value)) return null
  return value
}

/** Stable hash so the same domain always produces the same company. */
function hash(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function pick<T>(list: T[], seed: number, offset = 0): T {
  return list[(seed + offset) % list.length]
}

/* ------------------------------------------------------------------ *
 * Known demo companies
 * ------------------------------------------------------------------ */

interface Profile {
  customerId: CustomerId
  industry: string
  /** Only where we can source one. Omitted rather than guessed. */
  location?: string
  products: string[]
  audiences: string[]
  markets: string[]
  tone: string[]
  /** The label is applied by `analyzeBrand`, which knows the mode. */
  opportunity: Omit<Opportunity, 'label'>
  /** Null where the customer has assigned no public executive voice. */
  executive: CustomerExecutive | null
  /**
   * Purpose-built creative per channel. Empty today — every channel falls
   * back to `fallbackScene` until real assets are supplied.
   */
  media?: BrandMediaSet
  /** Placeholder used by any channel with no assigned asset. Temporary. */
  fallbackScene: MediaScene
  /** Copy per channel — written for the channel, not reformatted. */
  copy: {
    company: string
    instagram: { overline: string; caption: string; dir?: 'rtl' }
    executive: string
    newsletter: { subject: string; preheader: string; body: string; cta: string }
  }
}

/**
 * What Malaky prepares for a customer it already knows.
 *
 * Every value in a profile is either sourced in ./customers or is copy Malaky
 * wrote. Nothing in between: no revenue, no result, no date we did not read,
 * and no executive who has not publicly identified themselves in that role —
 * which is why `executive` is null for five of these six.
 *
 * `opportunity` is the business moment the outputs are written about, and it
 * must be something the company has actually said publicly.
 */
const PROFILES: Partial<Record<CustomerId, Profile>> = {
  ataccama: {
    customerId: 'ataccama',
    industry: 'Enterprise data management',
    products: ['Ataccama ONE', 'Data quality', 'Data observability'],
    audiences: ['Data leaders in regulated enterprises'],
    markets: ['Global'],
    tone: ['Precise', 'Technical', 'Plain'],
    opportunity: {
      title: 'Data Observability now available',
      detail:
        'Ataccama presents data observability as part of Ataccama ONE, monitoring pipelines alongside the data quality it already runs on data at rest.',
    },
    executive: null,
    fallbackScene: 'data-lattice',
    copy: {
      company:
        'Data Observability is now part of Ataccama ONE. Pipelines are monitored alongside the data quality rules you already run, and anomalies surface before they reach anything downstream.',
      instagram: {
        overline: 'Now available',
        caption: 'Now watching the pipeline, not just the table.',
      },
      executive:
        'Quality checks tell you the data was wrong. Observability tells you when it went wrong, and where. Those two belong in one place.',
      newsletter: {
        subject: 'Observability, where your quality rules already live',
        preheader: 'Monitoring for data in motion',
        body: 'Pipelines and persisted data, checked by the same rules and governed by the same context, with alerts routed to the channels your team already uses.',
        cta: 'See what changed',
      },
    },
  },

  'baker-tilly-sa': {
    customerId: 'baker-tilly-sa',
    industry: 'Audit, tax and advisory',
    location: 'Saudi Arabia',
    products: ['Audit & assurance', 'Consulting', 'Tax'],
    audiences: ['Finance leaders and audit committees'],
    markets: ['Riyadh', 'Jeddah', 'Khobar'],
    tone: ['Measured', 'Professional', 'Precise'],
    opportunity: {
      title: 'IFRS 18 readiness',
      detail:
        'IFRS 18 readiness is a service the firm publicly offers, and a subject its audience is actively working through.',
    },
    executive: null,
    fallbackScene: 'office',
    copy: {
      company:
        'IFRS 18 changes how performance is presented, not just what is disclosed. Our audit and assurance teams in Riyadh, Jeddah and Khobar are working through readiness with clients now.',
      instagram: {
        overline: 'IFRS 18',
        caption:
          'Presentation changes before disclosure does. Readiness starts with the statements.',
      },
      executive:
        'Most readiness conversations start with disclosure. The harder work is presentation — and that is the part that changes what a reader sees first.',
      newsletter: {
        subject: 'IFRS 18 readiness',
        preheader: 'What changes in presentation',
        body: 'A short view of what IFRS 18 changes in how performance is presented, and the questions worth asking your finance team before the work starts.',
        cta: 'Talk to our team',
      },
    },
  },

  'alpha-pro': {
    customerId: 'alpha-pro',
    industry: 'Data governance and enterprise AI',
    location: 'MENA',
    products: ['Data governance', 'Enterprise AI', 'Banking & finance advisory'],
    audiences: ['Regulated institutions, including banking and finance'],
    markets: ['MENA'],
    tone: ['Advisory', 'Direct', 'Enterprise'],
    opportunity: {
      title: 'Governance before AI',
      detail:
        'Alpha Pro MENA is an Ataccama certified partner working in data governance and enterprise AI for regulated institutions.',
    },
    executive: null,
    fallbackScene: 'signal-flow',
    copy: {
      company:
        'Enterprise AI runs on governed data or it does not run for long. Data catalog, quality, MDM and reference data come first — then the models have something to stand on.',
      instagram: {
        overline: 'Governed, then intelligent',
        caption: 'AI is only as good as the data underneath it.',
      },
      executive:
        'Every AI programme I have seen stall did so for the same reason: nobody could say where the data came from. Governance is not the slow part. It is the part that makes the rest fast.',
      newsletter: {
        subject: 'Governance before AI',
        preheader: 'Why the order matters',
        body: 'Catalog, quality, master data and reference data — what a regulated institution needs in place before an enterprise AI programme is worth starting.',
        cta: 'Book a conversation',
      },
    },
  },

  ila: {
    customerId: 'ila',
    industry: 'English-language education',
    location: 'McLean, Virginia',
    products: ['English language instruction', 'University preparation'],
    audiences: ['International students and their families'],
    markets: ['United States'],
    tone: ['Warm', 'Plain', 'Encouraging'],
    opportunity: {
      title: 'Preparing students for American universities',
      detail:
        'The academy teaches English and prepares students to study at American universities and to enter the U.S. workforce.',
    },
    executive: EXECUTIVES.dana,
    fallbackScene: 'office',
    copy: {
      company:
        'English for the classroom you are actually going into. Our teaching is built around what American universities ask of students once they arrive.',
      instagram: {
        overline: 'Washington D.C.',
        caption: 'The English you were taught, and the English you will need. We close the gap.',
      },
      executive:
        'Students arrive with the English they were taught. An American university asks for the English they will actually need. Closing that gap is the whole job.',
      newsletter: {
        subject: 'From the classroom to the campus',
        preheader: 'What university English actually asks for',
        body: 'The difference between passing an English exam and following a first-year lecture, and how our teaching is arranged around the second one.',
        cta: 'See our programmes',
      },
    },
  },

  'inception-dap': {
    customerId: 'inception-dap',
    industry: 'Customering and production',
    location: 'Jeddah',
    products: ['Customering', 'Production'],
    audiences: ['Customers that need design carried through to delivery'],
    markets: ['Saudi Arabia'],
    tone: ['Direct', 'Confident', 'Unfussy'],
    opportunity: {
      title: 'End-to-end branding and production',
      detail:
        'Inception DAP publicly describes itself as providing end-to-end branding and production solutions.',
    },
    executive: null,
    fallbackScene: 'still-life',
    copy: {
      company:
        'End-to-end branding and production. Design through delivery, handled in one place, so what was drawn is what arrives.',
      instagram: {
        overline: 'Design through delivery',
        caption: 'Customering that survives production.',
      },
      executive:
        'Most brand work is judged on a screen and lives in a warehouse. The interesting question is whether it holds up once it is made.',
      newsletter: {
        subject: 'Design through delivery',
        preheader: 'End-to-end branding and production',
        body: 'What changes when the people who design the brand are also the people who produce it.',
        cta: 'See the work',
      },
    },
  },
}

/** Domains the mock recognises, mapped to the centralised demo brands. */
const KNOWN_DOMAINS: Record<string, CustomerId> = {
  'ataccama.com': 'ataccama',
  'bakertilly.sa': 'baker-tilly-sa',
  'alphapromena.com': 'alpha-pro',
  'ila.edu': 'ila',
  'inceptiondap.com': 'inception-dap',
}

export const DEMO_DOMAINS = Object.keys(KNOWN_DOMAINS)

/* ------------------------------------------------------------------ *
 * Illustrative preview — every other domain
 *
 * Nothing below describes a real company, because nothing has been read.
 * These are neutral visual identities and example copy: no industry, no
 * country, no market, no product, no customer segment, no executive name and
 * no business event. The only value derived from the visitor's input is the
 * company's display name, which comes from the domain they typed.
 * ------------------------------------------------------------------ */

/**
 * A scene, and nothing else.
 *
 * This used to carry a palette and a geometric mark chosen by hashing the
 * domain — a made-up visual identity for a company we had not read. That is
 * exactly the thing this concept no longer does, so all that survives is which
 * drawn scene the preview uses, still chosen by a stable hash so the same
 * input always looks the same.
 */
const EXAMPLE_SCENES: MediaScene[] = ['signal-flow', 'office', 'long-table', 'still-life']

/**
 * The example copy set.
 *
 * Each channel demonstrates the shape Malaky writes to — what leads, how long
 * it runs, what register it uses — without asserting anything about the
 * visitor's business. No dates, no cities, no products, no numbers.
 */
const EXAMPLE_COPY: Profile['copy'] = {
  company:
    'The shape of a company post: what changes for the customer first, the operational detail second, one clear next step at the end. Written to the length your team has approved before.',
  instagram: {
    overline: 'Example',
    caption:
      'One line, one image, one reason to care. The detail lives on the channels built for it.',
  },
  executive:
    "The same news in a leader's register: first person, one concrete detail, no announcement language. Malaky learns this voice from posts your executive has already approved.",
  newsletter: {
    subject: 'The shape of a Malaky newsletter',
    preheader: 'An example of the structure, not a real send',
    body: 'What changed, what it means for this reader specifically, and what they need to do — in that order, at the length your audience already reads.',
    cta: 'Example call to action',
  },
}

/** "acme-trading.com" → "Acme Trading" */
function companyNameFromDomain(domain: string): string {
  const sld = domain.split('.')[0]
  const words = sld
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean)
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

/* ------------------------------------------------------------------ *
 * Output construction
 * ------------------------------------------------------------------ */

function buildOutputs(args: {
  customer: Customer
  /** Null where the customer has assigned no public executive voice. */
  executive: CustomerExecutive | null
  /** Purpose-built creative per channel. */
  media?: BrandMediaSet
  /** Stand-in for any channel without an assigned asset. */
  fallbackScene: MediaScene
  copy: Profile['copy']
}): AnalysisOutput[] {
  const { customer, executive, media, fallbackScene, copy } = args
  const fallback = {
    scene: fallbackScene,
    alt: `Concept creative prepared by Malaky for ${customer.name}`,
  }

  /**
   * Each channel asks for its own creative. Nothing shares one artwork any
   * more: assigning `media["instagram"]` changes only the Instagram output.
   */
  const mediaFor = (channel: Parameters<typeof resolveChannelMedia>[0]) =>
    resolveChannelMedia(channel, media, fallback)

  return [
    {
      channel: 'linkedin-company',
      label: 'LinkedIn',
      piece: {
        id: 'demo-linkedin-company',
        customerId: customer.id,
        customer,
        platform: 'linkedin-company',
        label: 'LinkedIn Company Post',
        timestamp: 'Prepared',
        copy: { body: copy.company },
        media: mediaFor('linkedin-company'),
        engagement: { likes: 38, comments: 5, reposts: 2 },
      },
    },
    {
      channel: 'instagram',
      label: 'Instagram',
      piece: {
        id: 'demo-instagram',
        customerId: customer.id,
        customer,
        platform: 'instagram',
        label: 'Instagram Post',
        dir: copy.instagram.dir,
        postedAt: '2 hours ago',
        copy: { body: copy.instagram.caption },
        media: { ...mediaFor('instagram'), overline: copy.instagram.overline },
        engagement: { likes: 92, comments: 7 },
      },
    },
    {
      channel: 'linkedin-executive',
      label: 'Executive',
      piece: {
        id: 'demo-linkedin-executive',
        customerId: customer.id,
        customer,
        executive: executive ?? undefined,
        platform: 'linkedin-executive',
        label: 'LinkedIn · Executive',
        timestamp: 'Prepared',
        copy: { body: copy.executive },
        engagement: { likes: 54, comments: 8 },
      },
    },
    {
      channel: 'newsletter',
      label: 'Newsletter',
      piece: {
        id: 'demo-newsletter',
        customerId: customer.id,
        customer,
        platform: 'newsletter',
        label: 'Newsletter',
        timestamp: 'Draft',
        copy: {
          headline: copy.newsletter.subject,
          subhead: copy.newsletter.preheader,
          body: copy.newsletter.body,
          cta: copy.newsletter.cta,
        },
        media: mediaFor('newsletter'),
      },
    },
  ]
}

/* ------------------------------------------------------------------ *
 * The seam
 * ------------------------------------------------------------------ */

/**
 * Mock analysis. Pure and synchronous — nothing is fetched.
 *
 * `domain` must already be normalised via `normalizeDomain`.
 */
export function analyzeBrand(domain: string): BrandAnalysis {
  const knownId = KNOWN_DOMAINS[domain]

  const profile = knownId ? PROFILES[knownId] : undefined

  if (knownId && profile) {
    const customer = CUSTOMERS[knownId]
    return {
      mode: 'authored',
      company: { name: customer.name, domain, logo: customer },
      subtitle: [profile.industry, profile.location].filter(Boolean).join(' · '),
      /* No swatches. We hold no customer's brand colours, and sampling four
         plausible ones would be inventing an identity for a real company. */
      palette: [],
      paletteLabel: '',
      facts: [
        { label: 'Audience', value: profile.audiences.join(' · ') },
        { label: 'Markets', value: profile.markets.join(' · ') },
        { label: 'Voice', value: profile.tone.join(' · ') },
        { label: 'Products / services', value: profile.products.join(' · ') },
      ],
      opportunity: { ...profile.opportunity, label: 'Public business moment' },
      outputs: buildOutputs({
        customer,
        executive: profile.executive,
        media: profile.media,
        fallbackScene: profile.fallbackScene,
        copy: profile.copy,
      }),
    }
  }

  /* Unknown domain. Nothing has been read, so nothing is claimed: the display
     name comes from what the visitor typed and every other value below is an
     example, labelled as one. */
  const seed = hash(domain)
  const scene = pick(EXAMPLE_SCENES, seed)
  const name = companyNameFromDomain(domain) || 'Your Company'

  /* Everything except the name is empty on purpose. No logo, no colours, no
     handle: this company has not been read, and a placeholder identity is
     still an identity somebody did not choose. */
  const customer: Customer = {
    id: 'ataccama', // structural only; nothing below reads it
    name,
    category: 'Example preview',
    shortCategory: 'Example preview',
    website: domain,
    handle: null,
    logo: null,
    facts: [],
  }

  /* A role, never a person. */
  const executive: CustomerExecutive = {
    id: 'example',
    name: 'Your executive',
    role: 'Example executive voice',
    customerId: 'ataccama',
    source: 'Example — no person is named.',
    portrait: null,
  }

  return {
    mode: 'illustrative',
    company: { name, domain, logo: customer },
    subtitle: 'Example profile — this website has not been read',
    palette: [],
    paletteLabel: 'Example palette',
    facts: [
      { label: 'Example audience', value: 'The people this company already sells to' },
      { label: 'Example channel mix', value: 'LinkedIn · Instagram · Executive · Newsletter' },
      { label: 'Example voice', value: 'Set from your own approved writing' },
      { label: 'Example campaign focus', value: 'Whatever is next on your calendar' },
    ],
    opportunity: {
      label: 'Illustrative opportunity',
      title: 'The moment Malaky would prepare for',
      detail:
        'In a real deployment this is a date on your calendar, a product milestone or a market event Malaky is already tracking. Here it stands in for one.',
    },
    outputs: buildOutputs({
      customer,
      executive,
      fallbackScene: scene,
      copy: EXAMPLE_COPY,
    }),
  }
}

/**
 * The async signature a real ingestion service should implement. Swap the
 * body for a fetch to the ingestion endpoint and the section keeps working:
 * it already awaits this and shows the analysis sequence while it resolves.
 */
export async function analyzeBrandAsync(domain: string): Promise<BrandAnalysis> {
  return analyzeBrand(domain)
}

/** The six states shown while the analysis runs. */
export const ANALYSIS_STATES = [
  'Customer identity identified',
  'Products & services understood',
  'Audience identified',
  'Markets identified',
  'Customer voice analyzed',
  'Relevant opportunities found',
] as const
