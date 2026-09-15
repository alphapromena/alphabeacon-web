/**
 * A 401 lands on login, every time (ORDER-FIX-0915, item 75) — against the
 * DEPLOYED dev API on one fresh QA org, zero spend.
 *
 * TEST-0915 measured three ways a session can die and where the app landed:
 *   1. the token EXPIRED at boot on `/`             → login, with the toast (was right)
 *   2. the token REVOKED mid-session on an authed route → `/`, the website (was wrong)
 *   3. a boot on an authed route with a dead token   → `/`, the website (was wrong)
 * The 401 handler purged and pushed `/login` in every case; the protected-route
 * guard's own redirect won the race with `/`. The guard sends to login now, so
 * all three end in the same place, with the session purged and the toast up.
 *
 * "Expired" is a tampered stored token; "revoked" is the app's own token
 * revoked from outside through `POST /auth/logout`, exactly what a second
 * device's sign-out-everywhere does. No refresh endpoint exists (api.md,
 * Conventions): a 401 is always a re-login.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { SCREEN_SYNC } from './live-clocks'
import { runStamp, signUpAndEnter } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = runStamp()
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}s@alphapromena.com`
const SESSION_ENDED = 'Your session ended. Sign in again to continue.'

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

// The server's request id rides in the error envelope; a 401's is the evidence
// this file exists for, so each one goes to the runner's log.
const API = API_BASE ?? ''
test.beforeEach(({ page }, info) => {
  page.on('response', (response) => {
    if (response.status() !== 401 || !response.url().startsWith(API)) return
    void response
      .json()
      .catch(() => null)
      .then((body: { error?: { requestId?: string } } | null) => {
        const path = response.url().slice(API.length)
        const id = body?.error?.requestId ?? 'none in the envelope'
        console.log(
          `    ${info.title.slice(0, 3).trim()} · ${response.request().method()} ${path} → 401 · request ${id}`,
        )
      })
  })
})

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Work email').fill(owner)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  // The heading shows before the sign-in sync's tail (org, wallet, schedules)
  // has landed; let the main body land before a test acts.
  await page.waitForLoadState('networkidle', { timeout: SCREEN_SYNC })
  // Every toast that appears from here on is recorded, so one that has gone by
  // the time an assertion looks is still on record (`.cn-toast` is the class
  // ui/sonner.tsx puts on every toast; a reload drops the observer, and the
  // tests that reload look at once).
  await page.evaluate(() => {
    const seen: string[] = []
    ;(window as unknown as { __toasts: string[] }).__toasts = seen
    new MutationObserver(() => {
      for (const toast of Array.from(document.querySelectorAll('.cn-toast'))) {
        const text = toast.textContent ?? ''
        if (text && !seen.includes(text)) seen.push(text)
      }
    }).observe(document, { childList: true, subtree: true, characterData: true })
  })
}

/** The app's own stored token, read the way `live-setup.ts` reads it. */
async function storedToken(page: Page): Promise<string> {
  const raw = await page.evaluate(
    () =>
      window.sessionStorage.getItem('ab-live-session') ??
      window.localStorage.getItem('ab-live-session'),
  )
  if (!raw) throw new Error('no live session in storage — log in first')
  return (JSON.parse(raw) as { token: string }).token
}

async function tamperStoredToken(page: Page) {
  await page.evaluate(() => {
    for (const store of [window.sessionStorage, window.localStorage]) {
      const raw = store.getItem('ab-live-session')
      if (!raw) continue
      const session = JSON.parse(raw) as { token: string }
      session.token = 'expired-token-fix-0915'
      store.setItem('ab-live-session', JSON.stringify(session))
    }
  })
}

