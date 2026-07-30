/**
 * Route table + session guards. Dev routes exist only outside production
 * builds. '/' is dual-purpose per screens4.md: marketing when signed out (M1),
 * the Dashboard when signed in (D1).
 *
 * Two guards, both reading the fake session in `DataProvider`:
 *   Authed — signed out goes to the marketing front door.
 *   Onboarded — signed in but unfinished lands on N3, which resumes the wizard
 *   at the right step instead of dumping people into an empty product.
 */
import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { useOrg, useSession } from '@/data/provider'
import { AcceptInviteScreen } from '@/features/auth/accept-invite-screen'
import { ResetPasswordScreen } from '@/features/auth/reset-password-screen'
import { SignInScreen } from '@/features/auth/signin-screen'
import { SignUpScreen } from '@/features/auth/signup-screen'
import { VerifyEmailScreen } from '@/features/auth/verify-email-screen'
import { CalendarScreen } from '@/features/calendar/calendar-screen'
import { EventSourcesScreen } from '@/features/calendar/event-sources-screen'
import { ScheduleConfigScreen } from '@/features/calendar/schedule-config-screen'
import {
  CheckoutReturnScreen,
  CreditsScreen,
  PlansScreen,
  SubscriptionScreen,
} from '@/features/billing/billing-screens'
import {
  AnalyticsOverviewScreen,
  ChannelDetailScreen,
} from '@/features/analytics/analytics-screens'
import { ConnectionsScreen } from '@/features/connections/connections-screen'
import { GenerateScreen } from '@/features/generate/generate-screen'
import { BrandVoiceScreen } from '@/features/settings/brand-voice-screen'
import { KnowledgeScreen } from '@/features/settings/knowledge-screen'
import { OrganizationScreen } from '@/features/settings/organization-screen'
import { SettingsLayout } from '@/features/settings/settings-layout'
import { SourcesScreen } from '@/features/settings/sources-screen'
import { TeamScreen } from '@/features/settings/team-screen'
import { ToneEditorScreen, TonesScreen } from '@/features/settings/tones-screen'
import {
  StudioAssetScreen,
  StudioComposerScreen,
  StudioGalleryScreen,
  StudioJobsScreen,
} from '@/features/studio/studio-screens'
import { DashboardScreen } from '@/features/dashboard/dashboard-screen'
import { DraftDetailScreen } from '@/features/today/draft-detail-screen'
import { TodayScreen } from '@/features/today/today-screen'
import { DevDatasetsScreen } from '@/features/dev/dev-datasets'
import { DevKitchenSinkScreen } from '@/features/dev/dev-kitchen-sink'
import { DevStatesScreen } from '@/features/dev/dev-states'
import { MarketingHome } from '@/features/marketing/marketing-home'
import { OnboardingScreen } from '@/features/onboarding/onboarding-screen'
import { EmptyOrgScreen } from '@/features/system/empty-org-screen'
import { NotFoundScreen } from '@/features/system/not-found'

function RootGate() {
  const session = useSession()
  const org = useOrg()
  if (!session.signedIn) return <MarketingHome />
  if (!org.onboarding.completed) return <EmptyOrgScreen />
  return <DashboardScreen />
}

function Authed({ children }: { children: ReactNode }) {
  const session = useSession()
  const org = useOrg()
  if (!session.signedIn) return <Navigate to="/" replace />
  if (!org.onboarding.completed) return <EmptyOrgScreen />
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
      { path: '/dev/datasets', element: <DevDatasetsScreen /> },
      { path: '/dev/states', element: <DevStatesScreen /> },
      { path: '/dev/kitchen-sink', element: <DevKitchenSinkScreen /> },
    ]

