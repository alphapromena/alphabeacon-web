/**
 * ORDER HSN-0902, the static half: the brand kit and the video duration in
 * the demo — zero network, the fixture asserts it.
 *
 * - Brand kit (Phase 1): a Knowledge kind of its own. No description field
 *   is rendered for it, the picker takes PDF only, the upload needs nothing
 *   typed, and it lands under Files as "Brand kit" — typed PDF, badged from
 *   the echoed role the demo mirrors — with Delete. Typed as a free
 *   description on another kind, "brandkit" is refused with the pointer at
 *   the Brand kit type, exactly as "logo" is refused.
 * - Video duration (Phase 2): the control exists for a video only, starts at
 *   8 s, shows the quality's maximum beside itself, clamps on a quality
 *   change (creative 20 → balanced 10), refuses an over-max entry with the
 *   message, and is absent for an image.
 *
 * What is NOT here, and why: the wire — the closed presign pair and the
 * top-level `params.durationS` — is `live-brand-kit.spec.ts` and
 * `live-video-duration.spec.ts`, plus the unit pins at the seam.
 *
 * NAVIGATION RULE: switch datasets through the shared helper, then move only
 * through in-app links.
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { activateDataset, openFromRail as open } from './datasets'
import { expect, test } from './fixtures'

const WCAG_TAGS = ['wcag2a', 'wcag2aa']

/** A minimal, valid single-page PDF — what a "tiny PDF" honestly is. */
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

async function openKnowledge(page: Page) {
  await open(page, 'Settings')
  await page.getByRole('tab', { name: 'Knowledge' }).click()
  await expect(page.getByRole('heading', { name: 'Knowledge', level: 1 })).toBeVisible()
}

/** Dashboard → Today, the way the product intends it. */
async function openToday(page: Page) {
  await activateDataset(page, 'Active org')
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: /Drafts awaiting review/ }).click()
  await expect(page.getByRole('heading', { name: 'Today', level: 1 })).toBeVisible()
  await expect(page.locator('[data-slot="card"]').first()).toBeVisible()
}

const pendingCard = (page: Page) =>
  page.locator('[data-slot="card"]').filter({ hasText: 'Needs review' }).first()

const visualDialog = (page: Page) => page.getByRole('dialog', { name: 'Create a visual' })

const SIMULATED = 'Simulated in the demo — nothing was sent anywhere.'

// ---------------------------------------------------------------------------
// Phase 1 — the brand kit
// ---------------------------------------------------------------------------

