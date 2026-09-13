/**
 * The brand voice's THREE guarantees, at the seam (item 65, 2026-09-13).
 *
 * The failure these pin is one thing seen from three heights. On org 1867 the
 * screen read a list flattened from two voice rows and saved it onto one of
 * them, so every save wrote the merge back: 18 rules became 94 across five
 * saves. Past the wire's 50-rule limit every PATCH answered
 * `400 validation_failed` — "Too big: expected array to have <=50 items" —
 * and the screen said "Brand voice saved" anyway.
 *
 * 1. the product cap is COMBINED across Do and Don't, below the wire's 50;
 * 2. a list already above the cap still saves and still shrinks — nothing is
 *    ever silently trimmed;
 * 3. a refused save comes back `ok: false` carrying the wire's own field
 *    message and request id, so no caller can mistake it for a success.
 *
 * The provider hooks are stubbed whole (as `brand-wire.test.ts` does) because
 * these need the LIVE branch of the seam without a live session, and the
 * saved brand voice has to be controllable per test.
 */
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { MAX_BRAND_VOICE_RULES } from '@/data/types'
import { MESSAGES } from '@/lib/messages'

vi.mock('@/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/client')>()),
  api: vi.fn(),
}))
vi.mock('@/api/config', () => ({
  apiBaseUrl: () => 'wire',
  isLiveMode: () => true,
}))

/** The org's SAVED brand voice, swapped per test before mounting the hook. */
let savedVoice = { do: [] as string[], dont: [] as string[], examples: [] as string[] }
/** null exercises the lazy-create POST path; an id exercises the PATCH path. */
let canonicalVoiceId: string | null = '293'

vi.mock('@/data/provider', () => ({
  useDataDispatch: () => vi.fn(),
  useFollowedSources: () => [],
  useLiveBrandIds: () => ({ canonicalVoiceId, extraVoiceRows: [], topicIdByText: {} }),
  useLiveWorkingOrgId: () => '1867',
  useOrg: () => ({ name: 'Malaky', brandVoice: savedVoice }),
  useTopics: () => [],
}))

import { api } from '@/api/client'
import { useBrandActions } from '@/data/brand'
const apiMock = vi.mocked(api)

beforeEach(() => {
  apiMock.mockReset()
  savedVoice = { do: [], dont: [], examples: [] }
  canonicalVoiceId = '293'
})

const rules = (count: number, prefix: string) =>
  Array.from({ length: count }, (_, index) => `${prefix} ${index + 1}`)

const voice = (dos: string[], donts: string[]) => ({ do: dos, dont: donts, examples: [] })

describe('the brand voice cap (item 65)', () => {
  it('saves a list exactly at the cap, counting Do and Don’t TOGETHER', async () => {
    // The wire counts one array, so the cap must too: 20 + 20 is 40, not two
    // lists of 20 each under a per-list ceiling.
    apiMock.mockResolvedValueOnce({ id: '293' })
    const { result } = renderHook(() => useBrandActions())

    const next = voice(rules(20, 'do'), rules(20, 'dont'))
    expect(next.do.length + next.dont.length).toBe(MAX_BRAND_VOICE_RULES)
    expect(await result.current.saveBrandVoice(next)).toEqual({ ok: true })

    const [method, path, options] = apiMock.mock.calls[0]
    expect(method).toBe('PATCH')
    expect(path).toBe('/orgs/1867/brand/voices/293')
    expect((options?.body as { rules: unknown[] }).rules).toHaveLength(MAX_BRAND_VOICE_RULES)
  })

  it('refuses one past the cap with the catalogue message and never reaches the wire', async () => {
    const { result } = renderHook(() => useBrandActions())

    const refused = await result.current.saveBrandVoice(voice(rules(21, 'do'), rules(20, 'dont')))

    expect(refused).toEqual({
      ok: false,
      code: 'validation_failed',
      message: MESSAGES.errors.brandVoiceCapReached,
      fieldErrors: [{ field: 'rules', message: MESSAGES.errors.brandVoiceCapReached }],
    })
    // The point of a client cap is that the request is never made.
    expect(apiMock).not.toHaveBeenCalled()
  })

  it('counts the combined total, not either list alone', async () => {
    // 39 do-rules alone is under the cap; adding a single don't puts it over.
    const { result } = renderHook(() => useBrandActions())

    apiMock.mockResolvedValueOnce({ id: '293' })
    expect(await result.current.saveBrandVoice(voice(rules(39, 'do'), ['one dont']))).toEqual({
      ok: true,
    })

    apiMock.mockReset()
    const refused = await result.current.saveBrandVoice(voice(rules(39, 'do'), ['a', 'b']))
    expect(refused.ok).toBe(false)
    expect(apiMock).not.toHaveBeenCalled()
  })
})

describe('a list already above the cap (item 65)', () => {
  it('still saves when it SHRINKS, so above-cap rules stay removable', async () => {
    // Org 1867 is the real case: 94 rules on the row. If the cap refused every
    // save, the only way down would be support — the user could not remove a
    // rule through the product at all.
    savedVoice = voice(rules(94, 'legacy'), [])
    apiMock.mockResolvedValueOnce({ id: '293' })
    const { result } = renderHook(() => useBrandActions())

    const shrunk = voice(rules(93, 'legacy'), [])
    expect(await result.current.saveBrandVoice(shrunk)).toEqual({ ok: true })
    expect((apiMock.mock.calls[0][2]?.body as { rules: unknown[] }).rules).toHaveLength(93)
  })

  it('refuses to GROW an above-cap list, and trims nothing', async () => {
    savedVoice = voice(rules(94, 'legacy'), [])
    const { result } = renderHook(() => useBrandActions())

    const grown = voice(rules(95, 'legacy'), [])
    const refused = await result.current.saveBrandVoice(grown)

    expect(refused.ok).toBe(false)
    expect(apiMock).not.toHaveBeenCalled()
    // Nothing was silently cut down to 40 on the way past.
    expect(grown.do).toHaveLength(95)
    expect(savedVoice.do).toHaveLength(94)
  })
})

describe('a refused save is never a success (item 65)', () => {
  it('returns the wire’s 400 with its FIELD message and request id', async () => {
    // The exact refusal org 1867 met, five times, while the screen said saved.
    apiMock.mockRejectedValueOnce(
      new ApiError(
        400,
        'validation_failed',
        'Validation failed',
        [{ field: 'rules', message: 'Too big: expected array to have <=50 items' }],
        'req-1867',
      ),
    )
    const { result } = renderHook(() => useBrandActions())

    const refused = await result.current.saveBrandVoice(voice(['one'], []))

    expect(refused.ok).toBe(false)
    if (refused.ok) throw new Error('unreachable — the save was supposed to fail')
    expect(refused.code).toBe('validation_failed')
    expect(refused.fieldErrors).toEqual([
      { field: 'rules', message: 'Too big: expected array to have <=50 items' },
    ])
    // The id is what makes the failure findable in the server's own logs.
    expect(refused.requestId).toBe('req-1867')
  })

  it('reports a POST failure the same way, so a first save cannot lie either', async () => {
    // The lazy-create path: an org with no canonical row yet.
    canonicalVoiceId = null
    apiMock.mockRejectedValueOnce(new ApiError(400, 'validation_failed', 'Name is required'))
    const { result } = renderHook(() => useBrandActions())

    const refused = await result.current.saveBrandVoice(voice(['one'], []))

    expect(refused).toMatchObject({ ok: false, code: 'validation_failed' })
  })
})
