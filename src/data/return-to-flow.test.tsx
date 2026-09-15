/**
 * Going back to where the person was (NIGHT-0916 order 3; D-NIGHT-0916-C),
 * seam by seam in jsdom:
 *   - the guard writes the intended app path (pathname + search) before it
 *     sends a signed-out visit to login;
 *   - the 401 handler writes it before its purge and push;
 *   - the sign-in screen takes it on success (reads, clears, goes there) and
 *     lands on `/` when there is none;
 *   - a deliberate sign-out clears it;
 *   - the verify screen never reads it.
 * The router is a declarative MemoryRouter (a data router cannot navigate
 * under jsdom); the handler's own push goes through window.history, which
 * jsdom keeps.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/config', () => ({
  isLiveMode: () => true,
  apiBaseUrl: () => 'wire',
}))

vi.mock('@/components/ab/toast', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
}))

// `@/routes` builds the app's browser router at module level; a data router
// cannot initialise under jsdom, so the constructor is stubbed and only the
// guards come out of it.
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  createBrowserRouter: () => ({ navigate: () => undefined }),
}))

// The verify screen's code input: input-otp mirrors the selection on a timer
// that outlives jsdom's window at teardown; a plain input stands in, with the
// same contract (onChange, onComplete at maxLength).
vi.mock('@/components/ui/input-otp', () => ({
  InputOTP: ({
    id,
    value,
    maxLength,
    onChange,
    onComplete,
  }: {
    id?: string
    value: string
    maxLength: number
    onChange: (value: string) => void
    onComplete?: () => void
  }) => (
    <input
      id={id}
      value={value}
      onChange={(event) => {
        onChange(event.target.value)
        if (event.target.value.length >= maxLength) onComplete?.()
      }}
    />
  ),
  InputOTPGroup: ({ children }: { children?: ReactNode }) => <>{children}</>,
  InputOTPSlot: () => null,
}))

// The auth seam stays real by default; the screens' tests hand it a stub.
vi.mock('@/data/auth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/data/auth')>()
  return { ...original, useAuthActions: vi.fn(original.useAuthActions) }
})

import { resetUnauthorizedGuard } from '@/api/client'
import { saveSession } from '@/api/session'
import { useAuthActions } from '@/data/auth'
import { DataProvider, useDataDispatch } from '@/data/provider'
import { SignInScreen } from '@/features/auth/signin-screen'
import { VerifyEmailScreen } from '@/features/auth/verify-email-screen'
import { configureNavigation } from '@/lib/navigation'
import { RETURN_TO_KEY } from '@/lib/return-to'
import { Authed, NavigationCommit, SignedOutOnly } from '@/routes'

const realAuthActions = vi.mocked(useAuthActions).getMockImplementation()!
let ResizeObserverKept: unknown
let matchMediaKept: unknown

const SESSION = {
  token: 'dead-token-night-0916',
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

function unauthorized(): Response {
  return new Response(
    JSON.stringify({ error: { code: 'unauthorized', message: 'Session expired' } }),
    { status: 401, headers: { 'content-type': 'application/json' } },
  )
}

function Where() {
  const { pathname, search } = useLocation()
  return <div data-testid="where">{pathname + search}</div>
}

/** What routes.tsx does for the app: the router's navigate to the data layer, and its commits reported. */
function Bridge() {
  const navigate = useNavigate()
  configureNavigation((to, options) => navigate(to, options))
  return <NavigationCommit />
}

function mount(at: string, screens: ReactNode) {
  return render(
    <DataProvider initialDatasetId="active">
      <MemoryRouter initialEntries={[at]}>
        <Bridge />
        <Where />
        <Routes>
          <Route path="/" element={<div>front door</div>} />
          <Route path="/login" element={<div>login screen</div>} />
          {screens}
        </Routes>
      </MemoryRouter>
    </DataProvider>,
  )
}

