/**
 * The ONE non-API request this frontend ever makes (decisions.md D-INT-A).
 *
 * Ward's rule (2026-08-17) is that every generation call goes through our own
 * `/orgs/:orgId/alphastudio/*` proxy with the normal Bearer session — the
 * frontend never speaks to AlphaProStudio, never signs anything. Uploads are
 * the single unavoidable exception, and only in the narrowest possible form:
 * our API mints a presigned `PUT` (a media reference image, a RAG file source)
 * and the bytes go straight to object storage, because the platform
 * deliberately never proxies bytes.
 *
 * What keeps that exception small enough to trust:
 * - the url is never composed here — it comes back from a call our API just
 *   made, so this function cannot address anything the API did not authorize;
 * - no `Authorization` header. The signature IS the authorization, and sending
 *   our session token to a third-party origin would leak it;
 * - exactly the `Content-Type` the presign was issued for. It is part of the
 *   S3 signature: a mismatch is a rejected upload, not a mislabelled file;
 * - failures come back as `ApiError`, so call sites catch one error type.
 *
 * It lives in its own file so the guard can state the law precisely: `fetch`
 * appears in `client.ts` and here, and nowhere else under `src/`.
 */
import { ApiError, codeForStatus } from './errors'

/**
 * PUTs raw bytes to a presigned url our API minted.
 *
 * @param url        the `uploadUrl` from a presign response — never built here
 * @param body       the file's bytes
 * @param mediaType  exactly the `mediaType` the presign was requested with
 */
export async function uploadToPresignedUrl(
  url: string,
  body: Blob | ArrayBuffer,
  mediaType: string,
): Promise<void> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'PUT',
      // Deliberately the only header: no Bearer, no accept, nothing that would
      // widen the CORS preflight this request has to survive.
      headers: { 'content-type': mediaType },
      body,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    // Object storage refusing the browser's preflight lands here too, which is
    // why the copy stays about reaching the destination rather than the file.
    throw new ApiError(0, 'network_error', 'The upload never reached storage.')
  }

  if (response.ok) return

  // Storage answers XML, not this API's envelope, so the status is all there is
  // to go on. A presign that has expired (15 minutes for RAG, and the signature
  // is minted per request) reads as 403.
  throw new ApiError(
    response.status,
    codeForStatus(response.status) ?? 'internal',
    'Storage refused the upload. Ask for a fresh link and try again.',
  )
}
