/**
 * Item 81's rule at every write seam (NIGHT-0916 order 1): a request the
 * server never answered comes back as `{ ok: false, code: 'timeout' }` with
 * the catalogue's sentence — the same failure shape every screen already
 * renders, so the alert names it, the button re-enables and the draft stays.
 * The client makes the timeout (`api/client.test.ts`); this proves no seam
 * swallows it: signup, verify-code, login, brand voice, topics, schedule — and
 * that the auth alert names it.
 */
import { render, renderHook, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import type { AuthActionResult } from '@/data/auth'
import { MESSAGES } from '@/lib/messages'

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
import { useAuthActions } from '@/data/auth'
import { useBrandActions } from '@/data/brand'
import { useSchedulingActions } from '@/data/scheduling'
import { AuthErrorAlert } from '@/features/auth/auth-error'

const apiMock = vi.mocked(api)
const noAnswer = () => new ApiError(0, 'timeout', MESSAGES.errors.noAnswer)

function expectTimeout(result: AuthActionResult) {
  expect(result.ok).toBe(false)
  if (result.ok) throw new Error('unreachable — the write was supposed to fail')
  expect(result.code).toBe('timeout')
  expect(result.message).toBe(MESSAGES.errors.noAnswer)
}

beforeEach(() => {
  apiMock.mockReset()
  dispatchSpy.mockReset()
})

describe('a submit the server never answered surfaces as a timeout failure', () => {
  it('signup', async () => {
    apiMock.mockRejectedValueOnce(noAnswer())
    const { result } = renderHook(() => useAuthActions())
    expectTimeout(
      await result.current.signUp({
        name: 'Dana Saif',
        email: 'dana@example.com',
        orgName: 'Nova',
        password: 'Roasted2Order!',
      }),
    )
  })

  it('verify-code', async () => {
    apiMock.mockRejectedValueOnce(noAnswer())
    const { result } = renderHook(() => useAuthActions())
    expectTimeout(await result.current.verifyEmail({ email: 'dana@example.com', code: '000000' }))
  })

  it('login', async () => {
    apiMock.mockRejectedValueOnce(noAnswer())
    const { result } = renderHook(() => useAuthActions())
    expectTimeout(
      await result.current.signIn({ email: 'dana@example.com', password: 'Roasted2Order!' }),
    )
  })

  it('brand voice — and it never resyncs (item 73)', async () => {
    apiMock.mockRejectedValueOnce(noAnswer())
    const { result } = renderHook(() => useBrandActions())
    expectTimeout(await result.current.saveBrandVoice({ do: ['one'], dont: [], examples: [] }))
    expect(dispatchSpy).not.toHaveBeenCalledWith({ type: 'live/resync' })
  })

  it('topics', async () => {
    apiMock.mockRejectedValueOnce(noAnswer())
    const { result } = renderHook(() => useBrandActions())
    expectTimeout(await result.current.setTopics(['single origin']))
  })

  it('schedule', async () => {
    apiMock.mockRejectedValueOnce(noAnswer())
    const { result } = renderHook(() => useSchedulingActions())
    const draft = {
      timezone: 'Asia/Amman',
      activeDays: ['mon'],
      generateAt: '07:00',
      postsPerDay: 1,
      modelId: 'gm_balanced',
      toneIds: [],
      attachToEvents: false,
      started: false,
    } as unknown as Parameters<ReturnType<typeof useSchedulingActions>['saveSchedule']>[0]
    expectTimeout(await result.current.saveSchedule(draft))
  })

  it('the auth alert names it, from the catalogue', () => {
    render(
      <AuthErrorAlert
        failure={{ ok: false, code: 'timeout', message: MESSAGES.errors.noAnswer, fieldErrors: [] }}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(MESSAGES.errors.noAnswer)
  })
})
