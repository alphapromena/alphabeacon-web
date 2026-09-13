/**
 * The Brand voice SCREEN's three promises (item 65, 2026-09-13) — the same
 * three the seam test pins, seen from where the user stands:
 *
 * 1. one visible counter, combined across Do and Don't, and the Add controls
 *    stop at the cap;
 * 2. a workspace already above the cap keeps every rule listed AND removable —
 *    otherwise the only way down from org 1867's 94 rules is support;
 * 3. a refused save renders the wire's own words with its request id, and the
 *    success toast does not fire. This is the exact lie that made the failure
 *    invisible: five PATCHes answered 400 and the screen said "Brand voice
 *    saved" every time.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExtraVoiceRow } from '@/data/adapters/brand-adapter'
import { MAX_BRAND_VOICE_RULES, type BrandVoice } from '@/data/types'
import { MESSAGES } from '@/lib/messages'

// Pinned STATIC for the same reason billing-screen.test.tsx is: vitest reads
// `.env.local`, which would boot this live on a dev machine and static in CI.
vi.mock('@/api/config', () => ({
  isLiveMode: () => false,
  apiBaseUrl: () => null,
}))

/** Swapped per test, before the screen mounts. */
let savedVoice: BrandVoice = { do: [], dont: [], examples: [] }
let extraVoiceRows: ExtraVoiceRow[] = []

vi.mock('@/data/provider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/provider')>()
  return {
    ...actual,
    useOrg: () => ({ ...actual.useOrg(), brandVoice: savedVoice }),
    useLiveBrandIds: () => ({ canonicalVoiceId: '293', extraVoiceRows, topicIdByText: {} }),
  }
})

const saveBrandVoice = vi.fn()
vi.mock('@/data/brand', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/data/brand')>()),
  useBrandActions: () => ({ saveBrandVoice }),
}))

vi.mock('@/components/ab/toast', () => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastInfo: vi.fn(),
}))

import { DataProvider } from '@/data/provider'
import { toastError, toastSuccess } from '@/components/ab/toast'
import { BrandVoiceScreen } from './brand-voice-screen'

const rules = (count: number, prefix: string) =>
  Array.from({ length: count }, (_, index) => `${prefix} ${index + 1}`)

/**
 * A DATA router, not a MemoryRouter: `SaveBar` guards navigation with
 * `useBlocker`, which only exists under one — and the save bar is where two of
 * these tests press Save.
 */
const mount = (node: ReactNode = createElement(BrandVoiceScreen)) => {
  const router = createMemoryRouter(
    [
      {
        path: '/settings/brand-voice',
        element: createElement(DataProvider, { initialDatasetId: 'active', children: node }),
      },
    ],
    { initialEntries: ['/settings/brand-voice'] },
  )
  return render(createElement(RouterProvider, { router }))
}

/**
 * The one combined counter, read off its live region.
 *
 * NOT `getByText`: the two numbers render inside `MonoNumber` spans, and
 * Testing Library's text matcher joins only an element's DIRECT text children
 * — so the counter's own node reads " / across Do and Don't" with the digits
 * missing, and a looser regex that does match also matches the cap message,
 * which ends with the same words.
 */
const counterText = () => document.querySelector('span[aria-live="polite"]')?.textContent ?? ''

beforeEach(() => {
  saveBrandVoice.mockReset()
  saveBrandVoice.mockResolvedValue({ ok: true })
  vi.mocked(toastSuccess).mockReset()
  vi.mocked(toastError).mockReset()
  savedVoice = { do: [], dont: [], examples: [] }
  extraVoiceRows = []
})

