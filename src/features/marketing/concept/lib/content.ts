/**
 * Concept executions — the illustrative layer.
 *
 * Every company named here is a real Malaky customer, and every fact about
 * those companies lives in ./customers with the source it came from. This file
 * holds the other half: marketing **Malaky prepared**, written to demonstrate
 * what the product does.
 *
 * ## The line this file must not cross
 *
 * A real customer, real business context, and illustrative Malaky output. Not
 * fictional business information presented as reality, and not our copy
 * presented as theirs. So:
 *
 * - The business moment a piece is written about must be something the
 *   customer has actually said publicly. `SOURCE_EVENT` carries its source.
 * - The copy in the cards is ours. It is labelled as prepared work, and it is
 *   never shown as something the customer published.
 * - No engagement figure on a prepared card describes real performance. See
 *   ENGAGEMENT_NOTE below — the numbers are part of the depicted platform
 *   surface, and the section says so.
 * - Nothing states a revenue, a result, a date, a location, a partnership or
 *   an executive opinion that ./customers cannot source.
 *
 * Work the customers really published is not in this file at all. It lives in
 * ./real-posts as finished screenshots and renders untouched.
 */

import type { Customer, CustomerExecutive, CustomerId } from './customers'
import type { CampaignCreativeId } from './campaign-creative'
/* MediaScene is re-exported below but not referenced here; this repo
   typechecks with noUnusedLocals, so it is not imported twice. */
import type { PieceMedia } from './media'
import type { RealPostId } from './real-posts'

export type Platform =
  | 'instagram'
  | 'linkedin-company'
  | 'linkedin-executive'
  | 'x'
  | 'newsletter'
  | 'reel'
  /**
   * The piece *is* a finished screenshot the customer published. Nothing draws
   * chrome for it — the chrome is in the image. See ./real-posts.
   */
  | 'real-screenshot'

/**
 * The platforms this concept draws chrome for. A real screenshot is excluded
 * by construction, so anything that renders a platform bar, an account row or
 * an engagement strip cannot be pointed at one.
 */
export type DrawnPlatform = Exclude<Platform, 'real-screenshot'>

export type {
  AspectRatio,
  FocalPoint,
  ImageMedia,
  MediaScene,
  PieceMedia,
  VideoMedia,
} from './media'

export interface Engagement {
  likes?: number
  comments?: number
  reposts?: number
  views?: string
}

/**
 * Said once, wherever prepared cards carry engagement chrome.
 *
 * The counts exist so a depicted post looks like a post rather than like a
 * text box. They are not performance, they are not anyone's results, and no
 * surface may present them as either.
 */
export const ENGAGEMENT_NOTE =
  'Prepared by Malaky. Interface figures are part of the illustration, not performance.'

/** The short label a prepared card carries so it is never mistaken for published work. */
export const PREPARED_LABEL = 'Prepared by Malaky'

export type PieceStatus = 'prepared' | 'ready' | 'approved' | 'scheduled'

export interface MarketingPiece {
  id: string
  /** Omitted only by real-screenshot pieces, which carry their own branding. */
  customerId?: CustomerId
  /**
   * Overrides the CUSTOMERS lookup. The brand-analysis layer uses this so a
   * company the visitor typed renders through the same components.
   */
  customer?: Customer
  platform: Platform
  /** Chrome label, e.g. "Instagram Post". */
  label: string
  /** Key from EXECUTIVES. Omit where no named person is attached. */
  executiveId?: string
  /** Overrides the EXECUTIVES lookup, for companies typed into the demo. */
  executive?: CustomerExecutive
  status?: PieceStatus
  /** Malaky's own state, e.g. "Prepared 05:47". */
  timestamp?: string
  /**
   * Platform-native posting time. Only ever set on a piece that really was
   * published — which in this repository means never, on a drawn card.
   */
  postedAt?: string
  dir?: 'ltr' | 'rtl'
  copy: {
    headline?: string
    subhead?: string
    body: string
    cta?: string
  }
  media?: PieceMedia
  engagement?: Engagement
  /** Reel duration, e.g. "0:18". */
  duration?: string
  /** Set only on `platform: "real-screenshot"` pieces. */
  realPostId?: RealPostId
}

