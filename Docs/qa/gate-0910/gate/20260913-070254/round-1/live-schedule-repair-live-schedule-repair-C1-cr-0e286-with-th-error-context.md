# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-schedule-repair.spec.ts >> C1 creates the missing schedule through the POST fallback, with the exact tones picked
- Location: e2e\live-schedule-repair.spec.ts:85:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Schedule saved')
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByText('Schedule saved')

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
- text: Q QA Repair Org 1789283573406211
- button "Toggle Sidebar"
- banner:
  - button "Toggle Sidebar"
  - heading "Schedule" [level=1]
  - paragraph: When drafts are generated, how many, and in which voices
  - link "No balance yet — subscribe":
    - /url: /billing
  - button "Notifications"
  - button "Switch to dark theme"
  - button "Account menu": QR
- main:
  - heading "When" [level=2]
  - text: Timezone
  - paragraph: Slot times are wall-clock in this zone, so daylight saving never moves your posts.
  - combobox "Timezone":
    - option "Asia/Amman (GMT+3)" [selected]
    - option "Asia/Dubai (GMT+4)"
    - option "Asia/Riyadh (GMT+3)"
    - option "Asia/Beirut (GMT+3)"
    - option "Africa/Cairo (GMT+3)"
    - option "Europe/London (GMT+1)"
    - option "Europe/Paris (GMT+2)"
    - option "Europe/Berlin (GMT+2)"
    - option "Europe/Istanbul (GMT+3)"
    - option "America/New York (GMT-4)"
    - option "America/Chicago (GMT-5)"
    - option "America/Los Angeles (GMT-7)"
    - option "Asia/Karachi (GMT+5)"
    - option "Asia/Kolkata (GMT+5:30)"
    - option "Asia/Singapore (GMT+8)"
    - option "Australia/Sydney (GMT+10)"
    - option "UTC (GMT+0)"
  - group "Active days":
    - text: Active days
    - paragraph: Drafts are generated on the days you pick.
    - toolbar:
      - button "Monday" [pressed]: M
      - button "Tuesday": T
      - button "Wednesday" [pressed]: W
      - button "Thursday": T
      - button "Friday": F
      - button "Saturday": S
      - button "Sunday": S
  - text: Generate at
  - paragraph: Drafts are ready by this time, so they are waiting when you start.
  - textbox "Generate at": 09:00
  - heading "How much, and how" [level=2]
  - text: Posts per day
  - paragraph: At most 3 a day, so the queue stays reviewable.
  - button "One fewer post per day" [disabled]: −
  - status "Posts per day": "1"
  - button "One more post per day": +
  - group "Generation model":
    - text: Generation model
    - paragraph: Which model drafts your copy.
    - radio "Balanced Reliable everyday drafts — the sensible default."
    - text: Balanced Reliable everyday drafts — the sensible default.
    - radio "Creative Pro plan Bolder angles and fresher hooks; a touch slower." [disabled]
    - text: Creative Pro plan Bolder angles and fresher hooks; a touch slower.
    - radio "Precise Pro plan Tightest grounding to your sources; best for regulated topics." [disabled]
    - text: Precise Pro plan Tightest grounding to your sources; best for regulated topics.
  - alert: Pick which model drafts your copy.
  - heading "Tones" [level=2]
  - link "Manage tones →":
    - /url: /settings/tones
  - group "Tones":
    - text: Tones
    - paragraph: Drafts rotate through the tones you pick.
    - button "Educational" [pressed]
    - button "Data-driven"
    - button "Provocative" [pressed]
    - button "Create custom tone"
  - heading "Events" [level=2]
  - text: Attach posts to events
  - paragraph: Slots near a holiday or launch borrow its name and date.
  - switch "Attach posts to events"
  - paragraph: Up to 2 drafts a week, in 2 tones, drafted by —.
  - paragraph: You have unsaved changes.
  - button "Cancel"
  - button "Save changes"
