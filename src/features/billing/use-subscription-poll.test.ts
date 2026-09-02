/**
 * The success-page poll under fake timers (ORDER BIL-0902): the 2 s ticks,
 * the early stop on `active`, the 60 s give-up, the unmount cleanup, and the
 * inert demo. A GET polled on a schedule — never a retry of anything.
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BillingRead, Subscription } from '@/data/billing'
import {
  RETURN_POLL_CEILING_MS,
  SUCCESS_POLL_CEILING_MS,
  SUCCESS_POLL_INTERVAL_MS,
  useSubscriptionPoll,
} from './use-subscription-poll'

const sub = (status: Subscription['status']): Subscription => ({
  plan: status === 'none' ? null : 'base',
  status,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  canceledAt: null,
  updatedAt: null,
})
const ok = (status: Subscription['status']): BillingRead<Subscription> => ({
  ok: true,
  value: sub(status),
})
const isActive = (s: Subscription) => s.status === 'active'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

/** Let the pending read resolve and the next timer (if any) be scheduled. */
const tick = async (ms = 0) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe('useSubscriptionPoll', () => {
  it('reads at once, then every 2 s, and settles the moment the status is active', async () => {
    const read = vi
      .fn<(orgId: string) => Promise<BillingRead<Subscription>>>()
      .mockResolvedValueOnce(ok('none'))
      .mockResolvedValueOnce(ok('incomplete'))
      .mockResolvedValueOnce(ok('active'))
      .mockResolvedValue(ok('active'))

    const { result } = renderHook(() =>
      useSubscriptionPoll({ orgId: '1670', read, until: isActive }),
    )
    expect(result.current.phase).toBe('polling')

    await tick(0)
    expect(read).toHaveBeenCalledTimes(1)
    expect(read).toHaveBeenCalledWith('1670')
    expect(result.current.subscription?.status).toBe('none')
    expect(result.current.phase).toBe('polling')

    // Not yet — a tick fires at 2 s, not before.
    await tick(SUCCESS_POLL_INTERVAL_MS - 1)
    expect(read).toHaveBeenCalledTimes(1)
    await tick(1)
    expect(read).toHaveBeenCalledTimes(2)
    // The wire's word is exposed every tick, so a non-active state is seen.
    expect(result.current.subscription?.status).toBe('incomplete')

    await tick(SUCCESS_POLL_INTERVAL_MS)
    expect(read).toHaveBeenCalledTimes(3)
    expect(result.current.phase).toBe('settled')
    expect(result.current.subscription?.status).toBe('active')
    expect(result.current.ticks).toBe(3)

    // Settled means STOPPED: no further reads, however long we wait.
    await tick(SUCCESS_POLL_CEILING_MS)
    expect(read).toHaveBeenCalledTimes(3)
  })

  it('gives up at 60 s with `stopped`, and stops reading', async () => {
    const read = vi.fn(async () => ok('none'))
    const { result } = renderHook(() =>
      useSubscriptionPoll({ orgId: '1670', read, until: isActive }),
    )
    await tick(0)
    // t = 0, 2, 4 … 58 s → 30 reads; at 60 s the deadline speaks first and
    // the tick due at the same instant is cancelled.
    await tick(SUCCESS_POLL_CEILING_MS)
    expect(read).toHaveBeenCalledTimes(SUCCESS_POLL_CEILING_MS / SUCCESS_POLL_INTERVAL_MS)
    expect(result.current.phase).toBe('stopped')
    expect(result.current.subscription?.status).toBe('none')

    await tick(SUCCESS_POLL_CEILING_MS)
    expect(read).toHaveBeenCalledTimes(SUCCESS_POLL_CEILING_MS / SUCCESS_POLL_INTERVAL_MS)
  })

  it('the give-up is a wall-clock promise: a read that never returns cannot delay it', async () => {
    const read = vi.fn(() => new Promise<BillingRead<Subscription>>(() => {}))
    const { result } = renderHook(() =>
      useSubscriptionPoll({ orgId: '1670', read, until: isActive }),
    )
    await tick(0)
    expect(read).toHaveBeenCalledTimes(1)
    await tick(SUCCESS_POLL_CEILING_MS - 1)
    expect(result.current.phase).toBe('polling')
    await tick(1)
    expect(result.current.phase).toBe('stopped')
    // Nothing more is scheduled behind the hung read.
    await tick(SUCCESS_POLL_CEILING_MS)
    expect(read).toHaveBeenCalledTimes(1)
  })

  it('a slow read that lands AFTER the give-up still counts when it is the answer', async () => {
    let release: (value: BillingRead<Subscription>) => void = () => {}
    const read = vi.fn(
      () =>
        new Promise<BillingRead<Subscription>>((resolve) => {
          release = resolve
        }),
    )
    const { result } = renderHook(() =>
      useSubscriptionPoll({ orgId: '1670', read, until: isActive }),
    )
    await tick(0)
    await tick(SUCCESS_POLL_CEILING_MS)
    expect(result.current.phase).toBe('stopped')
    await act(async () => {
      release(ok('active'))
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.phase).toBe('settled')
    expect(result.current.subscription?.status).toBe('active')
    await tick(SUCCESS_POLL_CEILING_MS)
    expect(read).toHaveBeenCalledTimes(1)
  })

  it('cleans up on unmount — a page left early cannot keep polling', async () => {
    const read = vi.fn(async () => ok('none'))
    const { unmount } = renderHook(() =>
      useSubscriptionPoll({ orgId: '1670', read, until: isActive }),
    )
    await tick(0)
    await tick(SUCCESS_POLL_INTERVAL_MS)
    expect(read).toHaveBeenCalledTimes(2)
    unmount()
    await tick(SUCCESS_POLL_CEILING_MS)
    expect(read).toHaveBeenCalledTimes(2)
  })

  it('a read that resolves AFTER unmount sets nothing and schedules nothing', async () => {
    let release: (value: BillingRead<Subscription>) => void = () => {}
    const read = vi.fn(
      () =>
        new Promise<BillingRead<Subscription>>((resolve) => {
          release = resolve
        }),
    )
    const { result, unmount } = renderHook(() =>
      useSubscriptionPoll({ orgId: '1670', read, until: isActive }),
    )
    await tick(0)
    expect(read).toHaveBeenCalledTimes(1)
    unmount()
    await act(async () => {
      release(ok('active'))
      await vi.advanceTimersByTimeAsync(SUCCESS_POLL_CEILING_MS)
    })
    expect(read).toHaveBeenCalledTimes(1)
    expect(result.current.phase).toBe('polling')
  })

  it('keeps asking through a failed read, and keeps the reason where the page can show it', async () => {
    const read = vi
      .fn<(orgId: string) => Promise<BillingRead<Subscription>>>()
      .mockResolvedValueOnce({
        ok: false,
        code: 'bad_gateway',
        message: 'upstream failed',
        fieldErrors: [],
      })
      .mockResolvedValue(ok('active'))
    const { result } = renderHook(() =>
      useSubscriptionPoll({ orgId: '1670', read, until: isActive }),
    )
    await tick(0)
    expect(result.current.error).toBe('upstream failed')
    expect(result.current.phase).toBe('polling')
    await tick(SUCCESS_POLL_INTERVAL_MS)
    expect(result.current.phase).toBe('settled')
    expect(result.current.error).toBeNull()
  })

  it('is inert when disabled or without an org — the demo has nothing to confirm', async () => {
    const read = vi.fn(async () => ok('active'))
    const { result: disabled } = renderHook(() =>
      useSubscriptionPoll({ orgId: '1670', read, until: isActive, enabled: false }),
    )
    const { result: orgless } = renderHook(() =>
      useSubscriptionPoll({ orgId: null, read, until: isActive }),
    )
    await tick(SUCCESS_POLL_CEILING_MS)
    expect(read).not.toHaveBeenCalled()
    expect(disabled.current.phase).toBe('idle')
    expect(orgless.current.phase).toBe('idle')
  })

  it('the portal return: a short window with no stop condition, ending quietly', async () => {
    const read = vi.fn(async () => ok('active'))
    const { result } = renderHook(() =>
      useSubscriptionPoll({
        orgId: '1670',
        read,
        until: () => false,
        ceilingMs: RETURN_POLL_CEILING_MS,
      }),
    )
    await tick(0)
    await tick(RETURN_POLL_CEILING_MS)
    expect(read).toHaveBeenCalledTimes(RETURN_POLL_CEILING_MS / SUCCESS_POLL_INTERVAL_MS)
    expect(result.current.phase).toBe('stopped')
    expect(result.current.subscription?.status).toBe('active')
  })

  it('restart is a user gesture: a fresh clock, a fresh round', async () => {
    const read = vi.fn(async () => ok('none'))
    const { result } = renderHook(() =>
      useSubscriptionPoll({
        orgId: '1670',
        read,
        until: isActive,
        ceilingMs: RETURN_POLL_CEILING_MS,
      }),
    )
    await tick(0)
    await tick(RETURN_POLL_CEILING_MS)
    expect(result.current.phase).toBe('stopped')
    const before = read.mock.calls.length
    act(() => result.current.restart())
    await tick(0)
    expect(result.current.phase).toBe('polling')
    expect(read).toHaveBeenCalledTimes(before + 1)
  })
})
