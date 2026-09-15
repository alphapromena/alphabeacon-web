/**
 * The gate that decides whether first light plays — and the way it decided
 * wrong (TEST-0915, proof F on the built app against the dev API).
 *
 * The overlay writes the account's "seen" flag the moment it mounts
 * (`lib/first-light.ts`, on purpose: a reload mid-moment must not replay it).
 * The gate then re-read that flag on EVERY render, so the first provider
 * update after the arming — in LIVE mode the workspace sync, which lands
 * within the first second — read the flag back as "already seen" and
 * unmounted the moment while it was playing. On a fresh live account the
 * flag was written and nothing was ever seen. Static mode is quiet for those
 * two seconds, which is why the probes there never caught it.
 *
 * So the decision is taken ONCE per arming; a re-render mid-moment keeps it.
 */
import { act, render, screen } from '@testing-library/react'
import { createElement, useEffect, type ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/config', () => ({
  isLiveMode: () => false,
  apiBaseUrl: () => null,
}))

let reduced = false
vi.mock('@/lib/reduced-motion', () => ({
  prefersReducedMotion: () => reduced,
}))

import { DataProvider, useDataDispatch } from '@/data/provider'
import { firstLightKey } from '@/lib/first-light'
import { FirstLightGate } from './first-light-gate'

const ACCOUNT = { name: 'Dana Saif', email: `dana+${Date.now()}@example.com` }

/** A hand on the provider: arms first light, then nudges the state the way a live sync would. */
let dispatchRef: ReturnType<typeof useDataDispatch> | null = null
function Hand() {
  const dispatch = useDataDispatch()
  useEffect(() => {
    dispatchRef = dispatch
  }, [dispatch])
  return null
}

function renderGate(dataset: 'active' | 'visitor' = 'active') {
  const node: ReactNode = createElement(
    'div',
    null,
    createElement(FirstLightGate),
    createElement(Hand),
  )
  const router = createMemoryRouter([
    {
      path: '/',
      element: createElement(DataProvider, { initialDatasetId: dataset, children: node }),
    },
  ])
  return render(<RouterProvider router={router} />)
}

describe('FirstLightGate', () => {
  beforeEach(() => {
    window.localStorage.clear()
    reduced = false
    dispatchRef = null
  })

  it('plays on a fresh account, and a provider update mid-moment does not dismiss it', async () => {
    renderGate()
    await act(async () => {
      dispatchRef!({ type: 'firstLight/arm', ...ACCOUNT })
    })
    expect(screen.getByRole('status', { name: /Welcome to Malaky, Dana/ })).toBeInTheDocument()
    // The overlay has now written the account's flag — as designed.
    expect(window.localStorage.getItem(firstLightKey(ACCOUNT.email))).toBe('1')
    // A live sync lands: any unrelated state change re-renders the gate.
    await act(async () => {
      dispatchRef!({ type: 'org/update', patch: { name: 'Renamed mid-moment' } })
    })
    expect(screen.getByRole('status', { name: /Welcome to Malaky, Dana/ })).toBeInTheDocument()
  })

  it('never plays for an account that has been welcomed', async () => {
    window.localStorage.setItem(firstLightKey(ACCOUNT.email), '1')
    renderGate()
    await act(async () => {
      dispatchRef!({ type: 'firstLight/arm', ...ACCOUNT })
    })
    expect(screen.queryByRole('status', { name: /Welcome to Malaky/ })).not.toBeInTheDocument()
  })

  /*
   * NIGHT-0916 order 4 (item 82; D-NIGHT-0916-D): the overlay first paints
   * only when the workspace is on screen — the org in the state the product
   * renders from. Armed before that, it waits; it does not decide again, and
   * the account's flag is not written until it actually plays.
   */
  it('waits for the workspace, then plays — armed on a world with no org yet', async () => {
    renderGate('visitor')
    await act(async () => {
      dispatchRef!({ type: 'firstLight/arm', ...ACCOUNT })
    })
    expect(screen.queryByRole('status', { name: /Welcome to Malaky/ })).not.toBeInTheDocument()
    // Not seen: nothing has played, so nothing is recorded.
    expect(window.localStorage.getItem(firstLightKey(ACCOUNT.email))).toBeNull()
    await act(async () => {
      dispatchRef!({ type: 'workspace/created', name: 'Nova' })
    })
    expect(screen.getByRole('status', { name: /Welcome to Malaky, Dana/ })).toBeInTheDocument()
    expect(window.localStorage.getItem(firstLightKey(ACCOUNT.email))).toBe('1')
  })

  it('is not mounted at all under reduced motion', async () => {
    reduced = true
    renderGate()
    await act(async () => {
      dispatchRef!({ type: 'firstLight/arm', ...ACCOUNT })
    })
    expect(screen.queryByRole('status', { name: /Welcome to Malaky/ })).not.toBeInTheDocument()
  })
})
