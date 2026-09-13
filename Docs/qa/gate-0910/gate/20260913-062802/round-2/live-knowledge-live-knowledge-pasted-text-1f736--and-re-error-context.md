# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-knowledge.spec.ts >> pasted text becomes a Ready source, and removing it removes it
- Location: e2e\live-knowledge.spec.ts:46:1

# Error details

```
Test timeout of 150000ms exceeded.
```

```
Error: locator.fill: Test timeout of 150000ms exceeded.
Call log:
  - waiting for getByLabel('Or paste some text')

```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - generic [ref=f1e3]:
    - generic [ref=f1e6]:
      - img "Malaky" [ref=f1e9]
      - generic [ref=f1e11]:
        - generic [ref=f1e12]: Workspace
        - list [ref=f1e14]:
          - listitem [ref=f1e15]:
            - link "Dashboard" [ref=f1e16] [cursor=pointer]:
              - /url: /
          - listitem [ref=f1e23]:
            - link "Today" [ref=f1e24] [cursor=pointer]:
              - /url: /today
          - listitem [ref=f1e29]:
            - link "Generate" [ref=f1e30] [cursor=pointer]:
              - /url: /generate
          - listitem [ref=f1e34]:
            - link "Calendar" [ref=f1e35] [cursor=pointer]:
              - /url: /calendar
          - listitem [ref=f1e39]:
            - link "Studio" [ref=f1e40] [cursor=pointer]:
              - /url: /studio
          - listitem [ref=f1e45]:
            - link "Analytics" [ref=f1e46] [cursor=pointer]:
              - /url: /analytics
          - listitem [ref=f1e51]:
            - link "Connections" [ref=f1e52] [cursor=pointer]:
              - /url: /connections
          - listitem [ref=f1e56]:
            - link "Billing" [ref=f1e57] [cursor=pointer]:
              - /url: /billing
          - listitem [ref=f1e61]:
            - link "Settings" [ref=f1e62] [cursor=pointer]:
              - /url: /settings
      - generic [ref=f1e68]:
        - generic [ref=f1e69]: Q
        - generic [ref=f1e71]: QA Knowledge Org 1789282167842817
      - button "Toggle Sidebar" [ref=f1e72]
    - generic [ref=f1e73]:
      - banner [ref=f1e74]:
        - button "Toggle Sidebar" [ref=f1e75]
        - generic [ref=f1e77]:
          - heading "Knowledge" [level=1] [ref=f1e78]
          - paragraph [ref=f1e79]: Documents drafts can quote — price lists, FAQs, product notes
        - generic [ref=f1e80]:
          - link "Balance could not be read" [ref=f1e81] [cursor=pointer]:
            - /url: /billing/balance
          - button "Notifications" [ref=f1e83]
          - button "Switch to dark theme" [ref=f1e84]
          - button "Account menu" [ref=f1e85]:
            - generic [ref=f1e86]: QK
      - main [ref=f1e88]:
        - generic [ref=f1e89]:
          - navigation "Settings sections" [ref=f1e90]:
            - tablist [ref=f1e91]:
              - tab "Organization" [ref=f1e92] [cursor=pointer]
              - tab "Brand voice" [ref=f1e93] [cursor=pointer]
              - tab "Tones" [ref=f1e94] [cursor=pointer]
              - tab "Sources & topics" [ref=f1e95] [cursor=pointer]
              - tab "Knowledge" [selected] [ref=f1e96] [cursor=pointer]
              - tab "Team" [ref=f1e97] [cursor=pointer]
          - tabpanel "Knowledge" [ref=f1e98]:
            - alert [ref=f1e99]:
              - generic [ref=f1e103]:
                - paragraph [ref=f1e104]: Something went wrong
                - paragraph [ref=f1e105]: We couldn't load this screen. Try again in a moment.
              - button "Try again" [ref=f1e106]
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | /**
  2   |  * INT-11's knowledge verify (I6), against the DEPLOYED API in a real browser.
  3   |  *
  4   |  * This spec IS the answer to open-item 24 (S3 CORS for a browser PUT). The
  5   |  * presigned upload was proven from Node during the smoke run, but a browser
  6   |  * additionally needs the bucket's own CORS to allow PUT from the app origin,
  7   |  * and nothing outside a browser can test that. Chromium here is the browser.
  8   |  * If this fails on CORS, the surface is hidden and the exact error is logged
  9   |  * against that item — the founder's amendment 7.
  10  |  */
  11  | import type { Page } from '@playwright/test'
  12  | import { expect, test } from './fixtures'
  13  | import { SCREEN_SYNC } from './live-clocks'
  14  | import { signUpAndEnter } from './live-setup'
  15  | import { runStamp } from './live-setup'
  16  | 
  17  | const API_BASE = process.env.VITE_API_BASE_URL
  18  | const RUN = runStamp()
  19  | const PASSWORD = 'Roasted2Order!'
  20  | const owner = `qa+${RUN}k@alphapromena.com`
  21  | const ORG_NAME = `QA Knowledge Org ${RUN}`
  22  | 
  23  | test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
  24  | test.describe.configure({ mode: 'serial' })
  25  | 
  26  | async function login(page: Page) {
  27  |   await page.goto('/login')
  28  |   await page.getByLabel('Work email').fill(owner)
  29  |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  30  |   await page.getByRole('button', { name: 'Sign in' }).click()
  31  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  32  |     timeout: 20_000,
  33  |   })
  34  | }
  35  | 
  36  | test('a fresh owner + org, made through the product', async ({ page }) => {
  37  |   test.setTimeout(150_000)
  38  |   await signUpAndEnter(page, {
  39  |     name: 'QA Knowledge Owner',
  40  |     email: owner,
  41  |     password: PASSWORD,
  42  |     orgName: ORG_NAME,
  43  |   })
  44  | })
  45  | 
  46  | test('pasted text becomes a Ready source, and removing it removes it', async ({ page }) => {
  47  |   test.setTimeout(150_000)
  48  |   await login(page)
  49  |   await page.goto('/settings/knowledge')
  50  |   // A reload's whole screen sync, at the SCREEN_SYNC rung (a decision taken
  51  |   // on purpose — live-clocks.ts): since MED-0831 this screen fans out two
  52  |   // more lazy reads on open — the RAG collection + its sources, and the
  53  |   // media asset list — each able to land on a cold container. The suite's
  54  |   // 5 s default failed here in BOTH rounds of the HSN-0902 gate (2026-09-02).
  55  |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  56  | 
> 57  |   await page.getByLabel('Or paste some text').fill('Roasting notes')
      |                                               ^ Error: locator.fill: Test timeout of 150000ms exceeded.
  58  |   await page.getByLabel('Text to add').fill('Ethiopia Guji, washed. Roast date matters most.')
  59  |   await page.getByRole('button', { name: 'Add text' }).click()
  60  | 
  61  |   // Ingestion is asynchronous: the list settles on its own.
  62  |   await expect(page.getByText('Roasting notes')).toBeVisible({ timeout: 30_000 })
  63  |   await expect(page.getByText('Ready')).toBeVisible({ timeout: 60_000 })
  64  |   // The row REPORTS its passage count, and the noun agrees with it: a short
  65  |   // paste is exactly one passage, which used to render as "1 passages"
  66  |   // (E2E-0820 F11). The row's spans concatenate with no separator, so the
  67  |   // noun is pinned with a lookahead rather than a word boundary.
  68  |   const row = page.getByRole('listitem').filter({ hasText: 'Roasting notes' })
  69  |   await expect(row).toContainText(/1 passage(?!s)/)
  70  | 
  71  |   await page.getByRole('button', { name: 'Remove' }).first().click()
  72  |   await page.getByRole('button', { name: 'Remove', exact: true }).last().click()
  73  |   await expect(page.getByText('Roasting notes')).toHaveCount(0, { timeout: 30_000 })
  74  | })
  75  | 
  76  | test('a FILE uploads straight to storage from the browser (open-item 24)', async ({ page }) => {
  77  |   test.setTimeout(150_000)
  78  |   await login(page)
  79  |   await page.goto('/settings/knowledge')
  80  |   // A reload's whole screen sync, at the SCREEN_SYNC rung (a decision taken
  81  |   // on purpose — live-clocks.ts): since MED-0831 this screen fans out two
  82  |   // more lazy reads on open — the RAG collection + its sources, and the
  83  |   // media asset list — each able to land on a cold container. The suite's
  84  |   // 5 s default failed here in BOTH rounds of the HSN-0902 gate (2026-09-02).
  85  |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  86  | 
  87  |   // HSN-04: the form asks WHAT this is and for a description before any file
  88  |   // leaves the browser — the description rides on the presign as `desc`
  89  |   // (probe P2 at the HSN-FINAL gate: the RAG door answers 201 with it).
  90  |   await page.getByRole('radio', { name: 'Document' }).click()
  91  |   await page.getByLabel('What is it?', { exact: true }).fill('Roasting notes for the Guji lot')
  92  | 
  93  |   // The collection is created lazily, so wait until the surface is ready.
  94  |   // `setInputFiles` bypasses the disabled BUTTON, so the button's state is the
  95  |   // only readiness signal available here (it is also disabled until the type
  96  |   // and the description above are given).
  97  |   await expect(page.getByRole('button', { name: 'Choose a file' })).toBeEnabled({
  98  |     timeout: 30_000,
  99  |   })
  100 | 
  101 |   // The presign is our API's; the PUT goes to storage directly, from Chromium.
  102 |   // A CORS refusal shows up as the seam's network_error, not a 4xx.
  103 |   await page.locator('#kn-file').setInputFiles({
  104 |     name: 'roasting.txt',
  105 |     mimeType: 'text/plain',
  106 |     buffer: Buffer.from('Roast dates, not origins. Guji lot landed Tuesday.\n'),
  107 |   })
  108 | 
  109 |   // A presigned source may carry no title, so the row is identified by its
  110 |   // state rather than its name: Uploading, then Ready once the bytes land and
  111 |   // ingestion finishes on its own.
  112 |   await expect(
  113 |     page
  114 |       .getByRole('listitem')
  115 |       .filter({ hasText: /Uploading|Processing|Ready/ })
  116 |       .first(),
  117 |   ).toBeVisible({
  118 |     timeout: 30_000,
  119 |   })
  120 |   await expect(page.getByText('Ready').first()).toBeVisible({ timeout: 90_000 })
  121 | })
  122 | 
```