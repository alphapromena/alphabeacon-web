# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-auth-401.spec.ts >> 5 · a deep link to /billing with no session: sign in lands on /billing
- Location: e2e\live-auth-401.spec.ts:229:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/billing$/
Received string:  "http://localhost:5199/"
Timeout: 40000ms

Call log:
  - Expect "toHaveURL" with timeout 40000ms
    6 × locator resolved to <html lang="en" class="dark">…</html>
      - unexpected value "http://localhost:5199/login"
    76 × locator resolved to <html lang="en" class="dark">…</html>
       - unexpected value "http://localhost:5199/"

```

```yaml
- img "Malaky"
- text: Workspace
- list:
  - listitem:
    - link "Dashboard":
      - /url: /
  - listitem:
    - link "Today 2 drafts need review":
      - /url: /today
  - listitem:
    - link "Generate":
      - /url: /generate
  - listitem:
    - link "Calendar":
      - /url: /calendar
  - listitem:
    - link "Studio":
      - /url: /studio
  - listitem:
    - link "Analytics":
      - /url: /analytics
  - listitem:
    - link "Connections":
      - /url: /connections
  - listitem:
    - link "Billing":
      - /url: /billing
  - listitem:
    - link "Settings":
      - /url: /settings
- text: Q QA Session Org 1789508434722833
- button "Toggle Sidebar"
- banner:
  - button "Toggle Sidebar"
  - heading "Dashboard" [level=1]
  - paragraph: Good to see you, QA — 2 drafts are ready for review
  - link "No balance yet — subscribe":
    - /url: /billing
  - button "Notifications"
  - button "Account menu": QS
- main:
  - region "Brand setup":
    - heading "Finish setting up" [level=2]
    - paragraph: Finish these and this workspace can write. Each one has its own screen — do them in any order.
    - list:
      - listitem:
        - text: Brand voice The rules every draft follows, whatever tone it is written in.
        - link "Set up Brand voice":
          - /url: /settings/brand-voice
      - listitem:
        - text: At least one tone How a draft should sound. Nothing generates without one.
        - link "Set up At least one tone":
          - /url: /settings/tones
      - listitem:
        - text: Sources What drafts read before they write.
        - link "Set up Sources":
          - /url: /settings/sources
      - listitem:
        - text: Topics What this workspace talks about.
        - link "Set up Topics":
          - /url: /settings/sources
      - listitem:
        - text: Country Needed for holidays — drafts work around your calendar. (optional for generating)
        - link "Set up Country":
          - /url: /settings/organization
      - listitem:
        - text: Posting rhythm Needed for scheduled posting — which days, and how many. (optional for generating)
        - link "Set up Posting rhythm":
          - /url: /calendar/settings
  - region "Key stats":
    - link "Drafts awaiting review 2":
      - /url: /today
    - link "Scheduled this week 1":
      - /url: /calendar
    - link "Available balance $0.00 Needs attention":
      - /url: /billing
    - link "Connections needing attention 1 Needs attention":
      - /url: /connections
  - region "Go to":
    - heading "Go to" [level=2]
    - link "Today's queue Approve, edit, reject":
      - /url: /today
    - link "Generate A post, on demand":
      - /url: /generate
    - link "Calendar What is scheduled, and how it did":
      - /url: /calendar
    - link "Creative Studio Images and video":
      - /url: /studio
    - link "Analytics Reach and engagement":
      - /url: /analytics
    - link "Connections Channels and permissions":
      - /url: /connections
    - link "Billing Plan and balance":
      - /url: /billing
    - link "Settings Brand voice, tones, team":
      - /url: /settings
  - region "Notifications and activity":
    - heading "Notifications & activity" [level=2]
    - radiogroup "Filter the feed":
      - radio "All" [checked]
      - radio "Notifications"
      - radio "Activity"
    - list:
      - listitem: Image generated for the washed-process explainer. in 8 hours
      - listitem: Maya approved the futures-price post. in 8 hours
      - listitem: Kirinyaga AA launch went out to Facebook and Instagram. 16 hours ago
