# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-auth-401.spec.ts >> 2 · a token revoked mid-session on an authed route lands on login, not on the website
- Location: e2e\live-auth-401.spec.ts:117:1

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
  87  |   await expect(page.getByText(SESSION_ENDED)).toBeVisible({ timeout: SCREEN_SYNC })
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
  132 |   // The next read with the dead token is the breach: Billing reads its plans,
  133 |   // credits and subscription on mount (the Team tab, already loaded, reads
  134 |   // nothing again — run 1 of this file proved that the hard way).
> 135 |   await page.getByRole('link', { name: 'Billing' }).first().click()
      |                                                             ^ Error: locator.click: Test timeout of 150000ms exceeded.
  136 |   await expectReLogin(page)
  137 | })
  138 | 
  139 | test('3 · a boot on an authed route with a dead token lands on login, not on the website', async ({
  140 |   page,
  141 | }) => {
  142 |   test.setTimeout(150_000)
  143 |   await login(page)
  144 |   await page.getByRole('link', { name: 'Billing' }).first().click()
  145 |   await expect(page.getByRole('heading', { name: 'Billing', level: 1 })).toBeVisible({
  146 |     timeout: SCREEN_SYNC,
  147 |   })
  148 |   await tamperStoredToken(page)
  149 |   await page.reload()
  150 |   await expectReLogin(page)
  151 | })
  152 | 
```