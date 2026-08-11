/**
 * Route table + session guards. Dev routes exist only outside production
 * builds. '/' is dual-purpose per screens4.md: marketing when signed out (M1),
 * the Dashboard when signed in (D1).
 *
 * CODE-SPLIT (production pass, 2026-08-11): the public marketing route is
 * the ONLY eagerly-bundled screen. Every authenticated screen, the auth
 * flow, and the dev tools load through React.lazy, so a visitor hitting
 * '/' downloads the marketing experience and nothing else — recharts,
 * Studio, Settings et al. arrive only when a signed-in route renders.
 * Direct navigation still works: Vercel rewrites every path to index.html
 * and the router resolves the lazy chunk on mount.
 *
 * Two guards, both reading the fake session in `DataProvider`:
 *   Authed — signed out goes to the marketing front door.
 *   Onboarded — signed in but unfinished lands on N3, which resumes the wizard
 *   at the right step instead of dumping people into an empty product.
 */
import { Suspense, lazy, type ComponentType, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { useOrg, useSession } from '@/data/provider'
import { MarketingHome } from '@/features/marketing/marketing-home'

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
  // Area A — auth and onboarding
  signup: () => lazyEl(() => import('@/features/auth/signup-screen'), 'SignUpScreen'),
  signin: () => lazyEl(() => import('@/features/auth/signin-screen'), 'SignInScreen'),
  verify: () => lazyEl(() => import('@/features/auth/verify-email-screen'), 'VerifyEmailScreen'),
  reset: () => lazyEl(() => import('@/features/auth/reset-password-screen'), 'ResetPasswordScreen'),
  invite: () => lazyEl(() => import('@/features/auth/accept-invite-screen'), 'AcceptInviteScreen'),
  onboarding: () => lazyEl(() => import('@/features/onboarding/onboarding-screen'), 'OnboardingScreen'),
  // The signed-in shell
  dashboard: () => lazyEl(() => import('@/features/dashboard/dashboard-screen'), 'DashboardScreen'),
  emptyOrg: () => lazyEl(() => import('@/features/system/empty-org-screen'), 'EmptyOrgScreen'),
  today: () => lazyEl(() => import('@/features/today/today-screen'), 'TodayScreen'),
  draft: () => lazyEl(() => import('@/features/today/draft-detail-screen'), 'DraftDetailScreen'),
  calendar: () => lazyEl(() => import('@/features/calendar/calendar-screen'), 'CalendarScreen'),
  schedule: () => lazyEl(() => import('@/features/calendar/schedule-config-screen'), 'ScheduleConfigScreen'),
  eventSources: () => lazyEl(() => import('@/features/calendar/event-sources-screen'), 'EventSourcesScreen'),
  connections: () => lazyEl(() => import('@/features/connections/connections-screen'), 'ConnectionsScreen'),
  studioGallery: () => lazyEl(() => import('@/features/studio/studio-screens'), 'StudioGalleryScreen'),
  studioComposer: () => lazyEl(() => import('@/features/studio/studio-screens'), 'StudioComposerScreen'),
  studioJobs: () => lazyEl(() => import('@/features/studio/studio-screens'), 'StudioJobsScreen'),
  studioAsset: () => lazyEl(() => import('@/features/studio/studio-screens'), 'StudioAssetScreen'),
  billingSubscription: () => lazyEl(() => import('@/features/billing/billing-screens'), 'SubscriptionScreen'),
  billingPlans: () => lazyEl(() => import('@/features/billing/billing-screens'), 'PlansScreen'),
  billingCredits: () => lazyEl(() => import('@/features/billing/billing-screens'), 'CreditsScreen'),
  billingReturn: () => lazyEl(() => import('@/features/billing/billing-screens'), 'CheckoutReturnScreen'),
  generate: () => lazyEl(() => import('@/features/generate/generate-screen'), 'GenerateScreen'),
  analytics: () => lazyEl(() => import('@/features/analytics/analytics-screens'), 'AnalyticsOverviewScreen'),
  analyticsChannel: () => lazyEl(() => import('@/features/analytics/analytics-screens'), 'ChannelDetailScreen'),
  settingsLayout: () => lazyEl(() => import('@/features/settings/settings-layout'), 'SettingsLayout'),
  settingsOrg: () => lazyEl(() => import('@/features/settings/organization-screen'), 'OrganizationScreen'),
  settingsBrandVoice: () => lazyEl(() => import('@/features/settings/brand-voice-screen'), 'BrandVoiceScreen'),
  settingsTones: () => lazyEl(() => import('@/features/settings/tones-screen'), 'TonesScreen'),
  settingsToneEditor: () => lazyEl(() => import('@/features/settings/tones-screen'), 'ToneEditorScreen'),
  settingsSources: () => lazyEl(() => import('@/features/settings/sources-screen'), 'SourcesScreen'),
  settingsKnowledge: () => lazyEl(() => import('@/features/settings/knowledge-screen'), 'KnowledgeScreen'),
  settingsTeam: () => lazyEl(() => import('@/features/settings/team-screen'), 'TeamScreen'),
  legal: (doc: 'privacy' | 'terms') => lazyEl(() => import('@/features/system/legal-screens'), doc === 'privacy' ? 'PrivacyScreen' : 'TermsScreen'),
  notFound: () => lazyEl(() => import('@/features/system/not-found'), 'NotFoundScreen'),
  devDatasets: () => lazyEl(() => import('@/features/dev/dev-datasets'), 'DevDatasetsScreen'),
  devStates: () => lazyEl(() => import('@/features/dev/dev-states'), 'DevStatesScreen'),
  devKitchenSink: () => lazyEl(() => import('@/features/dev/dev-kitchen-sink'), 'DevKitchenSinkScreen'),
}

function RootGate() {
  const session = useSession()
  const org = useOrg()
  if (!session.signedIn) return <MarketingHome />
  if (!org.onboarding.completed) return <>{el.emptyOrg()}</>
  return <>{el.dashboard()}</>
}

function Authed({ children }: { children: ReactNode }) {
  const session = useSession()
  const org = useOrg()
  if (!session.signedIn) return <Navigate to="/" replace />
  if (!org.onboarding.completed) return <>{el.emptyOrg()}</>
  return children
}

/** Auth screens redirect away once there is nothing left to authenticate. */
function SignedOutOnly({ children }: { children: ReactNode }) {
  const session = useSession()
  const org = useOrg()
  if (session.signedIn && org.onboarding.completed) return <Navigate to="/" replace />
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
  { path: '/', element: <RootGate /> },

  // Area A — auth and onboarding
  { path: '/signup', element: <SignedOutOnly>{el.signup()}</SignedOutOnly> },
  { path: '/login', element: <SignedOutOnly>{el.signin()}</SignedOutOnly> },
  { path: '/verify-email', element: el.verify() },
  { path: '/reset-password', element: el.reset() },
  // The invite deep link (docs/api/api.md): /accept-invite?email=…&code=…
  { path: '/accept-invite', element: el.invite() },
  { path: '/onboarding', element: el.onboarding() },

  // Public legal documents (production pass): real routes, linked from the
  // marketing footer and the signup consent line.
  { path: '/privacy', element: el.legal('privacy') },
  { path: '/terms', element: el.legal('terms') },

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

    // Area H — Billing
    { path: '/billing', element: el.billingSubscription() },
    { path: '/billing/plans', element: el.billingPlans() },
    { path: '/billing/subscription', element: el.billingSubscription() },
    { path: '/billing/credits', element: el.billingCredits() },
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