/**
 * A piece whose chrome this concept draws. Narrower than MarketingPiece by
 * exactly one case, so a surface that reasons per channel can be sure a real
 * screenshot never arrives there.
 */
export interface DrawnPiece extends MarketingPiece {
  platform: DrawnPlatform
}

/* ------------------------------------------------------------------ *
 * Hero — six pieces across the customer base
 * ------------------------------------------------------------------ */

/**
 * Three of the six are work the customers actually published, entering as
 * `real-screenshot` pieces and rendering as the finished screenshot with no
 * chrome drawn around them. The other three are prepared concept work, and
 * each is labelled as prepared on the card itself.
 */
export const HERO_PIECES: MarketingPiece[] = [
  {
    id: 'hero-instagram',
    platform: 'real-screenshot',
    realPostId: 'inception-branding',
    label: 'Instagram Post',
    copy: {
      body: 'We create end-to-end branding & production solutions that connect, inspire, and drive results.',
    },
  },
  {
    id: 'hero-facebook',
    platform: 'real-screenshot',
    realPostId: 'shrimp-joint-crispy-fish',
    label: 'Facebook Post',
    copy: { body: 'Crispy. Hot. Loaded. Our crispy fish sandwich is here.' },
  },
  {
    /* Short-form, for the one customer here whose work is professional
       services — a register nothing else in the hero covers.
    
       It carries no image, because X is the one channel where that is the
       native shape rather than a missing asset: a line of text and the firm's
       own link. Both the service and the three cities are things Baker Tilly
       states publicly about itself; the sentence around them is ours, and the
       card says it is prepared. No handle is shown — they have not published
       one to us, and an invented @name is an invented identity. */
    id: 'hero-x',
    customerId: 'baker-tilly-sa',
    platform: 'x',
    label: 'X Post',
    status: 'prepared',
    timestamp: 'Prepared 06:02',
    copy: {
      /* Two paragraphs, split on the blank line the way a post is written. */
      body:
        'IFRS 18 readiness starts before reporting season.\n\n' +
        'For finance teams, the work begins with understanding the new presentation, ' +
        'subtotals and disclosure requirements — before comparative figures need to be ' +
        'restated.',
    },
    engagement: { likes: 74, comments: 5, reposts: 12 },
  },
  {
    id: 'hero-newsletter',
    platform: 'real-screenshot',
    realPostId: 'ataccama-newsletter',
    label: 'Newsletter',
    copy: {
      headline: 'Smarter Data. Stronger Decisions.',
      body: 'Make data quality, governance, and trust your competitive edge.',
    },
  },
  {
    /* A draft prepared for a named executive, shown before she has seen it —
       which is the point of the card. Not a quotation, not something she has
       said, and the status says so. Subject matter is limited to what ILA
       states publicly about its own mission. */
    id: 'hero-linkedin-executive',
    customerId: 'ila',
    platform: 'linkedin-executive',
    label: 'Executive LinkedIn',
    executiveId: 'dana',
    status: 'prepared',
    timestamp: 'Draft prepared 05:51',
    copy: {
      body: 'Students arrive with the English they were taught. An American university asks for the English they will actually need. Closing that gap is the whole job.',
    },
    engagement: { likes: 58, comments: 9 },
  },
  {
    id: 'hero-reel',
    customerId: 'alpha-pro',
    platform: 'reel',
    label: 'Reel / Video',
    status: 'prepared',
    duration: '0:18',
    timestamp: 'Prepared 05:56',
    copy: {
      headline: 'Governed, then intelligent',
      body: 'Why data governance comes before enterprise AI.',
    },
    media: {
      scene: 'signal-flow',
      alt: 'An abstract flow of data across a wide dark frame',
      aspect: '9:16',
    },
    engagement: { views: '1,240' },
  },
]

