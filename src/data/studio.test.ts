/**
 * The studio rules that fail silently if they drift (INT-11), and the seams
 * HSN-02 and HSN-04 added, covered at the HSN-FINAL gate:
 * - the Create visual body is ONE post with the derived halves fixed;
 * - a fan-out receipt yields one job, or an honest `unconfirmed_receipt`;
 * - the Knowledge type check reads the file's REAL type and never coerces.
 */
import { act, renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { DataProvider } from '@/data/provider'
import type { Tone } from '@/data/types'
import { MESSAGES } from '@/lib/messages'
import {
  buildPostVisualRequest,
  checkKnowledgeFile,
  isJobTerminal,
  jobFromFanOutReceipt,
  COMPOSABLE_CAPABILITIES,
  GALLERY_CAPABILITIES,
  KNOWLEDGE_UPLOAD_KINDS,
  MAX_VISUAL_GUIDANCE,
  useStudioActions,
} from './studio'

vi.mock('@/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/client')>()),
  api: vi.fn(),
}))
import { api } from '@/api/client'
const apiMock = vi.mocked(api)

beforeEach(() => apiMock.mockReset())

describe('isJobTerminal', () => {
  it('uses the MEDIA JOB vocabulary, not a run one', () => {
    // Observed on the wire: queued -> submitted -> succeeded. A run reaches
    // `completed`; sharing a predicate would poll one of the two forever.
    expect(isJobTerminal({ jobId: 'j', status: 'succeeded' })).toBe(true)
    expect(isJobTerminal({ jobId: 'j', status: 'failed' })).toBe(true)
    expect(isJobTerminal({ jobId: 'j', status: 'queued' })).toBe(false)
    expect(isJobTerminal({ jobId: 'j', status: 'submitted' })).toBe(false)
    // A run's terminal word must NOT settle a job.
    expect(isJobTerminal({ jobId: 'j', status: 'completed' })).toBe(false)
  })

  it('is null-safe, so a failed read does not read as finished', () => {
    expect(isJobTerminal(null)).toBe(false)
    expect(isJobTerminal(undefined)).toBe(false)
  })
})

describe('the gallery/composer split (amendment 6)', () => {
  it('offers a composer only for capabilities whose body shape is known', () => {
    // Everything else is listed honestly rather than given a guessed form.
    expect([...COMPOSABLE_CAPABILITIES]).toEqual([
      'media.generate',
      'social-posts.media',
      'images.edit',
    ])
  })

  it('still PROBES every capability, because granted-ness is discovered', () => {
    for (const capability of COMPOSABLE_CAPABILITIES) {
      expect(GALLERY_CAPABILITIES).toContain(capability)
    }
    expect(GALLERY_CAPABILITIES.length).toBeGreaterThan(COMPOSABLE_CAPABILITIES.length)
  })
})

// --- HSN-04: the Knowledge type check ---------------------------------------

describe('checkKnowledgeFile', () => {
  it('passes a file whose real type is in the chosen kind, verbatim', () => {
    expect(checkKnowledgeFile('document', { name: 'notes.md', type: 'text/markdown' })).toEqual({
      ok: true,
      mediaType: 'text/markdown',
    })
    expect(checkKnowledgeFile('image', { name: 'shop.webp', type: 'image/webp' })).toEqual({
      ok: true,
      mediaType: 'image/webp',
    })
  })

  it('refuses a type outside the chosen kind as a mismatch', () => {
    expect(checkKnowledgeFile('document', { name: 'shop.png', type: 'image/png' })).toEqual({
      ok: false,
      reason: 'mismatch',
    })
    expect(checkKnowledgeFile('video', { name: 'notes.pdf', type: 'application/pdf' })).toEqual({
      ok: false,
      reason: 'mismatch',
    })
  })

  it('never coerces a file with no reported type — that is the old text/plain fallback', () => {
    expect(checkKnowledgeFile('document', { name: 'notes.txt', type: '' })).toEqual({
      ok: false,
      reason: 'unknown-type',
    })
  })

  it('reads the same table the picker filters by, so the two cannot disagree', () => {
    for (const spec of KNOWLEDGE_UPLOAD_KINDS) {
      for (const mediaType of spec.mediaTypes) {
        expect(checkKnowledgeFile(spec.kind, { name: 'f', type: mediaType })).toEqual({
          ok: true,
          mediaType,
        })
        for (const other of KNOWLEDGE_UPLOAD_KINDS) {
          if (other.kind === spec.kind) continue
          expect(checkKnowledgeFile(other.kind, { name: 'f', type: mediaType }).ok).toBe(false)
        }
      }
    }
  })
})

// --- HSN-02: the Create visual body and its receipt ----------------------------

const TONE: Tone = {
  id: 'tone_exec',
  name: 'Executive',
  description: 'Confident and concise.',
  rules: { do: ['Lead with an observation'], dont: ['Sound like a pitch'] },
  language: 'en',
  length: 'short',
}

const SUBJECT = { ref: 'prop_1', content: 'Most enterprises deploy agents first.', tone: TONE }

