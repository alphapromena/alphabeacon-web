# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-auth-401.spec.ts >> 2 · a token revoked mid-session on an authed route lands on login, not on the website
- Location: e2e\live-auth-401.spec.ts:117:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Your session ended. Sign in again to continue.')
Expected: visible
Timeout: 40000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 40000ms
  - waiting for getByText('Your session ended. Sign in again to continue.')

```

```yaml
- link "Malaky":
  - /url: /
  - img "Malaky"
- heading "Welcome back" [level=1]
- paragraph: Pick up where your queue left off.
- group:
  - text: Work email
  - textbox "Work email":
    - /placeholder: you@company.com
- group:
  - text: Password
  - textbox "Password"
- group:
  - text: Keep me signed in on this device
  - checkbox "Keep me signed in on this device"
- link "Forgot password?":
  - /url: /reset-password
- button "Sign in"
- text: New here?
- link "Create an account":
  - /url: /signup
- complementary:
  - blockquote:
    - paragraph: Nothing waiting on you goes unnoticed.
    - paragraph: The beacon only pulses when something genuinely needs review — so an empty queue means you are actually done.
- region "Notifications alt+T"
```

# Test source

```ts
  1   | /**
  2   |  * A 401 lands on login, every time (ORDER-FIX-0915, item 75) — against the
  3   |  * DEPLOYED dev API on one fresh QA org, zero spend.
  4   |  *
  5   |  * TEST-0915 measured three ways a session can die and where the app landed:
  6   |  *   1. the token EXPIRED at boot on `/`             → login, with the toast (was right)
  7   |  *   2. the token REVOKED mid-session on an authed route → `/`, the website (was wrong)
  8   |  *   3. a boot on an authed route with a dead token   → `/`, the website (was wrong)
  9   |  * The 401 handler purged and pushed `/login` in every case; the protected-route
  10  |  * guard's own redirect won the race with `/`. The guard sends to login now, so
  11  |  * all three end in the same place, with the session purged and the toast up.
  12  |  *
  13  |  * "Expired" is a tampered stored token; "revoked" is the app's own token
  14  |  * revoked from outside through `POST /auth/logout`, exactly what a second
  15  |  * device's sign-out-everywhere does. No refresh endpoint exists (api.md,
  16  |  * Conventions): a 401 is always a re-login.
  17  |  */
  18  | import type { Page } from '@playwright/test'
  19  | import { expect, test } from './fixtures'
  20  | import { SCREEN_SYNC } from './live-clocks'
  21  | import { runStamp, signUpAndEnter } from './live-setup'
  22  | 
  23  | const API_BASE = process.env.VITE_API_BASE_URL
  24  | const RUN = runStamp()
  25  | const PASSWORD = 'Roasted2Order!'
  26  | const owner = `qa+${RUN}s@alphapromena.com`
  27  | const SESSION_ENDED = 'Your session ended. Sign in again to continue.'
  28  | 
  29  | test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
  30  | test.describe.configure({ mode: 'serial' })
  31  | 
  32  | // The server's request id rides in the error envelope; a 401's is the evidence
  33  | // this file exists for, so each one goes to the runner's log.
  34  | const API = API_BASE ?? ''
  35  | test.beforeEach(({ page }, info) => {
  36  |   page.on('response', (response) => {
  37  |     if (response.status() !== 401 || !response.url().startsWith(API)) return
  38  |     void response
  39  |       .json()
  40  |       .catch(() => null)
  41  |       .then((body: { error?: { requestId?: string } } | null) => {
  42  |         const path = response.url().slice(API.length)
  43  |         const id = body?.error?.requestId ?? 'none in the envelope'
  44  |         console.log(
  45  |           `    ${info.title.slice(0, 3).trim()} · ${response.request().method()} ${path} → 401 · request ${id}`,
  46  |         )
  47  |       })
  48  |   })
  49  | })
  50  | 
  51  | async function login(page: Page) {
  52  |   await page.goto('/login')
  53  |   await page.getByLabel('Work email').fill(owner)
  54  |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  55  |   await page.getByRole('button', { name: 'Sign in' }).click()
  56  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  57  |     timeout: SCREEN_SYNC,
  58  |   })
  59  | }
  60  | 
  61  | /** The app's own stored token, read the way `live-setup.ts` reads it. */
  62  | async function storedToken(page: Page): Promise<string> {
  63  |   const raw = await page.evaluate(
  64  |     () =>
  65  |       window.sessionStorage.getItem('ab-live-session') ??
  66  |       window.localStorage.getItem('ab-live-session'),
  67  |   )
  68  |   if (!raw) throw new Error('no live session in storage — log in first')
  69  |   return (JSON.parse(raw) as { token: string }).token
  70  | }
  71  | 
  72  | async function tamperStoredToken(page: Page) {
  73  |   await page.evaluate(() => {
  74  |     for (const store of [window.sessionStorage, window.localStorage]) {
  75  |       const raw = store.getItem('ab-live-session')
  76  |       if (!raw) continue
  77  |       const session = JSON.parse(raw) as { token: string }
  78  |       session.token = 'expired-token-fix-0915'
  79  |       store.setItem('ab-live-session', JSON.stringify(session))
  80  |     }
  81  |   })
  82  | }
  83  | 
  84  | /** Login, the toast, and no session left behind — the end state all three share. */
  85  | async function expectReLogin(page: Page) {
  86  |   await expect(page).toHaveURL(/\/login$/, { timeout: SCREEN_SYNC })
> 87  |   await expect(page.getByText(SESSION_ENDED)).toBeVisible({ timeout: SCREEN_SYNC })
      |                                               ^ Error: expect(locator).toBeVisible() failed
  88  |   await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  89  |   expect(
  90  |     await page.evaluate(() =>
  91  |       Boolean(
  92  |         window.sessionStorage.getItem('ab-live-session') ||
  93  |         window.localStorage.getItem('ab-live-session'),
  94  |       ),
  95  |     ),
  96  |   ).toBe(false)
  97  | }
  98  | 
  99  | test('a fresh owner + org, made through the product', async ({ page }) => {
  100 |   test.setTimeout(150_000)
  101 |   await signUpAndEnter(page, {
  102 |     name: 'QA Session Owner',
  103 |     email: owner,
  104 |     password: PASSWORD,
  105 |     orgName: `QA Session Org ${RUN}`,
  106 |   })
  107 | })
  108 | 
  109 | test('1 · a token expired at boot on `/` lands on login with the toast', async ({ page }) => {
  110 |   test.setTimeout(150_000)
  111 |   await login(page)
  112 |   await tamperStoredToken(page)
  113 |   await page.goto('/')
  114 |   await expectReLogin(page)
  115 | })
  116 | 
  117 | test('2 · a token revoked mid-session on an authed route lands on login, not on the website', async ({
  118 |   page,
  119 |   request,
  120 | }) => {
  121 |   test.setTimeout(150_000)
  122 |   await login(page)
  123 |   await page.getByRole('link', { name: 'Settings' }).first().click()
  124 |   await expect(page.getByRole('tab', { name: 'Team' })).toBeVisible({ timeout: SCREEN_SYNC })
  125 |   // Revoked from OUTSIDE the app, the way sign-out-everywhere on another device
  126 |   // would do it; the app still holds the token.
  127 |   const token = await storedToken(page)
  128 |   const revoke = await request.post(`${API_BASE}/auth/logout`, {
  129 |     headers: { authorization: `Bearer ${token}` },
  130 |   })
  131 |   expect(revoke.status(), `POST /auth/logout → ${revoke.status()}`).toBe(204)
  132 |   // The next read with the dead token is the breach. Billing reads its plans,
  133 |   // credits and subscription on mount, so the click makes one — unless the
  134 |   // sign-in sync's own tail (org, wallet, schedules) is still in flight and
  135 |   // meets the 401 first, in which case the rail is gone before the click lands
  136 |   // (run 2 of this file). Whichever read it is, the end state is the same, so
  137 |   // the click is best-effort and the assertion is the end state.
  138 |   await page
  139 |     .getByRole('link', { name: 'Billing' })
  140 |     .first()
  141 |     .click({ timeout: 5_000 })
  142 |     .catch(() => undefined)
  143 |   await expectReLogin(page)
  144 | })
  145 | 
  146 | test('3 · a boot on an authed route with a dead token lands on login, not on the website', async ({
  147 |   page,
  148 | }) => {
  149 |   test.setTimeout(150_000)
  150 |   await login(page)
  151 |   await page.getByRole('link', { name: 'Billing' }).first().click()
  152 |   await expect(page.getByRole('heading', { name: 'Billing', level: 1 })).toBeVisible({
  153 |     timeout: SCREEN_SYNC,
  154 |   })
  155 |   await tamperStoredToken(page)
  156 |   await page.reload()
  157 |   await expectReLogin(page)
  158 | })
  159 | 
```