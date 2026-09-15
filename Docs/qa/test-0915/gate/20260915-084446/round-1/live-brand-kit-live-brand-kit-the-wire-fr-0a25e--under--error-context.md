# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-brand-kit.spec.ts >> the wire, from Node (NOT browser truth): presign the closed pair, PUT a tiny PDF, read the row back under Files, Delete, re-read
- Location: e2e\live-brand-kit.spec.ts:72:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('region', { name: 'Files' }).getByRole('listitem').filter({ hasText: 'Brand kit' })
Expected: visible
Timeout: 40000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 40000ms
  - waiting for getByRole('region', { name: 'Files' }).getByRole('listitem').filter({ hasText: 'Brand kit' })

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
- text: Q QA Brand Kit Org 1789461917333245
- button "Toggle Sidebar"
- banner:
  - button "Toggle Sidebar"
  - heading "Knowledge" [level=1]
  - paragraph: The approved business information Malaky uses to keep your marketing accurate
  - link "Balance could not be read":
    - /url: /billing/balance
  - button "Notifications"
  - button "Account menu": QB
- main:
  - navigation "Settings sections":
    - tablist:
      - tab "Organization"
      - tab "Brand voice"
      - tab "Tones"
      - tab "Sources & topics"
      - tab "Knowledge" [selected]
      - tab "Team"
  - tabpanel "Knowledge":
    - alert:
      - paragraph: This didn't load
      - paragraph: We couldn't load this screen. Try again in a moment.
      - button "Try again"
