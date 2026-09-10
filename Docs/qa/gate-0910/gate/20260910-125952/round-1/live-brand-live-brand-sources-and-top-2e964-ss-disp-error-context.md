# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-brand.spec.ts >> sources and topics: scheme-less display, real persistence
- Location: e2e\live-brand.spec.ts:119:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('perfectdailygrind.com/feed')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('perfectdailygrind.com/feed')

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
- text: Q QA Brand Org 1789045254544154
- button "Toggle Sidebar"
- banner:
  - button "Toggle Sidebar"
  - heading "Sources & topics" [level=1]
  - paragraph: What drafts read, and what they talk about
  - link "No balance yet — subscribe":
    - /url: /billing
  - button "Notifications"
  - button "Switch to dark theme"
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
    - alert:
      - paragraph: Something went wrong
      - paragraph: We couldn't load this screen. Try again in a moment.
      - button "Try again"
- region "Notifications alt+T"
```

# Test source

```ts
  27  |  * — and the signup -> wizard -> Finish walk alone measures 27-29 s door to door
  28  |  * against today's API (Docs/api/live-red-2026-08-23.md). It could not pass at
  29  |  * any wait value. Aligned with the 150 s `live-country` set when Finish became
  30  |  * idempotent (E2E-0820 B7); no wait value and no assertion here changed.
  31  |  */
  32  | test.beforeEach(() => {
  33  |   test.setTimeout(150_000)
  34  | })
  35  | 
  36  | async function login(page: Page, email: string, password: string) {
  37  |   await page.goto('/login')
  38  |   await page.getByLabel('Work email').fill(email)
  39  |   await page.getByLabel('Password', { exact: true }).fill(password)
  40  |   await page.getByRole('button', { name: 'Sign in' }).click()
  41  | }
  42  | 
  43  | async function sessionToken(page: Page): Promise<string> {
  44  |   const raw = await page.evaluate(
  45  |     () =>
  46  |       window.sessionStorage.getItem('ab-live-session') ??
  47  |       window.localStorage.getItem('ab-live-session'),
  48  |   )
  49  |   return (JSON.parse(raw!) as { token: string }).token
  50  | }
  51  | 
  52  | async function openSettingsTab(page: Page, tab: string) {
  53  |   await page.getByRole('link', { name: 'Settings' }).first().click()
  54  |   await page.getByRole('tab', { name: tab }).click()
  55  | }
  56  | 
  57  | test('a fresh owner + org, made through the product', async ({ page }) => {
  58  |   await signUpAndEnter(page, {
  59  |     name: 'QA Brand Owner',
  60  |     email: owner,
  61  |     password: PASSWORD,
  62  |     orgName: ORG_NAME,
  63  |   })
  64  | })
  65  | 
  66  | test('a custom tone: created under the adapter, edited, and it survives a reload', async ({
  67  |   page,
  68  | }) => {
  69  |   await login(page, owner, PASSWORD)
  70  |   await openSettingsTab(page, 'Tones')
  71  |   // A fresh org has no tones since ONB-0827 (D-ONB-B), so the way in is the
  72  |   // empty state's CTA rather than the header button.
  73  |   await page.getByRole('link', { name: 'Create your first tone' }).click()
  74  | 
  75  |   // INT-7: rules landed on the wire, so both editors are real now; only the
  76  |   // example line is still absent, and the note says so by name.
  77  |   await expect(page.getByText(/Example lines arrive with a later backend phase/)).toBeVisible()
  78  |   await expect(page.getByLabel('Do', { exact: true })).toHaveCount(1)
  79  | 
  80  |   await page.getByLabel('Tone name').fill('Roastery floor')
  81  |   // HSN-03: a tone's language is required, with no default.
  82  |   await page.getByLabel('Language').selectOption('en')
  83  |   await page.getByLabel('What this tone sounds like').fill('Warm, specific, smells of coffee.')
  84  |   await page.getByLabel('Do', { exact: true }).fill('Name the roast date')
  85  |   await page.getByRole('button', { name: 'Create tone' }).click()
  86  |   // A save and its toast: the ONE_CALL rung, not the suite's 5 s default.
  87  |   // Brand mutations are the SLOWEST saves the app makes — every committed
  88  |   // voice/source/topic write re-pushes the org's context bundle server-side
  89  |   // (api.md, "Context sync"), documented as ~1–2 s longer than a read. These
  90  |   // sat at 5 s and passed only while the API happened to answer inside it.
  91  |   await expect(page.getByText('Tone created')).toBeVisible({ timeout: ONE_CALL })
  92  |   await expect(page.getByText('Roastery floor')).toBeVisible()
  93  | 
  94  |   // A reload re-reads the server: the tone is real.
  95  |   await page.goto('/settings/tones')
  96  |   // First wait after a reload — the whole brand sync — live-red-2026-08-23.
  97  |   await expect(page.getByText('Roastery floor')).toBeVisible({ timeout: SCREEN_SYNC })
  98  | })
  99  | 
  100 | test('voice rules: the flat live list persists through the API', async ({ page }) => {
  101 |   await login(page, owner, PASSWORD)
  102 |   await openSettingsTab(page, 'Brand voice')
  103 | 
  104 |   // Live mode now has BOTH lists; only examples are explained as absent.
  105 |   await expect(page.getByText(/Example lines arrive with a later backend phase/)).toBeVisible()
  106 |   await expect(page.getByText(MESSAGE_REACHES_GENERATION)).toBeVisible()
  107 | 
  108 |   await page.getByRole('button', { name: 'Add do', exact: true }).click()
  109 |   await page.locator('input[id^="voice-do"]').last().fill('Name the farm when it matters')
  110 |   await page.getByRole('button', { name: 'Save changes' }).click()
  111 |   await expect(page.getByText('Brand voice saved')).toBeVisible({ timeout: ONE_CALL })
  112 | 
  113 |   await page.goto('/settings/brand-voice')
  114 |   await expect(page.locator('input[id^="voice-do"]').first()).toHaveValue(
  115 |     'Name the farm when it matters',
  116 |   )
  117 | })
  118 | 
  119 | test('sources and topics: scheme-less display, real persistence', async ({ page }) => {
  120 |   await login(page, owner, PASSWORD)
  121 |   await openSettingsTab(page, 'Sources & topics')
  122 | 
  123 |   await page.getByLabel('Add a source').fill('perfectdailygrind.com/feed')
  124 |   await page.getByRole('button', { name: 'Add source' }).click()
  125 |   // One POST round-trip — live-red-2026-08-23.
  126 |   await expect(page.getByText('Source added')).toBeVisible({ timeout: ONE_CALL })
> 127 |   await expect(page.getByText('perfectdailygrind.com/feed')).toBeVisible()
      |                                                              ^ Error: expect(locator).toBeVisible() failed
  128 | 
  129 |   await page.getByLabel('Add a topic').fill('single origin')
  130 |   await page.keyboard.press('Enter')
  131 |   // The tag chip is optimistic; give its POST the round trip before the
  132 |   // reload aborts in-flight requests.
  133 |   await expect(page.getByText('single origin')).toBeVisible()
  134 |   await page.waitForTimeout(1500)
  135 | 
  136 |   // Reload: both live on the server; the source renders scheme-less by law.
  137 |   // A reload plus the whole brand sync — the rung this file already uses for
  138 |   // its other post-reload reads.
  139 |   await page.goto('/settings/sources')
  140 |   await expect(page.getByText('perfectdailygrind.com/feed')).toBeVisible({
  141 |     timeout: SCREEN_SYNC,
  142 |   })
  143 |   await expect(page.getByText('single origin')).toBeVisible()
  144 | 
  145 |   await page.getByRole('button', { name: /Remove Perfectdailygrind/ }).click()
  146 |   await page.goto('/settings/sources')
  147 |   await expect(page.getByText('perfectdailygrind.com/feed')).toHaveCount(0)
  148 | })
  149 | 
  150 | test('deleting a tone reflects in the schedules that referenced it', async ({ page, request }) => {
  151 |   await login(page, owner, PASSWORD)
  152 |   // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  153 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  154 |     timeout: SCREEN_SYNC,
  155 |   })
  156 |   const token = await sessionToken(page)
  157 |   const auth = { authorization: `Bearer ${token}` }
  158 | 
  159 |   const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
  160 |     items: { id: string }[]
  161 |   }
  162 |   const orgId = orgs.items[0].id
  163 |   const tones = (await (
  164 |     await request.get(`${API_BASE}/orgs/${orgId}/brand/tones`, { headers: auth })
  165 |   ).json()) as { items: { id: string; name: string }[] }
  166 |   const tone = tones.items.find((entry) => entry.name === 'Roastery floor')!
  167 | 
  168 |   // A schedule referencing the tone (the schedule UI goes live in INT-4).
  169 |   const schedule = (await (
  170 |     await request.post(`${API_BASE}/orgs/${orgId}/schedules`, {
  171 |       headers: auth,
  172 |       data: {
  173 |         timezone: 'Asia/Amman',
  174 |         days: ['mon', 'wed'],
  175 |         generateAt: '07:00',
  176 |         toneIds: [tone.id],
  177 |       },
  178 |     })
  179 |   ).json()) as { id: string; toneIds: string[] }
  180 |   expect(schedule.toneIds).toEqual([tone.id])
  181 | 
  182 |   // Delete the tone through the UI…
  183 |   await openSettingsTab(page, 'Tones')
  184 |   await page
  185 |     .locator('[data-slot="card"]')
  186 |     .filter({ hasText: 'Roastery floor' })
  187 |     .getByRole('button', { name: /Delete/ })
  188 |     .click()
  189 |   await page.getByRole('button', { name: 'Delete tone' }).click()
  190 |   await expect(page.getByText('Tone deleted')).toBeVisible()
  191 | 
  192 |   // …and the schedule no longer references it: the documented cascade.
  193 |   const after = (await (
  194 |     await request.get(`${API_BASE}/orgs/${orgId}/schedules/${schedule.id}`, { headers: auth })
  195 |   ).json()) as { toneIds: string[] }
  196 |   expect(after.toneIds).toEqual([])
  197 | })
  198 | 
```