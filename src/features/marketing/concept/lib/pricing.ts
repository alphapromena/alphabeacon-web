/**
 * Pricing data for /pricing.
 *
 * Nothing here is wired to billing.
 *
 * The page is built on one rule: the platform is stated once, and the plans
 * describe how much of a marketing organisation each one covers. What used to
 * be here — the same seven capabilities printed inside all three cards, an
 * eleven-row table repeating the cards, and a monthly output count large
 * enough to divide into the price — invited the buyer to work out a cost per
 * post. Plans differ by brands, voices, markets, approval depth, planning
 * scope, operating cadence and support.
 *
 * Second rule: nothing is presented as shipped unless this concept actually
 * exercises it. Capability entries carry an explicit state, and anything that
 * depends on a deployment lives under "available where scoped" rather than
 * being implied.
 *
 * ## Middle East launch
 *
 * Launch pricing is $599 / $899 / custom. Intelligence Setup is included for
 * launch deployments, and no contractual term is stated on the public cards.
 * Both of those are commercial positions that will change, so both are modelled
 * rather than deleted — see SetupPricing and Plan.term below.
 */

/** Stated once on the page, near the plans. Never inside a card. */
export const ANNUAL_NOTE = 'Annual prepayment available. Save 10%.'

/** The first number a visitor meets. A floor, said quietly. */
export const PRICE_FROM_LINE = 'Middle East launch plans from $599 / month.'

/* ------------------------------------------------------------------ *
 * The platform — stated once, above the plans
 * ------------------------------------------------------------------ */

/**
 * `state` is the same honesty rule the homepage uses. "included" means this
 * concept exercises the behaviour somewhere you can go and try. "planned"
 * means it is described and still to be built, and it is labelled as such
 * rather than quietly listed beside the rest.
 */
export interface PlatformCapability {
  title: string
  body: string
  state: 'included' | 'planned'
}

export const PLATFORM: PlatformCapability[] = [
  {
    title: 'Persistent brand memory',
    body: 'Your brand, products, audience and voice are held between campaigns rather than re-explained.',
    state: 'included',
  },
  {
    title: 'Proactive campaign planning',
    body: 'Malaky works from your calendar and prepares the work before anyone asks for it.',
    state: 'included',
  },
  {
    title: 'Company + executive marketing',
    body: "The company's voice and your executives' own voices, written separately.",
    state: 'included',
  },
  {
    title: 'Arabic + English',
    body: 'Each language composed natively. Not a translation layer, and not an add-on.',
    state: 'included',
  },
  {
    title: 'Cross-channel adaptation',
    body: 'One business moment becomes work written for each channel, not one post reformatted.',
    state: 'included',
  },
  {
    title: 'Human approval',
    body: 'Nothing publishes until the required approval is given.',
    state: 'included',
  },
  {
    title: 'Business and calendar context',
    body: 'Malaky operates from the facts and dates your team has approved.',
    state: 'included',
  },
  {
    title: 'Continuous learning',
    body: 'Every edit, approval and decline becomes a rule the next draft already follows.',
    state: 'included',
  },
]

/**
 * Named here rather than omitted. Both were previously implied by plan
 * features — "advanced approvals & workflows", "governance" — which read as
 * shipped. They are not.
 */
export const PLATFORM_PLANNED: PlatformCapability[] = [
  {
    title: 'Roles & workflows',
    body: 'Different people prepare, review and approve, with permissions per role.',
    state: 'planned',
  },
  {
    title: 'Source visibility',
    body: 'Where a factual claim came from, shown before approval.',
    state: 'planned',
  },
]

/* ------------------------------------------------------------------ *
 * Plans
 * ------------------------------------------------------------------ */

/** One row of a plan's coverage. This is the offer — how much of the operation. */
export interface CoverageRow {
  label: string
  value: string
}

/**
 * Setup is priced separately from the subscription, and during the Middle East
 * launch it is not charged.
 *
 * `fee: null` is the launch position, not the absence of a price: the card
 * prints `includedLabel` instead of an amount. Giving a plan a number again is
 * a one-line change here and needs no work in the component.
 */
export interface SetupPricing {
  label: string
  /** One-time fee in USD, or null while setup is included. */
  fee: number | null
  /** Shown in place of an amount while `fee` is null. */
  includedLabel: string
}