/* ------------------------------------------------------------------ *
 * Hero — activity timeline ("Malaky is working")
 * ------------------------------------------------------------------ */

export interface ActivityEntry {
  time: string
  label: string
  /** The first entry is the trigger — it reads as the moment of noticing. */
  kind: 'trigger' | 'output'
  icon: 'target' | 'instagram' | 'linkedin' | 'mail' | 'x'
}

export const ACTIVITY_TIMELINE: ActivityEntry[] = [
  { time: '05:42', label: 'Campaign opportunity identified', kind: 'trigger', icon: 'target' },
  { time: '05:47', label: 'Instagram prepared', kind: 'output', icon: 'instagram' },
  { time: '05:51', label: 'Executive LinkedIn prepared', kind: 'output', icon: 'linkedin' },
  { time: '05:56', label: 'Newsletter prepared', kind: 'output', icon: 'mail' },
  { time: '06:02', label: 'X post prepared', kind: 'output', icon: 'x' },
]

/* ------------------------------------------------------------------ *
 * Section 3 — one event becomes everything
 * ------------------------------------------------------------------ */

/**
 * The source event is real, and it is the only part of this section that is.
 *
 * Ataccama presents data observability as part of Ataccama ONE, and announced
 * Agentic Data Observability publicly on 26 February 2026. `source` records
 * where that came from; the four outputs below are ours.
 */
export const SOURCE_EVENT = {
  customerId: 'alpha-pro' as CustomerId,
  kind: 'Campaign moment',
  title: 'Free AI assessment for enterprise leaders.',
  detail:
    'Alpha Pro MENA offers enterprise leaders an AI assessment covering an AI roadmap, a data readiness review, use-case identification and an AI opportunity report.',
  source:
    "Alpha Pro MENA's own published LinkedIn post, held in this repository at public/brand/real-posts/alpha-pro-mena/.",
}

/**
 * The same real moment, adapted per channel — every word of it written by
 * Malaky rather than by Alpha Pro.
 *
 * Four channels, each genuinely different in copy, length, register and shape:
 * a square image with one line, a wide image carrying the operational detail,
 * a draft in an executive's voice, and a right-to-left campaign composed in
 * Arabic for a market Alpha Pro actually works in.
 */
export const EVENT_FANOUT: MarketingPiece[] = [
  {
    /* Alpha Pro's own campaign artwork, lifted out of the post they published
       and cropped square for a feed. The image is theirs: reframed by
       scripts/crop-alpha-pro-creative.mjs and otherwise untouched — not
       redrawn, not relettered, not approximated. What is Malaky's here is the
       caption and the decision to run the campaign on this channel. */
    id: 'fanout-instagram',
    customerId: 'alpha-pro',
    platform: 'instagram',
    label: 'Instagram',
    status: 'prepared',
    copy: {
      body: 'Not sure where to start with AI? The assessment covers an AI maturity review, a data readiness review, use-case identification and a roadmap — and ends with an opportunity report.',
    },
    media: {
      src: '/brand/customers/alpha-pro/assessment-creative-square.png',
      alt: "Alpha Pro MENA's Free AI Assessment campaign artwork, set square for a feed",
      aspect: '1:1',
    },
    engagement: { likes: 88, comments: 6 },
  },
  {
    /* The campaign as Alpha Pro actually ran it. This is their post, shown
       whole — which is why it carries no drawn chrome and why the section's
       note names it as theirs. */
    id: 'fanout-linkedin-company',
    platform: 'real-screenshot',
    realPostId: 'alpha-pro-ai-assessment',
    label: 'LinkedIn Company',
    copy: {
      body: 'Not sure where to start with AI? Our experts will help you assess, prioritize, and move forward with confidence.',
    },
  },
  {
    /* A draft in an executive's register, tied to the same campaign. No name:
       Alpha Pro has not assigned one, and putting a real person's name on our
       copy without them is the thing this pass exists to remove. */
    id: 'fanout-linkedin-executive',
    customerId: 'alpha-pro',
    platform: 'linkedin-executive',
    label: 'Executive LinkedIn',
    status: 'prepared',
    timestamp: 'Awaiting assignment',
    copy: {
      body: "Most enterprises I meet don't have an AI problem. They have a data problem wearing an AI costume. The assessment starts there.",
    },
    engagement: { likes: 58, comments: 9 },
  },
  {
    /* Arabic LinkedIn — the same campaign, composed for an Arabic-speaking
       business audience rather than translated into one. The creative is
       composed right to left too, not mirrored. */
    id: 'fanout-arabic-linkedin',
    customerId: 'alpha-pro',
    platform: 'linkedin-company',
    label: 'Arabic LinkedIn',
    status: 'prepared',
    dir: 'rtl',
    timestamp: 'Prepared',
    copy: {
      body: 'قبل أن تبدأ أي مبادرة للذكاء الاصطناعي: هل بياناتك جاهزة؟ التقييم يبدأ من مراجعة الجاهزية، ثم خارطة الطريق، وينتهي بتقرير يصلح لمجلس الإدارة.',
    },
    media: {
      creative: 'alpha-pro-assessment-ar',
      alt: 'The same Alpha Pro MENA assessment creative, composed in Arabic',
      aspect: '1:1',
    },
    engagement: { likes: 52, comments: 4 },
  },
]

