/**
 * The studio rules that fail silently if they drift (INT-11), and the seams
 * HSN-02 and HSN-04 added, covered at the HSN-FINAL gate:
 * - the Create visual body is ONE post with the derived halves fixed;
 * - a fan-out receipt yields one job, or an honest `unconfirmed_receipt`;
 * - the Knowledge type check reads the file's REAL type and never coerces;
 * - the ONE media uploader (MED-0831): the presign body is exactly
 *   `{ mediaType, desc }`, the PUT uses the ticket's own values, nothing
 *   retries, and a failed PUT deletes the minted asset and reports its id;
 * - HSN-0902: the brand kit's closed presign pair and its PDF-only routing,
 *   the reserved word "brandkit", and the video duration — one table in
 *   seconds keyed by the plan, sent as `params.durationS` on a video body
 *   and NEVER as any `params` key on an image body.
 */
import { act, renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { DataProvider } from '@/data/provider'
import type { Tone } from '@/data/types'
import { MESSAGES } from '@/lib/messages'
import {
  assetKindForUpload,
  buildPostVisualRequest,
  checkKnowledgeFile,
  clampVideoDuration,
  isBrandKitAsset,
  isJobTerminal,
  isMediaUploadKind,
  isReservedMediaDesc,
  isUploadedMediaFile,
  isValidVideoDuration,
  jobFromFanOutReceipt,
  knowledgeUploadMarkers,
  reservedMediaDesc,
  BRAND_KIT_ASSET_DESC,
  COMPOSABLE_CAPABILITIES,
  GALLERY_CAPABILITIES,
  KNOWLEDGE_UPLOAD_KINDS,
  LOGO_ASSET_DESC,
  MAX_VISUAL_GUIDANCE,
  RESERVED_MEDIA_DESCS,
  VIDEO_DURATION_DEFAULT_S,
  VIDEO_DURATION_MAX_S,
  VIDEO_DURATION_MIN_S,
  VISUAL_COLLECTION,
  uploadRoleFor,
  useStudioActions,
  videoDurationMax,
} from './studio'

vi.mock('@/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/client')>()),
  api: vi.fn(),
}))
vi.mock('@/api/upload', () => ({ uploadToPresignedUrl: vi.fn() }))
import { api } from '@/api/client'
import { uploadToPresignedUrl } from '@/api/upload'
const apiMock = vi.mocked(api)
const uploadMock = vi.mocked(uploadToPresignedUrl)

