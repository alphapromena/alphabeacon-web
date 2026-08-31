/**
 * The tone WIRE bodies, frozen (CUT-0831 item 3). The app dropped the preset
 * concept, but the wire keeps its field: the probe measured create-with-
 * `preset:true` → 201 and DELETE → 204 (2026-08-31, org 1485), and the app's
 * own bodies must stay byte-what-they-were — `preset: false` on create,
 * no `preset` on PATCH, and neither carrying `language`/`length` while
 * `TONE_FIELDS_ON_WIRE` is off.
 *
 * The provider hooks are stubbed whole here (unlike brand.test.ts, which
 * mounts the real provider in static mode) because this test needs the LIVE
 * branch of the seam without a live session: `isLiveMode` and the working
 * org id are the only two switches that path reads.
 */
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Tone } from '@/data/types'

vi.mock('@/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/client')>()),
  api: vi.fn(),
}))
vi.mock('@/api/config', () => ({
  apiBaseUrl: () => 'wire',
  isLiveMode: () => true,
}))
vi.mock('@/data/provider', () => ({
  useDataDispatch: () => vi.fn(),
  useFollowedSources: () => [],
  useLiveBrandIds: () => undefined,
  useLiveWorkingOrgId: () => '1',
  useOrg: () => ({}),
  useTopics: () => [],
}))
import { api } from '@/api/client'
import { useBrandActions } from '@/data/brand'
const apiMock = vi.mocked(api)

beforeEach(() => {
  apiMock.mockReset()
  window.localStorage.clear()
})

const TONE: Tone = {
  id: 'tone_wire',
  name: 'Roastery floor',
  description: 'Warm and specific.',
  rules: { do: ['Name the farm'], dont: ['Say artisanal'] },
  language: 'en',
  length: 'medium',
}

describe('the tone wire bodies (CUT-0831)', () => {
  it('create POSTs exactly {name, description, preset:false, rules} — nothing more', async () => {
    apiMock.mockResolvedValueOnce({ id: 'srv_1' })
    const { result } = renderHook(() => useBrandActions())
    await result.current.createTone(TONE)

    const [method, path, options] = apiMock.mock.calls[0]
    expect(method).toBe('POST')
    expect(path).toBe('/orgs/1/brand/tones')
    expect(options?.body).toEqual({
      name: 'Roastery floor',
      description: 'Warm and specific.',
      preset: false,
      rules: [
        { kind: 'do', text: 'Name the farm' },
        { kind: 'dont', text: 'Say artisanal' },
      ],
    })
  })

  it('edit PATCHes exactly {name, description, rules} — no preset, no fields on the wire yet', async () => {
    apiMock.mockResolvedValueOnce({ id: 'tone_wire' })
    const { result } = renderHook(() => useBrandActions())
    await result.current.updateTone(TONE)

    const [method, path, options] = apiMock.mock.calls[0]
    expect(method).toBe('PATCH')
    expect(path).toBe('/orgs/1/brand/tones/tone_wire')
    expect(options?.body).toEqual({
      name: 'Roastery floor',
      description: 'Warm and specific.',
      rules: [
        { kind: 'do', text: 'Name the farm' },
        { kind: 'dont', text: 'Say artisanal' },
      ],
    })
  })
})