/**
 * Said under the fan-out. Two different things are on show here and a reader
 * is owed the difference: one card is the campaign Alpha Pro published, the
 * other three are Malaky's adaptations of it.
 */
export const FANOUT_NOTE =
  "The artwork across these cards is Alpha Pro MENA's own, from the campaign they published — reframed per channel, never redrawn. The LinkedIn card is that post shown whole; the Instagram, executive and Arabic cards are Malaky's adaptations of it, and the Arabic is composed rather than translated. Interface figures are part of the illustration, not performance."

/* ------------------------------------------------------------------ *
 * Section 4 — approval
 * ------------------------------------------------------------------ */

/**
 * Professional-services marketing is where approval earns its keep, so the
 * piece under review is prepared for Baker Tilly Saudi Arabia.
 *
 * IFRS 18 readiness is a service the firm publicly offers, and the three
 * cities are its own. Everything else on the card is ours — and deliberately
 * carries no effective date, no deadline and no regulatory claim, because
 * none of those has been verified here.
 */
export const APPROVAL_PIECE: MarketingPiece = {
  id: 'approval-linkedin',
  customerId: 'baker-tilly-sa',
  /* The review item is Baker Tilly's own published IFRS 18 post, shown whole.
     A drawn approximation of their creative was the weaker thing to review —
     approval is about looking at finished work, so the section now shows
     finished work. What that costs in honesty is paid back by APPROVAL_NOTE,
     which states plainly that the creative is theirs rather than ours. */
  platform: 'real-screenshot',
  realPostId: 'baker-tilly-ifrs18',
  label: 'LinkedIn Company Post',
  status: 'ready',
  timestamp: 'Ready for review',
  copy: {
    body: 'IFRS 18 changes how performance is presented, not just what is disclosed.',
  },
}

/**
 * The one sentence that keeps this section true.
 *
 * Everything else on the page is work Malaky prepared. This card is not: it is
 * the customer's own published post, standing in for a prepared draft so the
 * review step is exercised against real finished creative.
 */
export const APPROVAL_NOTE =
  "The creative shown is Baker Tilly Saudi Arabia's own published post, used here to demonstrate the review step."

export const APPROVAL_STAGES = ['Ready for review', 'Approved', 'Scheduled'] as const

/* ------------------------------------------------------------------ *
 * Section 5 — memory / learning
 * ------------------------------------------------------------------ */

/**
 * A demonstration of how Malaky would learn while operating a customer's
 * marketing — not a record of anything Inception DAP did.
 *
 * The edit is illustrative and the note on the section says so. It is about
 * register rather than about the business, precisely so that nothing here
 * turns into a claim: no product, no launch, no date.
 */
