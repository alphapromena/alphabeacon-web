/**
 * ORDER HSN-0902's brand kit against the DEPLOYED API, on a fresh QA org —
 * zero spend (presigns, PUTs, list reads and deletes are not billable).
 *
 * Two proofs, deliberately separate:
 *
 * 1. THE WIRE, from Node — NOT browser truth. The presign is our API's, the
 *    closed pair `{ mediaType: "application/pdf", desc: "brandkit",
 *    role: "brandkit" }` verbatim (what `knowledgeUploadMarkers` builds),
 *    and the PUT of a tiny PDF goes to storage from Playwright's request
 *    context, not from Chromium. What it proves: the door mints, storage
 *    takes the bytes, the list echoes the role, and the app's Files section
 *    reads that row back as "Brand kit" with Open and Delete — and Delete
 *    removes it from the wire. What it does NOT prove: that a browser's PUT
 *    survives the bucket's CORS. That is test 2's.
 * 2. BROWSER TRUTH: the Brand kit type on the Knowledge form, a PDF chosen
 *    with nothing typed, the PUT from Chromium itself — "Sent to the
 *    studio." — then the row and its Delete. Phase 0 measured the bucket's
 *    preflight open (`allow-origin: *`, `PUT`) for both the dev server and
 *    production, so this is expected green; if it goes red on the PUT, the
 *    status line names the wall, and that is the report.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { SCREEN_SYNC } from './live-clocks'
import { openSettingsTab, readWallet, signUpAndEnter } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}bk@alphapromena.com`
const ORG_NAME = `QA Brand Kit Org ${RUN}`

/** A minimal, valid single-page PDF — what a "tiny PDF" honestly is (191 bytes). */
const TINY_PDF = Buffer.from(
  [
    '%PDF-1.1',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 72 72]>>endobj',
    'trailer<</Root 1 0 R>>',
    '%%EOF',
    '',
  ].join('\n'),
)

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Work email').fill(owner)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: 20_000,
  })
}

test('a fresh owner + org, made through the product', async ({ page }) => {
  test.setTimeout(150_000)
  await signUpAndEnter(page, {
    name: 'QA Brand Kit Owner',
    email: owner,
    password: PASSWORD,
    orgName: ORG_NAME,
  })
})

test('the wire, from Node (NOT browser truth): presign the closed pair, PUT a tiny PDF, read the row back under Files, Delete, re-read', async ({
  page,
  request,
}) => {
  test.setTimeout(150_000)
  await login(page)
  const { orgId, token } = await readWallet(page, request)
  const auth = { authorization: `Bearer ${token}` }
  const studio = `${API_BASE}/orgs/${orgId}/alphastudio`

  // The presign body is EXACTLY what the app's form builds for the brand kit.
  const presign = await request.post(`${studio}/media/assets/presign`, {
    headers: auth,
    data: { mediaType: 'application/pdf', desc: 'brandkit', role: 'brandkit' },
  })
  expect(presign.status()).toBe(201)
  const ticket = (await presign.json()) as { assetId: string; uploadUrl: string; mediaType: string }
  expect(ticket.mediaType).toBe('application/pdf')

  // The bytes, from Node — the same PUT the browser makes, minus its CORS.
  const put = await request.put(ticket.uploadUrl, {
    headers: { 'content-type': ticket.mediaType },
    data: TINY_PDF,
  })
  expect(put.status()).toBe(200)

  // The list echoes the role — measured in Phase 0, asserted here.
  const listed = (await (
    await request.get(`${studio}/media/assets`, { headers: auth })
  ).json()) as {
    assets: { assetId: string; kind?: string; desc?: string; role?: string }[]
  }
  const row = listed.assets.find((asset) => asset.assetId === ticket.assetId)
  expect(row).toBeDefined()
  expect(row?.desc).toBe('brandkit')
  expect(row?.role).toBe('brandkit')
  expect(row?.kind).toBe('document')

  // The app reads that row back as the brand kit: its label, its type, the
  // badge from the echoed role, Open (present, not clicked) and Delete.
  await openSettingsTab(page, 'Knowledge')
  const files = page.getByRole('region', { name: 'Files' })
  const listItem = files.getByRole('listitem').filter({ hasText: 'Brand kit' })
  await expect(listItem).toBeVisible({ timeout: SCREEN_SYNC })
  await expect(listItem).toContainText('PDF')
  await expect(listItem.getByText('brand kit', { exact: true })).toBeVisible()
  await expect(listItem.getByRole('button', { name: 'Open Brand kit' })).toBeVisible()

  // Delete removes it from the WIRE: the list is re-read, and it is empty.
  await listItem.getByRole('button', { name: 'Delete Brand kit' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Deleted')).toBeVisible({ timeout: SCREEN_SYNC })
  await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })
  const after = (await (await request.get(`${studio}/media/assets`, { headers: auth })).json()) as {
    assets: unknown[]
  }
  expect(after.assets).toEqual([])
})

test('browser truth: the Brand kit type sends a PDF from Chromium with nothing typed, it lists, and Delete removes it', async ({
  page,
}) => {
  test.setTimeout(150_000)
  await login(page)
  await openSettingsTab(page, 'Knowledge')

  const files = page.getByRole('region', { name: 'Files' })
  await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })

  // No description field for the brand kit; the picker is ready at once.
  await page.getByRole('radio', { name: 'Brand kit' }).click()
  await expect(page.getByLabel('What is it?', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Choose a file' })).toBeEnabled()

  // Presign (our API, the closed pair) → PUT to storage FROM CHROMIUM → the
  // row comes back from GET .../media/assets, nowhere else.
  await page.locator('#kn-file').setInputFiles({
    name: 'brand-guidelines.pdf',
    mimeType: 'application/pdf',
    buffer: TINY_PDF,
  })
  await expect(page.getByText('Sent to the studio.')).toBeVisible({ timeout: SCREEN_SYNC })

  const row = files.getByRole('listitem').filter({ hasText: 'Brand kit' })
  await expect(row).toBeVisible({ timeout: SCREEN_SYNC })
  await expect(row).toContainText('PDF')
  await expect(row.getByText('brand kit', { exact: true })).toBeVisible()

  await row.getByRole('button', { name: 'Delete Brand kit' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Deleted')).toBeVisible({ timeout: SCREEN_SYNC })
  await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })
})
