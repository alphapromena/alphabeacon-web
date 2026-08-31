/**
 * The run shape (INT-10). A silent wrong answer is the failure mode here: a
 * draft whose tone and rationale read `undefined` still renders perfectly, it
 * just says nothing.
 *
 * The local run-ledger tests that used to live here went with the ledger in
 * INT-12 — the proposals ledger indexes runs server-side now, so its coverage
 * is in `proposals.test.ts`.
 *
 * HSN-FINAL added the generate BODY's sourcing rules (HSN-01 + HSN-03): no
 * `options`, per-tone `length` only when the tone has one, per-tone
 * `language` from the tone before the page's picker.
 */
import { act, renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PostsGenerateRequest } from '@/api/types'
import { DataProvider } from '@/data/provider'
import type { Tone } from '@/data/types'
import type { GenerationRun } from './generate'
import { draftsFromRun, isRunTerminal, toRunTone, useGenerateActions } from './generate'

vi.mock('@/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/client')>()),
  api: vi.fn(),
}))
import { api } from '@/api/client'
const apiMock = vi.mocked(api)

beforeEach(() => apiMock.mockReset())

/** Verbatim from Docs/api/alphastudio-shapes.md — a real completed run. */
const OBSERVED: GenerationRun = {
  runId: 'run_bcff55c15099774a756bea95',
  capability: 'social-posts.generate',
  mode: 'batch',
  status: 'completed',
  outputs: [
    {
      index: 0,
      content: {
        toneId: 'smoke-tone',
        content: "Today's roast is from the Flores farm.",
        rationale: 'It names the farm, as the tone asks.',
      },
      judge: { score: 0.2, voice: 0.2, grounding: 0, repetition: 0 },
      flags: [],
      attributions: [],
      proposalId: 'prop_bf6fd4c695b9c20418ac5050',
    },
  ],
}

describe('draftsFromRun', () => {
  it('reads toneId and rationale from INSIDE content, where they actually live', () => {
    // The trap D-INT-H caught: a type with these at the output level compiles,
    // renders, and shows a tone-less rationale-less draft forever.
    const [draft] = draftsFromRun(OBSERVED)
    expect(draft.toneId).toBe('smoke-tone')
    expect(draft.rationale).toBe('It names the farm, as the tone asks.')
    expect(draft.content).toBe("Today's roast is from the Flores farm.")
  })

  it('keeps the proposalId without rendering it', () => {
    // Proposals are not proxied yet; the id is the handle the day they are.
    expect(draftsFromRun(OBSERVED)[0].proposalId).toBe('prop_bf6fd4c695b9c20418ac5050')
  })

  it('defaults flags and attributions to arrays, so a card never crashes on them', () => {
    const run: GenerationRun = {
      runId: 'run_x',
      status: 'completed',
      outputs: [{ index: 0, content: { content: 'A line.' } }],
    }
    const [draft] = draftsFromRun(run)
    expect(draft.flags).toEqual([])
    expect(draft.attributions).toEqual([])
  })

  it('survives a run with no outputs', () => {
    expect(draftsFromRun({ runId: 'run_y', status: 'completed' })).toEqual([])
  })
})

describe('isRunTerminal', () => {
  it('uses the RUN vocabulary, never a media job one', () => {
    // A media job reaches `succeeded`; a run reaches `completed`. Sharing a
    // predicate between them would poll one of the two forever.
    expect(isRunTerminal({ runId: 'r', status: 'completed' })).toBe(true)
    expect(isRunTerminal({ runId: 'r', status: 'failed' })).toBe(true)
    expect(isRunTerminal({ runId: 'r', status: 'queued' })).toBe(false)
    expect(isRunTerminal({ runId: 'r', status: 'running' })).toBe(false)
    expect(isRunTerminal(null)).toBe(false)
  })
})

const PLAIN: Tone = {
  id: 'tone_1',
  name: 'Roastery floor',
  kind: 'custom',
  description: 'Warm and specific.',
  rules: { do: ['Name the farm'], dont: ['Say artisanal'] },
}

describe('toRunTone', () => {
  it('sends the tone whole, with its rules, and omits an absent example', () => {
    const sent = toRunTone(PLAIN)
    expect(sent).toEqual({
      id: 'tone_1',
      name: 'Roastery floor',
      description: 'Warm and specific.',
      rules: [
        { kind: 'do', text: 'Name the farm' },
        { kind: 'dont', text: 'Say artisanal' },
      ],
    })
    expect('example' in sent).toBe(false)
  })

  it('sends `length` when the tone has one, and OMITS the key when it does not (HSN-03)', () => {
    // A pre-HSN-03 tone never gets a length invented for it.
    expect(toRunTone({ ...PLAIN, length: 'long' }).length).toBe('long')
    expect('length' in toRunTone(PLAIN)).toBe(false)
  })
})

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(DataProvider, { initialDatasetId: 'active', children })

describe('the generate body (HSN-01 + HSN-03)', () => {
  it("takes each tone's language from the tone, falls back to the picker, and carries no `options`", async () => {
    apiMock.mockResolvedValueOnce({ runId: 'run_1' })
    const arabic: Tone = { ...PLAIN, id: 'tone_ar', language: 'ar', length: 'short' }
    const { result } = renderHook(() => useGenerateActions(), { wrapper })

    let outcome: Awaited<ReturnType<typeof result.current.generate>> | undefined
    await act(async () => {
      outcome = await result.current.generate({
        tones: [arabic, PLAIN],
        plan: 'balanced',
        language: 'en',
      })
    })
    expect(outcome).toEqual({ ok: true, runId: 'run_1' })

    const [method, path, options] = apiMock.mock.calls[0]
    expect(method).toBe('POST')
    expect(path).toMatch(/\/alphastudio\/posts\/generate$/)
    const body = options?.body as PostsGenerateRequest
    expect(body.tones[0]).toMatchObject({ id: 'tone_ar', language: 'ar', length: 'short' })
    expect(body.tones[1]).toMatchObject({ id: 'tone_1', language: 'en' })
    expect('length' in body.tones[1]).toBe(false)
    // HSN-01: the multiplier and its wrapper are gone from the wire.
    expect('options' in body).toBe(false)
    // `slot` is required on the wire (trap 13) and always built.
    expect(body.slot?.timezone).toBeTruthy()
    expect(body.plan).toBe('balanced')
    // CUT-0831 item 1: the steering box was never on the wire — the body's
    // key set is CLOSED, so deleting the control changed no byte of it.
    expect(Object.keys(body).sort()).toEqual(['plan', 'slot', 'tones'])
  })
})
