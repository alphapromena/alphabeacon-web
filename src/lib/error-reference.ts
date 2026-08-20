/**
 * The handle a user can quote when they report a failure (E2E-0820 F6).
 *
 * Friendly copy tells someone what happened; a reference is what makes the
 * report actionable at the other end. The API's error envelope carries a
 * `requestId`, so that is the first choice. When it does not — a client-side
 * network failure has no envelope, and the deployed CORS policy still exposes
 * no `x-request-id` response header (open-items 3) — the machine `code` is
 * the next best thing: it is contract vocabulary, so it says which failure
 * this was even though it cannot say which request.
 *
 * Returns `undefined` when there is nothing worth showing, so a caller can
 * render the reference conditionally instead of printing an empty bracket.
 */
export function errorReference(failure: {
  requestId?: string
  code?: string
}): string | undefined {
  if (failure.requestId) return failure.requestId
  return failure.code || undefined
}