export const MEMORY_EXAMPLE = {
  customerId: 'inception-dap' as CustomerId,
  original: "We're thrilled to announce that we now offer end-to-end branding and production!",
  edited: 'End-to-end branding and production. Design through delivery.',
  learned: {
    title: 'Preference learned',
    body: 'Direct. Less promotional language.',
    rules: ['No “thrilled to announce”', 'Lead with the offer', 'Claim, then evidence'],
  },
  /** Written later, by itself, in the learned style. */
  future: {
    context: 'Next draft — written 9 days later, unprompted',
    body: 'Design through delivery, handled end to end.',
  },
  /** Sits under the customer's mark, above the drafts. */
  context: 'Company voice · LinkedIn & Instagram',
  note: 'Illustrative. Prepared by Malaky to show how a correction becomes a rule.',
}

/* ------------------------------------------------------------------ *
 * Section 6 — Arabic is not a toggle
 * ------------------------------------------------------------------ */

/**
 * One customer, one subject, two campaigns — each composed in its own
 * language rather than translated across.
 *
 * The subject is the sandwich Shrimp Joint markets publicly. Both campaigns
 * are ours: different opening, different rhythm, different call to action, and
 * neither is a rendering of the other.
 */
export const BILINGUAL_CAMPAIGN = {
  customerId: 'shrimp-joint' as CustomerId,
  en: {
    label: 'English campaign',
    badge: 'EN',
    headline: 'Fried to order, not to schedule',
    subhead: 'The crispy fish sandwich',
    body: 'Crisp on the outside, hot all the way through, and it reaches you ready for the first bite.',
    cta: 'Order now',
    creative: 'shrimp-joint-crispy-en' as CampaignCreativeId,
    alt: 'A Shrimp Joint campaign creative headlined “Crispy Fish”',
  },
  /**
   * Composed in Arabic, not translated across. It opens on the promise rather
   * than on the product, and closes on the order — a different argument in a
   * different order, which is the only version of this section worth showing.
   */
  ar: {
    label: 'الحملة بالعربية',
    badge: 'AR',
    headline: 'مقرمش لآخر لُقْمَة',
    subhead: 'ساندويتش السمك المقرمش',
    body: 'سمك مقرمش ولذيذ، يتم تحضيره عند الطلب ويوصلك جاهزًا ومقرمشًا لآخر لُقْمَة.',
    cta: 'اطلبه الآن',
    creative: 'shrimp-joint-crispy-ar' as CampaignCreativeId,
    alt: 'The same Shrimp Joint campaign composed in Arabic',
  },
  /** Sits beside the customer's mark at the head of each panel. */
  context: 'Campaign · The crispy fish sandwich',
  note: 'Different language. Different rhythm. Same brand.',
}

/* ------------------------------------------------------------------ *
 * Trust and control
 * ------------------------------------------------------------------ */

/**
 * Honesty rule for this section: `state` records what the *concept* can
 * currently show, not what the production product does. "demonstrated" means
 * the behaviour is actually exercised elsewhere on this page. "planned" means
 * it is described but not built anywhere yet, and is labelled as such in the
 * UI so nothing reads as a shipped capability.
 */
export interface TrustPillar {
  id: string
  title: string
  body: string
  state: 'demonstrated' | 'planned'
}

export const TRUST_PILLARS: TrustPillar[] = [
  {
    id: 'human-approval',
    title: 'Human approval',
    body: 'Nothing publishes until the required approval is given.',
    state: 'demonstrated',
  },
  {
    id: 'business-knowledge',
    title: 'Business knowledge',
    body: 'Malaky works from information the company has provided and approved.',
    state: 'demonstrated',
  },
  {
    id: 'roles-workflows',
    title: 'Roles & workflows',
    body: 'Different people can prepare, review and approve.',
    state: 'planned',
  },
  {
    id: 'source-visibility',
    title: 'Source visibility',
    body: 'When factual information matters, show where the suggestion came from before approval.',
    state: 'planned',
  },
]
