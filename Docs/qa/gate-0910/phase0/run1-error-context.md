# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-auth.spec.ts >> correct password + unverified email routes to the verify screen, which finishes the job
- Location: e2e\live-auth.spec.ts:125:1

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
- heading "Name your workspace and we will finish setting it up." [level=1]
- paragraph: Everything else — your brand voice, tones, sources and posting rhythm — is set up inside the app, whenever you are ready.
- text: Organization name
- textbox "Organization name":
    - /placeholder: Atlas Roasters
- button "Create my workspace" [disabled]
- region "Notifications alt+T"
```

# Test source

```ts
  39  |  * — and the signup walk alone measures 27-29 s door to door against today's
  40  |  * API (Docs/api/live-red-2026-08-23.md). It could not pass at any wait value.
  41  |  * The cap stays where E2E-0820 B7 put it; ONB-0827 made the walk SHORTER (the
  42  |  * five wizard steps are gone), never longer.
  43  |  */
  44  | test.beforeEach(() => {
  45  |   test.setTimeout(150_000)
  46  | })
  47  |
  48  | async function sessionToken(page: Page): Promise<string> {
  49  |   const raw = await page.evaluate(
  50  |     () =>
  51  |       window.sessionStorage.getItem('ab-live-session') ??
  52  |       window.localStorage.getItem('ab-live-session'),
  53  |   )
  54  |   expect(raw, 'a live session should be persisted').toBeTruthy()
  55  |   return (JSON.parse(raw!) as { token: string }).token
  56  | }
  57  |
  58  | async function signUpViaUi(page: Page, name: string, email: string) {
  59  |   await page.goto('/signup')
  60  |   await page.getByLabel('Full name').fill(name)
  61  |   await page.getByLabel('Work email').fill(email)
  62  |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  63  |   await page.getByLabel('Organization name').fill('QA Roasters')
  64  |   await page.getByRole('checkbox', { name: /terms of service/ }).click()
  65  |   await page.getByRole('button', { name: 'Create account' }).click()
  66  |   // The run's first POST can hit a cold Lambda; give first contact headroom.
  67  |   // One POST round-trip — live-red-2026-08-23.
  68  |   await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({
  69  |     timeout: ONE_CALL,
  70  |   })
  71  | }
  72  |
  73  | async function enterCode(page: Page, code: string) {
  74  |   // input-otp renders one focusable input; typing fills the slots.
  75  |   await page.locator('[data-input-otp]').click()
  76  |   await page.keyboard.type(code)
  77  | }
  78  |
  79  | async function loginViaUi(page: Page, email: string, password: string) {
  80  |   await page.goto('/login')
  81  |   await page.getByLabel('Work email').fill(email)
  82  |   await page.getByLabel('Password', { exact: true }).fill(password)
  83  |   await page.getByRole('button', { name: 'Sign in' }).click()
  84  | }
  85  |
  86  | test('signup -> verify with the emailed code -> logged in, WITH a workspace, in the app', async ({
  87  |   page,
  88  | }) => {
  89  |   await signUpViaUi(page, 'QA Person A', emailA)
  90  |
  91  |   // The live verify screen is a real code entry, not the demo button.
  92  |   await expect(page.getByText(`We sent a 6-digit code to ${emailA}`)).toBeVisible()
  93  |   await enterCode(page, CODE)
  94  |
  95  |   // Verifying LOGS IN (the response is an auth session) and then creates the
  96  |   // workspace from the org name typed at signup, so the product is the next
  97  |   // thing on screen — no wizard, no workspace-less landing (ONB-0827).
  98  |   // The verify POST, the org create and the resync behind them.
  99  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  100 |     timeout: SCREEN_SYNC,
  101 |   })
  102 |   expect(await sessionToken(page)).toBeTruthy()
  103 | })
  104 |
  105 | test('a second signup: resend immediately proves the 429 countdown, wrong password proves the vague 401', async ({
  106 |   page,
  107 | }) => {
  108 |   await signUpViaUi(page, 'QA Person B', emailB)
  109 |
  110 |   // One send just happened; an immediate resend is the honest way to hit the
  111 |   // documented rate limit and see the mono countdown rather than a refusal.
  112 |   await page.getByRole('button', { name: 'Resend code' }).click()
  113 |   // One POST round-trip — live-red-2026-08-23.
  114 |   await expect(page.getByRole('alert')).toContainText('Too many requests', { timeout: ONE_CALL })
  115 |
  116 |   // Wrong password on an unverified account is still the vague 401 â€” no
  117 |   // account enumeration, no verification oracle.
  118 |   await loginViaUi(page, emailB, 'Wrong-password-9')
  119 |   // One POST round-trip — live-red-2026-08-23.
  120 |   await expect(page.getByRole('alert')).toContainText('Incorrect email or password', {
  121 |     timeout: ONE_CALL,
  122 |   })
  123 | })
  124 |
  125 | test('correct password + unverified email routes to the verify screen, which finishes the job', async ({
  126 |   page,
  127 | }) => {
  128 |   await loginViaUi(page, emailB, PASSWORD)
  129 |
  130 |   // 403 email_not_verified â†’ A3, with the address carried along.
  131 |   // One POST round-trip — live-red-2026-08-23.
  132 |   await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({
  133 |     timeout: ONE_CALL,
  134 |   })
  135 |   await expect(page.getByText(`We sent a 6-digit code to ${emailB}`)).toBeVisible()
  136 |
  137 |   await enterCode(page, CODE)
  138 |   // Same as above: verifying creates the workspace and lands in the app.
> 139 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
      |                                                                            ^ Error: expect(locator).toBeVisible() failed
  140 |     timeout: SCREEN_SYNC,
  141 |   })
  142 | })
  143 |
  144 | test('forgot â†’ reset via the documented deep link revokes everything; only the new password works', async ({
  145 |   page,
  146 | }) => {
  147 |   // Request the reset from the UI (this also proves the anti-enumeration
  148 |   // sent-state renders from a real 204).
  149 |   await page.goto('/reset-password')
  150 |   await page.getByLabel('Work email').fill(emailA)
  151 |   await page.getByRole('button', { name: 'Send reset link' }).click()
  152 |   // One POST round-trip — live-red-2026-08-23.
  153 |   await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({
  154 |     timeout: ONE_CALL,
  155 |   })
  156 |
  157 |   // The email's deep link: /reset-password?email=â€¦&code=â€¦
  158 |   await page.goto(`/reset-password?email=${encodeURIComponent(emailA)}&code=${CODE}`)
  159 |   await expect(page.getByRole('heading', { name: 'Set a new password' })).toBeVisible()
  160 |   await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD)
  161 |   await page.getByLabel('Confirm new password').fill(NEW_PASSWORD)
  162 |   await page.getByRole('button', { name: 'Reset password' }).click()
  163 |
  164 |   // Back to sign in; the old password is dead, the new one works.
  165 |   // One POST round-trip — live-red-2026-08-23.
  166 |   await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible({
  167 |     timeout: ONE_CALL,
  168 |   })
  169 |   await loginViaUi(page, emailA, PASSWORD)
  170 |   // One POST round-trip — live-red-2026-08-23.
  171 |   await expect(page.getByRole('alert')).toContainText('Incorrect email or password', {
  172 |     timeout: ONE_CALL,
  173 |   })
  174 |   await loginViaUi(page, emailA, NEW_PASSWORD)
  175 |   // This account already has its workspace (test 1 created it), so a good
  176 |   // login lands in the product.
  177 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  178 |     timeout: SCREEN_SYNC,
  179 |   })
  180 | })
  181 |
  182 | test('the shell appears; sign out and logout-all both really revoke', async ({
  183 |   page,
  184 |   request,
  185 | }) => {
  186 |   // No harness org any more: this account got its workspace from verifying
  187 |   // (ONB-0827, D-ONB-C), which is what the product does for every account.
  188 |   await loginViaUi(page, emailA, NEW_PASSWORD)
  189 |   // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  190 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  191 |     timeout: SCREEN_SYNC,
  192 |   })
  193 |
  194 |   // Exactly one workspace — signing up, verifying and logging in three times
  195 |   // over must not have stacked a second (the idempotency law, E2E-0820 F12).
  196 |   const token = await sessionToken(page)
  197 |   const mine = (await (
  198 |     await request.get(`${API_BASE}/me/orgs`, { headers: { authorization: `Bearer ${token}` } })
  199 |   ).json()) as { total: number }
  200 |   expect(mine.total).toBe(1)
  201 |
  202 |   // Sign out: session revoked server-side AND locally â€” marketing front door.
  203 |   await page.getByRole('button', { name: 'Account menu' }).click()
  204 |   await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
  205 |   // The signed-out front door is the concept-v2 marketing site (M2): its h1
  206 |   // is the hero headline, which spans three lines.
  207 |   // One POST round-trip — live-red-2026-08-23.
  208 |   await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.', {
  209 |     timeout: ONE_CALL,
  210 |   })
  211 |
  212 |   // Logout-all: sign in again, revoke everything, land back outside.
  213 |   await loginViaUi(page, emailA, NEW_PASSWORD)
  214 |   // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  215 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  216 |     timeout: SCREEN_SYNC,
  217 |   })
  218 |   await page.getByRole('button', { name: 'Account menu' }).click()
  219 |   await page.getByRole('menuitem', { name: 'Sign out everywhere' }).click()
  220 |   // The signed-out front door is the concept-v2 marketing site (M2): its h1
  221 |   // is the hero headline, which spans three lines.
  222 |   // One POST round-trip — live-red-2026-08-23.
  223 |   await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.', {
  224 |     timeout: ONE_CALL,
  225 |   })
  226 | })
  227 |
  228 | async function inviteNewUser(request: APIRequestContext, token: string, orgId: string) {
  229 |   const invited = await request.post(`${API_BASE}/orgs/${orgId}/members/invite`, {
  230 |     headers: { authorization: `Bearer ${token}` },
  231 |     data: { email: emailC, role: 'member' },
  232 |   })
  233 |   expect(invited.status(), await invited.text()).toBe(201)
  234 |   return (await invited.json()) as { invitedNewUser: boolean }
  235 | }
  236 |
  237 | test('a new user accepts an invite through the documented deep link and lands in the workspace', async ({
  238 |   page,
  239 |   request,
```
