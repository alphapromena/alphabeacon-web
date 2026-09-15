# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-auth-401.spec.ts >> 2 · a token revoked mid-session on an authed route lands on login, not on the website
- Location: e2e\live-auth-401.spec.ts:122:1

# Error details

```
Test timeout of 150000ms exceeded.
```

```
Error: locator.click: Test timeout of 150000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: 'Billing' }).first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link [ref=e5] [cursor=pointer]:
        - /url: /
        - img "Malaky" [ref=e6]
      - generic [ref=e7]:
        - generic [ref=e8]:
          - heading "Welcome back" [level=1] [ref=e9]
          - paragraph [ref=e10]: Pick up where your queue left off.
        - generic [ref=e11]:
          - group [ref=e12]:
            - generic [ref=e13]: Work email
            - textbox "Work email" [ref=e14]:
              - /placeholder: you@company.com
          - group [ref=e15]:
            - generic [ref=e16]: Password
            - textbox "Password" [ref=e17]
          - group [ref=e18]:
            - generic [ref=e19]: Keep me signed in on this device
            - checkbox "Keep me signed in on this device" [ref=e21]
            - checkbox
          - link "Forgot password?" [ref=e23] [cursor=pointer]:
            - /url: /reset-password
          - button "Sign in" [ref=e25]
        - generic [ref=e26]:
          - text: New here?
          - link "Create an account" [ref=e27] [cursor=pointer]:
            - /url: /signup
    - complementary [ref=e28]:
      - blockquote [ref=e30]:
        - paragraph [ref=e31]: Nothing waiting on you goes unnoticed.
        - paragraph [ref=e32]: The beacon only pulses when something genuinely needs review — so an empty queue means you are actually done.
  - region "Notifications alt+T"
```

# Test source

```ts
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
  59  |   // The heading shows before the sign-in sync's tail (org, wallet, schedules)
  60  |   // has landed; let it land, so the next read a test makes is ITS read and not
  61  |   // the sync's (run 3 of this file met the 401 on the tail and the toast had
  62  |   // gone by the time the test looked).
  63  |   await page.waitForLoadState('networkidle', { timeout: SCREEN_SYNC })
  64  | }
  65  | 
  66  | /** The app's own stored token, read the way `live-setup.ts` reads it. */
  67  | async function storedToken(page: Page): Promise<string> {
  68  |   const raw = await page.evaluate(
  69  |     () =>
  70  |       window.sessionStorage.getItem('ab-live-session') ??
  71  |       window.localStorage.getItem('ab-live-session'),
  72  |   )
  73  |   if (!raw) throw new Error('no live session in storage — log in first')
  74  |   return (JSON.parse(raw) as { token: string }).token
  75  | }
  76  | 
  77  | async function tamperStoredToken(page: Page) {
  78  |   await page.evaluate(() => {
  79  |     for (const store of [window.sessionStorage, window.localStorage]) {
  80  |       const raw = store.getItem('ab-live-session')
  81  |       if (!raw) continue
  82  |       const session = JSON.parse(raw) as { token: string }
  83  |       session.token = 'expired-token-fix-0915'
  84  |       store.setItem('ab-live-session', JSON.stringify(session))
  85  |     }
  86  |   })
  87  | }
  88  | 
  89  | /** Login, the toast, and no session left behind — the end state all three share. */
  90  | async function expectReLogin(page: Page) {
  91  |   await expect(page).toHaveURL(/\/login$/, { timeout: SCREEN_SYNC })
  92  |   await expect(page.getByText(SESSION_ENDED)).toBeVisible({ timeout: SCREEN_SYNC })
  93  |   await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  94  |   expect(
  95  |     await page.evaluate(() =>
  96  |       Boolean(
  97  |         window.sessionStorage.getItem('ab-live-session') ||
  98  |         window.localStorage.getItem('ab-live-session'),
  99  |       ),
  100 |     ),
  101 |   ).toBe(false)
  102 | }
  103 | 
  104 | test('a fresh owner + org, made through the product', async ({ page }) => {
  105 |   test.setTimeout(150_000)
  106 |   await signUpAndEnter(page, {
  107 |     name: 'QA Session Owner',
  108 |     email: owner,
  109 |     password: PASSWORD,
  110 |     orgName: `QA Session Org ${RUN}`,
  111 |   })
  112 | })
  113 | 
  114 | test('1 · a token expired at boot on `/` lands on login with the toast', async ({ page }) => {
  115 |   test.setTimeout(150_000)
  116 |   await login(page)
  117 |   await tamperStoredToken(page)
  118 |   await page.goto('/')
  119 |   await expectReLogin(page)
  120 | })
  121 | 
  122 | test('2 · a token revoked mid-session on an authed route lands on login, not on the website', async ({
  123 |   page,
  124 |   request,
  125 | }) => {
  126 |   test.setTimeout(150_000)
  127 |   await login(page)
  128 |   await page.getByRole('link', { name: 'Settings' }).first().click()
  129 |   await expect(page.getByRole('tab', { name: 'Team' })).toBeVisible({ timeout: SCREEN_SYNC })
  130 |   await page.waitForLoadState('networkidle', { timeout: SCREEN_SYNC })
  131 |   // Revoked from OUTSIDE the app, the way sign-out-everywhere on another device
  132 |   // would do it; the app still holds the token.
  133 |   const token = await storedToken(page)
  134 |   const revoke = await request.post(`${API_BASE}/auth/logout`, {
  135 |     headers: { authorization: `Bearer ${token}` },
  136 |   })
  137 |   expect(revoke.status(), `POST /auth/logout → ${revoke.status()}`).toBe(204)
  138 |   // The next read with the dead token is the breach: Billing reads its plans,
  139 |   // credits and subscription on mount. (The Team tab, already loaded, reads
  140 |   // nothing again — run 1 of this file.)
> 141 |   await page.getByRole('link', { name: 'Billing' }).first().click()
      |                                                             ^ Error: locator.click: Test timeout of 150000ms exceeded.
  142 |   await expectReLogin(page)
  143 | })
  144 | 
  145 | test('3 · a boot on an authed route with a dead token lands on login, not on the website', async ({
  146 |   page,
  147 | }) => {
  148 |   test.setTimeout(150_000)
  149 |   await login(page)
  150 |   await page.getByRole('link', { name: 'Billing' }).first().click()
  151 |   await expect(page.getByRole('heading', { name: 'Billing', level: 1 })).toBeVisible({
  152 |     timeout: SCREEN_SYNC,
  153 |   })
  154 |   await tamperStoredToken(page)
  155 |   await page.reload()
  156 |   await expectReLogin(page)
  157 | })
  158 | 
```