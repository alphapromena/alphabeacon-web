/**
 * ORDER MED-0831, the static half: the media door's surfaces in the demo.
 *
 * - Knowledge routing (H1): an image upload becomes a Files row — described,
 *   never ingested — and its Delete removes it; the RAG list is untouched.
 * - The reserved word: a description of "logo" (any case, padded) is refused
 *   with the message that points at Settings › Organization.
 * - The Organization logo: the demo's local preview uploads, replaces and
 *   removes — nothing leaves the browser (the suite's zero-network assert is
 *   the proof).
 *
 * What is NOT here, and why: the wire list, the read-presign Open, the
 * delete-then-upload replace and the multi-logo conflict are LIVE facts —
 * `live-media-upload.spec.ts` walks them against the deployed API; the
 * conflict needs a second client writing rows and is covered by unit tests
 * on the filter instead.
 *
 * NAVIGATION RULE: switch datasets through the shared helper, then move only
 * through in-app links.
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { activateDataset, openFromRail as open } from './datasets'
import { expect, test } from './fixtures'

const WCAG_TAGS = ['wcag2a', 'wcag2aa']

async function openKnowledge(page: Page) {
  await open(page, 'Settings')
  await page.getByRole('tab', { name: 'Knowledge' }).click()
  await expect(page.getByRole('heading', { name: 'Knowledge', level: 1 })).toBeVisible()
}

test('an image upload lands under Files, whole, and its Delete removes it', async ({ page }) => {
  await activateDataset(page, 'Active org')
  await openKnowledge(page)

  const files = page.getByRole('region', { name: 'Files' })
  await expect(files.getByText(/No files yet/)).toBeVisible()

  await page.getByRole('radio', { name: 'Image' }).click()
  await page.getByLabel('What is it?', { exact: true }).fill('Shop window at golden hour')
  await page.getByLabel('Choose documents to upload').setInputFiles({
    name: 'window.png',
    mimeType: 'image/png',
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  })

  // The media door has no lifecycle: the row lands whole — description and
  // kind, no status, no progress, no extraction verdict.
  const row = files.getByRole('listitem').filter({ hasText: 'Shop window at golden hour' })
  await expect(row).toBeVisible()
  await expect(row).toContainText('Image')
  await expect(row.getByText(/Uploading|Processing|Ready|Failed/)).toHaveCount(0)
  // No Open in the demo: nothing is stored, and a control that could never
  // work would be disabled-teasing.
  await expect(row.getByRole('button', { name: /Open/ })).toHaveCount(0)

  // The screen stays axe-clean with the section populated.
  const scan = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(scan.violations).toEqual([])

  await row.getByRole('button', { name: /^Delete/ }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  await expect(files.getByText(/No files yet/)).toBeVisible()
})

test('"logo" is a reserved description — refused in any case, with the pointer to Organization', async ({
  page,
}) => {
  await activateDataset(page, 'Active org')
  await openKnowledge(page)

  await page.getByRole('radio', { name: 'Image' }).click()
  await page.getByLabel('What is it?', { exact: true }).fill(' Logo ')
  await page.getByLabel('Choose documents to upload').setInputFiles({
    name: 'mark.png',
    mimeType: 'image/png',
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  })

  await expect(
    page.getByRole('alert').filter({ hasText: 'reserved for your organization' }),
  ).toBeVisible()
  const files = page.getByRole('region', { name: 'Files' })
  await expect(files.getByText(/No files yet/)).toBeVisible()
})

test('the demo logo previews, replaces and removes — locally', async ({ page }) => {
  await open(page, 'Settings', 'Fresh org')
  await expect(page.getByRole('heading', { name: 'Organization', level: 1 })).toBeVisible()

  await expect(page.getByRole('button', { name: 'Upload', exact: true })).toBeVisible()

  // A 1×1 PNG through the hidden input (the visible button is the affordance).
  await page.getByLabel('Choose a logo image').setInputFiles({
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    ),
  })

  // The preview is real: the button relabels and Remove appears.
  await expect(page.getByRole('button', { name: 'Replace', exact: true })).toBeVisible()
  const remove = page.getByRole('button', { name: 'Remove', exact: true })
  await expect(remove).toBeVisible()

  await remove.click()
  await expect(page.getByRole('button', { name: 'Upload', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remove', exact: true })).toHaveCount(0)
})
