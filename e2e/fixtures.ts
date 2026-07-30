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

export const test = base.extend({
  page: async ({ page }, use) => {
    const requestUrls: string[] = []
    page.on('request', (request) => {
      requestUrls.push(request.url())
    })

    await use(page)

    const offending = requestUrls.filter(
      (url) => !ALLOWED_URL_PREFIXES.some((prefix) => url.startsWith(prefix)),
    )
    expect(
      offending,
      'Zero-external-network law violated (web-plan.md §1): every request must start with ' +
        `${ALLOWED_URL_PREFIXES.join(', ')} — offending URLs listed below`,
    ).toEqual([])
  },
})

export { expect }
