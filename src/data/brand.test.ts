/**
 * The brand-kit caps at the SEAM (HSN-04): sources ≤ 10, topics ≤ 30, refused
 * as a validation-shaped failure so any path a screen did not gate still
 * cannot exceed them — and never trimmed: a list already above a cap (from
 * another client) keeps every row and may still shrink.
 *
 * Static mode, through the real provider, so the reducer and the seam are
 * tested together rather than a mocked pair that could agree with each other
 * and disagree with the app.
 */
import { act, renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useBrandActions } from '@/data/brand'
import { DataProvider, useDataDispatch, useFollowedSources, useTopics } from '@/data/provider'
import { MAX_FOLLOWED_SOURCES, MAX_TOPICS } from '@/data/types'
import { MESSAGES } from '@/lib/messages'

// Static mode never reaches the client; the mock is here to PROVE that.
vi.mock('@/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/client')>()),
  api: vi.fn(),
}))
import { api } from '@/api/client'

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(DataProvider, { initialDatasetId: 'active', children })

function mount() {
  return renderHook(
    () => ({
      brand: useBrandActions(),
      sources: useFollowedSources(),
      topics: useTopics(),
      dispatch: useDataDispatch(),
    }),
    { wrapper },
  )
}

describe('the sources cap (HSN-04)', () => {
  it('adds up to the cap, then refuses with the catalogue message and touches no wire', async () => {
    const { result } = mount()
    const start = result.current.sources.length
    expect(start).toBeLessThan(MAX_FOLLOWED_SOURCES)

    for (let n = start; n < MAX_FOLLOWED_SOURCES; n += 1) {
      await act(async () => {
        expect(await result.current.brand.addSource(`source-${n}.example/feed`)).toEqual({
          ok: true,
        })
      })
    }
    expect(result.current.sources).toHaveLength(MAX_FOLLOWED_SOURCES)

    let refused: Awaited<ReturnType<typeof result.current.brand.addSource>> | undefined
    await act(async () => {
      refused = await result.current.brand.addSource('one-too-many.example/feed')
    })
    expect(refused).toEqual({
      ok: false,
      code: 'validation_failed',
      message: MESSAGES.errors.sourcesCapReached,
      fieldErrors: [{ field: 'url', message: MESSAGES.errors.sourcesCapReached }],
    })
    expect(result.current.sources).toHaveLength(MAX_FOLLOWED_SOURCES)
    expect(vi.mocked(api)).not.toHaveBeenCalled()
  })

  it('still removes when at the cap, and then adds again', async () => {
    const { result } = mount()
    for (let n = result.current.sources.length; n < MAX_FOLLOWED_SOURCES; n += 1) {
      await act(async () => {
        await result.current.brand.addSource(`source-${n}.example/feed`)
      })
    }
    const victim = result.current.sources[0]
    await act(async () => {
      expect(await result.current.brand.removeSource(victim.id)).toEqual({ ok: true })
    })
    await act(async () => {
      expect(await result.current.brand.addSource('room-again.example/feed')).toEqual({ ok: true })
    })
    expect(result.current.sources).toHaveLength(MAX_FOLLOWED_SOURCES)
  })
})

describe('the topics cap (HSN-04)', () => {
  const topics = (n: number) => Array.from({ length: n }, (_, i) => `topic ${i + 1}`)

  it('grows to the cap and refuses one past it', async () => {
    const { result } = mount()
    await act(async () => {
      expect(await result.current.brand.setTopics(topics(MAX_TOPICS))).toEqual({ ok: true })
    })
    expect(result.current.topics).toHaveLength(MAX_TOPICS)

    let refused: Awaited<ReturnType<typeof result.current.brand.setTopics>> | undefined
    await act(async () => {
      refused = await result.current.brand.setTopics(topics(MAX_TOPICS + 1))
    })
    expect(refused).toMatchObject({
      ok: false,
      code: 'validation_failed',
      message: MESSAGES.errors.topicsCapReached,
    })
    expect(result.current.topics).toHaveLength(MAX_TOPICS)
  })

  it('renders an over-cap list whole, lets it SHRINK, and refuses it GROWING', async () => {
    const { result } = mount()
    // Another client put the org above the cap. Nothing is trimmed.
    act(() => result.current.dispatch({ type: 'topics/set', topics: topics(MAX_TOPICS + 5) }))
    expect(result.current.topics).toHaveLength(MAX_TOPICS + 5)

    await act(async () => {
      expect(await result.current.brand.setTopics(topics(MAX_TOPICS + 4))).toEqual({ ok: true })
    })
    expect(result.current.topics).toHaveLength(MAX_TOPICS + 4)

    let refused: Awaited<ReturnType<typeof result.current.brand.setTopics>> | undefined
    await act(async () => {
      refused = await result.current.brand.setTopics(topics(MAX_TOPICS + 6))
    })
    expect(refused).toMatchObject({ ok: false, code: 'validation_failed' })
    // Refused means untouched — not trimmed to the cap, not replaced.
    expect(result.current.topics).toHaveLength(MAX_TOPICS + 4)
    expect(vi.mocked(api)).not.toHaveBeenCalled()
  })
})