export interface Plan {
  id: 'business' | 'scale' | 'enterprise'
  name: string
  tagline: string
  /** Monthly list price, or null for a scoped deployment. */
  monthly: number | null
  /** Price wording for the scoped tier, in place of an amount. */
  priceNote?: string
  setup: SetupPricing
  /**
   * Only set where a term is genuinely part of the public offer. Business and
   * Scale deliberately carry none at launch — and no "cancel anytime" either,
   * which would be a commercial promise nobody has made.
   */
  term?: string
  /** Whether Malaky Managed can be added to this plan. */
  managedAvailable: boolean
  /** What the deployment covers. Differs meaningfully between plans. */
  coverage: CoverageRow[]
  /** Capacity in a sentence rather than a number. */
  capacity: string
  footnote?: string
}

export const PLANS: Plan[] = [
  {
    id: 'business',
    name: 'Malaky Business',
    tagline: 'For one business that wants Malaky running its core marketing operation.',
    monthly: 599,
    setup: {
      label: 'Intelligence setup',
      fee: null,
      includedLabel: 'Included during launch',
    },
    managedAvailable: true,
    coverage: [
      { label: 'Brands', value: '1 primary brand' },
      { label: 'Marketing voice', value: 'Company voice' },
      { label: 'Executive voices', value: '1 executive voice' },
      { label: 'Languages', value: 'Arabic + English' },
      { label: 'Campaign planning', value: 'Proactive marketing calendar' },
      { label: 'Channels', value: 'Core supported channels' },
      { label: 'Adaptation', value: 'Cross-channel adaptation' },
      { label: 'Approvals', value: 'Human approval' },
      { label: 'Support', value: 'Standard' },
    ],
    capacity: 'Built for an active single-brand marketing calendar.',
  },
  {
    id: 'scale',
    name: 'Malaky Scale',
    tagline: 'For growing businesses managing more campaigns, people, brands or markets.',
    monthly: 899,
    setup: {
      label: 'Intelligence setup',
      fee: null,
      includedLabel: 'Included during launch',
    },
    managedAvailable: true,
    coverage: [
      { label: 'Brands', value: 'Up to 2 brands or business units' },
      { label: 'Marketing voice', value: 'Company voice' },
      { label: 'Executive voices', value: 'Up to 3' },
      { label: 'Languages', value: 'Arabic + English' },
      { label: 'Campaign planning', value: 'Multi-market planning' },
      { label: 'Channels', value: 'Broader channel coverage' },
      { label: 'Campaign activity', value: 'Several concurrent initiatives' },
      { label: 'Approvals', value: 'More complex approval needs' },
      { label: 'Support', value: 'Priority' },
    ],
    capacity: 'Expanded coverage for multi-market and multi-team operations.',
  },
  {
    id: 'enterprise',
    name: 'Malaky Enterprise',
    tagline:
      'For larger organisations requiring multi-brand, multi-market or tailored deployments.',
    monthly: null,
    priceNote: 'Custom',
    setup: {
      label: 'Implementation',
      fee: null,
      includedLabel: 'Scoped in your proposal',
    },
    term: 'Proposal-based',
    managedAvailable: false,
    coverage: [
      { label: 'Deployment scope', value: 'Custom' },
      { label: 'Brands', value: 'Larger brand coverage' },
      { label: 'Executive voices', value: 'Defined by scope' },
      { label: 'Operating model', value: 'Tailored to your organisation' },
      { label: 'Implementation', value: 'Where scoped' },
      { label: 'Integrations', value: 'Where scoped' },
    ],
    capacity: 'Capacity defined around deployment scope.',
    footnote: 'Nothing beyond the agreed scope is implied.',
  },
]

/**
 * Operating ceilings.
 *
 * The previous per-month output and video numbers were set against the old
 * $3,500 / $6,000 pricing and do not carry over to a launch at $599 — inventing
 * replacements here would be a commercial claim nobody has made. The
 * protection stays as a stated principle until real numbers are decided.
 */
export const CAPACITY_NOTE =
  'Every deployment has an operating ceiling, agreed with you during setup and reviewed at each operating review. It exists so a deployment stays within what the team behind it can run well.'

/* ------------------------------------------------------------------ *
 * Malaky Managed — the optional operating layer
 * ------------------------------------------------------------------ */

/**
 * An assisted service, deliberately scoped small: one price, one description,
 * and an explicit statement of what it is not. A dedicated operator, unlimited
 * human marketing, a 24/7 account manager and an agency retainer are all
 * things this is not, and the clarification says so rather than leaving the
 * buyer to assume.
 */
