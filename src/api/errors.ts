/**
 * The AlphaStudio error contract (docs/api/api.md — "Error responses").
 *
 * Every non-2xx response carries one envelope:
 *   { error: { code, message, details?, requestId? } }
 *
 * `code` is machine-readable and part of the contract — callers switch on it,
 * NEVER on `message`. `details` is loosely shaped by design: an array of
 * `{ field, message }` for validation failures, an object with `reason` for
 * the login 403 (`email_not_verified`). The accessors below absorb that split
 * so call sites never probe the union by hand.
 */

/** Server codes, verbatim from the contract table. */
export const API_ERROR_CODES = [
  'bad_request',
  'validation_failed',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'rate_limited',
  /**
   * 402 — the org's AlphaProStudio wallet cannot cover the generation being
   * asked for. Actionable, and the reason it has its own code instead of
   * hiding inside 400/502: the UI must show the balance rather than a generic
   * failure. There is no funding endpoint on this API (orgs are funded once,
   * server-side, at creation), so the honest state says so.
   */
  'wallet_insufficient',
  /**
   * 502 — an upstream service failed. The contract's promise is the whole
   * value of this code: **nothing changed**. A retry is safe, and no screen
   * needs to reconcile a half-applied write.
   */
  'bad_gateway',
  'internal',
] as const

export type ServerErrorCode = (typeof API_ERROR_CODES)[number]

/**
 * `network_error` is CLIENT-side: fetch itself failed (offline, DNS, CORS).
 * It exists so screens can render N4's connectivity story instead of a
 * generic error, and it never comes from the server.
 */
export type ApiErrorCode = ServerErrorCode | 'network_error'

export interface ApiFieldDetail {
  field: string
  message: string
}

export type ApiErrorDetails = ApiFieldDetail[] | { reason?: string } | undefined

export class ApiError extends Error {
  constructor(
    /** HTTP status; 0 for a client-side network failure. */
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details: ApiErrorDetails = undefined,
    /** The server's requestId (from the envelope), for bug reports. */
    readonly requestId: string | undefined = undefined,
    /** Seconds from the Retry-After header; set only on 429. */
    readonly retryAfterSeconds: number | undefined = undefined,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** Per-field validation entries, or empty — never probe `details` directly. */
  get fieldDetails(): ApiFieldDetail[] {
    return Array.isArray(this.details) ? this.details : []
  }

  /** The first message for a field, for attaching under an input. */
  fieldMessage(field: string): string | undefined {
    return this.fieldDetails.find((detail) => detail.field === field)?.message
  }

  /** The 403 discriminator (`email_not_verified`), or undefined. */
  get reason(): string | undefined {
    if (this.details === undefined || Array.isArray(this.details)) return undefined
    return this.details.reason
  }
}

/** Narrowing helper for catch blocks. */
export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError
}

/**
 * The code a bare HTTP status implies, for the two places no envelope arrives:
 * an infrastructure gateway page (no JSON to switch on) and a presigned S3
 * `PUT`, which answers XML and knows nothing about this contract. `400` stays
 * `bad_request` rather than `validation_failed` — without `details` there is
 * nothing structured to say, which is exactly the difference between the two.
 * `undefined` means "the status alone does not decide it; keep your default".
 */
export function codeForStatus(status: number): ServerErrorCode | undefined {
  switch (status) {
    case 400:
      return 'bad_request'
    case 401:
      return 'unauthorized'
    case 402:
      return 'wallet_insufficient'
    case 403:
      return 'forbidden'
    case 404:
      return 'not_found'
    case 409:
      return 'conflict'
    case 429:
      return 'rate_limited'
    case 502:
      return 'bad_gateway'
    default:
      return status >= 500 ? 'internal' : undefined
  }
}
