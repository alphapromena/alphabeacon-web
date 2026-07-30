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
