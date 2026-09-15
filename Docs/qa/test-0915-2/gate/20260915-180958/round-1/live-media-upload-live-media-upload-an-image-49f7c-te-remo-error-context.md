# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-media-upload.spec.ts >> an image upload becomes a WIRE-listed Files row, and Delete removes it from the wire
- Location: e2e\live-media-upload.spec.ts:58:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Dashboard', level: 1 })
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByRole('heading', { name: 'Dashboard', level: 1 })

```

```yaml
- link "Malaky":
  - /url: /
  - img "Malaky"
- heading "Welcome back" [level=1]
- paragraph: Pick up where your queue left off.
- group:
  - text: Work email
  - textbox "Work email":
    - /placeholder: you@company.com
    - text: qa+1789496700496392med@alphapromena.com
- group:
  - text: Password
  - textbox "Password": Roasted2Order!
- group:
  - text: Keep me signed in on this device
  - checkbox "Keep me signed in on this device"
- link "Forgot password?":
  - /url: /reset-password
- button "Sign in"
- text: New here?
- link "Create an account":
  - /url: /signup
- complementary:
  - blockquote:
    - paragraph: Nothing waiting on you goes unnoticed.
    - paragraph: The beacon only pulses when something genuinely needs review — so an empty queue means you are actually done.