beforeEach(() => {
  apiMock.mockReset()
  uploadMock.mockReset()
})

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
          // A type may legitimately sit in TWO kinds — a PDF is a Document
          // and, since HSN-0902, the Brand kit; the CHOSEN kind decides the
          // door, and this check only says the file is what was chosen.
          if (other.mediaTypes.includes(mediaType)) continue
          expect(checkKnowledgeFile(other.kind, { name: 'f', type: mediaType }).ok).toBe(false)
        }
      }
    }
    // The one shared type is the PDF, and only between Document and Brand kit.
    const pdfKinds = KNOWLEDGE_UPLOAD_KINDS.filter((spec) =>
      spec.mediaTypes.includes('application/pdf'),
    ).map((spec) => spec.kind)
    expect(pdfKinds).toEqual(['document', 'brandkit'])
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
      // No `params` on an image body (HSN-0902) — the closed key set below
      // pins its absence, not merely its emptiness.
      collection: { use: true },
    })
  })

  it('always asks the collection in — H5, one constant, no toggle', () => {
    // The founder reversed HSN-02's `use: false` in person (2026-08-31).
    expect(VISUAL_COLLECTION).toEqual({ use: true })
    expect(buildPostVisualRequest(SUBJECT, OPTIONS).collection).toBe(VISUAL_COLLECTION)
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

// --- MED-0831: the ONE media uploader ----------------------------------------

describe('uploadMediaAsset', () => {
  const FILE = new Blob(['png-bytes'], { type: 'image/png' })
  const TICKET = {
    assetId: 'masset_1',
    uploadUrl: 'presigned-put-url',
    mediaType: 'image/png',
    expiresAt: '2026-08-31T10:00:00.000Z',
  }

  async function run() {
    const { result } = renderHook(() => useStudioActions(), { wrapper })
    let outcome: Awaited<ReturnType<typeof result.current.uploadMediaAsset>> | undefined
    await act(async () => {
      outcome = await result.current.uploadMediaAsset(FILE, 'image/png', 'a shop window')
    })
    return outcome
  }

  it('a role rides the presign as EXACTLY { mediaType, desc, role }, and an omitted one is an ABSENT key, never null', async () => {
    apiMock.mockResolvedValueOnce(TICKET)
    uploadMock.mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useStudioActions(), { wrapper })
    await act(async () => {
      await result.current.uploadMediaAsset(FILE, 'image/png', 'the mark', 'logo')
    })
    // toEqual is a closed key set: nothing else rides along (MED-0831/R A1).
    expect(apiMock.mock.calls[0][2]?.body).toEqual({
      mediaType: 'image/png',
      desc: 'the mark',
      role: 'logo',
    })

    apiMock.mockReset()
    uploadMock.mockReset()
    apiMock.mockResolvedValueOnce(TICKET)
    uploadMock.mockResolvedValueOnce(undefined)
    await act(async () => {
      await result.current.uploadMediaAsset(FILE, 'image/png', 'no mark')
    })
    const body = apiMock.mock.calls[0][2]?.body as Record<string, unknown>
    expect(body).toEqual({ mediaType: 'image/png', desc: 'no mark' })
    // The law by name: an omitted role is an absent KEY — never role: null.
    expect(Object.prototype.hasOwnProperty.call(body, 'role')).toBe(false)
  })

  it('presigns with EXACTLY { mediaType, desc }, then PUTs the ticket, in that order', async () => {
    apiMock.mockResolvedValueOnce(TICKET)
    uploadMock.mockResolvedValueOnce(undefined)
    const outcome = await run()

    // The success carries the TICKET's values — the ones storage signed.
    expect(outcome).toEqual({ ok: true, assetId: 'masset_1', mediaType: 'image/png' })

    // One API call (the presign): no read-presign in the chain — a download
    // url is minted only on demand through `assetUrl` — and no delete.
    expect(apiMock).toHaveBeenCalledTimes(1)
    const [method, path, options] = apiMock.mock.calls[0]
    expect(method).toBe('POST')
    expect(path).toMatch(/\/alphastudio\/media\/assets\/presign$/)
    // toEqual is a CLOSED set: an extra key (filename, say) fails this.
    expect(options?.body).toEqual({ mediaType: 'image/png', desc: 'a shop window' })

    // The PUT happened once, after the presign, with the ticket's own url and
    // media type — never the caller's copy of either.
    expect(uploadMock).toHaveBeenCalledTimes(1)
    expect(uploadMock).toHaveBeenCalledWith('presigned-put-url', FILE, 'image/png')
    expect(apiMock.mock.invocationCallOrder[0]).toBeLessThan(uploadMock.mock.invocationCallOrder[0])
  })

  it('a failed PUT deletes the minted asset — one call — and the report carries the id', async () => {
    apiMock.mockResolvedValueOnce(TICKET) // presign
    uploadMock.mockRejectedValueOnce(
      new ApiError(0, 'network_error', 'The upload never reached storage.'),
    )
    apiMock.mockResolvedValueOnce(undefined) // the cleanup DELETE
    const outcome = await run()

    expect(outcome).toMatchObject({
      ok: false,
      code: 'network_error',
      assetId: 'masset_1',
      cleanup: 'deleted',
    })
    // No retry of the PUT, and exactly one DELETE of exactly the minted id.
    expect(uploadMock).toHaveBeenCalledTimes(1)
    expect(apiMock).toHaveBeenCalledTimes(2)
    const [method, path] = apiMock.mock.calls[1]
    expect(method).toBe('DELETE')
    expect(path).toMatch(/\/alphastudio\/media\/assets\/masset_1$/)
  })

  it('when even the cleanup DELETE fails, the id still travels and nothing retries', async () => {
    apiMock.mockResolvedValueOnce(TICKET)
    uploadMock.mockRejectedValueOnce(new ApiError(403, 'forbidden', 'Storage refused the upload.'))
    apiMock.mockRejectedValueOnce(new ApiError(502, 'bad_gateway', 'The upstream did not answer.'))
    const outcome = await run()

    // The PUT's failure is the reported one; the cleanup's own failure only
    // downgrades `cleanup` — the id is the handle for a manual delete.
    expect(outcome).toMatchObject({
      ok: false,
      code: 'forbidden',
      assetId: 'masset_1',
      cleanup: 'left',
    })
    expect(uploadMock).toHaveBeenCalledTimes(1)
    expect(apiMock).toHaveBeenCalledTimes(2)
  })

  it('a failed presign minted nothing: no PUT, no DELETE, no assetId', async () => {
    apiMock.mockRejectedValueOnce(
      new ApiError(
        400,
        'bad_request',
        'The media service rejected the request',
        undefined,
        'req-400',
      ),
    )
    const outcome = await run()

    expect(outcome).toMatchObject({ ok: false, code: 'bad_request', requestId: 'req-400' })
    expect(outcome && 'assetId' in outcome ? outcome.assetId : undefined).toBeUndefined()
    expect(uploadMock).not.toHaveBeenCalled()
    expect(apiMock).toHaveBeenCalledTimes(1)
  })
})

// --- MED-0831: the routing law (H1) and the Files filter ---------------------

describe('isMediaUploadKind', () => {
  it('routes image and video to the media door, and only documents to RAG', () => {
    expect(isMediaUploadKind('image')).toBe(true)
    expect(isMediaUploadKind('video')).toBe(true)
    expect(isMediaUploadKind('document')).toBe(false)
  })
})

describe('uploadRoleFor', () => {
  it('only a MARKED IMAGE carries the logo role — never video, never document (A4)', () => {
    expect(uploadRoleFor('image', true)).toBe('logo')
    expect(uploadRoleFor('image', false)).toBeUndefined()
    expect(uploadRoleFor('video', true)).toBeUndefined()
    expect(uploadRoleFor('document', true)).toBeUndefined()
  })
})

describe('isReservedMediaDesc', () => {
  it('refuses "logo" trimmed and case-insensitive — the org logo owns that marker', () => {
    expect(isReservedMediaDesc('logo')).toBe(true)
    expect(isReservedMediaDesc(' Logo ')).toBe(true)
    expect(isReservedMediaDesc('LOGO')).toBe(true)
  })

  it('refuses only the marker itself, never a description that merely mentions it', () => {
    expect(isReservedMediaDesc('our logo on the shop window')).toBe(false)
    expect(isReservedMediaDesc('logos')).toBe(false)
  })
})

describe('isUploadedMediaFile', () => {
  it('excludes what is POSITIVELY synthetic — a render is not an upload', () => {
    expect(isUploadedMediaFile({ assetId: 'a', kind: 'image', meta: { synthetic: true } })).toBe(
      false,
    )
  })

  it('shows synthetic:false AND an absent flag — if the flag does not separate, the wire wins', () => {
    // Phase 0 measured every UPLOAD as `synthetic: false`; a render's row is
    // unobserved, so absence must not hide anything the wire chose to list.
    expect(
      isUploadedMediaFile({ assetId: 'a', kind: 'image', desc: 'x', meta: { synthetic: false } }),
    ).toBe(true)
    expect(isUploadedMediaFile({ assetId: 'a', kind: 'video', desc: 'x' })).toBe(true)
  })

  it('the logo row belongs to Organization, never to Files', () => {
    expect(
      isUploadedMediaFile({
        assetId: 'a',
        kind: 'image',
        desc: LOGO_ASSET_DESC,
        meta: { synthetic: false },
      }),
    ).toBe(false)
  })
})

describe('listAssets', () => {
  it('reads the wire list and hands the rows through untouched', async () => {
    apiMock.mockResolvedValueOnce({
      assets: [{ assetId: 'masset_1', kind: 'image', desc: 'x', meta: { synthetic: false } }],
    })
    const { result } = renderHook(() => useStudioActions(), { wrapper })
    let outcome: Awaited<ReturnType<typeof result.current.listAssets>> | undefined
    await act(async () => {
      outcome = await result.current.listAssets()
    })
    expect(outcome).toEqual({
      ok: true,
      assets: [{ assetId: 'masset_1', kind: 'image', desc: 'x', meta: { synthetic: false } }],
    })
    const [method, path] = apiMock.mock.calls[0]
    expect(method).toBe('GET')
    expect(path).toMatch(/\/alphastudio\/media\/assets$/)
  })

  it('returns a refusal AS a refusal — the caller says the list is down, no local memory', async () => {
    apiMock.mockRejectedValueOnce(
      new ApiError(502, 'bad_gateway', 'The upstream did not answer.', undefined, 'req-502'),
    )
    const { result } = renderHook(() => useStudioActions(), { wrapper })
    let outcome: Awaited<ReturnType<typeof result.current.listAssets>> | undefined
    await act(async () => {
      outcome = await result.current.listAssets()
    })
    expect(outcome).toMatchObject({ ok: false, code: 'bad_gateway', requestId: 'req-502' })
    expect(apiMock).toHaveBeenCalledTimes(1)
  })
})

// --- HSN-0902: the brand kit and the video duration ---------------------------

describe('the brand kit (HSN-0902)', () => {
  it('is a Knowledge kind of its own — PDF only — routed to the media door, kinded "document" by the wire', () => {
    const spec = KNOWLEDGE_UPLOAD_KINDS.find((entry) => entry.kind === 'brandkit')
    expect(spec?.label).toBe('Brand kit')
    // The door binds `role: "brandkit"` to application/pdf (Phase 0: a PNG
    // with it → 400), so the client allowlist mirrors the wire exactly.
    expect(spec?.mediaTypes).toEqual(['application/pdf'])
    expect(isMediaUploadKind('brandkit')).toBe(true)
    expect(assetKindForUpload('brandkit')).toBe('document')
    expect(assetKindForUpload('image')).toBe('image')
    expect(assetKindForUpload('video')).toBe('video')
  })

  it('puts the CLOSED pair on the presign — desc "brandkit" + role "brandkit" — whatever was typed or ticked', () => {
    expect(BRAND_KIT_ASSET_DESC).toBe('brandkit')
    expect(knowledgeUploadMarkers('brandkit', 'the 2026 brand guidelines', true)).toEqual({
      desc: 'brandkit',
      role: 'brandkit',
    })
    expect(uploadRoleFor('brandkit', false)).toBe('brandkit')
    // Every other kind is untouched: the description is the user's, trimmed,
    // and the role is whatever the kind allows — an absent role is an absent KEY.
    expect(knowledgeUploadMarkers('image', '  a shop window ', false)).toEqual({
      desc: 'a shop window',
    })
    expect(knowledgeUploadMarkers('image', 'the mark', true)).toEqual({
      desc: 'the mark',
      role: 'logo',
    })
    expect(knowledgeUploadMarkers('video', 'the reel', true)).toEqual({ desc: 'the reel' })
    const plain = knowledgeUploadMarkers('document', 'the price list', true)
    expect(Object.prototype.hasOwnProperty.call(plain, 'role')).toBe(false)
  })

  it('"brandkit" joins "logo" as a reserved description — trimmed, case-insensitive; the wire match exact', () => {
    expect(RESERVED_MEDIA_DESCS).toEqual(['logo', 'brandkit'])
    expect(reservedMediaDesc(' BrandKit ')).toBe('brandkit')
    expect(reservedMediaDesc('Logo')).toBe('logo')
    expect(isReservedMediaDesc('brandkit')).toBe(true)
    // Only the marker itself: a phrase that merely contains it is free text.
    expect(reservedMediaDesc('brand kit')).toBeNull()
    expect(reservedMediaDesc('our brandkit for 2026')).toBeNull()
  })

  it('is LISTED under Files — stored like every other file — and found by its exact desc', () => {
    const row = {
      assetId: 'masset_kit',
      kind: 'document',
      desc: 'brandkit',
      role: 'brandkit',
      meta: { synthetic: false },
    }
    expect(isUploadedMediaFile(row)).toBe(true)
    expect(isBrandKitAsset(row)).toBe(true)
    // The wire match is exact, as the logo's is.
    expect(isBrandKitAsset({ desc: 'Brandkit' })).toBe(false)
    expect(isBrandKitAsset({ desc: undefined })).toBe(false)
  })

  it('rides the ONE uploader as exactly { mediaType: "application/pdf", desc: "brandkit", role: "brandkit" }', async () => {
    apiMock.mockResolvedValueOnce({
      assetId: 'masset_kit',
      uploadUrl: 'presigned-put-url',
      mediaType: 'application/pdf',
    })
    uploadMock.mockResolvedValueOnce(undefined)
    const pdf = new Blob(['%PDF-1.1'], { type: 'application/pdf' })
    const { result } = renderHook(() => useStudioActions(), { wrapper })
    await act(async () => {
      await result.current.uploadMediaAsset(
        pdf,
        'application/pdf',
        BRAND_KIT_ASSET_DESC,
        'brandkit',
      )
    })
    expect(apiMock.mock.calls[0][2]?.body).toEqual({
      mediaType: 'application/pdf',
      desc: 'brandkit',
      role: 'brandkit',
    })
    expect(uploadMock).toHaveBeenCalledWith('presigned-put-url', pdf, 'application/pdf')
  })
})

describe('the video duration (HSN-0902)', () => {
  it('is SECONDS, in ONE table keyed by the plan vocabulary: balanced 10 · creative 20 · precise 30, default 8', () => {
    expect(VIDEO_DURATION_MAX_S).toEqual({ balanced: 10, creative: 20, precise: 30 })
    // The key set IS the plan vocabulary — a plan the table does not name
    // cannot exist, and a key the vocabulary does not name cannot either.
    expect(Object.keys(VIDEO_DURATION_MAX_S).sort()).toEqual(['balanced', 'creative', 'precise'])
    expect(VIDEO_DURATION_DEFAULT_S).toBe(8)
    expect(VIDEO_DURATION_MIN_S).toBe(1)
    expect(videoDurationMax('creative')).toBe(20)
  })

  it('validates whole seconds inside the plan range, and clamps into it on a plan change', () => {
    expect(isValidVideoDuration('balanced', 10)).toBe(true)
    expect(isValidVideoDuration('balanced', 11)).toBe(false)
    expect(isValidVideoDuration('precise', 30)).toBe(true)
    expect(isValidVideoDuration('precise', 31)).toBe(false)
    expect(isValidVideoDuration('balanced', 0)).toBe(false)
    expect(isValidVideoDuration('balanced', 2.5)).toBe(false)
    expect(isValidVideoDuration('balanced', Number.NaN)).toBe(false)

    expect(clampVideoDuration('balanced', 20)).toBe(10)
    expect(clampVideoDuration('precise', 20)).toBe(20)
    expect(clampVideoDuration('creative', 0)).toBe(1)
    expect(clampVideoDuration('creative', 7.6)).toBe(8)
    expect(clampVideoDuration('creative', Number.NaN)).toBe(VIDEO_DURATION_DEFAULT_S)
  })

  it('rides the video body as the TOP-LEVEL params.durationS, exactly as given', () => {
    const body = buildPostVisualRequest(SUBJECT, {
      ...OPTIONS,
      kind: 'video' as const,
      durationS: 8,
    })
    expect(body.kind).toBe('video')
    expect(body.params).toEqual({ durationS: 8 })
    // Top-level, beside `collection` — never nested under style or a post.
    expect(Object.keys(body)).toEqual([
      'capability',
      'plan',
      'kind',
      'posts',
      'style',
      'guidance',
      'params',
      'collection',
    ])
  })

  it('images NEVER send params — not {}, not null: the key is ABSENT (a body without it clears the wire)', () => {
    const body = buildPostVisualRequest(SUBJECT, OPTIONS)
    expect(Object.prototype.hasOwnProperty.call(body, 'params')).toBe(false)
  })
})
