/**
 * The route guards, and where a session that ends mid-life lands
 * (ORDER-FIX-0915, item 75).
 *
 * TEST-0915 measured three cases on the built app against the dev API: a
 * token expired at boot on `/` landed on login with the toast (right); a token
 * revoked mid-session on an authed route landed on `/`, the marketing home
 * (wrong, toast at 413 ms); a boot on an authed route with a dead token landed
 * on `/` too (wrong, seen on Billing in the production smoke).
 *
 * The mechanism: the 401 handler purges the session, toasts and pushes
 * `/login`; the provider's update re-renders the CURRENT authed route with the
 * cleared session first, and `Authed` answered a signed-out render with
 * `<Navigate to="/" replace />`, which supersedes the handler's push. So the
 * guard's target is the fix: an unauthenticated visitor on a protected route
 * goes to login, never to the marketing home, and the guard and the handler
 * agree.
 *
 * The guards render around stub screens in a declarative `MemoryRouter` on
 * the static provider's worlds. A data router cannot navigate under jsdom
 * (Node's Request refuses jsdom's AbortSignal); the guards use only the
 * provider hooks and `<Navigate>`, so the flavour of router is not what is
 * under test. The handler's own navigation is covered in
 * `data/session-breach.test.tsx`; the real race between the two, on a browser
 * router against the dev API, by `e2e/live-auth-401.spec.ts`.
 */
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/config', () => ({
  isLiveMode: () => false,
  apiBaseUrl: () => null,
}))

// `@/routes` builds the app's browser router at module level, and a data
// router cannot initialise under jsdom (Node's Request refuses jsdom's
// AbortSignal); the constructor is stubbed so only the guards come out of it.
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  createBrowserRouter: () => ({}),
}))

import { DataProvider, useDataDispatch } from '@/data/provider'
import { Authed, SignedOutOnly } from '@/routes'

let dispatchRef: ReturnType<typeof useDataDispatch> | null = null

function Hand() {
  dispatchRef = useDataDispatch()
  return null
}

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>
}

function mount(dataset: 'active' | 'visitor', at: string) {
  return render(
    <DataProvider initialDatasetId={dataset}>
      <Hand />
      <MemoryRouter initialEntries={[at]}>
        <Where />
        <Routes>
          <Route path="/" element={<div>marketing home</div>} />
          <Route
            path="/billing"
            element={
              <Authed>
                <div>billing screen</div>
              </Authed>
            }
          />
          <Route
            path="/login"
            element={
              <SignedOutOnly>
                <div>login screen</div>
              </SignedOutOnly>
            }
          />
        </Routes>
      </MemoryRouter>
    </DataProvider>,
  )
}

const where = () => screen.getByTestId('where').textContent

beforeEach(() => {
  dispatchRef = null
})

describe('Authed — where an unauthenticated visitor lands', () => {
  it('a boot on an authed route with no session lands on login, not on the marketing home', async () => {
    mount('visitor', '/billing')
    await waitFor(() => expect(where()).toBe('/login'))
    expect(screen.getByText('login screen')).toBeInTheDocument()
    expect(screen.queryByText('marketing home')).not.toBeInTheDocument()
  })

  it('a session that ends mid-session on an authed route lands on login — the guard agrees with the 401 handler', async () => {
    mount('active', '/billing')
    expect(await screen.findByText('billing screen')).toBeInTheDocument()
    // Exactly what the 401 handler dispatches after purging the storage.
    await act(async () => {
      dispatchRef!({ type: 'live/sessionCleared' })
    })
    await waitFor(() => expect(where()).toBe('/login'))
    expect(screen.getByText('login screen')).toBeInTheDocument()
  })

  it('a signed-in visitor with a workspace is sent from login into the product (unchanged)', async () => {
    mount('active', '/login')
    await waitFor(() => expect(where()).toBe('/'))
    expect(screen.getByText('marketing home')).toBeInTheDocument()
  })
})
