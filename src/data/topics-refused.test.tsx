/**
 * Item 73's rule at the topics seam (NIGHT-0916 order 5, item 78;
 * D-NIGHT-0916-E): a refused topic write never resyncs — the optimistic chip
 * stays in state and the failure comes back with the wire's message and
 * request id; a landed write resyncs once. On the dispatch spy.
 */
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'

vi.mock('@/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/client')>()),
  api: vi.fn(),
}))
vi.mock('@/api/config', () => ({
  apiBaseUrl: () => 'wire',
  isLiveMode: () => true,
}))
const { dispatchSpy } = vi.hoisted(() => ({ dispatchSpy: vi.fn() }))
vi.mock('@/data/provider', () => ({
  useDataDispatch: () => dispatchSpy,
  useUsers: () => [],
  useFollowedSources: () => [],
  useLiveBrandIds: () => ({ canonicalVoiceId: '293', extraVoiceRows: [], topicIdByText: {} }),
  useLiveWorkingOrgId: () => '1867',
  useLiveScheduleId: () => null,
  useOrg: () => ({ name: 'Malaky', brandVoice: { do: [], dont: [], examples: [] } }),
  useTopics: () => [],
}))

import { api } from '@/api/client'
import { useBrandActions } from '@/data/brand'

const apiMock = vi.mocked(api)

beforeEach(() => {
  apiMock.mockReset()
  dispatchSpy.mockReset()
})

describe('a refused topic write', () => {
  it('keeps the optimistic chip, never resyncs, and says why with the request id', async () => {
    apiMock.mockRejectedValueOnce(
      new ApiError(400, 'bad_request', 'Topic refused by the wire', undefined, 'req-78'),
    )
    const { result } = renderHook(() => useBrandActions())
    const outcome = await result.current.setTopics(['single origin'])
    expect(outcome.ok).toBe(false)
    if (outcome.ok) throw new Error('unreachable')
    expect(outcome.message).toBe('Topic refused by the wire')
    expect(outcome.requestId).toBe('req-78')
    // The chip was dispatched, optimistically — and nothing took it back.
    expect(dispatchSpy).toHaveBeenCalledWith({ type: 'topics/set', topics: ['single origin'] })
    expect(dispatchSpy).not.toHaveBeenCalledWith({ type: 'live/resync' })
  })
})

describe('a landed topic write', () => {
  it('resyncs exactly once', async () => {
    apiMock.mockResolvedValueOnce({ id: 't1', description: 'cold brew' })
    const { result } = renderHook(() => useBrandActions())
    const outcome = await result.current.setTopics(['cold brew'])
    expect(outcome.ok).toBe(true)
    const resyncs = dispatchSpy.mock.calls.filter(([action]) => action.type === 'live/resync')
    expect(resyncs).toHaveLength(1)
  })
})
