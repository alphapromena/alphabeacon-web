/**
 * The one HTTP client (docs/api/api.md is its contract; decisions.md
 * 2026-07-30 is its license — network code is legal ONLY in src/api/).
 *
 * What it owns, so no call site has to:
 * - base URL from the env switch; throws loudly if called in static mode,
 *   because a screen reaching the network without the provider deciding so is
 *   a bug, not a fallback;
 * - `Authorization: Bearer <token>` via an injected supplier — the client
 *   never stores a token itself;
 * - the single error envelope → `ApiError`, switched on `code` (never on
 *   `message`);
 * - 401 → the injected `onUnauthorized` hook, fired ONCE per breach and only
 *   when a token was actually attached: a 401 on a bare login attempt is a
 *   wrong password, not a dead session;
 * - 429 → `retryAfterSeconds` parsed from Retry-After. The client does NOT
 *   auto-retry: every 429 in this API guards a human-triggered send, where a
 *   silent retry would burn the very rate budget the user is waiting on —
 *   surfacing the wait is the honest behaviour;
 * - x-request-id: sent on every request, and the server's echo logged, so a
 *   bug report can always cite the id the server logs carry;
 * - 204 → resolves to undefined; `{ items, total }` pagination is typed via
 *   `Paginated<T>` with limit/offset in `query`.
 */
import { apiBaseUrl } from './config'
import { ApiError, type ApiErrorCode, type ApiErrorDetails } from './errors'

type QueryValue = string | number | boolean | undefined
export type Query = Record<string, QueryValue>

interface ApiHooks {
  /** Supplies the current session token, or null when signed out. */
  getToken: () => string | null
  /** A Bearer-carrying request came back 401: the session is dead. */
  onUnauthorized: () => void
}

let hooks: ApiHooks = {
  getToken: () => null,
  onUnauthorized: () => {},
}

/** Wired once by the provider (INT-1); tests wire their own. */
export function configureApi(next: ApiHooks): void {
  hooks = next
}

/** One breach, one reaction — a burst of parallel 401s must not stack toasts. */
let unauthorizedNotified = false

/** Called by the session layer after a fresh sign-in re-arms the guard. */
export function resetUnauthorizedGuard(): void {
  unauthorizedNotified = false
}

const requestId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `req-${Date.now()}-${Math.floor(Math.random() * 1e9)}`

function buildQuery(query: Query | undefined): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  const text = params.toString()
  return text ? `?${text}` : ''
}

export interface RequestOptions {
  body?: unknown
  query?: Query
  signal?: AbortSignal
  /** Send without Authorization even if a token exists (auth endpoints). */
  anonymous?: boolean
}

export async function api<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const base = apiBaseUrl()
  if (!base) {
    throw new Error(
      `api(${method} ${path}) called in static mode — the provider must not route here without VITE_API_BASE_URL`,
    )
  }

  const token = options.anonymous ? null : hooks.getToken()
  const outboundId = requestId()
  const headers: Record<string, string> = {
    accept: 'application/json',
    'x-request-id': outboundId,
  }
  if (token) headers.authorization = `Bearer ${token}`
  if (options.body !== undefined) headers['content-type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${base}${path}${buildQuery(options.query)}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError(0, 'network_error', 'The request never reached the server.')
  }

  const serverId = response.headers.get('x-request-id') ?? undefined
  console.debug(`[api] ${method} ${path} → ${response.status} (req ${outboundId}, srv ${serverId})`)

  if (response.ok) {
    if (token) unauthorizedNotified = false
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }

  const error = await toApiError(response, serverId)

  if (error.status === 401 && token && !unauthorizedNotified) {
    unauthorizedNotified = true
    hooks.onUnauthorized()
  }

  throw error
}

async function toApiError(response: Response, serverId: string | undefined): Promise<ApiError> {
  let code: ApiErrorCode = 'internal'
  let message = 'Internal server error'
  let details: ApiErrorDetails
  let requestIdFromBody: string | undefined

  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string; details?: ApiErrorDetails; requestId?: string }
    }
    if (body.error) {
      code = (body.error.code as ApiErrorCode) ?? code
      message = body.error.message ?? message
      details = body.error.details
      requestIdFromBody = body.error.requestId
    }
  } catch {
    // A non-JSON error body (gateway timeout page, truncated response) still
    // needs a coherent ApiError; synthesize the code from the status.
    code = response.status === 429 ? 'rate_limited' : response.status >= 500 ? 'internal' : code
  }

  const retryAfterHeader = response.headers.get('retry-after')
  const retryAfterSeconds =
    response.status === 429 && retryAfterHeader && /^\d+$/.test(retryAfterHeader)
      ? Number(retryAfterHeader)
      : undefined

  return new ApiError(
    response.status,
    code,
    message,
    details,
    requestIdFromBody ?? serverId,
    retryAfterSeconds,
  )
}
