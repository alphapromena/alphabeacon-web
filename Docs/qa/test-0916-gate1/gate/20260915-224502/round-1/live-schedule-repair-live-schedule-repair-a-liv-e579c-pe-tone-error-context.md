# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-schedule-repair.spec.ts >> a live org in the 619 shape: tones seeded, no schedule
- Location: e2e\live-schedule-repair.spec.ts:45:1

# Error details

```
Error: apiRequestContext.post: connect ETIMEDOUT 51.24.30.245:443
Call log:
  - → POST https://<api-host>/auth/signup
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 96

```

# Test source

```ts
  1   | /**
  2   |  * E2E-0820 B9: the ORG-619 SHAPE — a live org with tones but no schedule, and
  3   |  * whether the editor alone can repair it.
  4   |  *
  5   |  * Org 619 came out of the wizard with tones seeded, the schedule missing and
  6   |  * the country unset, because Finish swallowed everything after `POST /orgs`
  7   |  * (B7 fixed the swallowing). That leaves a question B7 cannot answer: can a
  8   |  * user in that state fix it themselves, from C1, without anyone touching the
  9   |  * database? Two things have to be true for the answer to be yes, and neither
  10  |  * was covered anywhere:
  11  |  *
  12  |  * 1. `saveSchedule` falls back to `POST` when the org has no schedule to
  13  |  *    `PATCH` — the create path, which every other live spec skips because the
  14  |  *    wizard has always made a schedule first.
  15  |  * 2. The tones the user picks survive the round trip EXACTLY. That is the B9
  16  |  *    bug's own ground: the draft is seeded from the pre-sync demo world, so a
  17  |  *    screen that saved what it was holding rather than what the user chose
  18  |  *    would post ids this org has never had.
  19  |  *
  20  |  * The org is built by DIRECT API calls, not the wizard — the wizard always
  21  |  * creates a schedule, so it cannot produce the state under test.
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
> 48  |   await request.post(`${API_BASE}/auth/signup`, {
      |                 ^ Error: apiRequestContext.post: connect ETIMEDOUT 51.24.30.245:443
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
  114 |   // The production world starts with NO model selected (GATE-0910, item 62):
  115 |   // the form refuses to save without one — "Pick which model drafts your
  116 |   // copy." — so this walk picks Balanced, as a new org on production must.
  117 |   // The dev server's demo world had one pre-picked, which hid this for weeks.
  118 |   await page.getByRole('radio', { name: /^Balanced/ }).check()
  119 | 
  120 |   // Pick a deliberate, checkable subset — not all of them, so a screen that
  121 |   // saved "whatever it was holding" would be caught.
  122 |   await tones.getByRole('button', { name: 'Provocative', exact: true }).click()
  123 |   await tones.getByRole('button', { name: 'Educational', exact: true }).click()
  124 | 
  125 |   await expect(page.getByText('You have unsaved changes.')).toBeVisible()
  126 |   await page.getByRole('button', { name: 'Save changes' }).click()
  127 |   await expect(page.getByText('Schedule saved')).toBeVisible({ timeout: 20_000 })
  128 |   // A good save leaves nothing for the leave-guard to refuse (B9).
  129 |   await expect(page.getByText('You have unsaved changes.')).toHaveCount(0)
  130 | 
  131 |   // The wire agrees: one schedule where there were none, and the tone ids are
  132 |   // the ones that were clicked — no demo ghosts, nothing dropped.
  133 |   const auth = { authorization: `Bearer ${await sessionToken(page)}` }
  134 |   const after = (await json(
  135 |     await request.get(`${API_BASE}/orgs/${orgId}/schedules`, { headers: auth }),
  136 |   )) as unknown as { total: number; items: { toneIds: string[] }[] }
  137 |   expect(after.total).toBe(1)
  138 |   expect([...after.items[0].toneIds].sort()).toEqual(
  139 |     [toneIdByName['Provocative'], toneIdByName['Educational']].sort(),
  140 |   )
  141 | })
  142 | 
  143 | test('and it survives a reload, still clean', async ({ page }) => {
  144 |   test.setTimeout(120_000)
  145 |   await signIn(page)
  146 | 
  147 |   await page.goto('/calendar/settings')
  148 |   await expect(page.getByRole('heading', { name: 'Schedule', level: 1 })).toBeVisible({
```