- region "Notifications alt+T"
```

# Test source

```ts
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
  157 |   const revoke = await request.post(`${API_BASE}/auth/logout`, {
  158 |     headers: { authorization: `Bearer ${token}` },
  159 |   })
  160 |   expect(revoke.status(), `POST /auth/logout → ${revoke.status()}`).toBe(204)
  161 |   // The next read with the dead token is the breach. The app makes one on its
  162 |   // own within a second (the sync's deferred reads — countries, media assets —
  163 |   // met it in runs 2–4 of this file); Billing's mount reads (plans, credits,
  164 |   // subscription) are the fallback if it does not. The click is dispatched,
  165 |   // not waited on for actionability: the rail may already be gone.
  166 |   const billing = page.getByRole('link', { name: 'Billing' }).first()
  167 |   if (await billing.isVisible()) {
  168 |     await billing.dispatchEvent('click', undefined, { timeout: 2_000 }).catch(() => undefined)
  169 |   }
  170 |   await expectReLogin(page)
  171 | })
  172 | 
  173 | test('3 · a boot on an authed route with a dead token lands on login, not on the website', async ({
  174 |   page,
  175 | }) => {
  176 |   test.setTimeout(150_000)
  177 |   await login(page)
  178 |   await page.getByRole('link', { name: 'Billing' }).first().click()
  179 |   await expect(page.getByRole('heading', { name: 'Billing', level: 1 })).toBeVisible({
  180 |     timeout: SCREEN_SYNC,
  181 |   })
  182 |   await tamperStoredToken(page)
  183 |   await page.reload()
  184 |   await expectReLogin(page)
  185 | })
  186 | 
  187 | /**
  188 |  * The other way a session ends (NIGHT-0916 order 2, item 83; D-NIGHT-0916-B):
  189 |  * a DELIBERATE sign-out lands on the marketing home from any route — the
  190 |  * action moves to `/` before the session clears — while the forced ones above
  191 |  * land on login. Two routes here; the unit test walks four.
  192 |  */
  193 | for (const start of [
  194 |   { rail: 'Settings', heading: 'Organization' },
  195 |   { rail: 'Billing', heading: 'Billing' },
  196 | ]) {
  197 |   test(`4 · a deliberate sign-out from ${start.rail} lands on the marketing home, not on login`, async ({
  198 |     page,
  199 |   }) => {
  200 |     test.setTimeout(150_000)
  201 |     await login(page)
  202 |     await page.getByRole('link', { name: start.rail }).first().click()
  203 |     await expect(page.getByRole('heading', { name: start.heading, level: 1 })).toBeVisible({
  204 |       timeout: SCREEN_SYNC,
  205 |     })
  206 |     await page.getByRole('button', { name: 'Account menu' }).click()
  207 |     await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
  208 |     await expect(page).toHaveURL(/\/$/, { timeout: SCREEN_SYNC })
  209 |     await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.', {
  210 |       timeout: SCREEN_SYNC,
  211 |     })
  212 |     expect(
  213 |       await page.evaluate(() =>
  214 |         Boolean(
  215 |           window.sessionStorage.getItem('ab-live-session') ||
  216 |           window.localStorage.getItem('ab-live-session'),
  217 |         ),
  218 |       ),
  219 |     ).toBe(false)
  220 |   })
  221 | }
  222 | 
  223 | /**
  224 |  * Back to where the person was (NIGHT-0916 order 3; D-NIGHT-0916-C): the
  225 |  * guard and the 401 handler remember the intended app path before they send
  226 |  * to login, and the sign-in takes it. A deep link with no session, and a
  227 |  * token that dies on an authed route.
  228 |  */
  229 | test('5 · a deep link to /billing with no session: sign in lands on /billing', async ({ page }) => {
  230 |   test.setTimeout(150_000)
  231 |   await page.goto('/billing')
  232 |   await expect(page.getByRole('heading', { name: 'Welcome back', level: 1 })).toBeVisible({
  233 |     timeout: SCREEN_SYNC,
  234 |   })
  235 |   await page.getByLabel('Work email').fill(owner)
  236 |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  237 |   await page.getByRole('button', { name: 'Sign in' }).click()
> 238 |   await expect(page).toHaveURL(/\/billing$/, { timeout: SCREEN_SYNC })
      |                      ^ Error: expect(page).toHaveURL(expected) failed
  239 |   await expect(page.getByRole('heading', { name: 'Billing', level: 1 })).toBeVisible({
  240 |     timeout: SCREEN_SYNC,
  241 |   })
  242 |   expect(await page.evaluate(() => window.sessionStorage.getItem('ab-return-to'))).toBeNull()
  243 | })
  244 | 
  245 | test('6 · a token dead on /settings/organization: sign in lands back there', async ({ page }) => {
  246 |   test.setTimeout(150_000)
  247 |   await login(page)
  248 |   await page.getByRole('link', { name: 'Settings' }).first().click()
  249 |   await expect(page.getByRole('heading', { name: 'Organization', level: 1 })).toBeVisible({
  250 |     timeout: SCREEN_SYNC,
  251 |   })
  252 |   await tamperStoredToken(page)
  253 |   await page.reload()
  254 |   await expectReLogin(page)
  255 |   await page.getByLabel('Work email').fill(owner)
  256 |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  257 |   await page.getByRole('button', { name: 'Sign in' }).click()
  258 |   await expect(page).toHaveURL(/\/settings\/organization$/, { timeout: SCREEN_SYNC })
  259 |   await expect(page.getByRole('heading', { name: 'Organization', level: 1 })).toBeVisible({
  260 |     timeout: SCREEN_SYNC,
  261 |   })
  262 | })
  263 | 
```