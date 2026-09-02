/**
 * Route table + session guards. Dev routes exist only outside production
 * builds. '/' is dual-purpose per screens4.md: marketing when signed out (M1),
 * the Dashboard when signed in (D1).
 *
 * THE VISITOR WORLD IS A LAYOUT ROUTE (M2, concept-v2). '/', '/pricing',
 * '/request-demo', '/terms' and '/privacy' are siblings under one
 * `MarketingLayout`, so the header and footer mount once and survive
 * navigation between them — a page rendering its own chrome destroys the
 * focused nav link on every click (state.md trap 8). The layout gates itself
 * at '/': signed in, it renders the outlet bare so the product never wears
 * marketing chrome.
 *
 * CODE-SPLIT (production pass, 2026-08-11): the public marketing route is
 * the ONLY eagerly-bundled screen. Every authenticated screen, the auth
 * flow, and the dev tools load through React.lazy, so a visitor hitting
 * '/' downloads the marketing experience and nothing else — recharts,
 * Studio, Settings et al. arrive only when a signed-in route renders.
 * The marketing world's secondary pages (pricing, the demo request, the two
 * legal documents) are lazy too: they share the eager layout, but their own
 * bodies arrive only when someone asks for them.
 * Direct navigation still works: Vercel rewrites every path to index.html
 * and the router resolves the lazy chunk on mount.
 *
 * Two guards, both reading the fake session in `DataProvider`:
 *   Authed — signed out goes to the marketing front door.
 *   A workspace — signed in with no org lands on N3. **That gate used to mean
 *   "the wizard is unfinished"** and it does not any more (ORDER ONB-0827,
 *   D-ONB-C): the wizard is deleted, verifying creates the org, and the only
 *   way to arrive here without one is a create that failed or was interrupted.
 *   N3 is the retry surface for exactly that, not a journey to resume.
 */
