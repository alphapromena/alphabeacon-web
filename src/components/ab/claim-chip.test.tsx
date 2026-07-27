import { cleanup, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClaimChip } from '@/components/ab/claim-chip'
import { useCountUp } from '@/components/ab/use-count-up'
import type { Claim } from '@/data/types'

const VERIFIED: Claim = {
  id: 'claim-verified',
  source: 'reuters.com/markets/commodities',
  title: 'Copper closed at a three-month high on Chinese demand',
  state: 'verified',
}

const FLAGGED: Claim = {
  id: 'claim-flagged',
  source: 'marketchatter.example/opinion/copper',
  title: 'One analyst says copper is about to double',
  state: 'flagged',
}

/** Reduced motion is a user setting, so the tests state it rather than inherit it. */
function stubReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
}

// vitest globals are off, so Testing Library's auto-cleanup never registers.
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ClaimChip', () => {
  it('says "verified" in words, so the state never rests on colour alone', () => {
    render(<ClaimChip claim={VERIFIED} />)

    expect(screen.getByText('Verified source')).toBeInTheDocument()
    expect(screen.getByText(VERIFIED.source)).toBeInTheDocument()
  })

  it('says "flagged" in words rather than hiding the weak claim', () => {
    render(<ClaimChip claim={FLAGGED} />)

    expect(screen.getByText('Flagged source')).toBeInTheDocument()
    expect(screen.getByText(FLAGGED.source)).toBeInTheDocument()
  })

  it('renders a meaningful count through MonoNumber formatting', () => {
    stubReducedMotion(true)

    render(<ClaimChip claim={VERIFIED} count={1234} />)

    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('counts up and settles on the target when motion is allowed', async () => {
    stubReducedMotion(false)
    // Drive the frames ourselves instead of waiting on jsdom's rAF clock: the
    // assertion is "the count lands exactly on the target", and letting a real
    // 700ms animation race a test timeout measures the machine, not the hook.
    // Two frames — one mid-flight, one past the end — also prove it settles
    // rather than merely passing through the right number.
    const frames = [80, 5_000]
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const at = frames.shift()
      if (at !== undefined) queueMicrotask(() => callback(performance.now() + at))
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})

    render(<ClaimChip claim={VERIFIED} count={1234} />)

    expect(await screen.findByText('1,234')).toBeInTheDocument()
  })

  it('stays inert until a caller opts into selection', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()

    const { rerender } = render(<ClaimChip claim={VERIFIED} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    rerender(<ClaimChip claim={VERIFIED} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: /verified source/i }))

    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})

describe('useCountUp', () => {
  it('returns the target on the first render under reduced motion', () => {
    stubReducedMotion(true)

    const { result } = renderHook(() => useCountUp(1234))

    expect(result.current).toBe(1234)
  })

  it('starts from zero when motion is allowed', () => {
    stubReducedMotion(false)

    const { result } = renderHook(() => useCountUp(1234))

    expect(result.current).toBe(0)
  })
})