describe('the combined counter and the cap (item 65)', () => {
  it('counts Do and Don’t TOGETHER, not each list alone', () => {
    savedVoice = { do: rules(3, 'do'), dont: rules(2, 'dont'), examples: [] }
    mount()
    // Five rules across two lists reads as five, against the one ceiling.
    expect(counterText()).toContain('5')
    expect(counterText()).toContain(String(MAX_BRAND_VOICE_RULES))
  })

  it('leaves both Add controls live below the cap', () => {
    savedVoice = { do: rules(20, 'do'), dont: rules(19, 'dont'), examples: [] }
    mount()
    expect(screen.getByRole('button', { name: 'Add do' })).toBeEnabled()
    expect(screen.getByRole('button', { name: "Add don't" })).toBeEnabled()
    expect(screen.queryByText(MESSAGES.errors.brandVoiceCapReached)).not.toBeInTheDocument()
  })

  it('disables BOTH Add controls at the cap and says why', () => {
    // 20 + 20 = 40: neither list is at 40 on its own, which is the whole
    // point of counting them together.
    savedVoice = { do: rules(20, 'do'), dont: rules(20, 'dont'), examples: [] }
    mount()
    expect(screen.getByRole('button', { name: 'Add do' })).toBeDisabled()
    expect(screen.getByRole('button', { name: "Add don't" })).toBeDisabled()
    expect(screen.getByText(MESSAGES.errors.brandVoiceCapReached)).toBeInTheDocument()
  })
})

describe('a workspace already above the cap (item 65)', () => {
  it('lists every rule and keeps each one removable', async () => {
    // Org 1867's real shape. Nothing is trimmed on the way in, and the X on
    // every row still works — the only way back under the cap.
    savedVoice = { do: rules(94, 'legacy'), dont: [], examples: [] }
    mount()

    expect(counterText()).toContain('94')
    expect(screen.getByRole('button', { name: 'Add do' })).toBeDisabled()
    expect(screen.getAllByRole('button', { name: /^Remove do rule / })).toHaveLength(94)

    await userEvent.click(screen.getByRole('button', { name: 'Remove do rule 1' }))

    expect(screen.getAllByRole('button', { name: /^Remove do rule / })).toHaveLength(93)
    expect(counterText()).toContain('93')
    // Still above the cap, so adding is still closed — but shrinking worked.
    expect(screen.getByRole('button', { name: 'Add do' })).toBeDisabled()
  })

  it('names extra voice rows instead of hiding rules that still shape drafts', () => {
    extraVoiceRows = [{ id: '294', name: 'Brand voice', ruleCount: 94 }]
    mount()
    expect(
      screen.getByText(new RegExp(MESSAGES.notices.brandVoiceExtraRows.slice(0, 40))),
    ).toBeInTheDocument()
  })
})

describe('a refused save is never reported as a success (item 65)', () => {
  /** Type one rule so the save bar appears, then press it. */
  async function editAndSave() {
    await userEvent.click(screen.getByRole('button', { name: 'Add do' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Do rule 1' }), 'Name the farm')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
  }

  it('renders the wire’s FIELD message and request id, and fires no success toast', async () => {
    // The exact refusal org 1867 met five times.
    saveBrandVoice.mockResolvedValue({
      ok: false,
      code: 'validation_failed',
      message: 'Validation failed',
      fieldErrors: [{ field: 'rules', message: 'Too big: expected array to have <=50 items' }],
      requestId: 'req-1867',
    })
    mount()
    await editAndSave()

    const alert = await screen.findByRole('alert')
    // The field message, not the envelope's vaguer one and not the catalogue's.
    expect(
      within(alert).getByText(/Too big: expected array to have <=50 items/),
    ).toBeInTheDocument()
    expect(within(alert).getByText(/req-1867/)).toBeInTheDocument()

    expect(toastSuccess).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalledWith('Too big: expected array to have <=50 items')
  })

  it('falls back to the envelope message when the wire names no field', async () => {
    saveBrandVoice.mockResolvedValue({
      ok: false,
      code: 'validation_failed',
      message: 'Name is required',
      fieldErrors: [],
      requestId: undefined,
    })
    mount()
    await editAndSave()

    expect(
      within(await screen.findByRole('alert')).getByText(/Name is required/),
    ).toBeInTheDocument()
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it('fires the green toast only after a save that actually succeeded', async () => {
    saveBrandVoice.mockResolvedValue({ ok: true })
    mount()
    await editAndSave()

    expect(toastSuccess).toHaveBeenCalledWith('Brand voice saved', expect.anything())
    expect(toastError).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
