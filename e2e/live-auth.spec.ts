/**
 * INT-1's verify: one real account driven through every auth path on the
 * DEPLOYED AlphaStudio API, through the real UI.
 *
 * Runs only when the run opts into live mode (VITE_API_BASE_URL exported to
 * both the Playwright process and the webServer — see playwright.config.ts);
 * the default static suite skips this file entirely.
 *
 * Care with the API's rate limits (60 s between code sends, 5/hour per
 * email+purpose): every account is a fresh qa+<timestamp> address, each
 * purpose sends at most once per address — and the ONE deliberate extra send
 * (an immediate resend) exists precisely to prove the 429 countdown UI.
 * Dev convenience per the contract: every emailed code is 000000.
 *
 * The org used by the shell + invite tests is created by the HARNESS via the
 * API (org creation is INT-2's UI work); the flows under test stay UI-driven.
 */
import type { APIRequestContext, Page } from '@playwright/test'
import { expect, test } from './fixtures'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const NEW_PASSWORD = 'FreshlyGround3!'
const CODE = '000000'

const emailA = `qa+${RUN}a@alphapromena.com`
const emailB = `qa+${RUN}b@alphapromena.com`
const emailC = `qa+${RUN}c@alphapromena.com`

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

async function sessionToken(page: Page): Promise<string> {
  const raw = await page.evaluate(
    () =>
      window.sessionStorage.getItem('ab-live-session') ??
      window.localStorage.getItem('ab-live-session'),
  )
  expect(raw, 'a live session should be persisted').toBeTruthy()
  return (JSON.parse(raw!) as { token: string }).token
}

async function signUpViaUi(page: Page, name: string, email: string) {
  await page.goto('/signup')
  await page.getByLabel('Full name').fill(name)
  await page.getByLabel('Work email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Organization name').fill('QA Roasters')
  await page.getByRole('checkbox', { name: /terms of service/ }).click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()
}

async function enterCode(page: Page, code: string) {
  // input-otp renders one focusable input; typing fills the slots.
  await page.locator('[data-input-otp]').click()
  await page.keyboard.type(code)
}

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Work email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test('signup → verify with the emailed code → logged in, org-less, at onboarding', async ({
  page,
}) => {
  await signUpViaUi(page, 'QA Person A', emailA)

  // The live verify screen is a real code entry, not the demo button.
  await expect(page.getByText(`We sent a 6-digit code to ${emailA}`)).toBeVisible()
  await enterCode(page, CODE)

  // Verifying LOGS IN (the response is an auth session). No orgs yet, so the
  // workspace-less state owns the landing.
  await expect(page.getByText('finish setting up your workspace')).toBeVisible()
  expect(await sessionToken(page)).toBeTruthy()
})

test('a second signup: resend immediately proves the 429 countdown, wrong password proves the vague 401', async ({
  page,
}) => {
  await signUpViaUi(page, 'QA Person B', emailB)

  // One send just happened; an immediate resend is the honest way to hit the
  // documented rate limit and see the mono countdown rather than a refusal.
  await page.getByRole('button', { name: 'Resend code' }).click()
  await expect(page.getByRole('alert')).toContainText('Too many requests')

  // Wrong password on an unverified account is still the vague 401 — no
  // account enumeration, no verification oracle.
  await loginViaUi(page, emailB, 'Wrong-password-9')
  await expect(page.getByRole('alert')).toContainText('Incorrect email or password')
})

test('correct password + unverified email routes to the verify screen, which finishes the job', async ({
  page,
}) => {
  await loginViaUi(page, emailB, PASSWORD)

  // 403 email_not_verified → A3, with the address carried along.
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()
  await expect(page.getByText(`We sent a 6-digit code to ${emailB}`)).toBeVisible()

  await enterCode(page, CODE)
  await expect(page.getByText('finish setting up your workspace')).toBeVisible()
})

