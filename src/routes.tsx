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
import { ConnectionsScreen } from '@/features/connections/connections-screen'
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
import { PlaceholderScreen } from '@/features/system/placeholder-screen'

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

const STUB_ROUTES = [
  { path: '/analytics', title: 'Analytics', phase: 'W6' },
  { path: '/settings', title: 'Settings', phase: 'W6' },
  { path: '/settings/tones', title: 'Tones', phase: 'W6' },
  { path: '/generate', title: 'Generate', phase: 'W6' },
]

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
  ].map(({ path, element }) => ({ path, element: <Authed>{element}</Authed> })),

  ...STUB_ROUTES.map(({ path, title, phase }) => ({
    path,
    element: (
      <Authed>
        <PlaceholderScreen title={title} phase={phase} />
      </Authed>
    ),
  })),
  ...devRoutes,
  { path: '*', element: <NotFoundScreen /> },
])