const where = () => screen.getByTestId('where').textContent
const remembered = () => window.sessionStorage.getItem(RETURN_TO_KEY)
const authed = (path: string, label: string) => (
  <Route
    path={path}
    element={
      <Authed>
        <div>{label}</div>
      </Authed>
    }
  />
)

beforeAll(() => {
  // The auth screens' layout measures (ResizeObserver) and shadcn asks the
  // viewport (matchMedia); jsdom has neither — the app-shell test's stubs.
  class ResizeObserverStub {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe() {
      this.callback([], this as unknown as ResizeObserver)
    }
    unobserve() {}
    disconnect() {}
  }
  ResizeObserverKept = ResizeObserverStub
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  matchMediaKept = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })
  vi.stubGlobal('matchMedia', matchMediaKept)
})

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  // Back to the real seam; a screen's test hands it a stub of its own.
  vi.mocked(useAuthActions).mockImplementation(realAuthActions)
  // A never-answering wire: the sync stays pending, nothing lands.
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise<Response>(() => undefined)),
  )
  resetUnauthorizedGuard()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.stubGlobal('ResizeObserver', ResizeObserverKept)
  vi.stubGlobal('matchMedia', matchMediaKept)
  configureNavigation(null)
  window.history.replaceState({}, '', '/')
})

describe('the guard writes the intended path before it sends a signed-out visit to login', () => {
  it('a deep link with a query', async () => {
    mount('/billing?tab=balance', authed('/billing', 'billing screen'))
    await waitFor(() => expect(where()).toBe('/login'))
    expect(remembered()).toBe('/billing?tab=balance')
  })

  it('a nested settings path', async () => {
    mount('/settings/team', authed('/settings/team', 'team screen'))
    await waitFor(() => expect(where()).toBe('/login'))
    expect(remembered()).toBe('/settings/team')
  })
})

describe('the 401 handler writes the path it was on before its purge and push', () => {
  it('a token dead on the boot sync at /settings/team?x=1', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => unauthorized()),
    )
    saveSession(SESSION, true)
    window.history.replaceState({}, '', '/settings/team?x=1')
    mount('/settings/team?x=1', authed('/settings/team', 'team screen'))
    await waitFor(() => expect(window.location.pathname).toBe('/login'))
    await waitFor(() => expect(where()).toBe('/login'))
    expect(remembered()).toBe('/settings/team?x=1')
  })
})

