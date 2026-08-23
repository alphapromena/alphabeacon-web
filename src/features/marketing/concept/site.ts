/**
 * Where the marketing world sends people, and what each page calls itself.
 *
 * Ported from the prototype's `lib/site.ts`. Two things changed in the port,
 * both because this repo has what the prototype was waiting for:
 *
 * 1. **The seams are closed.** The prototype could not know where the product
 *    would live, so the dashboard URL and the login destination were
 *    environment-shaped holes with honest placeholders behind them. Here the
 *    product IS this app: Login is `/login`, and "Get started" is `/signup` —
 *    both real screens, both signed in for real. `NEXT_PUBLIC_SITE_URL` and
 *    `NEXT_PUBLIC_DASHBOARD_URL` are gone with them; this app reads exactly one
 *    environment variable and it is not this one (stack.md).
 * 2. **The hostname IS decided.** `index.html` carries the canonical
 *    `malaky.ai` origin already, so the absolute-URL machinery `metadataBase`
 *    existed for is not needed — the head mechanism here sets titles and
 *    descriptions, and the origin never moves.
 *
 * This file is the single wiring map from the marketing world to the product.
 * Every CTA on every marketing page resolves through one of these constants,
 * and `cta.test.ts` asserts the map — a hand-typed href in a section is how
 * "Get started" quietly starts meaning two different things.
 */

/* ------------------------------------------------------------------ *
 * The wiring map: marketing → the real product
 * ------------------------------------------------------------------ */

/** The marketing front door. */
export const HOME_HREF = '/'

/** The pricing page. Marketing-owned. */
export const PRICING_HREF = '/pricing'

/** The sales-led route, everywhere it appears. Marketing-owned. */
export const DEMO_HREF = '/request-demo'

/**
 * The self-serve route, everywhere it appears — and it is the REAL signup.
 *
 * The prototype ended here in its own inert purchase fiction; this app has an
 * account to create, so every "Get started" lands on it (decisions.md D-M2-C,
 * D-M2-D).
 */
export const START_HREF = '/signup'

/** Where an existing customer goes. The real sign-in screen. */
export const LOGIN_HREF = '/login'

export const PRIVACY_HREF = '/privacy'
export const TERMS_HREF = '/terms'

/**
 * PLACEHOLDER — a real mailbox has not been supplied.
 *
 * The prototype carried no contact address anywhere: no `mailto:`, no address
 * in the footer, nothing in `lib/legal.ts` (every value there is still
 * `null`). The demo form needs a visible way to reach a human, because
 * `submitDemoRequest` resolves locally and transmits nothing — so this is the
 * obvious address for the obvious domain, and it is flagged rather than
 * assumed correct. It is the ONLY invented value in the whole port.
 *
 * Replace it, or point it at whatever mailbox sales actually reads, before
 * DNS cutover — same open item as giving the form a real destination.
 */
export const CONTACT_EMAIL = 'hello@malaky.ai'

/**
 * Every route the marketing world links to, keyed by the name the site uses
 * for it. Exported as one object so the wiring can be asserted as a map
 * rather than as eight separate constants.
 */
export const MARKETING_ROUTES = {
  home: HOME_HREF,
  pricing: PRICING_HREF,
  demo: DEMO_HREF,
  start: START_HREF,
  login: LOGIN_HREF,
  privacy: PRIVACY_HREF,
  terms: TERMS_HREF,
} as const

export type MarketingRouteName = keyof typeof MARKETING_ROUTES

/** The two routes that leave the marketing world for the real product. */
export const PRODUCT_ROUTES: MarketingRouteName[] = ['start', 'login']

/* ------------------------------------------------------------------ *
 * Naming
 * ------------------------------------------------------------------ */

export const SITE_NAME = 'Malaky'

/** One card for the whole site — the prototype's, copied into `public/og/`. */
export const OG_IMAGE = {
  url: '/og/malaky-social.png',
  width: 1200,
  height: 630,
  alt: 'Malaky — your marketing was working before you were.',
} as const

/* ------------------------------------------------------------------ *
 * The canonical wording
 *
 * One title and one description per page, so the head, Open Graph and the X
 * card cannot drift apart. The homepage's pair is also `index.html`'s, which
 * is what a crawler that never runs JavaScript sees.
 * ------------------------------------------------------------------ */

export const HOME_TITLE = 'Malaky — Your marketing was working before you were'

export const HOME_DESCRIPTION =
  'Malaky learns your business, watches what’s coming, and prepares your marketing across every channel before you ask.'

export interface PageMeta {
  title: string
  description: string
}

export const PAGE_META = {
  home: { title: HOME_TITLE, description: HOME_DESCRIPTION },
  pricing: {
    title: 'Pricing — Malaky',
    description:
      "Malaky is not another tool. It's your marketing operation. Business, Scale and Enterprise deployments, each beginning with intelligence setup.",
  },
  demo: {
    title: 'Request a private demo — Malaky',
    description:
      "Tell us about your company and we'll make the conversation specific to your brand, markets and marketing operation.",
  },
  privacy: {
    title: 'Privacy Policy — Malaky',
    description:
      'How Malaky handles personal information collected through its public website, including demo requests.',
  },
  terms: {
    title: 'Website Terms of Use — Malaky',
    description:
      'The terms that apply to using the Malaky website, its previews and its demo request form.',
  },
} as const satisfies Record<string, PageMeta>
