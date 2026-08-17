/**
 * The client's contract behaviours, each pinned against a mocked fetch:
 * envelope parsing switched on code, Bearer injection, the 401 discriminator
 * (token attached = dead session; anonymous = credential failure), 429
 * Retry-After, 204 bodies, query building, and the static-mode refusal.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, configureApi, resetUnauthorizedGuard } from './client'
import { ApiError } from './errors'

// A deliberately non-http scheme: fetch is mocked so it is never parsed, and
// the http-literal ban stays total in src/api (the real base is env-supplied).
const BASE = 'stub://alphastudio.test/api'

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'x-request-id': 'srv-1', ...headers },
  })
}

const fetchMock = vi.fn<typeof fetch>()

/** Await a rejection and hand back the typed ApiError. */
async function capture(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (error) {
    return error as ApiError
  }
  throw new Error('expected the call to reject')
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', BASE)
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.mockReset()
  resetUnauthorizedGuard()
  configureApi({ getToken: () => null, onUnauthorized: () => {} })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('api()', () => {
  it('refuses to run in static mode — the provider decides, not the network', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    await expect(api('GET', '/health')).rejects.toThrow(/static mode/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('joins base + path + query, skipping undefined params', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { items: [], total: 0 }))
    await api('GET', '/orgs/1/slots', {
      query: { from: '2026-07-01', to: undefined, limit: 100, offset: 0 },
    })
    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BASE}/orgs/1/slots?from=2026-07-01&limit=100&offset=0`)
  })

  it('sends Bearer when a token exists, and never for anonymous calls', async () => {
    configureApi({ getToken: () => 'tok-1', onUnauthorized: () => {} })
    fetchMock.mockResolvedValue(jsonResponse(200, {}))

    await api('GET', '/me')
    const authedHeaders = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<
      string,
      string
    >
    expect(authedHeaders.authorization).toBe('Bearer tok-1')
    // No x-request-id header: the deployed CORS policy does not allow it from
    // browsers (see client.ts + open-items); the server's own id is logged.
    expect(authedHeaders['x-request-id']).toBeUndefined()

    fetchMock.mockResolvedValue(jsonResponse(200, {}))
    await api('POST', '/auth/login', { body: { email: 'a@b.c' }, anonymous: true })
    const anonHeaders = (fetchMock.mock.calls[1][1] as RequestInit).headers as Record<
      string,
      string
    >
    expect(anonHeaders.authorization).toBeUndefined()
  })

  it('resolves 204 to undefined', async () => {
    fetchMock.mockResolvedValue(jsonResponse(204, null))
    await expect(api('POST', '/auth/logout')).resolves.toBeUndefined()
  })

  it('parses the error envelope into an ApiError switched on code', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        error: {
          code: 'validation_failed',
          message: 'Validation failed',
          details: [{ field: 'email', message: 'Invalid email' }],
          requestId: 'req-abc',
        },
      }),
    )
    const error = await capture(api('POST', '/auth/signup', { body: {} }))
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('validation_failed')
    expect(error.status).toBe(400)
    expect(error.fieldMessage('email')).toBe('Invalid email')
    expect(error.requestId).toBe('req-abc')
  })

  it('exposes the 403 reason discriminator', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(403, {
        error: { code: 'forbidden', message: 'Email not verified', details: { reason: 'email_not_verified' } },
      }),
    )
    const error = await capture(api('POST', '/auth/login', { anonymous: true }))
    expect(error.reason).toBe('email_not_verified')
    expect(error.fieldDetails).toEqual([])
  })

  it('parses Retry-After on 429', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        429,
        { error: { code: 'rate_limited', message: 'Too many requests' } },
        { 'retry-after': '42' },
      ),
    )
    const error = await capture(api('POST', '/auth/resend-verification', { anonymous: true }))
    expect(error.code).toBe('rate_limited')
    expect(error.retryAfterSeconds).toBe(42)
  })

  it('fires onUnauthorized once for a token-carrying 401, and never for anonymous', async () => {
    const onUnauthorized = vi.fn()
    configureApi({ getToken: () => 'tok-dead', onUnauthorized })
    fetchMock.mockResolvedValue(
      jsonResponse(401, { error: { code: 'unauthorized', message: 'Session expired' } }),
    )

    await expect(api('GET', '/me')).rejects.toMatchObject({ code: 'unauthorized' })
    fetchMock.mockResolvedValue(
      jsonResponse(401, { error: { code: 'unauthorized', message: 'Session expired' } }),
    )
    await expect(api('GET', '/me/orgs')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)

    // Anonymous 401 is a wrong password, not a dead session.
    onUnauthorized.mockClear()
    resetUnauthorizedGuard()
    configureApi({ getToken: () => null, onUnauthorized })
    fetchMock.mockResolvedValue(
      jsonResponse(401, { error: { code: 'unauthorized', message: 'Invalid email or password' } }),
    )
    await expect(api('POST', '/auth/login', { anonymous: true })).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('wraps a network failure as a client-side network_error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const error = await capture(api('GET', '/health'))
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('network_error')
    expect(error.status).toBe(0)
  })

  it('survives a non-JSON error body by synthesizing from the status', async () => {
    // An infrastructure gateway page carries no envelope, and 502 is precisely
    // where the synthesized code earns its keep: "upstream failed, nothing
    // changed" and the generic internal error read very differently on screen.
    fetchMock.mockResolvedValue(
      new Response('<html>Bad gateway</html>', { status: 502, headers: { 'x-request-id': 's' } }),
    )
    const error = await capture(api('GET', '/me'))
    expect(error.code).toBe('bad_gateway')
    expect(error.status).toBe(502)
  })

  it('carries the two codes the 2026-08-17 contract added', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(402, {
        error: { code: 'wallet_insufficient', message: 'Wallet cannot cover this request' },
      }),
    )
    const wallet = await capture(api('POST', '/orgs/1/alphastudio/media/jobs', { body: {} }))
    expect(wallet.code).toBe('wallet_insufficient')
    expect(wallet.status).toBe(402)

    fetchMock.mockResolvedValue(
      jsonResponse(502, { error: { code: 'bad_gateway', message: 'Upstream unavailable' } }),
    )
    const upstream = await capture(api('PUT', '/orgs/1/country', { body: { country: 'JO' } }))
    expect(upstream.code).toBe('bad_gateway')
  })

  it('treats 202 as a JSON success — the async surfaces answer a receipt', async () => {
    fetchMock.mockResolvedValue(jsonResponse(202, { runId: 'run_1', status: 'queued' }))
    await expect(
      api('POST', '/orgs/1/alphastudio/posts/generate', { body: { tones: [] } }),
    ).resolves.toEqual({ runId: 'run_1', status: 'queued' })
  })

  it('reads a DELETE that answers 200 WITH a body (the RAG source delete)', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { sourceId: 'src_1', vectorsDeleted: 12 }))
    await expect(api('DELETE', '/orgs/1/alphastudio/rag/sources/src_1')).resolves.toEqual({
      sourceId: 'src_1',
      vectorsDeleted: 12,
    })
  })

  it('sends PUT with a JSON body', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { holidaysCount: 11, reloaded: true }))
    await api('PUT', '/orgs/1/country', { body: { country: 'JO' } })
    const [, init] = fetchMock.mock.calls[0]
    expect((init as RequestInit).method).toBe('PUT')
    expect((init as RequestInit).body).toBe('{"country":"JO"}')
  })

  it('resolves an EMPTY 200 body to undefined instead of throwing a SyntaxError', async () => {
    // A raw SyntaxError would escape as something no catch site in the data
    // layer is shaped for; every failure this client produces is an ApiError.
    fetchMock.mockResolvedValue(new Response('', { status: 200 }))
    await expect(api('POST', '/orgs/1/notifications/read-all')).resolves.toBeUndefined()
  })

  it('turns an unreadable success body into an ApiError, not a raw throw', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"truncated":', { status: 200, headers: { 'content-type': 'application/json' } }),
    )
    const error = await capture(api('GET', '/me'))
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('internal')
  })
})
