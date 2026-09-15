/**
 * Item 81's rule on the live app (NIGHT-0916 order 1): a submit the server
 * does not answer inside the client's 15 s says so — the alert names it, the
 * button is usable, the typed email stays — and nothing retries on its own.
 * The wire is held at the BROWSER (page.route keeps /auth/login past the
 * limit); the wire itself is never asked to hang. Lane A, one fresh org, zero
 * spend.
 */
import { expect, test } from './fixtures'
import { SCREEN_SYNC } from './live-clocks'
import { runStamp, signUpAndEnter } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = runStamp()
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}t@alphapromena.com`
const NO_ANSWER = 'The server did not answer. Try again.'

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

test('a fresh owner + org, made through the product', async ({ page }) => {
  test.setTimeout(150_000)
  await signUpAndEnter(page, {
    name: 'QA Timeout Owner',
    email: owner,
    password: PASSWORD,
    orgName: `QA Timeout Org ${RUN}`,
  })
})

test('a sign-in the server does not answer in 15 s says so, keeps the form, retries nothing — and the next sign-in lands', async ({
  page,
}) => {
  test.setTimeout(150_000)
  let held = 0
  const isLogin = (url: URL) => url.pathname.endsWith('/auth/login')
  await page.route(isLogin, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    held += 1
    // Longer than the client's limit: the client must give up first.
    await new Promise((resolve) => setTimeout(resolve, 20_000))
    await route.abort('timedout').catch(() => undefined)
  })

  await page.goto('/login')
  await page.getByLabel('Work email').fill(owner)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  const started = Date.now()
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('alert')).toContainText(NO_ANSWER, { timeout: 30_000 })
  const waited = Date.now() - started
  expect(waited, "the client gave up on its own limit, not the route's").toBeGreaterThanOrEqual(
    14_000,
  )
  expect(waited).toBeLessThan(20_000)
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  await expect(page.getByLabel('Work email')).toHaveValue(owner)
  await page.waitForTimeout(1_500)
  expect(held, 'no retry on its own').toBe(1)

  await page.unroute(isLogin)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
})