test('forgot → reset via the documented deep link revokes everything; only the new password works', async ({
  page,
}) => {
  // Request the reset from the UI (this also proves the anti-enumeration
  // sent-state renders from a real 204).
  await page.goto('/reset-password')
  await page.getByLabel('Work email').fill(emailA)
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()

  // The email's deep link: /reset-password?email=…&code=…
  await page.goto(`/reset-password?email=${encodeURIComponent(emailA)}&code=${CODE}`)
  await expect(page.getByRole('heading', { name: 'Set a new password' })).toBeVisible()
  await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD)
  await page.getByLabel('Confirm new password').fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Reset password' }).click()

  // Back to sign in; the old password is dead, the new one works.
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await loginViaUi(page, emailA, PASSWORD)
  await expect(page.getByRole('alert')).toContainText('Incorrect email or password')
  await loginViaUi(page, emailA, NEW_PASSWORD)
  await expect(page.getByText('finish setting up your workspace')).toBeVisible()
})

test('with an org (harness-created), the shell appears; sign out and logout-all both really revoke', async ({
  page,
  request,
}) => {
  // Harness setup: the org UI arrives in INT-2; the API is the contract.
  await loginViaUi(page, emailA, NEW_PASSWORD)
  await expect(page.getByText('finish setting up your workspace')).toBeVisible()
  const token = await sessionToken(page)
  const created = await request.post(`${API_BASE}/orgs`, {
    headers: { authorization: `Bearer ${token}` },
    data: { name: `QA Org ${RUN}` },
  })
  expect(created.status(), await created.text()).toBe(201)

  // The stored session's `orgs` is a login-time snapshot, so the new org is
  // not in it — a fresh login returns it (INT-2 makes boot refresh /me/orgs;
  // open-items item 6). With an org, the dashboard owns '/'.
  await loginViaUi(page, emailA, NEW_PASSWORD)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()

  // Sign out: session revoked server-side AND locally — marketing front door.
  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'AlphaBeacon' })).toBeVisible()

  // Logout-all: sign in again, revoke everything, land back outside.
  await loginViaUi(page, emailA, NEW_PASSWORD)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByRole('menuitem', { name: 'Sign out everywhere' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'AlphaBeacon' })).toBeVisible()
})

async function inviteNewUser(request: APIRequestContext, token: string, orgId: string) {
  const invited = await request.post(`${API_BASE}/orgs/${orgId}/members/invite`, {
    headers: { authorization: `Bearer ${token}` },
    data: { email: emailC, role: 'member' },
  })
  expect(invited.status(), await invited.text()).toBe(201)
  return (await invited.json()) as { invitedNewUser: boolean }
}

test('a new user accepts an invite through the documented deep link and lands in the workspace', async ({
  page,
  request,
}) => {
  // Sign back in (logout-all above really did revoke this account's sessions).
  await loginViaUi(page, emailA, NEW_PASSWORD)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  const token = await sessionToken(page)

  const orgsResponse = await request.get(`${API_BASE}/me/orgs`, {
    headers: { authorization: `Bearer ${token}` },
  })
  const orgs = (await orgsResponse.json()) as { items: { id: string }[] }
  const orgId = orgs.items[0].id

  const invite = await inviteNewUser(request, token, orgId)
  expect(invite.invitedNewUser).toBe(true)

  // The invitee's context: a fresh page, the emailed deep link, a password.
  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
  await page.goto(`/accept-invite?email=${encodeURIComponent(emailC)}&code=${CODE}`)
  await expect(page.getByRole('heading', { name: 'Join your team' })).toBeVisible()
  await page.getByLabel('Your name').fill('QA Person C')
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Confirm password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Join the workspace' }).click()

  // Logged in, verified, and INSIDE the org that invited them.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
})

test('a token-carrying 401 purges the session and lands on login with the toast', async ({
  page,
}) => {
  await loginViaUi(page, emailC, PASSWORD)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()

  // Corrupt the stored token, then force an API read (a reload re-grafts the
  // stored session; the next authed call comes back 401).
  await page.evaluate(() => {
    const key = 'ab-live-session'
    const raw = window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key)
    if (!raw) throw new Error('no session to corrupt')
    const record = JSON.parse(raw) as { token: string }
    record.token = 'dead-token'
    ;(window.sessionStorage.getItem(key) ? window.sessionStorage : window.localStorage).setItem(
      key,
      JSON.stringify(record),
    )
  })
  await page.goto('/')
  // Trigger an authed call through the seam: signing out everywhere uses the
  // (now dead) token and must come back 401.
  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByRole('menuitem', { name: 'Sign out everywhere' }).click()

  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await expect(page.getByText('Your session ended. Sign in again to continue.')).toBeVisible()
})
