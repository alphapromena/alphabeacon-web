/**
 * Where a session ends lands (NIGHT-0916 order 2, item 83; D-NIGHT-0916-B).
 *
 * Two ways a session ends, two landings, each the same from every route:
 *   - a DELIBERATE sign-out lands on the marketing home — the action moves to
 *     `/` through the router, waits for that location to be COMMITTED (the
 *     router's navigation is a transition, which a plain state update would
 *     overtake), and only then clears the session, so the route that renders
 *     signed out is RootGate, never the guard;
 *   - a FORCED sign-out (the 401 handler clearing the session in place) lands
 *     on login — the guard's answer (D-FIX-0915-A stands).
 * Proven from Today, Billing, Settings and the Dashboard, on the static
 * provider's worlds in a declarative MemoryRouter (a data router cannot
 * navigate under jsdom), the router's `navigate` registered the way routes.tsx
 * registers it.
 */
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/config', () => ({
  isLiveMode: () => false,
  apiBaseUrl: () => null,
}))

// `@/routes` builds the app's browser router at module level; a data router
// cannot initialise under jsdom, so the constructor is stubbed and only the
// guards come out of it.
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  createBrowserRouter: () => ({ navigate: () => undefined }),
}))

import { useAuthActions } from '@/data/auth'
import { DataProvider, useDataDispatch } from '@/data/provider'
import { configureNavigation } from '@/lib/navigation'
import { Authed, NavigationCommit } from '@/routes'

type Auth = ReturnType<typeof useAuthActions>
let auth: Auth | null = null
let dispatchRef: ReturnType<typeof useDataDispatch> | null = null

/**
 * What routes.tsx does for the app: hand the router's navigate to the data
 * layer, and report the paths the router commits (`NavigationCommit`, which
 * the world layout mounts).
 */
function Bridge() {
  const navigate = useNavigate()
  configureNavigation((to, options) => navigate(to, options))
  auth = useAuthActions()
  dispatchRef = useDataDispatch()
  return <NavigationCommit />
}

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>
}

const ROUTES = ['/today', '/billing', '/settings/organization', '/'] as const

function mount(at: string) {
  return render(
    <DataProvider initialDatasetId="active">
      <MemoryRouter initialEntries={[at]}>
        <Bridge />
        <Where />
        <Routes>
          <Route path="/" element={<div>marketing home or dashboard</div>} />
          <Route path="/login" element={<div>login screen</div>} />
          {ROUTES.filter((r) => r !== '/').map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <Authed>
                  <div>{path} screen</div>
                </Authed>
              }
            />
          ))}
        </Routes>
      </MemoryRouter>
    </DataProvider>,
  )
}

const where = () => screen.getByTestId('where').textContent

afterEach(() => {
  configureNavigation(null)
  auth = null
  dispatchRef = null
})

describe('a deliberate sign-out lands on the marketing home, from every route', () => {
  for (const start of ROUTES) {
    it(`from ${start}`, async () => {
      mount(start)
      expect(where()).toBe(start)
      // Not under act(): the action awaits the router's COMMIT, which act
      // would hold back until the action returned.
      const done = auth!.signOut()
      await waitFor(() => expect(where()).toBe('/'))
      await done
      expect(screen.queryByText('login screen')).not.toBeInTheDocument()
    })
  }

  it('sign-out everywhere lands there too', async () => {
    mount('/billing')
    const done = auth!.signOutEverywhere()
    await waitFor(() => expect(where()).toBe('/'))
    await done
  })
})

describe('a forced sign-out (the 401 handler clearing the session in place) lands on login, from every authed route', () => {
  for (const start of ROUTES.filter((r) => r !== '/')) {
    it(`from ${start}`, async () => {
      mount(start)
      // Exactly what the 401 handler dispatches after purging the storage.
      await act(async () => {
        dispatchRef!({ type: 'live/sessionCleared' })
      })
      await waitFor(() => expect(where()).toBe('/login'))
      expect(screen.getByText('login screen')).toBeInTheDocument()
    })
  }
})
