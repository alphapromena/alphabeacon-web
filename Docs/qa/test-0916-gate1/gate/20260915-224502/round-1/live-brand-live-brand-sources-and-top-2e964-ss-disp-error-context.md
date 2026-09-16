# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-brand.spec.ts >> sources and topics: scheme-less display, real persistence
- Location: e2e\live-brand.spec.ts:184:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('single origin')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('single origin')

```

```yaml
- img "Malaky"
- text: Workspace
- list:
  - listitem:
    - link "Dashboard":
      - /url: /
  - listitem:
    - link "Today":
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
- text: Q QA Brand Org 1789513084886783
- button "Toggle Sidebar"
- banner:
  - button "Toggle Sidebar"
  - heading "Sources & topics" [level=1]
  - paragraph: Sources are what Malaky watches. Topics are what Malaky cares about.
  - link "No balance yet — subscribe":
    - /url: /billing
  - button "Notifications"
  - button "Account menu": QB
- main:
  - navigation "Settings sections":
    - tablist:
      - tab "Organization"
      - tab "Brand voice"
      - tab "Tones"
      - tab "Sources & topics" [selected]
      - tab "Knowledge"
      - tab "Team"
  - tabpanel "Sources & topics":
    - heading "Sources" [level=2]
    - paragraph: RSS feeds, news pages, and blogs. Connected social accounts are publish targets, not sources — nothing is read back from them.
    - text: Add a source 1 / 10
    - textbox "Add a source":
      - /placeholder: example.com/blog
    - button "Add source"
    - list:
      - listitem:
        - text: Perfectdailygrind perfectdailygrind.com/feed Sep 16
        - button "Remove Perfectdailygrind"
    - heading "Topics" [level=2]
    - paragraph: Subjects worth writing about, whether or not a source mentions them this week.
    - text: Add a topic 0 / 30
    - paragraph: Be specific. 'Data governance regulation in Saudi Arabia' works better than 'Technology'.
    - textbox "Add a topic":
      - /placeholder: A specific subject, not a category
    - button "Add"
    - paragraph: No topics yet — add a few so drafts stay on subjects you care about.
