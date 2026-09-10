# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-country.spec.ts >> a fresh workspace has NO country, and I1 is where one is set
- Location: e2e\live-country.spec.ts:55:1

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 180000ms exceeded.
Call log:
  - waiting for locator('#i1-country')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e6]:
      - img "Malaky" [ref=e9]
      - generic [ref=e11]:
        - generic [ref=e12]: Workspace
        - list [ref=e14]:
          - listitem [ref=e15]:
            - link "Dashboard" [ref=e16] [cursor=pointer]:
              - /url: /
          - listitem [ref=e23]:
            - link "Today" [ref=e24] [cursor=pointer]:
              - /url: /today
          - listitem [ref=e29]:
            - link "Generate" [ref=e30] [cursor=pointer]:
              - /url: /generate
          - listitem [ref=e34]:
            - link "Calendar" [ref=e35] [cursor=pointer]:
              - /url: /calendar
          - listitem [ref=e39]:
            - link "Studio" [ref=e40] [cursor=pointer]:
              - /url: /studio
          - listitem [ref=e45]:
            - link "Analytics" [ref=e46] [cursor=pointer]:
              - /url: /analytics
          - listitem [ref=e51]:
            - link "Connections" [ref=e52] [cursor=pointer]:
              - /url: /connections
          - listitem [ref=e56]:
            - link "Billing" [ref=e57] [cursor=pointer]:
              - /url: /billing
          - listitem [ref=e61]:
            - link "Settings" [ref=e62] [cursor=pointer]:
              - /url: /settings
      - generic [ref=e68]:
        - generic [ref=e69]: Q
        - generic [ref=e71]: QA Country Org 1789044698374497
      - button "Toggle Sidebar" [ref=e72]
    - generic [ref=e73]:
      - banner [ref=e74]:
        - button "Toggle Sidebar" [ref=e75]
        - heading "Settings" [level=1] [ref=e78]
        - generic [ref=e79]:
          - link "Balance could not be read" [ref=e80] [cursor=pointer]:
            - /url: /billing/balance
          - button "Notifications" [ref=e82]
          - button "Switch to dark theme" [ref=e83]
          - button "Account menu" [ref=e84]:
            - generic [ref=e85]: QC
      - main [ref=e87]:
        - generic [ref=e88]:
          - navigation "Settings sections" [ref=e89]:
            - tablist [ref=e90]:
              - tab "Organization" [selected] [ref=e91] [cursor=pointer]
              - tab "Brand voice" [ref=e92] [cursor=pointer]
              - tab "Tones" [ref=e93] [cursor=pointer]
              - tab "Sources & topics" [ref=e94] [cursor=pointer]
              - tab "Knowledge" [ref=e95] [cursor=pointer]
              - tab "Team" [ref=e96] [cursor=pointer]
          - tabpanel "Organization" [ref=e97]:
            - alert [ref=e98]:
              - generic [ref=e102]:
                - paragraph [ref=e103]: Something went wrong
                - paragraph [ref=e104]: We couldn't load this screen. Try again in a moment.
              - button "Try again" [ref=e105]
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | /**
  2   |  * INT-8's verify: the org country as the ONE holiday control, against the
  3   |  * DEPLOYED API through the real UI (decisions.md D-INT-F, confirmed by the
  4   |  * backend 2026-08-17).
  5   |  *
  6   |  * What is worth proving here, and why:
  7   |  * - the country set on I1 survives to the org and loads a real calendar, which
  8   |  *   is the whole point of moving it off the event-source surface. **It is set
  9   |  *   on I1 now, not in a wizard** (ORDER ONB-0827, D-ONB-C): a fresh workspace
  10  |  *   has NO country, and the Phase-0 probe proved that does not block
  11  |  *   generation — the country buys holidays, not permission;
  12  |  * - the second save of the SAME country is a cheap no-op and SAYS so
  13  |  *   (`reloaded: false`) rather than claiming a reload that never happened;
  14  |  * - the calendar renders those holidays in date order and each one can show
  15  |  *   the do/don't rules generation will obey on that day;
  16  |  * - C2 offers no "add a source" affordance any more, because the wire cannot
  17  |  *   honour one.
  18  |  */
  19  | import type { Page } from '@playwright/test'
  20  | import { expect, test } from './fixtures'
  21  | import { AFTER_COUNTRY, SCREEN_SYNC } from './live-clocks'
  22  | import { signUpAndEnter } from './live-setup'
  23  | import { runStamp } from './live-setup'
  24  | 
  25  | const API_BASE = process.env.VITE_API_BASE_URL
  26  | const RUN = runStamp()
  27  | const PASSWORD = 'Roasted2Order!'
  28  | const owner = `qa+${RUN}c@alphapromena.com`
  29  | const ORG_NAME = `QA Country Org ${RUN}`
  30  | 
  31  | test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
  32  | test.describe.configure({ mode: 'serial' })
  33  | 
  34  | async function sessionToken(page: Page): Promise<string> {
  35  |   const raw = await page.evaluate(
  36  |     () =>
  37  |       window.sessionStorage.getItem('ab-live-session') ??
  38  |       window.localStorage.getItem('ab-live-session'),
  39  |   )
  40  |   return (JSON.parse(raw!) as { token: string }).token
  41  | }
  42  | 
  43  | async function login(page: Page) {
  44  |   await page.goto('/login')
  45  |   await page.getByLabel('Work email').fill(owner)
  46  |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  47  |   await page.getByRole('button', { name: 'Sign in' }).click()
  48  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  49  |     timeout: 20_000,
  50  |   })
  51  | }
  52  | 
  53  | // Signup + verify + the org create, then I1's ~10 s country lookup: more than
  54  | // the suite's 30 s default.
  55  | test('a fresh workspace has NO country, and I1 is where one is set', async ({ page, request }) => {
  56  |   test.setTimeout(180_000)
  57  |   await signUpAndEnter(page, {
  58  |     name: 'QA Country Owner',
  59  |     email: owner,
  60  |     password: PASSWORD,
  61  |     orgName: ORG_NAME,
  62  |   })
  63  | 
  64  |   // Nothing set it on the way in — the wizard that used to is deleted, and
  65  |   // the ruling is that a missing country is a checklist item, not a blocker.
  66  |   const token = await sessionToken(page)
  67  |   const auth = { authorization: `Bearer ${token}` }
  68  |   const orgsResponse = await request.get(`${API_BASE}/me/orgs`, { headers: auth })
  69  |   // Assert the read before indexing it: a failed read used to surface as
  70  |   // "cannot read properties of undefined", which says nothing about why.
  71  |   expect(orgsResponse.status(), await orgsResponse.text()).toBe(200)
  72  |   const orgs = (await orgsResponse.json()) as { items: { id: string }[] }
  73  |   const before = (await (
  74  |     await request.get(`${API_BASE}/orgs/${orgs.items[0].id}`, { headers: auth })
  75  |   ).json()) as { org: { country: string | null } }
  76  |   expect(before.org.country).toBeNull()
  77  | 
  78  |   // I1 owns the control, and saving it loads the calendar for real.
  79  |   await page.getByRole('link', { name: 'Settings' }).first().click()
  80  |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
> 81  |   await page.locator('#i1-country').selectOption('JO')
      |                                     ^ Error: locator.selectOption: Test timeout of 180000ms exceeded.
  82  |   await page.getByRole('button', { name: 'Save country' }).click()
  83  |   await expect(page.getByText(/public holidays loaded for the year/)).toBeVisible({
  84  |     timeout: AFTER_COUNTRY,
  85  |   })
  86  | })
  87  | 
  88  | /**
  89  |  * NAVIGATE TO THE MONTH THAT HOLDS ONE, rather than assuming today's grid does.
  90  |  *
  91  |  * This test used to open the Calendar and expect an occasion immediately. That
  92  |  * only ever worked when a holiday happened to fall inside the current month's
  93  |  * grid, which is a fact about the calendar date rather than about the product
  94  |  * — the latent kind of test that passes for months and then does not. Measured
  95  |  * on 2026-08-28 against a fresh JO org: `PUT /orgs/:id/country` answered
  96  |  * `holidaysCount: 1, reloaded: true` and `GET .../holidays` returned exactly
  97  |  * one row, **2026-12-25**, four months out of view. The country was set
  98  |  * correctly and the calendar was right to show nothing in August.
  99  |  *
  100 |  * So the test asks the wire which month to look in, then drives the product's
  101 |  * own month control to get there. The assertions about what an occasion
  102 |  * renders are unchanged.
  103 |  */
  104 | test('the calendar carries real holidays, each with the rules for that day', async ({
  105 |   page,
  106 |   request,
  107 | }) => {
  108 |   await login(page)
  109 | 
  110 |   const token = await sessionToken(page)
  111 |   const auth = { authorization: `Bearer ${token}` }
  112 |   const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
  113 |     items: { id: string }[]
  114 |   }
  115 |   const holidays = (await (
  116 |     await request.get(`${API_BASE}/orgs/${orgs.items[0].id}/holidays`, { headers: auth })
  117 |   ).json()) as { items: { date: string; event: string }[] }
  118 |   // The country really did load a calendar — that is this file's first claim,
  119 |   // and it is asserted on the wire before anything is looked for on screen.
  120 |   expect(holidays.items.length).toBeGreaterThan(0)
  121 |   const target = holidays.items[0]
  122 |   const targetTitle = new Intl.DateTimeFormat('en-US', {
  123 |     month: 'long',
  124 |     year: 'numeric',
  125 |     timeZone: 'UTC',
  126 |   }).format(new Date(`${target.date}T00:00:00Z`))
  127 | 
  128 |   await page.getByRole('link', { name: 'Calendar', exact: true }).first().click()
  129 |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  130 | 
  131 |   // Walk forward to the month that holds it. `exact` because getByRole name
  132 |   // matching is SUBSTRING (state.md trap 16). Capped at twelve presses: the
  133 |   // lookup covers the year, so a holiday further out than that is a fact worth
  134 |   // failing on rather than scrolling past.
  135 |   for (let step = 0; step < 12; step += 1) {
  136 |     if (await page.getByRole('heading', { name: targetTitle }).count()) break
  137 |     await page.getByRole('button', { name: 'Next', exact: true }).click()
  138 |   }
  139 |   await expect(page.getByRole('heading', { name: targetTitle })).toBeVisible()
  140 | 
  141 |   // The occasion is a real button because it has guidance behind it.
  142 |   const occasion = page.getByRole('button', { name: /Christmas|Mawlid|Eid|Independence|New Year/ })
  143 |   await expect(occasion.first()).toBeVisible({ timeout: 20_000 })
  144 |   await occasion.first().click()
  145 | 
  146 |   const sheet = page.getByRole('dialog')
  147 |   await expect(sheet.getByText('How Malaky will treat this day')).toBeVisible()
  148 |   // At least one do or don't, rendered under its own heading.
  149 |   await expect(sheet.getByRole('heading', { name: 'How Malaky will treat this day' })).toBeVisible()
  150 |   await expect(sheet).toContainText(/\S{10,}/)
  151 | })
  152 | 
  153 | test('re-saving the same country is a quiet no-op, not a fake reload', async ({ page }) => {
  154 |   // One real lookup in here, and a lookup is about ten seconds.
  155 |   test.setTimeout(120_000)
  156 |   await login(page)
  157 |   await page.getByRole('link', { name: 'Settings' }).first().click()
  158 |   // The Settings landing has TWO busy regions since ONB-0827-B: the screen's
  159 |   // own sync and the setup checklist's, which does not claim anything about
  160 |   // this workspace until the live answer lands (trap 20). Both settle inside
  161 |   // one screen-sync; the suite's 5 s default was never enough for one of them.
  162 |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  163 | 
  164 |   // I1 carries the control; the first test in this file set JO through it.
  165 |   const picker = page.locator('#i1-country')
  166 |   await expect(picker).toBeVisible()
  167 |   await expect(picker).toHaveValue('JO')
  168 |   // Nothing to change, so the button refuses to spend ten seconds on a no-op.
  169 |   await expect(page.getByRole('button', { name: 'Save country' })).toBeDisabled()
  170 | 
  171 |   // Choose a different country, then choose JO again: the second save is the
  172 |   // one the contract calls cheap, and the copy must not claim a reload.
  173 |   await picker.selectOption('AE')
  174 |   await page.getByRole('button', { name: 'Save country' }).click()
  175 |   await expect(page.getByText(/public holidays loaded for the year/)).toBeVisible({
  176 |     timeout: 60_000,
  177 |   })
  178 | 
  179 |   await picker.selectOption('AE')
  180 |   await expect(page.getByRole('button', { name: 'Save country' })).toBeDisabled()
  181 | })
```