- region "Notifications alt+T"
```

# Test source

```ts
  22  |  */
  23  | import type { Page } from '@playwright/test'
  24  | import { expect, test } from './fixtures'
  25  | import { runStamp } from './live-setup'
  26  | 
  27  | const API_BASE = process.env.VITE_API_BASE_URL
  28  | const RUN = runStamp()
  29  | const PASSWORD = 'Roasted2Order!'
  30  | const CODE = '000000'
  31  | const owner = `qa+${RUN}r@alphapromena.com`
  32  | const ORG_NAME = `QA Repair Org ${RUN}`
  33  | 
  34  | test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
  35  | test.describe.configure({ mode: 'serial' })
  36  | 
  37  | let orgId = ''
  38  | /** name -> the id the API minted, so the assertion can name real tones. */
  39  | const toneIdByName: Record<string, string> = {}
  40  | 
  41  | async function json(response: { json: () => Promise<unknown> }) {
  42  |   return (await response.json()) as Record<string, never>
  43  | }
  44  | 
  45  | test('a live org in the 619 shape: tones seeded, no schedule', async ({ request }) => {
  46  |   test.setTimeout(120_000)
  47  | 
  48  |   await request.post(`${API_BASE}/auth/signup`, {
  49  |     data: { name: 'QA Repair', email: owner, password: PASSWORD },
  50  |   })
  51  |   const verified = (await json(
  52  |     await request.post(`${API_BASE}/auth/verify-email`, {
  53  |       data: { email: owner, code: CODE },
  54  |     }),
  55  |   )) as unknown as { token: string }
  56  |   const auth = { authorization: `Bearer ${verified.token}` }
  57  | 
  58  |   const created = (await json(
  59  |     await request.post(`${API_BASE}/orgs`, { data: { name: ORG_NAME }, headers: auth }),
  60  |   )) as unknown as { org: { id: string } }
  61  |   orgId = created.org.id
  62  | 
  63  |   // Tones yes — exactly the half of Finish that landed for 619.
  64  |   for (const tone of [
  65  |     { name: 'Provocative', description: 'Takes a position and defends it.' },
  66  |     { name: 'Data-driven', description: 'Leads with the number.' },
  67  |     { name: 'Educational', description: 'Explains the why before the what.' },
  68  |   ]) {
  69  |     const row = (await json(
  70  |       await request.post(`${API_BASE}/orgs/${orgId}/brand/tones`, {
  71  |         data: { ...tone, preset: true, rules: [] },
  72  |         headers: auth,
  73  |       }),
  74  |     )) as unknown as { id: string; name: string }
  75  |     toneIdByName[row.name] = row.id
  76  |   }
  77  | 
  78  |   // Schedule no — the state under test.
  79  |   const schedules = (await json(
  80  |     await request.get(`${API_BASE}/orgs/${orgId}/schedules`, { headers: auth }),
  81  |   )) as unknown as { total: number }
  82  |   expect(schedules.total).toBe(0)
  83  | })
  84  | 
  85  | test('C1 creates the missing schedule through the POST fallback, with the exact tones picked', async ({
  86  |   page,
  87  |   request,
  88  | }) => {
  89  |   test.setTimeout(120_000)
  90  |   await signIn(page)
  91  | 
  92  |   await page.goto('/calendar/settings')
  93  |   await expect(page.getByRole('heading', { name: 'Schedule', level: 1 })).toBeVisible({
  94  |     timeout: 20_000,
  95  |   })
  96  |   // The tone picker is the readiness signal that matters here: it renders from
  97  |   // the SYNCED world, so a tone this org actually owns being visible proves
  98  |   // the draft is no longer sitting on the pre-sync demo schedule (trap 2 says
  99  |   // the shell's h1 cannot prove that, and trap 14 says a count cannot either).
  100 |   const tones = page.getByRole('group', { name: 'Tones' })
  101 |   await expect(tones.getByRole('button', { name: 'Provocative', exact: true })).toBeVisible({
  102 |     timeout: 20_000,
  103 |   })
  104 | 
  105 |   // An org with no schedule arrives BLANK — no days, no tones — rather than
  106 |   // wearing the demo's cadence (B9). That is the state being repaired, so the
  107 |   // form asks for both.
  108 |   await expect(tones.getByRole('button', { name: 'Provocative', exact: true })).toHaveAttribute(
  109 |     'aria-pressed',
  110 |     'false',
  111 |   )
  112 |   await page.getByRole('button', { name: 'Monday' }).click()
  113 |   await page.getByRole('button', { name: 'Wednesday' }).click()
  114 | 
  115 |   // Pick a deliberate, checkable subset — not all of them, so a screen that
  116 |   // saved "whatever it was holding" would be caught.
  117 |   await tones.getByRole('button', { name: 'Provocative', exact: true }).click()
  118 |   await tones.getByRole('button', { name: 'Educational', exact: true }).click()
  119 | 
  120 |   await expect(page.getByText('You have unsaved changes.')).toBeVisible()
  121 |   await page.getByRole('button', { name: 'Save changes' }).click()
> 122 |   await expect(page.getByText('Schedule saved')).toBeVisible({ timeout: 20_000 })
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  123 |   // A good save leaves nothing for the leave-guard to refuse (B9).
  124 |   await expect(page.getByText('You have unsaved changes.')).toHaveCount(0)
  125 | 
  126 |   // The wire agrees: one schedule where there were none, and the tone ids are
  127 |   // the ones that were clicked — no demo ghosts, nothing dropped.
  128 |   const auth = { authorization: `Bearer ${await sessionToken(page)}` }
  129 |   const after = (await json(
  130 |     await request.get(`${API_BASE}/orgs/${orgId}/schedules`, { headers: auth }),
  131 |   )) as unknown as { total: number; items: { toneIds: string[] }[] }
  132 |   expect(after.total).toBe(1)
  133 |   expect([...after.items[0].toneIds].sort()).toEqual(
  134 |     [toneIdByName['Provocative'], toneIdByName['Educational']].sort(),
  135 |   )
  136 | })
  137 | 
  138 | test('and it survives a reload, still clean', async ({ page }) => {
  139 |   test.setTimeout(120_000)
  140 |   await signIn(page)
  141 | 
  142 |   await page.goto('/calendar/settings')
  143 |   await expect(page.getByRole('heading', { name: 'Schedule', level: 1 })).toBeVisible({
  144 |     timeout: 20_000,
  145 |   })
  146 |   const tones = page.getByRole('group', { name: 'Tones' })
  147 |   await expect(tones.getByRole('button', { name: 'Provocative', exact: true })).toBeVisible({
  148 |     timeout: 20_000,
  149 |   })
  150 | 
  151 |   // The two picked tones read back as selected, the third does not, and the
  152 |   // form is not dirty — the three ways the B9 bug showed itself.
  153 |   await expect(tones.getByRole('button', { name: 'Provocative', exact: true })).toHaveAttribute(
  154 |     'aria-pressed',
  155 |     'true',
  156 |   )
  157 |   await expect(tones.getByRole('button', { name: 'Educational', exact: true })).toHaveAttribute(
  158 |     'aria-pressed',
  159 |     'true',
  160 |   )
  161 |   await expect(tones.getByRole('button', { name: 'Data-driven', exact: true })).toHaveAttribute(
  162 |     'aria-pressed',
  163 |     'false',
  164 |   )
  165 |   await expect(page.getByText('You have unsaved changes.')).toHaveCount(0)
  166 | })
  167 | 
  168 | async function signIn(page: Page) {
  169 |   await page.goto('/login')
  170 |   await page.getByLabel('Work email').fill(owner)
  171 |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  172 |   await page.getByRole('button', { name: 'Sign in' }).click()
  173 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  174 |     timeout: 25_000,
  175 |   })
  176 | }
  177 | 
  178 | async function sessionToken(page: Page): Promise<string> {
  179 |   const raw = await page.evaluate(
  180 |     () =>
  181 |       window.sessionStorage.getItem('ab-live-session') ??
  182 |       window.localStorage.getItem('ab-live-session'),
  183 |   )
  184 |   return (JSON.parse(raw!) as { token: string }).token
  185 | }
  186 | 
```