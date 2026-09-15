/**
 * The shell as a layout (ORDER-SHELL-0915, item 77): `AppFrame` mounts once
 * above the outlet, a screen's `AppShell` declares the top bar into it, and
 * after a navigation the rail, the one indicator in it and the main are the
 * SAME DOM nodes — which is what lets the indicator travel. The real walk on
 * a browser is `e2e/shell-identity.spec.ts`; these are the seams.
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter, Outlet, Route, Routes } from 'react-router'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/config', () => ({
  isLiveMode: () => false,
  apiBaseUrl: () => null,
}))

import { AppFrame, AppShell } from '@/components/ab/app-shell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DataProvider } from '@/data/provider'

beforeAll(() => {
  // The indicator measures its row from a ResizeObserver's first notification
  // (its layout effect runs before the container's ref is attached — the
  // browser then delivers the initial observation); jsdom has no
  // ResizeObserver, so this one notifies on observe, as the browser does.
  class ResizeObserverStub {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe() {
      this.callback([], this as unknown as ResizeObserver)
    }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  // shadcn's sidebar asks the viewport (useIsMobile); jsdom has no matchMedia.
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
})

function Frame() {
  return (
    <AppFrame>
      <Outlet />
    </AppFrame>
  )
}

function TodayScreen() {
  return (
    <AppShell
      title="Today"
      context="What is waiting on you"
      actions={<button type="button">Act</button>}
    >
      <p>the queue</p>
      <Link to="/billing">to billing</Link>
    </AppShell>
  )
}

function BillingScreen() {
  return (
    <AppShell title="Billing">
      <p>the plans</p>
      <Link to="/today">to today</Link>
    </AppShell>
  )
}

function mount(at = '/today') {
  return render(
    <DataProvider initialDatasetId="active">
      <TooltipProvider>
        <MemoryRouter initialEntries={[at]}>
          <Routes>
            <Route element={<Frame />}>
              <Route path="/today" element={<TodayScreen />} />
              <Route path="/billing" element={<BillingScreen />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </DataProvider>,
  )
}

const rail = () => document.querySelector('[data-sidebar="sidebar"]')
const indicator = () => document.querySelector('[data-slot="nav-indicator"]')
const main = () => document.querySelector('main')

describe('AppShell declares into the frame above it', () => {
  it('the top bar reads the screen: title, context, actions; the content lands in main', () => {
    mount()
    expect(screen.getByRole('heading', { name: 'Today', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('What is waiting on you')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Act' })).toBeInTheDocument()
    expect(main()).toContainElement(screen.getByText('the queue'))
    expect(document.querySelectorAll('main')).toHaveLength(1)
    expect(document.querySelectorAll('h1')).toHaveLength(1)
  })

  it('a screen with no frame above it says so, loudly', () => {
    // React reports a render-time throw on console.error as well; the throw
    // is the assertion, the log is noise.
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() =>
      render(
        <AppShell title="Orphan">
          <p>no frame</p>
        </AppShell>,
      ),
    ).toThrow(/AppFrame/)
  })
})

describe('one frame across a navigation', () => {
  it('the rail, its indicator and the main are the same nodes after the hop, and the top bar follows the screen', async () => {
    mount()
    const before = { rail: rail(), indicator: indicator(), main: main() }
    expect(before.rail, 'the rail').not.toBeNull()
    expect(before.indicator, 'the indicator').not.toBeNull()

    fireEvent.click(screen.getByRole('link', { name: 'to billing' }))

    expect(await screen.findByRole('heading', { name: 'Billing', level: 1 })).toBeInTheDocument()
    expect(screen.queryByText('What is waiting on you')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Act' })).not.toBeInTheDocument()
    expect(screen.getByText('the plans')).toBeInTheDocument()
    expect(rail()).toBe(before.rail)
    expect(indicator()).toBe(before.indicator)
    expect(main()).toBe(before.main)
    expect(document.querySelectorAll('[data-slot="nav-indicator"]')).toHaveLength(1)
    expect(document.querySelectorAll('main')).toHaveLength(1)
  })

  it('the content entrance plays once per arrival: on mount, off after its 600 ms, on again after the hop', async () => {
    mount()
    expect(main()).toHaveAttribute('data-ab-enter', 'content')
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 700))
    })
    expect(main()).not.toHaveAttribute('data-ab-enter')

    fireEvent.click(screen.getByRole('link', { name: 'to billing' }))
    expect(await screen.findByRole('heading', { name: 'Billing', level: 1 })).toBeInTheDocument()
    expect(main()).toHaveAttribute('data-ab-enter', 'content')
  })
})
