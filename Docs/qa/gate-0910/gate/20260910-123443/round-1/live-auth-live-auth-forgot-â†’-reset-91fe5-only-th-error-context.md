# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-auth.spec.ts >> forgot â†’ reset via the documented deep link revokes everything; only the new password works
- Location: e2e\live-auth.spec.ts:157:1

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
- alert: Something went wrong on our side. Try again — your work is safe.
- group:
  - text: Work email
  - textbox "Work email":
    - /placeholder: you@company.com
    - text: qa+1789043746227249a@alphapromena.com
- group:
  - text: Password
  - textbox "Password": FreshlyGround3!
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
  90  |   await signUpViaUi(page, 'QA Person A', emailA)
  91  | 
  92  |   // The live verify screen is a real code entry, not the demo button.
  93  |   await expect(page.getByText(`We sent a 6-digit code to ${emailA}`)).toBeVisible()
  94  |   await enterCode(page, CODE)
  95  | 
  96  |   // Verifying LOGS IN (the response is an auth session) and then creates the
  97  |   // workspace from the org name typed at signup, so the product is the next
  98  |   // thing on screen — no wizard, no workspace-less landing (ONB-0827).
  99  |   // The verify POST, the org create and the resync behind them.
  100 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  101 |     timeout: SCREEN_SYNC,
  102 |   })
  103 |   expect(await sessionToken(page)).toBeTruthy()
  104 | })
  105 | 
  106 | test('a second signup: resend immediately proves the 429 countdown, wrong password proves the vague 401', async ({
  107 |   page,
  108 | }) => {
  109 |   await signUpViaUi(page, 'QA Person B', emailB)
  110 | 
  111 |   // One send just happened; an immediate resend is the honest way to hit the
  112 |   // documented rate limit and see the mono countdown rather than a refusal.
  113 |   await page.getByRole('button', { name: 'Resend code' }).click()
  114 |   // One POST round-trip — live-red-2026-08-23.
  115 |   await expect(page.getByRole('alert')).toContainText('Too many requests', { timeout: ONE_CALL })
  116 | 
  117 |   // Wrong password on an unverified account is still the vague 401 â€” no
  118 |   // account enumeration, no verification oracle.
  119 |   await loginViaUi(page, emailB, 'Wrong-password-9')
  120 |   // One POST round-trip — live-red-2026-08-23.
  121 |   await expect(page.getByRole('alert')).toContainText('Incorrect email or password', {
  122 |     timeout: ONE_CALL,
  123 |   })
  124 | })
  125 | 
  126 | test('correct password + unverified email routes to the verify screen, and N3 names the workspace', async ({
  127 |   page,
  128 | }) => {
  129 |   await loginViaUi(page, emailB, PASSWORD)
  130 | 
  131 |   // 403 email_not_verified â†’ A3, with the address carried along.
  132 |   // One POST round-trip — live-red-2026-08-23.
  133 |   await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({
  134 |     timeout: ONE_CALL,
  135 |   })
  136 |   await expect(page.getByText(`We sent a 6-digit code to ${emailB}`)).toBeVisible()
  137 | 
  138 |   await enterCode(page, CODE)
  139 |   // This walk carries no org name: the signup's name lives in the browser
  140 |   // that typed it, and this is a fresh one. So verifying creates nothing and
  141 |   // N3 asks (GATE-0910, item 59) — the walk production actually has. The dev
  142 |   // server used to skip N3 by naming the workspace after its demo world.
  143 |   await expect(
  144 |     page.getByRole('heading', {
  145 |       name: 'Name your workspace and we will finish setting it up.',
  146 |       level: 1,
  147 |     }),
  148 |   ).toBeVisible({ timeout: SCREEN_SYNC })
  149 |   await page.getByLabel('Organization name').fill('QA Roasters')
  150 |   await page.getByRole('button', { name: 'Create my workspace' }).click()
  151 |   // POST /orgs and the resync, then the product.
  152 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  153 |     timeout: SCREEN_SYNC,
  154 |   })
  155 | })
  156 | 
  157 | test('forgot â†’ reset via the documented deep link revokes everything; only the new password works', async ({
  158 |   page,
  159 | }) => {
  160 |   // Request the reset from the UI (this also proves the anti-enumeration
  161 |   // sent-state renders from a real 204).
  162 |   await page.goto('/reset-password')
  163 |   await page.getByLabel('Work email').fill(emailA)
  164 |   await page.getByRole('button', { name: 'Send reset link' }).click()
  165 |   // One POST round-trip — live-red-2026-08-23.
  166 |   await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({
  167 |     timeout: ONE_CALL,
  168 |   })
  169 | 
  170 |   // The email's deep link: /reset-password?email=â€¦&code=â€¦
  171 |   await page.goto(`/reset-password?email=${encodeURIComponent(emailA)}&code=${CODE}`)
  172 |   await expect(page.getByRole('heading', { name: 'Set a new password' })).toBeVisible()
  173 |   await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD)
  174 |   await page.getByLabel('Confirm new password').fill(NEW_PASSWORD)
  175 |   await page.getByRole('button', { name: 'Reset password' }).click()
  176 | 
  177 |   // Back to sign in; the old password is dead, the new one works.
  178 |   // One POST round-trip — live-red-2026-08-23.
  179 |   await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible({
  180 |     timeout: ONE_CALL,
  181 |   })
  182 |   await loginViaUi(page, emailA, PASSWORD)
  183 |   // One POST round-trip — live-red-2026-08-23.
  184 |   await expect(page.getByRole('alert')).toContainText('Incorrect email or password', {
  185 |     timeout: ONE_CALL,
  186 |   })
  187 |   await loginViaUi(page, emailA, NEW_PASSWORD)
  188 |   // This account already has its workspace (test 1 created it), so a good
  189 |   // login lands in the product.
> 190 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
      |                                                                            ^ Error: expect(locator).toBeVisible() failed
  191 |     timeout: SCREEN_SYNC,
  192 |   })
  193 | })
  194 | 
  195 | test('the shell appears; sign out and logout-all both really revoke', async ({ page, request }) => {
  196 |   // No harness org any more: this account got its workspace from verifying
  197 |   // (ONB-0827, D-ONB-C), which is what the product does for every account.
  198 |   await loginViaUi(page, emailA, NEW_PASSWORD)
  199 |   // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  200 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  201 |     timeout: SCREEN_SYNC,
  202 |   })
  203 | 
  204 |   // Exactly one workspace — signing up, verifying and logging in three times
  205 |   // over must not have stacked a second (the idempotency law, E2E-0820 F12).
  206 |   const token = await sessionToken(page)
  207 |   const mine = (await (
  208 |     await request.get(`${API_BASE}/me/orgs`, { headers: { authorization: `Bearer ${token}` } })
  209 |   ).json()) as { total: number }
  210 |   expect(mine.total).toBe(1)
  211 | 
  212 |   // Sign out: session revoked server-side AND locally â€” marketing front door.
  213 |   await page.getByRole('button', { name: 'Account menu' }).click()
  214 |   await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
  215 |   // The signed-out front door is the concept-v2 marketing site (M2): its h1
  216 |   // is the hero headline, which spans three lines.
  217 |   // One POST round-trip — live-red-2026-08-23.
  218 |   await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.', {
  219 |     timeout: ONE_CALL,
  220 |   })
  221 | 
  222 |   // Logout-all: sign in again, revoke everything, land back outside.
  223 |   await loginViaUi(page, emailA, NEW_PASSWORD)
  224 |   // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  225 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  226 |     timeout: SCREEN_SYNC,
  227 |   })
  228 |   await page.getByRole('button', { name: 'Account menu' }).click()
  229 |   await page.getByRole('menuitem', { name: 'Sign out everywhere' }).click()
  230 |   // The signed-out front door is the concept-v2 marketing site (M2): its h1
  231 |   // is the hero headline, which spans three lines.
  232 |   // One POST round-trip — live-red-2026-08-23.
  233 |   await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.', {
  234 |     timeout: ONE_CALL,
  235 |   })
  236 | })
  237 | 
  238 | async function inviteNewUser(request: APIRequestContext, token: string, orgId: string) {
  239 |   const invited = await request.post(`${API_BASE}/orgs/${orgId}/members/invite`, {
  240 |     headers: { authorization: `Bearer ${token}` },
  241 |     data: { email: emailC, role: 'member' },
  242 |   })
  243 |   expect(invited.status(), await invited.text()).toBe(201)
  244 |   return (await invited.json()) as { invitedNewUser: boolean }
  245 | }
  246 | 
  247 | test('a new user accepts an invite through the documented deep link and lands in the workspace', async ({
  248 |   page,
  249 |   request,
  250 | }) => {
  251 |   // Sign back in (logout-all above really did revoke this account's sessions).
  252 |   await loginViaUi(page, emailA, NEW_PASSWORD)
  253 |   // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  254 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  255 |     timeout: SCREEN_SYNC,
  256 |   })
  257 |   const token = await sessionToken(page)
  258 | 
  259 |   const orgsResponse = await request.get(`${API_BASE}/me/orgs`, {
  260 |     headers: { authorization: `Bearer ${token}` },
  261 |   })
  262 |   const orgs = (await orgsResponse.json()) as { items: { id: string }[] }
  263 |   const orgId = orgs.items[0].id
  264 | 
  265 |   const invite = await inviteNewUser(request, token, orgId)
  266 |   expect(invite.invitedNewUser).toBe(true)
  267 | 
  268 |   // The invitee's context: a fresh page, the emailed deep link, a password.
  269 |   await page.getByRole('button', { name: 'Account menu' }).click()
  270 |   await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
  271 |   await page.goto(`/accept-invite?email=${encodeURIComponent(emailC)}&code=${CODE}`)
  272 |   await expect(page.getByRole('heading', { name: 'Join your team' })).toBeVisible()
  273 |   await page.getByLabel('Your name').fill('QA Person C')
  274 |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  275 |   await page.getByLabel('Confirm password').fill(PASSWORD)
  276 |   await page.getByRole('button', { name: 'Join the workspace' }).click()
  277 | 
  278 |   // Logged in, verified, and INSIDE the org that invited them — and it is the
  279 |   // org they are WORKING in, not merely one they belong to (ORDER ONB-0827-B
  280 |   // part 1: accepting an invite switches the active org immediately). The
  281 |   // rail names it, which is the user-visible form of that claim.
  282 |   await expect(page.locator('[data-sidebar="sidebar"]').getByText('QA Roasters')).toBeVisible({
  283 |     timeout: SCREEN_SYNC,
  284 |   })
  285 |   // The accept POST and the workspace's whole sync — live-red-2026-08-23.
  286 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  287 |     timeout: SCREEN_SYNC,
  288 |   })
  289 | })
  290 | 
```