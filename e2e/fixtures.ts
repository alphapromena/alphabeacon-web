import { test as base, expect } from '@playwright/test'

// The zero-external-network law (web-plan.md §1): the app talks to nothing.
// Every e2e run asserts it — each page collects every request it issues, and at
// fixture teardown every URL must be same-origin dev-server traffic or an
// inline scheme. Anything else fails the test.
const ALLOWED_URL_PREFIXES = ['http://localhost:5199', 'data:', 'blob:', 'about:'] as const

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
