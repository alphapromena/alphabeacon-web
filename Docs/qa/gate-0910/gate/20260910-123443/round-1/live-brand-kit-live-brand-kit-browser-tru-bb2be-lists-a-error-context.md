# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-brand-kit.spec.ts >> browser truth: the Brand kit type sends a PDF from Chromium with nothing typed, it lists, and Delete removes it
- Location: e2e\live-brand-kit.spec.ts:130:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('region', { name: 'Files' }).getByText(/No files yet/)
Expected: visible
Timeout: 40000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 40000ms
  - waiting for getByRole('region', { name: 'Files' }).getByText(/No files yet/)

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
- text: Q QA Brand Kit Org 1789043715143704
- button "Toggle Sidebar"
- banner:
  - button "Toggle Sidebar"
  - heading "Knowledge" [level=1]
  - paragraph: Documents drafts can quote — price lists, FAQs, product notes
  - link "Balance could not be read":
    - /url: /billing/balance
  - button "Notifications"
  - button "Switch to dark theme"
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
      - paragraph: Something went wrong
      - paragraph: We couldn't load this screen. Try again in a moment.
      - button "Try again"
- region "Notifications alt+T"
```

# Test source

```ts
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
  69  | })
  70  | 
  71  | test('the wire, from Node (NOT browser truth): presign the closed pair, PUT a tiny PDF, read the row back under Files, Delete, re-read', async ({
  72  |   page,
  73  |   request,
  74  | }) => {
  75  |   test.setTimeout(150_000)
  76  |   await login(page)
  77  |   const { orgId, token } = await readWallet(page, request)
  78  |   const auth = { authorization: `Bearer ${token}` }
  79  |   const studio = `${API_BASE}/orgs/${orgId}/alphastudio`
  80  | 
  81  |   // The presign body is EXACTLY what the app's form builds for the brand kit.
  82  |   const presign = await request.post(`${studio}/media/assets/presign`, {
  83  |     headers: auth,
  84  |     data: { mediaType: 'application/pdf', desc: 'brandkit', role: 'brandkit' },
  85  |   })
  86  |   expect(presign.status()).toBe(201)
  87  |   const ticket = (await presign.json()) as { assetId: string; uploadUrl: string; mediaType: string }
  88  |   expect(ticket.mediaType).toBe('application/pdf')
  89  | 
  90  |   // The bytes, from Node — the same PUT the browser makes, minus its CORS.
  91  |   const put = await request.put(ticket.uploadUrl, {
  92  |     headers: { 'content-type': ticket.mediaType },
  93  |     data: TINY_PDF,
  94  |   })
  95  |   expect(put.status()).toBe(200)
  96  | 
  97  |   // The list echoes the role — measured in Phase 0, asserted here.
  98  |   const listed = (await (
  99  |     await request.get(`${studio}/media/assets`, { headers: auth })
  100 |   ).json()) as {
  101 |     assets: { assetId: string; kind?: string; desc?: string; role?: string }[]
  102 |   }
  103 |   const row = listed.assets.find((asset) => asset.assetId === ticket.assetId)
  104 |   expect(row).toBeDefined()
  105 |   expect(row?.desc).toBe('brandkit')
  106 |   expect(row?.role).toBe('brandkit')
  107 |   expect(row?.kind).toBe('document')
  108 | 
  109 |   // The app reads that row back as the brand kit: its label, its type, the
  110 |   // badge from the echoed role, Open (present, not clicked) and Delete.
  111 |   await openSettingsTab(page, 'Knowledge')
  112 |   const files = page.getByRole('region', { name: 'Files' })
  113 |   const listItem = files.getByRole('listitem').filter({ hasText: 'Brand kit' })
  114 |   await expect(listItem).toBeVisible({ timeout: SCREEN_SYNC })
  115 |   await expect(listItem).toContainText('PDF')
  116 |   await expect(listItem.getByText('brand kit', { exact: true })).toBeVisible()
  117 |   await expect(listItem.getByRole('button', { name: 'Open Brand kit' })).toBeVisible()
  118 | 
  119 |   // Delete removes it from the WIRE: the list is re-read, and it is empty.
  120 |   await listItem.getByRole('button', { name: 'Delete Brand kit' }).click()
  121 |   await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  122 |   await expect(page.getByText('Deleted')).toBeVisible({ timeout: SCREEN_SYNC })
  123 |   await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })
  124 |   const after = (await (await request.get(`${studio}/media/assets`, { headers: auth })).json()) as {
  125 |     assets: unknown[]
  126 |   }
  127 |   expect(after.assets).toEqual([])
  128 | })
  129 | 
  130 | test('browser truth: the Brand kit type sends a PDF from Chromium with nothing typed, it lists, and Delete removes it', async ({
  131 |   page,
  132 | }) => {
  133 |   test.setTimeout(150_000)
  134 |   await login(page)
  135 |   await openSettingsTab(page, 'Knowledge')
  136 | 
  137 |   const files = page.getByRole('region', { name: 'Files' })
> 138 |   await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })
      |                                                 ^ Error: expect(locator).toBeVisible() failed
  139 | 
  140 |   // No description field for the brand kit; the picker is ready at once.
  141 |   await page.getByRole('radio', { name: 'Brand kit' }).click()
  142 |   await expect(page.getByLabel('What is it?', { exact: true })).toHaveCount(0)
  143 |   await expect(page.getByRole('button', { name: 'Choose a file' })).toBeEnabled()
  144 | 
  145 |   // Presign (our API, the closed pair) → PUT to storage FROM CHROMIUM → the
  146 |   // row comes back from GET .../media/assets, nowhere else.
  147 |   await page.locator('#kn-file').setInputFiles({
  148 |     name: 'brand-guidelines.pdf',
  149 |     mimeType: 'application/pdf',
  150 |     buffer: TINY_PDF,
  151 |   })
  152 |   await expect(page.getByText('Sent to the studio.')).toBeVisible({ timeout: SCREEN_SYNC })
  153 | 
  154 |   const row = files.getByRole('listitem').filter({ hasText: 'Brand kit' })
  155 |   await expect(row).toBeVisible({ timeout: SCREEN_SYNC })
  156 |   await expect(row).toContainText('PDF')
  157 |   await expect(row.getByText('brand kit', { exact: true })).toBeVisible()
  158 | 
  159 |   await row.getByRole('button', { name: 'Delete Brand kit' }).click()
  160 |   await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  161 |   await expect(page.getByText('Deleted')).toBeVisible({ timeout: SCREEN_SYNC })
  162 |   await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })
  163 | })
  164 | 
```