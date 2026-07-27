/**
 * Route table + session guards. Dev routes exist only outside production
 * builds. '/' is dual-purpose per screens4.md: marketing when signed out
 * (M1), the Dashboard when signed in (D1).
 */
import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { useSession } from '@/data/provider'
import { DashboardScreen } from '@/features/dashboard/dashboard-screen'
import { DevDatasetsScreen } from '@/features/dev/dev-datasets'
import { DevKitchenSinkScreen } from '@/features/dev/dev-kitchen-sink'
import { DevStatesScreen } from '@/features/dev/dev-states'
import { MarketingHome } from '@/features/marketing/marketing-home'
import { NotFoundScreen } from '@/features/system/not-found'
import { PlaceholderScreen } from '@/features/system/placeholder-screen'

function RootGate() {
  const session = useSession()
  return session.signedIn ? <DashboardScreen /> : <MarketingHome />
}

function Authed({ children }: { children: ReactNode }) {
  const session = useSession()
  if (!session.signedIn) return <Navigate to="/" replace />
  return children
}

const STUB_ROUTES = [
  { path: '/today', title: 'Today', phase: 'W3' },
  { path: '/calendar', title: 'Calendar', phase: 'W4' },
  { path: '/studio', title: 'Studio', phase: 'W5' },
  { path: '/analytics', title: 'Analytics', phase: 'W6' },
  { path: '/connections', title: 'Connections', phase: 'W4' },
  { path: '/billing', title: 'Billing', phase: 'W5' },
  { path: '/settings', title: 'Settings', phase: 'W6' },
  { path: '/onboarding', title: 'Onboarding', phase: 'W2' },
  { path: '/signup', title: 'Sign up', phase: 'W2' },
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