export const MANAGED = {
  name: 'Malaky Managed',
  monthly: 299,
  eyebrow: 'Optional operating layer',
  question: 'Want Malaky operated with you?',
  positioning: 'Add a human Malaky operator.',
  /** The idea, in two lines. */
  couplet: ['Malaky prepares the work.', 'Your operator keeps it moving.'],
  description:
    'A Malaky operator reviews prepared marketing, checks routine brand consistency, handles approvals within agreed rules, and schedules or publishes approved work where authorised.',
  responsibilities: [
    'Reviews prepared campaigns and posts',
    'Catches obvious quality or brand issues',
    'Handles routine approvals under agreed guidelines',
    'Requests corrections when needed',
    'Schedules and publishes approved marketing where access is authorised',
    'Escalates decisions that need you',
  ],
  clarification:
    'Managed is an assisted operating service, not a dedicated full-time marketing employee. Higher-volume or dedicated coverage is scoped separately.',
  /** Shown on the cards it can be added to. */
  addLine: 'Add Managed for +$299 / month',
} as const

/** Business + Managed, Scale + Managed. Arithmetic, not a checkout. */
export interface ManagedCombination {
  planName: string
  planMonthly: number
  total: number
}

export function managedCombinations(): ManagedCombination[] {
  return PLANS.filter((p) => p.managedAvailable && p.monthly != null).map((p) => ({
    planName: p.name.replace('Malaky ', ''),
    planMonthly: p.monthly as number,
    total: (p.monthly as number) + MANAGED.monthly,
  }))
}

/* ------------------------------------------------------------------ *
 * Intelligence setup
 * ------------------------------------------------------------------ */

/** What happens before Malaky starts operating. No duration is promised. */
export const SETUP_STEPS = [
  'Brand ingestion',
  'Products & services',
  'Audience and market context',
  'Company voice',
  'Arabic voice',
  'Executive voices',
  'Approved business facts',
  'Campaign calendar',
  'Approval workflow',
  'Initial operating rules',
]

/** The launch position on setup pricing, stated where setup is explained. */
export const SETUP_PRICE_LINE =
  'Intelligence Setup is included with Business and Scale during the Middle East launch.'

export const SETUP_CLOSE = "Malaky starts with your company's context instead of a blank prompt."

/* ------------------------------------------------------------------ *
 * What changes between plans
 *
 * Only the differences. Anything included in every deployment belongs in
 * PLATFORM and is deliberately absent here — the table answers "why Scale
 * instead of Business", not "does this plan have AI".
 * ------------------------------------------------------------------ */

export interface ComparisonRow {
  label: string
  business: string
  scale: string
  enterprise: string
}

export const COMPARISON: ComparisonRow[] = [
  {
    label: 'Brands / business units',
    business: '1',
    scale: 'Up to 2',
    enterprise: 'Larger coverage',
  },
  {
    label: 'Executive voices',
    business: '1',
    scale: 'Up to 3',
    enterprise: 'Defined by scope',
  },
  {
    label: 'Market coverage',
    business: 'One primary market',
    scale: 'Multi-market planning',
    enterprise: 'Tailored',
  },
  {
    label: 'Channel coverage',
    business: 'Core supported channels',
    scale: 'Broader coverage',
    enterprise: 'Defined in deployment',
  },
  {
    label: 'Campaign activity',
    business: 'One brand calendar',
    scale: 'Several concurrent initiatives',
    enterprise: 'Defined in deployment',
  },
  {
    label: 'Approval needs',
    business: 'Standard',
    scale: 'More complex paths',
    enterprise: 'Tailored architecture',
  },
  {
    label: 'Support level',
    business: 'Standard',
    scale: 'Priority',
    enterprise: 'Defined in proposal',
  },
  {
    label: 'Malaky Managed',
    business: '+$299 / month',
    scale: '+$299 / month',
    enterprise: 'Scoped',
  },
]

/* ------------------------------------------------------------------ *
 * Additional scope
 *
 * Replaces a nine-item monthly add-on menu. Additions are a conversation, not
 * a shopping list, and none of them is priced publicly.
 * ------------------------------------------------------------------ */

export const ADDITIONAL_SCOPE =
  'Additional brands, markets, executive voices, specialised creative, integrations and dedicated managed coverage can be scoped into your deployment.'

/**
 * Named so a buyer knows what is available to ask for, and grouped under
 * "where scoped" so none of it reads as shipped. Nothing here is claimed as a
 * feature of any plan.
 */
export const SCOPED_ITEMS = [
  'Additional brands',
  'Additional markets',
  'Additional executive voices',
  'Specialised creative',
  'Integrations',
  'Dedicated managed coverage',
]

export const SCOPED_NOTE =
  'Scoped items are agreed during deployment. Nothing beyond the agreed scope is implied.'

export function formatUsd(n: number): string {
  return `$${n.toLocaleString('en-US')}`
}