const OPTIONS = {
  kind: 'image' as const,
  plan: 'balanced' as const,
  imgStyle: 'Cinematic',
  text: true,
  logo: false,
  guidance: ['  show the logo  ', '', '   ', 'dark background'],
}

describe('buildPostVisualRequest', () => {
  it('is exactly one post with the derived halves fixed, guidance trimmed of blanks', () => {
    expect(buildPostVisualRequest(SUBJECT, OPTIONS)).toEqual({
      capability: 'social-posts.media',
      plan: 'balanced',
      kind: 'image',
      posts: [
        {
          ref: 'prop_1',
          content: 'Most enterprises deploy agents first.',
          tone: {
            id: 'tone_exec',
            name: 'Executive',
            description: 'Confident and concise.',
            rules: [
              { kind: 'do', text: 'Lead with an observation' },
              { kind: 'dont', text: 'Sound like a pitch' },
            ],
          },
        },
      ],
      style: { imgStyle: 'Cinematic', text: true, logo: false },
      guidance: ['show the logo', 'dark background'],
      params: {},
      collection: { use: false },
    })
  })

  it('caps guidance at six, and sends an empty rules list rather than omitting the key', () => {
    const body = buildPostVisualRequest(
      { ...SUBJECT, tone: { ...TONE, rules: { do: [], dont: [] } } },
      { ...OPTIONS, guidance: Array.from({ length: 9 }, (_, i) => `g${i}`) },
    )
    expect(body.guidance).toHaveLength(MAX_VISUAL_GUIDANCE)
    expect(body.posts[0].tone.rules).toEqual([])
    expect(body.posts).toHaveLength(1)
  })
})

describe('jobFromFanOutReceipt', () => {
  const job = { jobId: 'job_1', status: 'queued' }

  it('takes the ONE job out of the ruled list shape', () => {
    expect(jobFromFanOutReceipt({ jobs: [job] })).toEqual(job)
  })

  it('tolerates a bare job — the single-post control call answered that shape', () => {
    expect(jobFromFanOutReceipt(job)).toEqual(job)
  })

  it('answers null for anything without a job to follow', () => {
    expect(jobFromFanOutReceipt({ jobs: [] })).toBeNull()
    expect(jobFromFanOutReceipt({ jobs: [{}] })).toBeNull()
    expect(jobFromFanOutReceipt({})).toBeNull()
    expect(jobFromFanOutReceipt(null)).toBeNull()
    expect(jobFromFanOutReceipt('accepted')).toBeNull()
  })
})

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(DataProvider, { initialDatasetId: 'active', children })

describe('createPostVisual', () => {
  it('sends the built body, once, and returns the job from the list receipt', async () => {
    apiMock.mockResolvedValueOnce({ jobs: [{ jobId: 'job_1', status: 'queued' }] })
    const { result } = renderHook(() => useStudioActions(), { wrapper })
    let outcome: Awaited<ReturnType<typeof result.current.createPostVisual>> | undefined
    await act(async () => {
      outcome = await result.current.createPostVisual(SUBJECT, OPTIONS)
    })
    expect(outcome).toEqual({ ok: true, job: { jobId: 'job_1', status: 'queued' } })
    expect(apiMock).toHaveBeenCalledTimes(1)
    const [method, path, options] = apiMock.mock.calls[0]
    expect(method).toBe('POST')
    expect(path).toMatch(/\/alphastudio\/media\/jobs$/)
    expect(options?.body).toEqual(buildPostVisualRequest(SUBJECT, OPTIONS))
  })

  it('reports a 2xx with no job as unconfirmed — accepted, maybe billed, nothing to follow', async () => {
    apiMock.mockResolvedValueOnce({ accepted: true })
    const { result } = renderHook(() => useStudioActions(), { wrapper })
    let outcome: Awaited<ReturnType<typeof result.current.createPostVisual>> | undefined
    await act(async () => {
      outcome = await result.current.createPostVisual(SUBJECT, OPTIONS)
    })
    expect(outcome).toMatchObject({ ok: false, code: 'unconfirmed_receipt' })
    // The copy the dialog shows for it names the one fact that matters.
    expect(MESSAGES.errors.visualUnconfirmed).toMatch(/retry can bill again/)
    expect(MESSAGES.errors.visualUnconfirmed).toMatch(/Studio renders/)
  })

  it('carries the requestId through a refusal, and never retries', async () => {
    apiMock.mockRejectedValueOnce(
      new ApiError(502, 'bad_gateway', 'The upstream did not answer.', undefined, 'req-502'),
    )
    const { result } = renderHook(() => useStudioActions(), { wrapper })
    let outcome: Awaited<ReturnType<typeof result.current.createPostVisual>> | undefined
    await act(async () => {
      outcome = await result.current.createPostVisual(SUBJECT, OPTIONS)
    })
    expect(outcome).toMatchObject({ ok: false, code: 'bad_gateway', requestId: 'req-502' })
    expect(apiMock).toHaveBeenCalledTimes(1)
  })
})
