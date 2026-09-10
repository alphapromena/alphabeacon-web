/**
 * ORDER HSN-0910/A + /C, static mode: the Studio is a grid of the 13
 * capabilities (one card each, an image with the feature's name), every card
 * opens a composer with ONLY that capability's fields, and each composer
 * refuses the document's own trap before any round-trip — with zero network,
 * which the fixture asserts on every test.
 *
 * NAVIGATION RULE: switch datasets through the shared helper, then move only
 * through in-app links (`verify:w05`).
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { activateDataset } from './datasets'
import { expect, test } from './fixtures'

const WCAG_TAGS = ['wcag2a', 'wcag2aa']

/** The 13 cards, by the name on each — the table's own words (A1). */
const CARDS = [
  'Generate',
  'Edit a photo',
  'Product photoshoot',
  'Brand mark options',
  'New logo',
  'Logo redesign',
  'Presenter from photos',
  'Presenter, imagined',
  'Character sheet',
  'Video ad from a still',
  'Voiceover',
  'Short film',
  'Motion transfer',
]

/** A valid 1×1 PNG, for the reference pickers. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

async function openStudio(page: Page, dataset = 'Active org') {
  await activateDataset(page, dataset)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'Studio', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Studio', level: 1 })).toBeVisible()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
}

async function openCard(page: Page, name: string) {
  await page.getByRole('main').getByRole('link', { name, exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Create', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible()
}

async function uploadReference(page: Page, inputLabel: string, name = 'ref.png') {
  await page.getByLabel(inputLabel).setInputFiles({ name, mimeType: 'image/png', buffer: PNG })
}

test('the grid shows the 13 capabilities, each an image with the name on it', async ({ page }) => {
  await openStudio(page)
  for (const name of CARDS) {
    await expect(page.getByRole('main').getByRole('link', { name, exact: true })).toBeVisible()
  }
  // The image is decorative under the name: no alt text competes with it.
  const images = page.getByRole('main').locator('img[src^="/studio/cards/"]')
  await expect(images).toHaveCount(13)
  for (const image of await images.all()) {
    await expect(image).toHaveAttribute('alt', '')
  }
  // The price line is the catalog's own decimal string, shown as money.
  await expect(page.getByText(/\$0\.03 per image/).first()).toBeVisible()
  // The kind filter follows the table's output kinds.
  await page.getByRole('button', { name: 'audio' }).click()
  await expect(page.getByRole('link', { name: 'Voiceover', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Edit a photo', exact: true })).toHaveCount(0)
})

test('a composer carries only its own fields, and the demo render lands on an asset', async ({
  page,
}) => {
  await openStudio(page)
  await openCard(page, 'Edit a photo')
  // The document's images.edit: an instruction, exactly one reference, the
  // image params — and nothing that belongs to another capability.
  await expect(page.getByLabel('The change')).toBeVisible()
  await expect(page.getByRole('group', { name: /Reference image/ })).toBeVisible()
  await expect(page.getByLabel('Aspect ratio')).toBeVisible()
  await expect(page.getByLabel('How many')).toHaveCount(0)
  await expect(page.getByRole('group', { name: 'Quality' })).toHaveCount(0)
  // A fixed model, said so.
  await expect(page.getByText(/a fixed model, no quality to choose/)).toBeVisible()

  // The trap: no reference — refused here, before any round-trip.
  await page.getByLabel('The change').fill('replace the background with a plain deep-navy backdrop')
  await page.getByRole('button', { name: 'Render' }).click()
  await expect(page.getByRole('alert')).toContainText('Reference image is required')

  // One reference in, the picker refuses a second (exactly one).
  await uploadReference(page, 'Choose an image for Reference image')
  await expect(page.getByRole('button', { name: 'Upload an image' })).toBeDisabled()

  await page.getByRole('button', { name: 'Render' }).click()
  await expect(page.getByText('Rendering…')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Asset', level: 1 })).toBeVisible({
    timeout: 10_000,
  })
  await expect(page.getByText('Standalone')).toBeVisible()
  await expect(page.getByText('Edit a photo').first()).toBeVisible()
})

test('every composer refuses the document’s own trap before any round-trip', async ({ page }) => {
  test.setTimeout(120_000)
  await openStudio(page)

  // media.generate: an empty prompt.
  await openCard(page, 'Generate')
  await page.getByRole('button', { name: 'Render' }).click()
  await expect(page.getByRole('alert')).toContainText('What should it show? is required')
  await page.getByRole('link', { name: 'Back to the studio' }).click()

  // brand-assets.generate: a count of one is not a batch.
  await openCard(page, 'Brand mark options')
  await page.getByLabel('How many').fill('1')
  await page.getByRole('button', { name: 'Render' }).click()
  await expect(page.getByRole('alert')).toContainText('How many must be between 2 and 20')
  await page.getByRole('link', { name: 'Back to the studio' }).click()

  // logos.generate: twenty-one.
  await openCard(page, 'New logo')
  await page.getByLabel('How many').fill('21')
  await page.getByRole('button', { name: 'Render' }).click()
  await expect(page.getByRole('alert')).toContainText('How many must be between 1 and 20')
  await page.getByRole('link', { name: 'Back to the studio' }).click()

  // logos.redesign: no reference.
  await openCard(page, 'Logo redesign')
  await page.getByRole('button', { name: 'Render' }).click()
  await expect(page.getByRole('alert')).toContainText('Reference image is required')
  await page.getByRole('link', { name: 'Back to the studio' }).click()

  // avatars.generate and the character sheet: nine.
  await openCard(page, 'Presenter from photos')
  await page.getByLabel('How many').fill('9')
  await page.getByRole('button', { name: 'Render' }).click()
  await expect(page.getByRole('alert')).toContainText('How many must be between 1 and 8')
  await page.getByRole('link', { name: 'Back to the studio' }).click()
  await openCard(page, 'Character sheet')
  await page.getByLabel('How many').fill('9')
  await page.getByRole('button', { name: 'Render' }).click()
  await expect(page.getByRole('alert')).toContainText('How many must be between 1 and 8')
  await page.getByRole('link', { name: 'Back to the studio' }).click()

  // avatars.imagine: 601 characters.
  await openCard(page, 'Presenter, imagined')
  // The control itself is the refusal: the 601st character never lands.
  await expect(page.getByLabel('Who they are')).toHaveAttribute('maxlength', '600')
  await page.getByLabel('Who they are').fill('x'.repeat(601))
  await expect(page.getByLabel('Who they are')).toHaveValue('x'.repeat(600))
  await page.getByRole('link', { name: 'Back to the studio' }).click()

  // photoshoot.generate: the picker stops at four (above four the wire
  // answers 502, item 58) and a direction is required.
  await openCard(page, 'Product photoshoot')
  for (let n = 1; n <= 4; n += 1) {
    await uploadReference(page, 'Choose an image for Reference images', `ref-${n}.png`)
  }
  await expect(page.getByRole('button', { name: 'Upload an image' })).toBeDisabled()
  await page.getByRole('button', { name: 'Render' }).click()
  await expect(page.getByRole('alert')).toContainText('At least one line of direction is needed')
  await page.getByRole('link', { name: 'Back to the studio' }).click()

  // video-ads.generate: 5 or 10 seconds and nothing else; no aspect ratio, no audio.
  await openCard(page, 'Video ad from a still')
  await expect(page.getByLabel('Length').locator('option')).toHaveText(['5', '10'])
  await expect(page.getByLabel('Aspect ratio')).toHaveCount(0)
  await expect(page.getByText(/This lane is silent/)).toBeVisible()
  await page.getByRole('link', { name: 'Back to the studio' }).click()

  // voice.speak: a two-letter language; similarity and speed vanish on precise.
  await openCard(page, 'Voiceover')
  await page.getByLabel('The words').fill('Welcome to Alpha Pro.')
  // The control itself is the refusal: a third letter never lands.
  await expect(page.getByLabel('Language')).toHaveAttribute('maxlength', '2')
  await page.getByLabel('Language').fill('eng')
  await expect(page.getByLabel('Language')).toHaveValue('en')
  await expect(page.getByLabel('Similarity')).toBeVisible()
  await page.getByRole('button', { name: /^Precise/ }).click()
  await expect(page.getByLabel('Similarity')).toHaveCount(0)
  await expect(page.getByLabel('Speed')).toHaveCount(0)
  await page.getByRole('link', { name: 'Back to the studio' }).click()

  // film.generate: the scenes must add up; balanced is the silent lane.
  await openCard(page, 'Short film')
  await page.getByLabel('Length in seconds').fill('4')
  await expect(page.getByText(/must match exactly/)).toBeVisible()
  await page.getByRole('button', { name: 'Render' }).click()
  await expect(page.getByRole('alert')).toContainText('add up to 3 seconds; the film is 4')
  await expect(page.getByLabel('Speech').locator('option', { hasText: 'On camera' })).toBeDisabled()
  await expect(page.getByLabel('Resolution')).toHaveCount(0)
  await page.getByRole('button', { name: /^Creative/ }).click()
  await expect(page.getByLabel('Resolution')).toBeVisible()
  await page.getByRole('link', { name: 'Back to the studio' }).click()

  // motion.generate: no language field at all (item 57), and the pricing trap in words.
  await openCard(page, 'Motion transfer')
  await expect(page.getByLabel('Language')).toHaveCount(0)
  await expect(page.getByText(/billed at the framing/i).first()).toBeVisible()
  await page.getByRole('button', { name: 'Render' }).click()
  await expect(page.getByRole('alert')).toContainText('The still is required')
})

test('Settings shows the organization id at the top, with a copy control (HSN-0910/C)', async ({
  page,
}) => {
  await activateDataset(page, 'Active org')
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Organization', level: 1 })).toBeVisible()
  await expect(page.getByText('Organization ID')).toBeVisible()
  await expect(page.getByText('org_atlas')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy the organization ID' })).toBeVisible()
})

test('@axe the grid and one composer scan clean', async ({ page }) => {
  await openStudio(page)
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
  await openCard(page, 'Short film')
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
})
