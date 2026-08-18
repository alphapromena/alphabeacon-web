import { test as base, expect } from '@playwright/test'

// The network law (web-plan.md §1, amended by decisions.md 2026-07-30): in
// STATIC mode the app talks to nothing — every request must be same-origin
// dev-server traffic or an inline scheme, exactly as before. In LIVE mode
// (VITE_API_BASE_URL set for the run) exactly ONE extra origin is legal: the
// AlphaStudio API. Anything else still fails the test, so the amendment is a
// single named exception, not a hole.
const apiOrigin = (() => {
  const base = process.env.VITE_API_BASE_URL
  if (!base) return []
  try {
    return [new URL(base).origin]
  } catch {
    return []
  }
})()

const ALLOWED_URL_PREFIXES = [
  'http://localhost:5199',
  'data:',
  'blob:',
  'about:',
  ...apiOrigin,
] as const

/**
 * PRESIGNED STORAGE TRAFFIC (decisions.md D-INT-A, widened in INT-11).
 *
 * The platform deliberately never proxies bytes, so two things necessarily
 * leave the app for object storage, and both only after OUR API minted the
 * signature for them:
 * - a PUT of file bytes to an upload url (a reference image, a knowledge file);
 * - a GET of an asset the org owns, which is how a rendered image is shown at
 *   all — the contract hands finished jobs presigned GET urls precisely so the
 *   client loads them directly.
 *
 * The predicate stays narrow enough to be a named exception rather than a
 * hole: live mode only, and only urls carrying the AWS SigV4 signature our API
 * issued. Any unsigned request, to any host, still fails the law — which is
 * what would catch a feature quietly calling something it should not.
 */
function isPresignedStorage(url: string): boolean {
  if (apiOrigin.length === 0) return false
  return /[?&]X-Amz-Signature=/i.test(url)
}

export const test = base.extend({
  page: async ({ page }, use) => {
    const requests: { method: string; url: string }[] = []
    page.on('request', (request) => {
      requests.push({ method: request.method(), url: request.url() })
    })

    await use(page)

    const offending = requests
      .filter(
        ({ url }) =>
          !ALLOWED_URL_PREFIXES.some((prefix) => url.startsWith(prefix)) &&
          !isPresignedStorage(url),
      )
      .map(({ url }) => url)
    expect(
      offending,
      'Zero-external-network law violated (web-plan.md §1): every request must start with ' +
        `${ALLOWED_URL_PREFIXES.join(', ')} — offending URLs listed below`,
    ).toEqual([])
  },
})

export { expect }