describe('the sign-in screen takes it on success', () => {
  function stubSignIn() {
    const signIn = vi.fn(async () => ({ ok: true as const }))
    vi.mocked(useAuthActions).mockReturnValue({
      signIn,
    } as unknown as ReturnType<typeof useAuthActions>)
    return signIn
  }

  async function signIn() {
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Work email'), 'dana@example.com')
    await user.type(screen.getByLabelText('Password', { exact: true }), 'Roasted2Order!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
  }

  it('reads, clears, and goes there', async () => {
    stubSignIn()
    window.sessionStorage.setItem(RETURN_TO_KEY, '/billing?tab=balance')
    render(
      <DataProvider initialDatasetId="active">
        <MemoryRouter initialEntries={['/login']}>
          <Where />
          <Routes>
            <Route path="/login" element={<SignInScreen />} />
            <Route path="/billing" element={<div>billing screen</div>} />
          </Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    await signIn()
    await waitFor(() => expect(screen.getByText('billing screen')).toBeInTheDocument())
    expect(remembered()).toBeNull()
  })

  it('goes there even though the auth route redirects signed-in visitors — the redirect is decided at mount', async () => {
    // The real seam establishes the session mid-submit; the auth route's
    // redirect must not fire on that render and overtake the screen's own
    // navigation (the live run that found it: order-3/live-auth-401-alone-run1.log).
    let dispatch: ReturnType<typeof useDataDispatch> | null = null
    function Hand() {
      dispatch = useDataDispatch()
      return null
    }
    vi.mocked(useAuthActions).mockReturnValue({
      signIn: vi.fn(async () => {
        dispatch!({ type: 'live/sessionEstablished', session: SESSION, activeOrgId: '42' })
        return { ok: true as const }
      }),
    } as unknown as ReturnType<typeof useAuthActions>)
    window.sessionStorage.setItem(RETURN_TO_KEY, '/billing?tab=balance')
    render(
      <DataProvider initialDatasetId="active">
        <MemoryRouter initialEntries={['/login']}>
          <Hand />
          <Where />
          <Routes>
            <Route
              path="/login"
              element={
                <SignedOutOnly>
                  <SignInScreen />
                </SignedOutOnly>
              }
            />
            <Route path="/" element={<div>front door</div>} />
            <Route path="/billing" element={<div>billing screen</div>} />
          </Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    await signIn()
    await waitFor(() => expect(where()).toBe('/billing?tab=balance'))
    // And it stays there: no redirect to `/` comes after.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(where()).toBe('/billing?tab=balance')
    expect(remembered()).toBeNull()
  })

  it('lands on `/` when there is none', async () => {
    stubSignIn()
    render(
      <DataProvider initialDatasetId="active">
        <MemoryRouter initialEntries={['/login']}>
          <Where />
          <Routes>
            <Route path="/login" element={<SignInScreen />} />
            <Route path="/" element={<div>front door</div>} />
          </Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    await signIn()
    await waitFor(() => expect(where()).toBe('/'))
    expect(screen.getByText('front door')).toBeInTheDocument()
  })

  it('a stored value that is not an app path is ignored and cleared', async () => {
    stubSignIn()
    window.sessionStorage.setItem(RETURN_TO_KEY, '//evil.example/billing')
    render(
      <DataProvider initialDatasetId="active">
        <MemoryRouter initialEntries={['/login']}>
          <Where />
          <Routes>
            <Route path="/login" element={<SignInScreen />} />
            <Route path="/" element={<div>front door</div>} />
          </Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    await signIn()
    await waitFor(() => expect(where()).toBe('/'))
    expect(remembered()).toBeNull()
  })
})

describe('a deliberate sign-out clears it', () => {
  let actions: ReturnType<typeof useAuthActions> | null = null
  function Grab() {
    actions = useAuthActions()
    return null
  }

  it('signOut', async () => {
    // A wire that answers the revoke: 204, the contract's sign-out.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 })),
    )
    saveSession(SESSION, true)
    window.sessionStorage.setItem(RETURN_TO_KEY, '/billing')
    render(
      <DataProvider initialDatasetId="active">
        <MemoryRouter initialEntries={['/billing']}>
          <Bridge />
          <Grab />
          <Where />
          <Routes>
            <Route path="/" element={<div>front door</div>} />
            <Route path="/billing" element={<div>billing screen</div>} />
          </Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    await actions!.signOut()
    await waitFor(() => expect(where()).toBe('/'))
    expect(remembered()).toBeNull()
  })
})

describe('the verify screen never reads it', () => {
  it('a verified code lands on `/` and leaves the key alone', async () => {
    window.sessionStorage.setItem(RETURN_TO_KEY, '/billing')
    vi.mocked(useAuthActions).mockReturnValue({
      verifyEmail: vi.fn(async () => ({ ok: true as const })),
      resendVerification: vi.fn(async () => ({ ok: true as const })),
    } as unknown as ReturnType<typeof useAuthActions>)
    render(
      <DataProvider initialDatasetId="active">
        <MemoryRouter initialEntries={['/verify-email?email=dana%40example.com']}>
          <Where />
          <Routes>
            <Route path="/verify-email" element={<VerifyEmailScreen />} />
            <Route path="/" element={<div>front door</div>} />
            <Route path="/billing" element={<div>billing screen</div>} />
          </Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Verification code'), '000000')
    await waitFor(() => expect(where()).toBe('/'))
    expect(screen.queryByText('billing screen')).not.toBeInTheDocument()
    expect(remembered()).toBe('/billing')
  })
})