- region "Notifications alt+T"
```

# Test source

```ts
  31  | const RUN = runStamp()
  32  | const PASSWORD = 'Roasted2Order!'
  33  | const owner = `qa+${RUN}bk@alphapromena.com`
  34  | const ORG_NAME = `QA Brand Kit Org ${RUN}`
  35  | 
  36  | /** A minimal, valid single-page PDF — what a "tiny PDF" honestly is (191 bytes). */
  37  | const TINY_PDF = Buffer.from(
  38  |   [
  39  |     '%PDF-1.1',
  40  |     '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
  41  |     '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
  42  |     '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 72 72]>>endobj',
  43  |     'trailer<</Root 1 0 R>>',
  44  |     '%%EOF',
  45  |     '',
  46  |   ].join('\n'),
  47  | )
  48  | 
  49  | test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
  50  | test.describe.configure({ mode: 'serial' })
  51  | 
  52  | async function login(page: Page) {
  53  |   await page.goto('/login')
  54  |   await page.getByLabel('Work email').fill(owner)
  55  |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  56  |   await page.getByRole('button', { name: 'Sign in' }).click()
  57  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  58  |     timeout: 20_000,
  59  |   })
  60  | }
  61  | 
  62  | test('a fresh owner + org, made through the product', async ({ page }) => {
  63  |   test.setTimeout(150_000)
  64  |   await signUpAndEnter(page, {
  65  |     name: 'QA Brand Kit Owner',
  66  |     email: owner,
  67  |     password: PASSWORD,
  68  |     orgName: ORG_NAME,
  69  |   })
  70  | })
  71  | 
  72  | test('the wire, from Node (NOT browser truth): presign the closed pair, PUT a tiny PDF, read the row back under Files, Delete, re-read', async ({
  73  |   page,
  74  |   request,
  75  | }) => {
  76  |   test.setTimeout(150_000)
  77  |   // TEST-0915 proof D2 — DELIBERATE, reverted after the run: the FIRST run of this
  78  |   // file meets a service that fails the org sync (500 on the brand voices read),
  79  |   // so the app shows its own error page; the marker is consumed, so every
  80  |   // re-run meets the real service.
  81  |   if (existsSync('.gate/test-0915-break-once')) {
  82  |     unlinkSync('.gate/test-0915-break-once')
  83  |     await page.route(
  84  |       (url) => /\/brand\/voices(\?|$)/.test(url.href),
  85  |       (route) =>
  86  |         route.fulfill({
  87  |           status: 500,
  88  |           contentType: 'application/json',
  89  |           body: JSON.stringify({ error: { code: 'internal', message: 'TEST-0915 deliberate' } }),
  90  |         }),
  91  |     )
  92  |   }
  93  |   await login(page)
  94  |   const { orgId, token } = await readWallet(page, request)
  95  |   const auth = { authorization: `Bearer ${token}` }
  96  |   const studio = `${API_BASE}/orgs/${orgId}/alphastudio`
  97  | 
  98  |   // The presign body is EXACTLY what the app's form builds for the brand kit.
  99  |   const presign = await request.post(`${studio}/media/assets/presign`, {
  100 |     headers: auth,
  101 |     data: { mediaType: 'application/pdf', desc: 'brandkit', role: 'brandkit' },
  102 |   })
  103 |   expect(presign.status()).toBe(201)
  104 |   const ticket = (await presign.json()) as { assetId: string; uploadUrl: string; mediaType: string }
  105 |   expect(ticket.mediaType).toBe('application/pdf')
  106 | 
  107 |   // The bytes, from Node — the same PUT the browser makes, minus its CORS.
  108 |   const put = await request.put(ticket.uploadUrl, {
  109 |     headers: { 'content-type': ticket.mediaType },
  110 |     data: TINY_PDF,
  111 |   })
  112 |   expect(put.status()).toBe(200)
  113 | 
  114 |   // The list echoes the role — measured in Phase 0, asserted here.
  115 |   const listed = (await (
  116 |     await request.get(`${studio}/media/assets`, { headers: auth })
  117 |   ).json()) as {
  118 |     assets: { assetId: string; kind?: string; desc?: string; role?: string }[]
  119 |   }
  120 |   const row = listed.assets.find((asset) => asset.assetId === ticket.assetId)
  121 |   expect(row).toBeDefined()
  122 |   expect(row?.desc).toBe('brandkit')
  123 |   expect(row?.role).toBe('brandkit')
  124 |   expect(row?.kind).toBe('document')
  125 | 
  126 |   // The app reads that row back as the brand kit: its label, its type, the
  127 |   // badge from the echoed role, Open (present, not clicked) and Delete.
  128 |   await openSettingsTab(page, 'Knowledge')
  129 |   const files = page.getByRole('region', { name: 'Files' })
  130 |   const listItem = files.getByRole('listitem').filter({ hasText: 'Brand kit' })
> 131 |   await expect(listItem).toBeVisible({ timeout: SCREEN_SYNC })
      |                          ^ Error: expect(locator).toBeVisible() failed
  132 |   await expect(listItem).toContainText('PDF')
  133 |   await expect(listItem.locator('[data-slot="file-role-badge"]')).toHaveText('Brand kit')
  134 |   await expect(listItem.getByRole('button', { name: 'Open Brand kit' })).toBeVisible()
  135 | 
  136 |   // Delete removes it from the WIRE: the list is re-read, and it is empty.
  137 |   await listItem.getByRole('button', { name: 'Delete Brand kit' }).click()
  138 |   await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  139 |   await expect(page.getByText('Deleted')).toBeVisible({ timeout: SCREEN_SYNC })
  140 |   await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })
  141 |   const after = (await (await request.get(`${studio}/media/assets`, { headers: auth })).json()) as {
  142 |     assets: unknown[]
  143 |   }
  144 |   expect(after.assets).toEqual([])
  145 | })
  146 | 
  147 | test('browser truth: the Brand kit type sends a PDF from Chromium with nothing typed, it lists, and Delete removes it', async ({
  148 |   page,
  149 | }) => {
  150 |   test.setTimeout(150_000)
  151 |   await login(page)
  152 |   await openSettingsTab(page, 'Knowledge')
  153 | 
  154 |   const files = page.getByRole('region', { name: 'Files' })
  155 |   await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })
  156 | 
  157 |   // No description field for the brand kit; the picker is ready at once.
  158 |   await page.getByRole('radio', { name: 'Brand kit' }).click()
  159 |   await expect(page.getByLabel('What is it?', { exact: true })).toHaveCount(0)
  160 |   await expect(page.getByRole('button', { name: 'Choose a file' })).toBeEnabled()
  161 | 
  162 |   // Presign (our API, the closed pair) → PUT to storage FROM CHROMIUM → the
  163 |   // row comes back from GET .../media/assets, nowhere else.
  164 |   await page.locator('#kn-file').setInputFiles({
  165 |     name: 'brand-guidelines.pdf',
  166 |     mimeType: 'application/pdf',
  167 |     buffer: TINY_PDF,
  168 |   })
  169 |   await expect(page.getByText('Sent to the studio.')).toBeVisible({ timeout: SCREEN_SYNC })
  170 | 
  171 |   const row = files.getByRole('listitem').filter({ hasText: 'Brand kit' })
  172 |   await expect(row).toBeVisible({ timeout: SCREEN_SYNC })
  173 |   await expect(row).toContainText('PDF')
  174 |   await expect(row.locator('[data-slot="file-role-badge"]')).toHaveText('Brand kit')
  175 | 
  176 |   await row.getByRole('button', { name: 'Delete Brand kit' }).click()
  177 |   await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  178 |   await expect(page.getByText('Deleted')).toBeVisible({ timeout: SCREEN_SYNC })
  179 |   await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })
  180 | })
  181 | 
```