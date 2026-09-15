/**
 * The 401 handler, end to end in jsdom with the network stubbed (ORDER-FIX-0915,
 * item 75): a stored session, the boot sync answers 401, and the app must end
 * on login with the session purged and the toast shown — whether it booted on
 * `/` (the case that always worked) or on an authed route (the case that
 * landed on the marketing home, because the route guard's redirect won the
 * race against the handler's push).
 *
 * The handler navigates through `window.history`, which jsdom keeps, so its
 * half is read from `window.location`; the guard's half from a declarative
 * `MemoryRouter` (a data router cannot navigate under jsdom). The race between
 * the two on a real browser is `e2e/live-auth-401.spec.ts`'s.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/config', () => ({
  isLiveMode: () => true,
  apiBaseUrl: () => 'wire',
}))

vi.mock('@/components/ab/toast', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
}))

// `@/routes` builds the app's browser router at module level, and a data
// router cannot initialise under jsdom (Node's Request refuses jsdom's
// AbortSignal); the constructor is stubbed so only the guards come out of it.
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  createBrowserRouter: () => ({}),
}))

import { resetUnauthorizedGuard } from '@/api/client'
import { saveSession } from '@/api/session'
import { toastError } from '@/components/ab/toast'
import { DataProvider } from '@/data/provider'
import { MESSAGES } from '@/lib/messages'
import { Authed, SignedOutOnly } from '@/routes'

const SESSION = {
  token: 'dead-token-fix-0915',
  expiresAt: '2099-01-01T00:00:00.000Z',
  user: {
    id: 'u1',
    name: 'Dana Saif',
    email: 'dana@example.com',
    role: 'user',
    status: 'active',
    emailVerifiedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  orgs: [
    {
      id: '42',
      name: 'Nova Skincare',
      slug: 'nova-skincare',
      status: 'active',
      role: 'owner',
      joinedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
} as unknown as Parameters<typeof saveSession>[0]

/** Every request the dead token makes answers 401, the contract's envelope. */
function unauthorized(): Response {
  return new Response(
    JSON.stringify({ error: { code: 'unauthorized', message: 'Session expired' } }),
    { status: 401, headers: { 'content-type': 'application/json' } },
  )
}

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>
}

function mount(at: string) {
  window.history.replaceState({}, '', at)
  return render(
    <DataProvider initialDatasetId="active">
      <MemoryRouter initialEntries={[at]}>
        <Where />
        <Routes>
          <Route path="/" element={<div>front door</div>} />
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
const stored = () =>
  Boolean(
    window.sessionStorage.getItem('ab-live-session') ||
    window.localStorage.getItem('ab-live-session'),
  )

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  vi.mocked(toastError).mockClear()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => unauthorized()),
  )
  // The client fires the hook ONCE per breach and a fresh sign-in re-arms it
  // (data/auth.ts). This harness stores the session directly, so it re-arms
  // by hand — the way client.test.ts does.
  resetUnauthorizedGuard()
  saveSession(SESSION, true)
})

afterEach(() => {
  vi.unstubAllGlobals()
  window.history.replaceState({}, '', '/')
})

describe('a 401 on the boot sync', () => {
  it('booting on `/`: purges the session, toasts, and the handler itself pushes login', async () => {
    expect(stored()).toBe(true)
    mount('/')
    // The handler's own navigation goes through window.history (the browser
    // router follows it in the app); jsdom keeps that history.
    await waitFor(() => expect(window.location.pathname).toBe('/login'))
    expect(stored()).toBe(false)
    expect(toastError).toHaveBeenCalledWith(MESSAGES.errors.sessionExpired)
    expect(screen.getByText('front door')).toBeInTheDocument()
  })

  it('booting on an authed route: the guard sends the cleared session to login, where the handler is pushing too', async () => {
    mount('/billing')
    await waitFor(() => expect(where()).toBe('/login'))
    expect(screen.getByText('login screen')).toBeInTheDocument()
    expect(screen.queryByText('front door')).not.toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
    expect(stored()).toBe(false)
    expect(toastError).toHaveBeenCalledWith(MESSAGES.errors.sessionExpired)
  })
})
