# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-brand-kit.spec.ts >> a fresh owner + org, made through the product
- Location: e2e\live-brand-kit.spec.ts:61:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'TEST-0915 deliberately absent' })
Expected: visible
Timeout: 1000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 1000ms
  - waiting for getByRole('heading', { name: 'TEST-0915 deliberately absent' })

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
- text: Q QA Brand Kit Org 1789461759632468
- button "Toggle Sidebar"
- banner:
  - button "Toggle Sidebar"
  - heading "Dashboard" [level=1]
  - paragraph: Good to see you, QA — nothing is waiting on you right now
  - link "Loading balance…":
    - /url: /billing/balance
  - button "Notifications"
  - button "Account menu": QB
- main:
  - status "Loading dashboard"
  - status "Loading list"
- status "Welcome to Malaky, there":
  - paragraph: Welcome to Malaky, there
  - button "Skip"
- region "Notifications alt+T"
```

# Test source

```ts
  1   | /**
  2   |  * ORDER HSN-0902's brand kit against the DEPLOYED API, on a fresh QA org —
  3   |  * zero spend (presigns, PUTs, list reads and deletes are not billable).
  4   |  *
  5   |  * Two proofs, deliberately separate:
  6   |  *
  7   |  * 1. THE WIRE, from Node — NOT browser truth. The presign is our API's, the
  8   |  *    closed pair `{ mediaType: "application/pdf", desc: "brandkit",
  9   |  *    role: "brandkit" }` verbatim (what `knowledgeUploadMarkers` builds),
  10  |  *    and the PUT of a tiny PDF goes to storage from Playwright's request
  11  |  *    context, not from Chromium. What it proves: the door mints, storage
  12  |  *    takes the bytes, the list echoes the role, and the app's Files section
  13  |  *    reads that row back as "Brand kit" with Open and Delete — and Delete
  14  |  *    removes it from the wire. What it does NOT prove: that a browser's PUT
  15  |  *    survives the bucket's CORS. That is test 2's.
  16  |  * 2. BROWSER TRUTH: the Brand kit type on the Knowledge form, a PDF chosen
  17  |  *    with nothing typed, the PUT from Chromium itself — "Sent to the
  18  |  *    studio." — then the row and its Delete. Phase 0 measured the bucket's
  19  |  *    preflight open (`allow-origin: *`, `PUT`) for both the dev server and
  20  |  *    production, so this is expected green; if it goes red on the PUT, the
  21  |  *    status line names the wall, and that is the report.
  22  |  */
  23  | import type { Page } from '@playwright/test'
  24  | import { expect, test } from './fixtures'
  25  | import { SCREEN_SYNC } from './live-clocks'
  26  | import { openSettingsTab, readWallet, signUpAndEnter } from './live-setup'
  27  | import { runStamp } from './live-setup'
  28  | 
  29  | const API_BASE = process.env.VITE_API_BASE_URL
  30  | const RUN = runStamp()
  31  | const PASSWORD = 'Roasted2Order!'
  32  | const owner = `qa+${RUN}bk@alphapromena.com`
  33  | const ORG_NAME = `QA Brand Kit Org ${RUN}`
  34  | 
  35  | /** A minimal, valid single-page PDF — what a "tiny PDF" honestly is (191 bytes). */
  36  | const TINY_PDF = Buffer.from(
  37  |   [
  38  |     '%PDF-1.1',
  39  |     '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
  40  |     '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
  41  |     '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 72 72]>>endobj',
  42  |     'trailer<</Root 1 0 R>>',
  43  |     '%%EOF',
  44  |     '',
  45  |   ].join('\n'),
  46  | )
  47  | 
  48  | test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
  49  | test.describe.configure({ mode: 'serial' })
  50  | 
  51  | async function login(page: Page) {
  52  |   await page.goto('/login')
  53  |   await page.getByLabel('Work email').fill(owner)
  54  |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  55  |   await page.getByRole('button', { name: 'Sign in' }).click()
  56  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  57  |     timeout: 20_000,
  58  |   })
  59  | }
  60  | 
  61  | test('a fresh owner + org, made through the product', async ({ page }) => {
  62  |   test.setTimeout(150_000)
  63  |   await signUpAndEnter(page, {
  64  |     name: 'QA Brand Kit Owner',
  65  |     email: owner,
  66  |     password: PASSWORD,
  67  |     orgName: ORG_NAME,
  68  |   })
  69  |   // TEST-0915 proof D1 — DELIBERATE, reverted after the run.
> 70  |   await expect(page.getByRole('heading', { name: 'TEST-0915 deliberately absent' })).toBeVisible({ timeout: 1_000 })
      |                                                                                      ^ Error: expect(locator).toBeVisible() failed
  71  | })
  72  | 
  73  | test('the wire, from Node (NOT browser truth): presign the closed pair, PUT a tiny PDF, read the row back under Files, Delete, re-read', async ({
  74  |   page,
  75  |   request,
  76  | }) => {
  77  |   test.setTimeout(150_000)
  78  |   await login(page)
  79  |   const { orgId, token } = await readWallet(page, request)
  80  |   const auth = { authorization: `Bearer ${token}` }
  81  |   const studio = `${API_BASE}/orgs/${orgId}/alphastudio`
  82  | 
  83  |   // The presign body is EXACTLY what the app's form builds for the brand kit.
  84  |   const presign = await request.post(`${studio}/media/assets/presign`, {
  85  |     headers: auth,
  86  |     data: { mediaType: 'application/pdf', desc: 'brandkit', role: 'brandkit' },
  87  |   })
  88  |   expect(presign.status()).toBe(201)
  89  |   const ticket = (await presign.json()) as { assetId: string; uploadUrl: string; mediaType: string }
  90  |   expect(ticket.mediaType).toBe('application/pdf')
  91  | 
  92  |   // The bytes, from Node — the same PUT the browser makes, minus its CORS.
  93  |   const put = await request.put(ticket.uploadUrl, {
  94  |     headers: { 'content-type': ticket.mediaType },
  95  |     data: TINY_PDF,
  96  |   })
  97  |   expect(put.status()).toBe(200)
  98  | 
  99  |   // The list echoes the role — measured in Phase 0, asserted here.
  100 |   const listed = (await (
  101 |     await request.get(`${studio}/media/assets`, { headers: auth })
  102 |   ).json()) as {
  103 |     assets: { assetId: string; kind?: string; desc?: string; role?: string }[]
  104 |   }
  105 |   const row = listed.assets.find((asset) => asset.assetId === ticket.assetId)
  106 |   expect(row).toBeDefined()
  107 |   expect(row?.desc).toBe('brandkit')
  108 |   expect(row?.role).toBe('brandkit')
  109 |   expect(row?.kind).toBe('document')
  110 | 
  111 |   // The app reads that row back as the brand kit: its label, its type, the
  112 |   // badge from the echoed role, Open (present, not clicked) and Delete.
  113 |   await openSettingsTab(page, 'Knowledge')
  114 |   const files = page.getByRole('region', { name: 'Files' })
  115 |   const listItem = files.getByRole('listitem').filter({ hasText: 'Brand kit' })
  116 |   await expect(listItem).toBeVisible({ timeout: SCREEN_SYNC })
  117 |   await expect(listItem).toContainText('PDF')
  118 |   await expect(listItem.locator('[data-slot="file-role-badge"]')).toHaveText('Brand kit')
  119 |   await expect(listItem.getByRole('button', { name: 'Open Brand kit' })).toBeVisible()
  120 | 
  121 |   // Delete removes it from the WIRE: the list is re-read, and it is empty.
  122 |   await listItem.getByRole('button', { name: 'Delete Brand kit' }).click()
  123 |   await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  124 |   await expect(page.getByText('Deleted')).toBeVisible({ timeout: SCREEN_SYNC })
  125 |   await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })
  126 |   const after = (await (await request.get(`${studio}/media/assets`, { headers: auth })).json()) as {
  127 |     assets: unknown[]
  128 |   }
  129 |   expect(after.assets).toEqual([])
  130 | })
  131 | 
  132 | test('browser truth: the Brand kit type sends a PDF from Chromium with nothing typed, it lists, and Delete removes it', async ({
  133 |   page,
  134 | }) => {
  135 |   test.setTimeout(150_000)
  136 |   await login(page)
  137 |   await openSettingsTab(page, 'Knowledge')
  138 | 
  139 |   const files = page.getByRole('region', { name: 'Files' })
  140 |   await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })
  141 | 
  142 |   // No description field for the brand kit; the picker is ready at once.
  143 |   await page.getByRole('radio', { name: 'Brand kit' }).click()
  144 |   await expect(page.getByLabel('What is it?', { exact: true })).toHaveCount(0)
  145 |   await expect(page.getByRole('button', { name: 'Choose a file' })).toBeEnabled()
  146 | 
  147 |   // Presign (our API, the closed pair) → PUT to storage FROM CHROMIUM → the
  148 |   // row comes back from GET .../media/assets, nowhere else.
  149 |   await page.locator('#kn-file').setInputFiles({
  150 |     name: 'brand-guidelines.pdf',
  151 |     mimeType: 'application/pdf',
  152 |     buffer: TINY_PDF,
  153 |   })
  154 |   await expect(page.getByText('Sent to the studio.')).toBeVisible({ timeout: SCREEN_SYNC })
  155 | 
  156 |   const row = files.getByRole('listitem').filter({ hasText: 'Brand kit' })
  157 |   await expect(row).toBeVisible({ timeout: SCREEN_SYNC })
  158 |   await expect(row).toContainText('PDF')
  159 |   await expect(row.locator('[data-slot="file-role-badge"]')).toHaveText('Brand kit')
  160 | 
  161 |   await row.getByRole('button', { name: 'Delete Brand kit' }).click()
  162 |   await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  163 |   await expect(page.getByText('Deleted')).toBeVisible({ timeout: SCREEN_SYNC })
  164 |   await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })
  165 | })
  166 | 
```