/** Login, the toast, and no session left behind — the end state all three share. */
async function expectReLogin(page: Page) {
  await expect(page).toHaveURL(/\/login$/, { timeout: SCREEN_SYNC })
  // Up now, or seen by `login`'s observer: a breach the app meets on its own
  // (test 2's deferred reads) shows the toast before the test looks.
  await expect
    .poll(
      async () =>
        (await page.getByText(SESSION_ENDED).count()) > 0 ||
        (
          await page.evaluate(() => (window as unknown as { __toasts?: string[] }).__toasts ?? [])
        ).some((toast) => toast.includes(SESSION_ENDED)),
      { timeout: SCREEN_SYNC },
    )
    .toBe(true)
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  expect(
    await page.evaluate(() =>
      Boolean(
        window.sessionStorage.getItem('ab-live-session') ||
        window.localStorage.getItem('ab-live-session'),
      ),
    ),
  ).toBe(false)
}

test('a fresh owner + org, made through the product', async ({ page }) => {
  test.setTimeout(150_000)
  await signUpAndEnter(page, {
    name: 'QA Session Owner',
    email: owner,
    password: PASSWORD,
    orgName: `QA Session Org ${RUN}`,
  })
})

test('1 · a token expired at boot on `/` lands on login with the toast', async ({ page }) => {
  test.setTimeout(150_000)
  await login(page)
  await tamperStoredToken(page)
  await page.goto('/')
  await expectReLogin(page)
})

test('2 · a token revoked mid-session on an authed route lands on login, not on the website', async ({
  page,
  request,
}) => {
  test.setTimeout(150_000)
  await login(page)
  await page.getByRole('link', { name: 'Settings' }).first().click()
  await expect(page.getByRole('tab', { name: 'Team' })).toBeVisible({ timeout: SCREEN_SYNC })
  await page.waitForLoadState('networkidle', { timeout: SCREEN_SYNC })
  // Revoked from OUTSIDE the app, the way sign-out-everywhere on another device
  // would do it; the app still holds the token.
  const token = await storedToken(page)
  const revoke = await request.post(`${API_BASE}/auth/logout`, {
    headers: { authorization: `Bearer ${token}` },
  })
  expect(revoke.status(), `POST /auth/logout → ${revoke.status()}`).toBe(204)
  // The next read with the dead token is the breach. The app makes one on its
  // own within a second (the sync's deferred reads — countries, media assets —
  // met it in runs 2–4 of this file); Billing's mount reads (plans, credits,
  // subscription) are the fallback if it does not. The click is dispatched,
  // not waited on for actionability: the rail may already be gone.
  const billing = page.getByRole('link', { name: 'Billing' }).first()
  if (await billing.isVisible()) {
    await billing.dispatchEvent('click', undefined, { timeout: 2_000 }).catch(() => undefined)
  }
  await expectReLogin(page)
})

test('3 · a boot on an authed route with a dead token lands on login, not on the website', async ({
  page,
}) => {
  test.setTimeout(150_000)
  await login(page)
  await page.getByRole('link', { name: 'Billing' }).first().click()
  await expect(page.getByRole('heading', { name: 'Billing', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  await tamperStoredToken(page)
  await page.reload()
  await expectReLogin(page)
})

/**
 * The other way a session ends (NIGHT-0916 order 2, item 83; D-NIGHT-0916-B):
 * a DELIBERATE sign-out lands on the marketing home from any route — the
 * action moves to `/` before the session clears — while the forced ones above
 * land on login. Two routes here; the unit test walks four.
 */
for (const start of [
  { rail: 'Settings', heading: 'Organization' },
  { rail: 'Billing', heading: 'Billing' },
]) {
  test(`4 · a deliberate sign-out from ${start.rail} lands on the marketing home, not on login`, async ({
    page,
  }) => {
    test.setTimeout(150_000)
    await login(page)
    await page.getByRole('link', { name: start.rail }).first().click()
    await expect(page.getByRole('heading', { name: start.heading, level: 1 })).toBeVisible({
      timeout: SCREEN_SYNC,
    })
    await page.getByRole('button', { name: 'Account menu' }).click()
    await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: SCREEN_SYNC })
    await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.', {
      timeout: SCREEN_SYNC,
    })
    expect(
      await page.evaluate(() =>
        Boolean(
          window.sessionStorage.getItem('ab-live-session') ||
          window.localStorage.getItem('ab-live-session'),
        ),
      ),
    ).toBe(false)
  })
}