export const router = createBrowserRouter([
  { path: '/', element: <RootGate /> },

  // Area A — auth and onboarding
  {
    path: '/signup',
    element: (
      <SignedOutOnly>
        <SignUpScreen />
      </SignedOutOnly>
    ),
  },
  {
    path: '/login',
    element: (
      <SignedOutOnly>
        <SignInScreen />
      </SignedOutOnly>
    ),
  },
  { path: '/verify-email', element: <VerifyEmailScreen /> },
  { path: '/reset-password', element: <ResetPasswordScreen /> },
  // The invite deep link (docs/api/api.md): /accept-invite?email=…&code=…
  { path: '/accept-invite', element: <AcceptInviteScreen /> },
  { path: '/onboarding', element: <OnboardingScreen /> },

  // Area D — the review queue
  {
    path: '/today',
    element: (
      <Authed>
        <TodayScreen />
      </Authed>
    ),
  },
  {
    path: '/today/:id',
    element: (
      <Authed>
        <DraftDetailScreen />
      </Authed>
    ),
  },

  // Areas C and B — calendar, scheduling, connections
  ...[
    { path: '/calendar', element: <CalendarScreen /> },
    { path: '/calendar/settings', element: <ScheduleConfigScreen /> },
    { path: '/calendar/sources', element: <EventSourcesScreen /> },
    { path: '/connections', element: <ConnectionsScreen /> },

    // Area E — Creative Studio
    { path: '/studio', element: <StudioGalleryScreen /> },
    { path: '/studio/new', element: <StudioComposerScreen /> },
    { path: '/studio/jobs', element: <StudioJobsScreen /> },
    { path: '/studio/assets/:id', element: <StudioAssetScreen /> },

    // Area H — Billing
    { path: '/billing', element: <SubscriptionScreen /> },
    { path: '/billing/plans', element: <PlansScreen /> },
    { path: '/billing/subscription', element: <SubscriptionScreen /> },
    { path: '/billing/credits', element: <CreditsScreen /> },
    { path: '/billing/return', element: <CheckoutReturnScreen /> },

    // Area F — on-demand generate
    { path: '/generate', element: <GenerateScreen /> },

    // Area G — analytics
    { path: '/analytics', element: <AnalyticsOverviewScreen /> },
    { path: '/analytics/:connectionId', element: <ChannelDetailScreen /> },
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
    element: (
      <Authed>
        <SettingsLayout />
      </Authed>
    ),
    children: [
      // Every entry point into Settings lands on the org profile (I1).
      { index: true, element: <Navigate to="/settings/organization" replace /> },
      {
        path: 'organization',
        element: <OrganizationScreen />,
        handle: { title: 'Organization', context: 'Who you are, and how drafts should sign off' },
      },
      {
        path: 'brand-voice',
        element: <BrandVoiceScreen />,
        handle: { title: 'Brand voice', context: 'What every draft must and must not do' },
      },
      {
        path: 'tones',
        element: <TonesScreen />,
        handle: { title: 'Tones', context: 'The voices drafts can be written in', wide: true },
      },
      {
        path: 'tones/new',
        element: <ToneEditorScreen />,
        handle: {
          title: 'New custom tone',
          context: 'Brand voice always applies underneath — a tone shapes the style on top of it',
        },
      },
      {
        // The layout renames this one after the tone being edited.
        path: 'tones/:toneId',
        element: <ToneEditorScreen />,
        handle: {
          title: 'Edit tone',
          context: 'Brand voice always applies underneath — a tone shapes the style on top of it',
        },
      },
      {
        path: 'sources',
        element: <SourcesScreen />,
        handle: {
          title: 'Sources & topics',
          context: 'What drafts read, and what they talk about',
        },
      },
      {
        path: 'knowledge',
        element: <KnowledgeScreen />,
        handle: {
          title: 'Knowledge',
          context: 'Documents drafts can quote — price lists, FAQs, product notes',
          wide: true,
        },
      },
      {
        path: 'team',
        element: <TeamScreen />,
        handle: {
          title: 'Team',
          context: 'Who can see and approve what this workspace publishes',
          wide: true,
        },
      },
    ],
  },

  ...devRoutes,
  { path: '*', element: <NotFoundScreen /> },
])
