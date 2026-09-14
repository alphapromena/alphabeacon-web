/**
 * The tween behind every figure in the product (`MonoNumber`).
 *
 * The bounds test here is not hypothetical: the first version of this hook
 * used the timestamp `requestAnimationFrame` hands its callback, which shares
 * `performance.now()`'s time origin in a browser and does NOT in jsdom. A
 * counter asked to go 94 → 93 was measured leaping to **332** before decaying
 * onto its target, and a screen test caught it as "expected '96 / 40' to
 * contain '93'". Hence: one clock, clamped, and an assertion that the value
 * can never leave the interval it was given.
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useNumberTransition } from '@/components/ab/use-number-transition'

/** Let real rAF frames run for a while, the way a browser would. */
async function settle(ms = 700) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })
}

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: reduce,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useNumberTransition', () => {
  it('shows the target on the first render — a number does not arrive, it is', () => {
    const { result } = renderHook(() => useNumberTransition(1234))
    // Counting up from zero on mount is `use-count-up`'s job, and doing it
    // here would be the decorative entrance §5 bans.
    expect(result.current).toBe(1234)
  })

  it('travels to a new value without ever leaving the interval', async () => {
    const seen: number[] = []
    const { result, rerender } = renderHook(({ n }) => useNumberTransition(n), {
      initialProps: { n: 94 },
    })
    seen.push(result.current)

    rerender({ n: 93 })
    for (let i = 0; i < 30; i++) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
      })
      seen.push(result.current)
    }

    expect(Math.max(...seen), `overshot: ${seen.join(',')}`).toBeLessThanOrEqual(94)
    expect(Math.min(...seen), `undershot: ${seen.join(',')}`).toBeGreaterThanOrEqual(93)
    expect(result.current).toBe(93)
  })

  it('arrives at the target when the numbers are far apart', async () => {
    const { result, rerender } = renderHook(({ n }) => useNumberTransition(n), {
      initialProps: { n: 0 },
    })
    rerender({ n: 5000 })
    await settle()
    expect(result.current).toBe(5000)
  })

  it('counts DOWN as readily as up', async () => {
    const { result, rerender } = renderHook(({ n }) => useNumberTransition(n), {
      initialProps: { n: 40 },
    })
    rerender({ n: 0 })
    await settle()
    expect(result.current).toBe(0)
  })

  it('under reduced motion the new value is there at once, with no frames', () => {
    stubReducedMotion(true)
    const raf = vi.spyOn(globalThis, 'requestAnimationFrame')

    const { result, rerender } = renderHook(({ n }) => useNumberTransition(n), {
      initialProps: { n: 10 },
    })
    rerender({ n: 99 })

    // Removed, not shortened: someone who asked for stillness gets the fact.
    expect(result.current).toBe(99)
    expect(raf).not.toHaveBeenCalled()
    raf.mockRestore()
  })
})