import { Suspense, lazy, type ComponentType, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { useOrg, useSession } from '@/data/provider'
import { MarketingHome } from '@/features/marketing/home-screen'
import { MarketingLayout } from '@/features/marketing/marketing-layout'

/** The only visual between route resolution and a lazy chunk's arrival —
 * quiet, centered, and announced to assistive tech. */
function RouteFallback() {
  return (
    <div aria-busy="true" className="grid min-h-svh place-items-center bg-background">
      <span className="sr-only">Loading</span>
      <span
        aria-hidden
        className="size-6 animate-spin rounded-full border-2 border-border border-t-foreground motion-reduce:animate-none"
      />
    </div>
  )
}

/** lazy() + Suspense in one move, keeping the route table readable. */
function lazyEl(loader: () => Promise<Record<string, unknown>>, name: string): ReactNode {
  const Component = lazy(async () => {
    const mod = await loader()
    return { default: mod[name] as ComponentType }
  })
  return (
    <Suspense fallback={<RouteFallback />}>
      <Component />
    </Suspense>
  )
}

const el = {
  // Area A — auth
  signup: () => lazyEl(() => import('@/features/auth/signup-screen'), 'SignUpScreen'),
  signin: () => lazyEl(() => import('@/features/auth/signin-screen'), 'SignInScreen'),
  verify: () => lazyEl(() => import('@/features/auth/verify-email-screen'), 'VerifyEmailScreen'),
  reset: () => lazyEl(() => import('@/features/auth/reset-password-screen'), 'ResetPasswordScreen'),
  invite: () => lazyEl(() => import('@/features/auth/accept-invite-screen'), 'AcceptInviteScreen'),
  // The signed-in shell
  dashboard: () => lazyEl(() => import('@/features/dashboard/dashboard-screen'), 'DashboardScreen'),
  emptyOrg: () => lazyEl(() => import('@/features/system/empty-org-screen'), 'EmptyOrgScreen'),
  today: () => lazyEl(() => import('@/features/today/today-screen'), 'TodayScreen'),
  draft: () => lazyEl(() => import('@/features/today/draft-detail-screen'), 'DraftDetailScreen'),
  calendar: () => lazyEl(() => import('@/features/calendar/calendar-screen'), 'CalendarScreen'),
  schedule: () =>
    lazyEl(() => import('@/features/calendar/schedule-config-screen'), 'ScheduleConfigScreen'),
  eventSources: () =>
    lazyEl(() => import('@/features/calendar/event-sources-screen'), 'EventSourcesScreen'),
  connections: () =>
    lazyEl(() => import('@/features/connections/connections-screen'), 'ConnectionsScreen'),
  studioGallery: () =>
    lazyEl(() => import('@/features/studio/studio-screens'), 'StudioGalleryScreen'),
  studioComposer: () =>
    lazyEl(() => import('@/features/studio/studio-screens'), 'StudioComposerScreen'),
  studioJobs: () => lazyEl(() => import('@/features/studio/studio-screens'), 'StudioJobsScreen'),
  studioAsset: () => lazyEl(() => import('@/features/studio/studio-screens'), 'StudioAssetScreen'),
  // BIL-0902: the product's billing, on the wire — plans + state, and the
  // Stripe return. The two paths are hard-coded by the backend (DASHBOARD_URL);
  // never rename them without telling Ward.
  billing: () => lazyEl(() => import('@/features/billing/billing-screen'), 'BillingScreen'),
  billingSuccess: () =>
    lazyEl(() => import('@/features/billing/billing-success-screen'), 'BillingSuccessScreen'),
  billingSubscription: () =>
    lazyEl(() => import('@/features/billing/billing-screens'), 'SubscriptionScreen'),
  billingPlans: () => lazyEl(() => import('@/features/billing/billing-screens'), 'PlansScreen'),
  billingBalance: () => lazyEl(() => import('@/features/billing/billing-screens'), 'BalanceScreen'),
  billingReturn: () =>
    lazyEl(() => import('@/features/billing/billing-screens'), 'CheckoutReturnScreen'),
  generate: () => lazyEl(() => import('@/features/generate/generate-screen'), 'GenerateScreen'),
  analytics: () =>
    lazyEl(() => import('@/features/analytics/analytics-screens'), 'AnalyticsOverviewScreen'),
  analyticsChannel: () =>
    lazyEl(() => import('@/features/analytics/analytics-screens'), 'ChannelDetailScreen'),
  settingsLayout: () =>
    lazyEl(() => import('@/features/settings/settings-layout'), 'SettingsLayout'),
  settingsOrg: () =>
    lazyEl(() => import('@/features/settings/organization-screen'), 'OrganizationScreen'),
  settingsBrandVoice: () =>
    lazyEl(() => import('@/features/settings/brand-voice-screen'), 'BrandVoiceScreen'),
  settingsTones: () => lazyEl(() => import('@/features/settings/tones-screen'), 'TonesScreen'),
  settingsToneEditor: () =>
    lazyEl(() => import('@/features/settings/tones-screen'), 'ToneEditorScreen'),
  settingsSources: () =>
    lazyEl(() => import('@/features/settings/sources-screen'), 'SourcesScreen'),
  settingsKnowledge: () =>
    lazyEl(() => import('@/features/settings/knowledge-screen'), 'KnowledgeScreen'),
  settingsTeam: () => lazyEl(() => import('@/features/settings/team-screen'), 'TeamScreen'),
  // The visitor world's secondary pages (M2).
  pricing: () => lazyEl(() => import('@/features/marketing/pricing-screen'), 'PricingScreen'),
  requestDemo: () =>
    lazyEl(() => import('@/features/marketing/request-demo-screen'), 'RequestDemoScreen'),
  legal: (doc: 'privacy' | 'terms') =>
    lazyEl(
      () => import('@/features/marketing/legal-screens'),
      doc === 'privacy' ? 'PrivacyScreen' : 'TermsScreen',
    ),
  notFound: () => lazyEl(() => import('@/features/system/not-found'), 'NotFoundScreen'),
  devDatasets: () => lazyEl(() => import('@/features/dev/dev-datasets'), 'DevDatasetsScreen'),
  devStates: () => lazyEl(() => import('@/features/dev/dev-states'), 'DevStatesScreen'),
  devKitchenSink: () =>
    lazyEl(() => import('@/features/dev/dev-kitchen-sink'), 'DevKitchenSinkScreen'),
}

function RootGate() {
  const session = useSession()
  const org = useOrg()
  if (!session.signedIn) return <MarketingHome />
  if (!org.exists) return <>{el.emptyOrg()}</>
  return <>{el.dashboard()}</>
}

function Authed({ children }: { children: ReactNode }) {
  const session = useSession()
  const org = useOrg()
  if (!session.signedIn) return <Navigate to="/" replace />
  if (!org.exists) return <>{el.emptyOrg()}</>
  return children
}

/** Auth screens redirect away once there is nothing left to authenticate. */
function SignedOutOnly({ children }: { children: ReactNode }) {
  const session = useSession()
  const org = useOrg()
  if (session.signedIn && org.exists) return <Navigate to="/" replace />
  return children
}

const devRoutes = import.meta.env.PROD
  ? []
  : [
      { path: '/dev/datasets', element: el.devDatasets() },
      { path: '/dev/states', element: el.devStates() },
      { path: '/dev/kitchen-sink', element: el.devKitchenSink() },
    ]

export const router = createBrowserRouter([
  /**
   * The visitor world. One layout, five routes, one mounted header.
   *
   * '/' stays dual-purpose: `RootGate` resolves it to the Dashboard or N3 when
   * signed in, and `MarketingLayout` drops its own chrome for exactly that
   * case. The other four are marketing at any session state — /terms and
   * /privacy are website documents, and the signup consent line links to them.
   */
  {
    element: <MarketingLayout />,
    children: [
      { path: '/', element: <RootGate /> },
      { path: '/pricing', element: el.pricing() },
      { path: '/request-demo', element: el.requestDemo() },
      // Public legal documents: real routes, linked from the marketing footer
      // and the signup consent line.
      { path: '/privacy', element: el.legal('privacy') },
      { path: '/terms', element: el.legal('terms') },
    ],
  },

  // Area A — auth
  { path: '/signup', element: <SignedOutOnly>{el.signup()}</SignedOutOnly> },
  { path: '/login', element: <SignedOutOnly>{el.signin()}</SignedOutOnly> },
  { path: '/verify-email', element: el.verify() },
  { path: '/reset-password', element: el.reset() },
  // The invite deep link (docs/api/api.md): /accept-invite?email=…&code=…
  { path: '/accept-invite', element: el.invite() },

  /**
   * The wizard's route (ORDER ONB-0827, D-ONB-C). The screen is DELETED, not
   * disabled — setup lives in Settings and the Calendar now. The path stays
   * reachable because it was linked from N3, the dashboard banner, Today's
   * empty state and a shelf of bookmarks, and a link somebody saved should
   * land in the product rather than on a 404. `RootGate` then routes by the
   * one fact that still matters: does this account have a workspace.
   */
  { path: '/onboarding', element: <Navigate to="/" replace /> },

  /**
   * The early-access front door (Phase 2 §24) is RETIRED. M2 replaced the
   * launch model: "Get started" is real self-serve signup and "Request a
   * private demo" is the sales route, so there is no third door and the screen
   * that was it has left the bundle (decisions.md D-M2-A, D-M2-D). The path
   * stays reachable — a link somebody shared should not 404 — and lands on the
   * page that now does its job. Founder can veto the whole CTA change at
   * review, which is why this is a redirect and not a deletion.
   */
  { path: '/request-access', element: <Navigate to="/request-demo" replace /> },

  // Area D — the review queue
  { path: '/today', element: <Authed>{el.today()}</Authed> },
  { path: '/today/:id', element: <Authed>{el.draft()}</Authed> },

  // Areas C and B — calendar, scheduling, connections
  ...[
    { path: '/calendar', element: el.calendar() },
    { path: '/calendar/settings', element: el.schedule() },
    { path: '/calendar/sources', element: el.eventSources() },
    { path: '/connections', element: el.connections() },

    // Area E — Creative Studio
    { path: '/studio', element: el.studioGallery() },
    { path: '/studio/new', element: el.studioComposer() },
    { path: '/studio/jobs', element: el.studioJobs() },
    { path: '/studio/assets/:id', element: el.studioAsset() },

    // Area H — Billing. `/billing` and `/billing/success` are the product's
    // (BIL-0902, wire); `/billing/plans`, `/billing/subscription` and
    // `/billing/return` are the static demo's H1/H2/H4 and redirect to
    // `/billing` in live mode; `/billing/balance` is H3 in both modes.
    { path: '/billing', element: el.billing() },
    { path: '/billing/success', element: el.billingSuccess() },
    { path: '/billing/plans', element: el.billingPlans() },
    { path: '/billing/subscription', element: el.billingSubscription() },
    { path: '/billing/balance', element: el.billingBalance() },
    // The old path stays reachable: it was linked from the shell chip, the
    // dashboard tile and a live e2e spec, and a bookmark should not 404
    // because the product renamed its vocabulary (E2E-0820 F4).
    { path: '/billing/credits', element: <Navigate to="/billing/balance" replace /> },
    { path: '/billing/return', element: el.billingReturn() },

    // Area F — on-demand generate
    { path: '/generate', element: el.generate() },

    // Area G — analytics
    { path: '/analytics', element: el.analytics() },
    { path: '/analytics/:connectionId', element: el.analyticsChannel() },
  ].map(({ path, element }) => ({ path, element: <Authed>{element}</Authed> })),

  /**
   * Area I — settings. A NESTED layout, deliberately: the sections share one
   * tablist, and mounting it once above the `Outlet` is what stops the focused
   * tab being destroyed on every section change. Each child carries its own
   * heading in `handle` (typed as `SettingsHandle`), because the layout owns
   * the `h1` and there is exactly one per page.
   */
  {
    path: '/settings',
    element: <Authed>{el.settingsLayout()}</Authed>,
    children: [
      // Every entry point into Settings lands on the org profile (I1).
      { index: true, element: <Navigate to="/settings/organization" replace /> },
      {
        path: 'organization',
        element: el.settingsOrg(),
        handle: { title: 'Organization', context: 'Who you are, and how drafts should sign off' },
      },
      {
        path: 'brand-voice',
        element: el.settingsBrandVoice(),
        handle: { title: 'Brand voice', context: 'What every draft must and must not do' },
      },
      {
        path: 'tones',
        element: el.settingsTones(),
        handle: { title: 'Tones', context: 'The voices drafts can be written in', wide: true },
      },
      {
        path: 'tones/new',
        element: el.settingsToneEditor(),
        handle: {
          title: 'New custom tone',
          context: 'Brand voice always applies underneath — a tone shapes the style on top of it',
        },
      },
      {
        // The layout renames this one after the tone being edited.
        path: 'tones/:toneId',
        element: el.settingsToneEditor(),
        handle: {
          title: 'Edit tone',
          context: 'Brand voice always applies underneath — a tone shapes the style on top of it',
        },
      },
      {
        path: 'sources',
        element: el.settingsSources(),
        handle: {
          title: 'Sources & topics',
          context: 'What drafts read, and what they talk about',
        },
      },
      {
        path: 'knowledge',
        element: el.settingsKnowledge(),
        handle: {
          title: 'Knowledge',
          context: 'Documents drafts can quote — price lists, FAQs, product notes',
          wide: true,
        },
      },
      {
        path: 'team',
        element: el.settingsTeam(),
        handle: {
          title: 'Team',
          context: 'Who can see and approve what this workspace publishes',
          wide: true,
        },
      },
    ],
  },

  ...devRoutes,
  { path: '*', element: el.notFound() },
])