- region "Notifications alt+T"
```

# Test source

```ts
  108 |   await expect(page.getByText(MESSAGE_REACHES_GENERATION)).toBeVisible()
  109 | 
  110 |   await addVoiceRule(page, 'Do', 'Name the farm when it matters')
  111 |   await page.getByRole('button', { name: 'Save changes' }).click()
  112 |   await expect(page.getByText('Brand voice saved')).toBeVisible({ timeout: ONE_CALL })
  113 | 
  114 |   await page.goto('/settings/brand-voice')
  115 |   await expect(page.getByRole('textbox', { name: 'Do rule 1', exact: true })).toHaveValue(
  116 |     'Name the farm when it matters',
  117 |   )
  118 | })
  119 | 
  120 | test('a refused save keeps the draft, the alert and Save on screen (item 73)', async ({ page }) => {
  121 |   await login(page, owner, PASSWORD)
  122 |   await openSettingsTab(page, 'Brand voice')
  123 |   await expect(page.getByRole('textbox', { name: 'Do rule 1', exact: true })).toHaveValue(
  124 |     'Name the farm when it matters',
  125 |     { timeout: SCREEN_SYNC },
  126 |   )
  127 | 
  128 |   // The wire refuses the save: its own 400 envelope, fulfilled at the browser
  129 |   // for the canonical row's PATCH only — the preflight and every other request
  130 |   // still reach the API. The app cannot tell this refusal from a real one.
  131 |   const REQUEST_ID = 'fix-0915-refused-save'
  132 |   const FIELD_MESSAGE = 'Too big: expected array to have <=50 items'
  133 |   const isVoiceRow = (url: URL) => /\/brand\/voices\/[^/]+$/.test(url.pathname)
  134 |   await page.route(isVoiceRow, async (route) => {
  135 |     const request = route.request()
  136 |     if (request.method() !== 'PATCH') return route.fallback()
  137 |     await route.fulfill({
  138 |       status: 400,
  139 |       headers: {
  140 |         'content-type': 'application/json',
  141 |         'access-control-allow-origin': request.headers()['origin'] ?? '*',
  142 |         'access-control-expose-headers': 'x-request-id',
  143 |         'x-request-id': REQUEST_ID,
  144 |       },
  145 |       body: JSON.stringify({
  146 |         error: {
  147 |           code: 'validation_failed',
  148 |           message: 'Validation failed',
  149 |           details: [{ field: 'rules', message: FIELD_MESSAGE }],
  150 |           requestId: REQUEST_ID,
  151 |         },
  152 |       }),
  153 |     })
  154 |   })
  155 | 
  156 |   const typed = 'Say the roast date, never "fresh"'
  157 |   await addVoiceRule(page, 'Do', typed)
  158 |   await page.getByRole('button', { name: 'Save changes' }).click()
  159 | 
  160 |   // Honest, as before: never "saved", the wire's field message in the toast…
  161 |   await expect(page.getByText(FIELD_MESSAGE).first()).toBeVisible({ timeout: ONE_CALL })
  162 |   await expect(page.getByText('Brand voice saved')).toHaveCount(0)
  163 |   // …and now the rest STAYS: the alert with the request id, the draft and the
  164 |   // Save button — three seconds on too, which is when proof C watched them go
  165 |   // (the failure path resynced, the layout swapped in its skeleton, the screen
  166 |   // remounted pristine).
  167 |   const alert = page.getByRole('alert').filter({ hasText: `request ${REQUEST_ID}` })
  168 |   await expect(alert).toContainText(FIELD_MESSAGE)
  169 |   await page.waitForTimeout(3000)
  170 |   await expect(alert).toBeVisible()
  171 |   await expect(page.getByRole('textbox', { name: 'Do rule 2', exact: true })).toHaveValue(typed)
  172 |   await expect(page.getByRole('button', { name: 'Save changes' })).toBeEnabled()
  173 | 
  174 |   // The wire relents; the same draft saves for real and persists.
  175 |   await page.unroute(isVoiceRow)
  176 |   await page.getByRole('button', { name: 'Save changes' }).click()
  177 |   await expect(page.getByText('Brand voice saved')).toBeVisible({ timeout: ONE_CALL })
  178 |   await page.goto('/settings/brand-voice')
  179 |   await expect(page.getByRole('textbox', { name: 'Do rule 2', exact: true })).toHaveValue(typed, {
  180 |     timeout: SCREEN_SYNC,
  181 |   })
  182 | })
  183 | 
  184 | test('sources and topics: scheme-less display, real persistence', async ({ page }) => {
  185 |   await login(page, owner, PASSWORD)
  186 |   await openSettingsTab(page, 'Sources & topics')
  187 | 
  188 |   await page.getByLabel('Add a source').fill('perfectdailygrind.com/feed')
  189 |   await page.getByRole('button', { name: 'Add source' }).click()
  190 |   // One POST round-trip — live-red-2026-08-23.
  191 |   await expect(page.getByText('Source added')).toBeVisible({ timeout: ONE_CALL })
  192 |   await expect(page.getByText('perfectdailygrind.com/feed')).toBeVisible()
  193 | 
  194 |   await page.getByLabel('Add a topic').fill('single origin')
  195 |   await page.keyboard.press('Enter')
  196 |   // The tag chip is optimistic; give its POST the round trip before the
  197 |   // reload aborts in-flight requests.
  198 |   await expect(page.getByText('single origin')).toBeVisible()
  199 |   await page.waitForTimeout(1500)
  200 | 
  201 |   // Reload: both live on the server; the source renders scheme-less by law.
  202 |   // A reload plus the whole brand sync — the rung this file already uses for
  203 |   // its other post-reload reads.
  204 |   await page.goto('/settings/sources')
  205 |   await expect(page.getByText('perfectdailygrind.com/feed')).toBeVisible({
  206 |     timeout: SCREEN_SYNC,
  207 |   })
> 208 |   await expect(page.getByText('single origin')).toBeVisible()
      |                                                 ^ Error: expect(locator).toBeVisible() failed
  209 | 
  210 |   await page.getByRole('button', { name: /Remove Perfectdailygrind/ }).click()
  211 |   await page.goto('/settings/sources')
  212 |   await expect(page.getByText('perfectdailygrind.com/feed')).toHaveCount(0)
  213 | })
  214 | 
  215 | test('deleting a tone reflects in the schedules that referenced it', async ({ page, request }) => {
  216 |   await login(page, owner, PASSWORD)
  217 |   // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  218 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  219 |     timeout: SCREEN_SYNC,
  220 |   })
  221 |   const token = await sessionToken(page)
  222 |   const auth = { authorization: `Bearer ${token}` }
  223 | 
  224 |   const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
  225 |     items: { id: string }[]
  226 |   }
  227 |   const orgId = orgs.items[0].id
  228 |   const tones = (await (
  229 |     await request.get(`${API_BASE}/orgs/${orgId}/brand/tones`, { headers: auth })
  230 |   ).json()) as { items: { id: string; name: string }[] }
  231 |   const tone = tones.items.find((entry) => entry.name === 'Roastery floor')!
  232 | 
  233 |   // A schedule referencing the tone (the schedule UI goes live in INT-4).
  234 |   const schedule = (await (
  235 |     await request.post(`${API_BASE}/orgs/${orgId}/schedules`, {
  236 |       headers: auth,
  237 |       data: {
  238 |         timezone: 'Asia/Amman',
  239 |         days: ['mon', 'wed'],
  240 |         generateAt: '07:00',
  241 |         toneIds: [tone.id],
  242 |       },
  243 |     })
  244 |   ).json()) as { id: string; toneIds: string[] }
  245 |   expect(schedule.toneIds).toEqual([tone.id])
  246 | 
  247 |   // Delete the tone through the UI…
  248 |   await openSettingsTab(page, 'Tones')
  249 |   await page
  250 |     .locator('[data-slot="card"]')
  251 |     .filter({ hasText: 'Roastery floor' })
  252 |     .getByRole('button', { name: /Delete/ })
  253 |     .click()
  254 |   await page.getByRole('button', { name: 'Delete tone' }).click()
  255 |   await expect(page.getByText('Tone deleted')).toBeVisible()
  256 | 
  257 |   // …and the schedule no longer references it: the documented cascade.
  258 |   const after = (await (
  259 |     await request.get(`${API_BASE}/orgs/${orgId}/schedules/${schedule.id}`, { headers: auth })
  260 |   ).json()) as { toneIds: string[] }
  261 |   expect(after.toneIds).toEqual([])
  262 | })
  263 | 
```