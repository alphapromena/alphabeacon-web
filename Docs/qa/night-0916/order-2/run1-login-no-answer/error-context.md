# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-auth-401.spec.ts >> 4 · a deliberate sign-out from Settings lands on the marketing home, not on login
- Location: e2e\live-auth-401.spec.ts:197:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Dashboard', level: 1 })
Expected: visible
Timeout: 40000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 40000ms
  - waiting for getByRole('heading', { name: 'Dashboard', level: 1 })

```

```yaml
- link "Malaky":
  - /url: /
  - img "Malaky"
- heading "Welcome back" [level=1]
- paragraph: Pick up where your queue left off.
- alert: The server did not answer. Try again.
- group:
  - text: Work email
  - textbox "Work email":
    - /placeholder: you@company.com
    - text: qa+1789507349240681s@alphapromena.com
- group:
  - text: Password
  - textbox "Password": Roasted2Order!
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
> 56  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
      |                                                                            ^ Error: expect(locator).toBeVisible() failed
  57  |     timeout: SCREEN_SYNC,
  58  |   })
  59  |   // The heading shows before the sign-in sync's tail (org, wallet, schedules)
  60  |   // has landed; let the main body land before a test acts.
  61  |   await page.waitForLoadState('networkidle', { timeout: SCREEN_SYNC })
  62  |   // Every toast that appears from here on is recorded, so one that has gone by
  63  |   // the time an assertion looks is still on record (`.cn-toast` is the class
  64  |   // ui/sonner.tsx puts on every toast; a reload drops the observer, and the
  65  |   // tests that reload look at once).
  66  |   await page.evaluate(() => {
  67  |     const seen: string[] = []
  68  |     ;(window as unknown as { __toasts: string[] }).__toasts = seen
  69  |     new MutationObserver(() => {
  70  |       for (const toast of Array.from(document.querySelectorAll('.cn-toast'))) {
  71  |         const text = toast.textContent ?? ''
  72  |         if (text && !seen.includes(text)) seen.push(text)
  73  |       }
  74  |     }).observe(document, { childList: true, subtree: true, characterData: true })
  75  |   })
  76  | }
  77  | 
  78  | /** The app's own stored token, read the way `live-setup.ts` reads it. */
  79  | async function storedToken(page: Page): Promise<string> {
  80  |   const raw = await page.evaluate(
  81  |     () =>
  82  |       window.sessionStorage.getItem('ab-live-session') ??
  83  |       window.localStorage.getItem('ab-live-session'),
  84  |   )
  85  |   if (!raw) throw new Error('no live session in storage — log in first')
  86  |   return (JSON.parse(raw) as { token: string }).token
  87  | }
  88  | 
  89  | async function tamperStoredToken(page: Page) {
  90  |   await page.evaluate(() => {
  91  |     for (const store of [window.sessionStorage, window.localStorage]) {
  92  |       const raw = store.getItem('ab-live-session')
  93  |       if (!raw) continue
  94  |       const session = JSON.parse(raw) as { token: string }
  95  |       session.token = 'expired-token-fix-0915'
  96  |       store.setItem('ab-live-session', JSON.stringify(session))
  97  |     }
  98  |   })
  99  | }
  100 | 
  101 | /** Login, the toast, and no session left behind — the end state all three share. */
  102 | async function expectReLogin(page: Page) {
  103 |   await expect(page).toHaveURL(/\/login$/, { timeout: SCREEN_SYNC })
  104 |   // Up now, or seen by `login`'s observer: a breach the app meets on its own
  105 |   // (test 2's deferred reads) shows the toast before the test looks.
  106 |   await expect
  107 |     .poll(
  108 |       async () =>
  109 |         (await page.getByText(SESSION_ENDED).count()) > 0 ||
  110 |         (
  111 |           await page.evaluate(() => (window as unknown as { __toasts?: string[] }).__toasts ?? [])
  112 |         ).some((toast) => toast.includes(SESSION_ENDED)),
  113 |       { timeout: SCREEN_SYNC },
  114 |     )
  115 |     .toBe(true)
  116 |   await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  117 |   expect(
  118 |     await page.evaluate(() =>
  119 |       Boolean(
  120 |         window.sessionStorage.getItem('ab-live-session') ||
  121 |         window.localStorage.getItem('ab-live-session'),
  122 |       ),
  123 |     ),
  124 |   ).toBe(false)
  125 | }
  126 | 
  127 | test('a fresh owner + org, made through the product', async ({ page }) => {
  128 |   test.setTimeout(150_000)
  129 |   await signUpAndEnter(page, {
  130 |     name: 'QA Session Owner',
  131 |     email: owner,
  132 |     password: PASSWORD,
  133 |     orgName: `QA Session Org ${RUN}`,
  134 |   })
  135 | })
  136 | 
  137 | test('1 · a token expired at boot on `/` lands on login with the toast', async ({ page }) => {
  138 |   test.setTimeout(150_000)
  139 |   await login(page)
  140 |   await tamperStoredToken(page)
  141 |   await page.goto('/')
  142 |   await expectReLogin(page)
  143 | })
  144 | 
  145 | test('2 · a token revoked mid-session on an authed route lands on login, not on the website', async ({
  146 |   page,
  147 |   request,
  148 | }) => {
  149 |   test.setTimeout(150_000)
  150 |   await login(page)
  151 |   await page.getByRole('link', { name: 'Settings' }).first().click()
  152 |   await expect(page.getByRole('tab', { name: 'Team' })).toBeVisible({ timeout: SCREEN_SYNC })
  153 |   await page.waitForLoadState('networkidle', { timeout: SCREEN_SYNC })
  154 |   // Revoked from OUTSIDE the app, the way sign-out-everywhere on another device
  155 |   // would do it; the app still holds the token.
  156 |   const token = await storedToken(page)
```