- region "Notifications alt+T"
```

# Test source

```ts
  1   | /**
  2   |  * ORDER MED-0831's live verify: BOTH media-door surfaces, through the UI, on
  3   |  * a fresh QA org, against the DEPLOYED API — zero spend (presigns and PUTs
  4   |  * are not billable; no job, no run, no render), so NOT LIVE_MEDIA-gated.
  5   |  *
  6   |  * - Knowledge (H1/H2): Image + description + a 1×1 PNG → a Files row read
  7   |  *   back from the WIRE's asset list (no local ledger exists) → Delete → the
  8   |  *   list re-read and empty.
  9   |  * - Organization (H3): the same PNG uploaded as the logo (`desc: "logo"`) →
  10  |  *   shown as the logo, with the ruled status line — and ABSENT from
  11  |  *   Knowledge's Files (the logo row is Organization's) → Remove → cleared.
  12  |  *
  13  |  * This spec is also the media bucket's browser-CORS proof, exactly as
  14  |  * live-knowledge.spec.ts was the RAG bucket's (open-item 24): the presign is
  15  |  * our API's, the PUT goes to storage from Chromium itself.
  16  |  */
  17  | import type { Page } from '@playwright/test'
  18  | import { expect, test } from './fixtures'
  19  | import { SCREEN_SYNC } from './live-clocks'
  20  | import { openSettingsTab, signUpAndEnter } from './live-setup'
  21  | import { runStamp } from './live-setup'
  22  | 
  23  | const API_BASE = process.env.VITE_API_BASE_URL
  24  | const RUN = runStamp()
  25  | const PASSWORD = 'Roasted2Order!'
  26  | const owner = `qa+${RUN}med@alphapromena.com`
  27  | const ORG_NAME = `QA Media Org ${RUN}`
  28  | 
  29  | /** A real 1×1 transparent PNG (70 bytes) — the byte-for-byte Phase 0 shape. */
  30  | const PNG_1X1 = Buffer.from(
  31  |   'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  32  |   'base64',
  33  | )
  34  | 
  35  | test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
  36  | test.describe.configure({ mode: 'serial' })
  37  | 
  38  | async function login(page: Page) {
  39  |   await page.goto('/login')
  40  |   await page.getByLabel('Work email').fill(owner)
  41  |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  42  |   await page.getByRole('button', { name: 'Sign in' }).click()
> 43  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
      |                                                                            ^ Error: expect(locator).toBeVisible() failed
  44  |     timeout: 20_000,
  45  |   })
  46  | }
  47  | 
  48  | test('a fresh owner + org, made through the product', async ({ page }) => {
  49  |   test.setTimeout(150_000)
  50  |   await signUpAndEnter(page, {
  51  |     name: 'QA Media Owner',
  52  |     email: owner,
  53  |     password: PASSWORD,
  54  |     orgName: ORG_NAME,
  55  |   })
  56  | })
  57  | 
  58  | test('an image upload becomes a WIRE-listed Files row, and Delete removes it from the wire', async ({
  59  |   page,
  60  | }) => {
  61  |   test.setTimeout(150_000)
  62  |   await login(page)
  63  |   await openSettingsTab(page, 'Knowledge')
  64  | 
  65  |   const files = page.getByRole('region', { name: 'Files' })
  66  |   await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })
  67  | 
  68  |   await page.getByRole('radio', { name: 'Image' }).click()
  69  |   await page.getByLabel('What is it?', { exact: true }).fill('Shop window at golden hour')
  70  |   await expect(page.getByRole('button', { name: 'Choose a file' })).toBeEnabled()
  71  | 
  72  |   // Presign (our API, with `desc`) → PUT to storage FROM CHROMIUM → the row
  73  |   // comes back from GET .../media/assets, nowhere else.
  74  |   await page.locator('#kn-file').setInputFiles({
  75  |     name: 'window.png',
  76  |     mimeType: 'image/png',
  77  |     buffer: PNG_1X1,
  78  |   })
  79  |   await expect(page.getByText('Uploaded — the studio has it now')).toBeVisible({
  80  |     timeout: SCREEN_SYNC,
  81  |   })
  82  | 
  83  |   const row = files.getByRole('listitem').filter({ hasText: 'Shop window at golden hour' })
  84  |   await expect(row).toBeVisible({ timeout: SCREEN_SYNC })
  85  |   await expect(row).toContainText('Image')
  86  |   // The live row offers Open (a fresh ~1 h presign on click) — present, not
  87  |   // clicked: a popup proves nothing a status code has not already.
  88  |   await expect(row.getByRole('button', { name: /^Open/ })).toBeVisible()
  89  | 
  90  |   await row.getByRole('button', { name: /^Delete/ }).click()
  91  |   await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  92  |   await expect(page.getByText('Deleted')).toBeVisible({ timeout: SCREEN_SYNC })
  93  |   // The wire list was re-read; what remains is what it now says: nothing.
  94  |   await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })
  95  | })
  96  | 
  97  | test('the logo uploads with desc "logo", shows as the logo, stays out of Files, and removes', async ({
  98  |   page,
  99  | }) => {
  100 |   test.setTimeout(150_000)
  101 |   await login(page)
  102 |   await openSettingsTab(page, 'Organization')
  103 | 
  104 |   // The lazy list has answered when the button knows what it would replace.
  105 |   await expect(page.getByRole('button', { name: 'Upload', exact: true })).toBeEnabled({
  106 |     timeout: SCREEN_SYNC,
  107 |   })
  108 | 
  109 |   await page.getByLabel('Choose a logo image').setInputFiles({
  110 |     name: 'logo.png',
  111 |     mimeType: 'image/png',
  112 |     buffer: PNG_1X1,
  113 |   })
  114 | 
  115 |   // The ruled status line, then the wire's own logo: the re-read finds the
  116 |   // desc "logo" row, read-presigns it, and the avatar shows the stored file.
  117 |   await expect(page.getByText('Sent to the studio.')).toBeVisible({ timeout: SCREEN_SYNC })
  118 |   await expect(page.getByRole('button', { name: 'Replace', exact: true })).toBeVisible({
  119 |     timeout: SCREEN_SYNC,
  120 |   })
  121 |   await expect(page.locator('[data-slot="avatar-image"]').first()).toBeVisible({
  122 |     timeout: SCREEN_SYNC,
  123 |   })
  124 | 
  125 |   // The logo is Organization's, never a Knowledge file: Files stays empty.
  126 |   await openSettingsTab(page, 'Knowledge')
  127 |   const files = page.getByRole('region', { name: 'Files' })
  128 |   await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })
  129 | 
  130 |   // Remove = DELETE + clear, and the wire agrees on the next read.
  131 |   await openSettingsTab(page, 'Organization')
  132 |   await expect(page.getByRole('button', { name: 'Remove', exact: true })).toBeVisible({
  133 |     timeout: SCREEN_SYNC,
  134 |   })
  135 |   await page.getByRole('button', { name: 'Remove', exact: true }).click()
  136 |   await expect(page.getByText('Removed.')).toBeVisible({ timeout: SCREEN_SYNC })
  137 |   await expect(page.getByRole('button', { name: 'Upload', exact: true })).toBeVisible({
  138 |     timeout: SCREEN_SYNC,
  139 |   })
  140 | })
  141 | 
```