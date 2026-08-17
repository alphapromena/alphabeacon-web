/**
 * The presigned-upload helper's contract (decisions.md D-INT-A). Its whole job
 * is to be the narrowest possible exception to the proxy law, so the tests are
 * mostly about what it must NOT do: no Bearer, no invented url, no header the
 * presign did not ask for.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './errors'
import { uploadToPresignedUrl } from './upload'

// Non-http scheme: fetch is mocked, and the http-literal ban is total in src/.
const UPLOAD_URL = 'stub://storage.test/objects/masset_1?signature=abc'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('uploadToPresignedUrl()', () => {
  it('PUTs the bytes to the url it was given, with exactly the signed media type', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }))
    const bytes = new Uint8Array([137, 80, 78, 71]).buffer

    await uploadToPresignedUrl(UPLOAD_URL, bytes, 'image/png')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(UPLOAD_URL)
    const request = init as RequestInit
    expect(request.method).toBe('PUT')
    expect(request.body).toBe(bytes)
    expect(request.headers).toEqual({ 'content-type': 'image/png' })
  })

  it('never sends Authorization — the signature IS the authorization', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }))
    await uploadToPresignedUrl(UPLOAD_URL, new Blob(['hello']), 'text/markdown')
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>
    expect(headers.authorization).toBeUndefined()
    expect(Object.keys(headers)).toEqual(['content-type'])
  })

  it('surfaces a refused upload as an ApiError with the status', async () => {
    // Storage answers XML, never this API's envelope; 403 is what an expired
    // signature looks like.
    fetchMock.mockResolvedValue(new Response('<Error>AccessDenied</Error>', { status: 403 }))
    await expect(uploadToPresignedUrl(UPLOAD_URL, new Blob(['x']), 'text/plain')).rejects
      .toMatchObject({ status: 403, code: 'forbidden' })
  })

  it('surfaces a blocked or unreachable upload as network_error', async () => {
    // Object storage refusing the browser's CORS preflight lands here.
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const error = await uploadToPresignedUrl(UPLOAD_URL, new Blob(['x']), 'text/plain').catch(
      (cause: unknown) => cause,
    )
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 0, code: 'network_error' })
  })
})