test('the Brand kit type asks no description, takes PDF only, and lands under Files as "Brand kit"', async ({
  page,
}) => {
  await openKnowledge(page)
  const files = page.getByRole('region', { name: 'Files' })
  await expect(files.getByText(/No files yet/)).toBeVisible()

  // Before a type is chosen the description field is there, as always.
  const description = page.getByLabel('What is it?', { exact: true })
  await expect(description).toBeVisible()

  // The brand kit is always the brand kit: no description field at all, the
  // picker filters to PDF, and the file can be chosen with nothing typed.
  await page.getByRole('radio', { name: 'Brand kit' }).click()
  await expect(description).toHaveCount(0)
  const input = page.getByLabel('Choose documents to upload')
  await expect(input).toHaveAttribute('accept', 'application/pdf')
  await expect(page.getByRole('button', { name: 'Browse files' })).toBeEnabled()

  await input.setInputFiles({
    name: 'brand-guidelines.pdf',
    mimeType: 'application/pdf',
    buffer: TINY_PDF,
  })

  // Listed like every other file — the founder's ruling — under its own
  // label, typed by what it can only be, badged from the role the wire
  // echoes (the demo mirrors that echo). No Open in the demo: it keeps no
  // bytes, and a control that could never work is the disabled-teasing the
  // design law forbids.
  const row = files.getByRole('listitem').filter({ hasText: 'Brand kit' })
  await expect(row).toBeVisible()
  await expect(row).toContainText('PDF')
  await expect(row.getByText('brand kit', { exact: true })).toBeVisible()
  await expect(row.getByRole('button', { name: /Open/ })).toHaveCount(0)
  await expect(row.getByRole('button', { name: 'Delete Brand kit' })).toBeVisible()

  // A PNG declared as the brand kit is refused by the same real-type check.
  await input.setInputFiles({
    name: 'not-a-kit.png',
    mimeType: 'image/png',
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  })
  await expect(page.getByRole('alert').filter({ hasText: 'not the type you chose' })).toContainText(
    'not-a-kit.png',
  )
  await expect(files.getByRole('listitem')).toHaveCount(1)

  const scan = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(scan.violations).toEqual([])

  await row.getByRole('button', { name: 'Delete Brand kit' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  await expect(files.getByText(/No files yet/)).toBeVisible()

  // Switching back to a described kind brings the description field back.
  await page.getByRole('radio', { name: 'Image' }).click()
  await expect(page.getByLabel('What is it?', { exact: true })).toBeVisible()
})

test('"brandkit" is a reserved description on any other kind — refused with the pointer at the Brand kit type', async ({
  page,
}) => {
  await openKnowledge(page)

  await page.getByRole('radio', { name: 'Image' }).click()
  await page.getByLabel('What is it?', { exact: true }).fill(' BrandKit ')
  await page.getByLabel('Choose documents to upload').setInputFiles({
    name: 'mark.png',
    mimeType: 'image/png',
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  })

  await expect(
    page.getByRole('alert').filter({ hasText: 'reserved for your brand kit' }),
  ).toBeVisible()
  const files = page.getByRole('region', { name: 'Files' })
  await expect(files.getByText(/No files yet/)).toBeVisible()
})

// ---------------------------------------------------------------------------
// Phase 2 — the video duration
// ---------------------------------------------------------------------------

test('the video duration: video only, 8 s by default, the maximum shown, clamped on a quality change, over-max refused', async ({
  page,
}) => {
  await openToday(page)
  await pendingCard(page).getByRole('button', { name: 'Create visual' }).click()
  const dialog = visualDialog(page)
  await expect(dialog).toBeVisible()

  // Absent until the kind is a video: an image has no duration to send.
  const duration = dialog.getByLabel('Duration (seconds)')
  await expect(duration).toHaveCount(0)
  await dialog.getByLabel('Image or video').selectOption('image')
  await expect(duration).toHaveCount(0)

  await dialog.getByLabel('Image or video').selectOption('video')
  await expect(duration).toHaveValue('8')
  await expect(dialog.getByText(/up to 10 s on Balanced/)).toBeVisible()

  // The maximum follows the quality, and a quality change pulls the value
  // inside the new range: creative 20 → balanced 10.
  await dialog.getByLabel('Quality').selectOption('creative')
  await expect(dialog.getByText(/up to 20 s on Creative/)).toBeVisible()
  await duration.fill('20')
  await dialog.getByLabel('Quality').selectOption('balanced')
  await expect(duration).toHaveValue('10')
  await expect(dialog.getByText(/up to 10 s on Balanced/)).toBeVisible()

  // A typed over-max value is refused on submit with the message — never
  // rewritten under the user's hands — and the form stays where it was.
  await duration.fill('11')
  await dialog.getByRole('button', { name: 'Create visual' }).click()
  await expect(dialog.getByRole('alert')).toContainText('whole number of seconds')
  await expect(duration).toHaveValue('11')
  await expect(dialog.getByRole('button', { name: 'Create visual' })).toBeVisible()

  // Back to an image the control disappears; back to a video it remembers.
  await duration.fill('10')
  await dialog.getByLabel('Image or video').selectOption('image')
  await expect(duration).toHaveCount(0)
  await dialog.getByLabel('Image or video').selectOption('video')
  await expect(duration).toHaveValue('10')

  // The demo runs with the same limits — zero network, the fixture's proof.
  await dialog.getByRole('button', { name: 'Create visual' }).click()
  await expect(dialog.getByRole('status')).toContainText('Rendering')
  await expect(dialog.getByText(SIMULATED)).toBeVisible({ timeout: 10_000 })
  await dialog.getByRole('button', { name: 'Done' }).click()
  await expect(dialog).toHaveCount(0)
})

test('@axe the Create visual modal with the duration control is clean', async ({ page }) => {
  await openToday(page)
  await pendingCard(page).getByRole('button', { name: 'Create visual' }).click()
  const dialog = visualDialog(page)
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Image or video').selectOption('video')
  await expect(dialog.getByLabel('Duration (seconds)')).toBeVisible()
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(results.violations).toEqual([])
})
