/**
 * The Hasan series (HSN-01…04), covered at its consolidated gate (HSN-FINAL).
 *
 * The series law deferred every test to one order; this file is that order's
 * static half. Four things, through the real screens, in the demo world:
 * - HSN-02 — Create visual: both entry points, the refused blank kind, the
 *   single flight, the simulated lifecycle, and that it attaches NOTHING.
 * - HSN-03 — tone language + length: required on create, defaulted on length
 *   only, shown on the card, editable.
 * - HSN-04 — the sources/topics caps: the counter, the disabled add, and room
 *   again after a removal (shrink is always allowed).
 * - HSN-04 — the Knowledge upload form: the type filters the picker, the real
 *   MIME is checked against it, and the description is required.
 *
 * What is NOT here, and why: the `unconfirmed_receipt` copy is a LIVE failure
 * path the static world cannot reach (unit-tested at the seam instead); a
 * tone with no language exists only for tones created before HSN-03 on a live
 * org (the label contract is unit-tested); the paid render is
 * `live-create-visual.spec.ts`, gated on LIVE_MEDIA.
 *
 * NAVIGATION RULE: switch datasets through the shared helper, then move only
 * through in-app links.
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { activateDataset, openFromRail as open } from './datasets'
import { expect, test } from './fixtures'

const WCAG_TAGS = ['wcag2a', 'wcag2aa']

/** Dashboard → Today, the way the product intends it. */
async function openToday(page: Page) {
  await activateDataset(page, 'Active org')
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: /Drafts awaiting review/ }).click()
  await expect(page.getByRole('heading', { name: 'Today', level: 1 })).toBeVisible()
  // The shell's h1 renders during the skeleton too (trap 2): wait for a card.
  await expect(page.locator('[data-slot="card"]').first()).toBeVisible()
}

/** The first card still awaiting review. */
const pendingCard = (page: Page) =>
  page.locator('[data-slot="card"]').filter({ hasText: 'Needs review' }).first()

const visualDialog = (page: Page) => page.getByRole('dialog', { name: 'Create a visual' })

const SIMULATED = 'Simulated in the demo — nothing was sent anywhere.'

// ---------------------------------------------------------------------------
// HSN-02 — Create visual
// ---------------------------------------------------------------------------

test('Create visual on Today: beside Approve and Reject, refuses a blank kind, runs once, attaches nothing', async ({
  page,
}) => {
  await openToday(page)
  const card = pendingCard(page)
  await expect(card.getByRole('button', { name: 'Approve' })).toBeVisible()
  await expect(card.getByRole('button', { name: 'Reject' })).toBeVisible()
  await expect(card.getByRole('button', { name: 'Create visual' })).toBeVisible()
  // It is NOT the approval-gated media entry, which stays absent pre-approval.
  await expect(card.getByRole('button', { name: /Create image or video/ })).toHaveCount(0)

  await card.getByRole('button', { name: 'Create visual' }).click()
  const dialog = visualDialog(page)
  await expect(dialog).toBeVisible()

  // The kind is chosen, never defaulted: a blank one is refused before
  // anything runs, and the form stays where it was.
  await expect(dialog.getByLabel('Image or video')).toHaveValue('')
  await dialog.getByRole('button', { name: 'Create visual' }).click()
  await expect(dialog.getByRole('alert')).toContainText('Choose image or video first')
  await expect(dialog.getByRole('button', { name: 'Create visual' })).toBeVisible()

  // Guidance is capped at six — the seventh "Add" does not exist.
  for (let n = 0; n < 6; n += 1) {
    await dialog.getByRole('button', { name: 'Add guidance' }).click()
  }
  await expect(dialog.getByLabel('Guidance 6')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Add guidance' })).toHaveCount(0)

  await dialog.getByLabel('Image or video').selectOption('image')
  await dialog.getByRole('button', { name: 'Create visual' }).click()

  // Single flight: while it runs there is no button that could send again.
  await expect(dialog.getByRole('status')).toContainText('Rendering')
  await expect(dialog.getByRole('button', { name: 'Create visual' })).toHaveCount(0)

  // The simulation names itself, and says nothing was attached.
  await expect(dialog.getByText(SIMULATED)).toBeVisible({ timeout: 10_000 })
  await expect(dialog.getByText(/Attaching it to the draft arrives in a later phase/)).toBeVisible()
  await expect(dialog.getByRole('link', { name: 'Open the asset' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Done' }).click()
  await expect(dialog).toHaveCount(0)

  // Attaches nothing: the draft still awaits review, and the gate is intact.
  await expect(card).toContainText('Needs review')
  await expect(card.getByRole('button', { name: /Create image or video/ })).toHaveCount(0)

  // Reopening starts from a blank form — the next kind is chosen afresh.
  await card.getByRole('button', { name: 'Create visual' }).click()
  await expect(visualDialog(page).getByLabel('Image or video')).toHaveValue('')
  await expect(visualDialog(page).getByLabel('Guidance 1')).toHaveCount(0)
})

test('Create visual on a Generate result: the second entry point opens the same modal', async ({
  page,
}) => {
  await open(page, 'Today')
  await page.getByRole('link', { name: 'Generate one now' }).first().click()
  await expect(
    page.getByRole('heading', { name: 'What should we write about?', level: 1 }),
  ).toBeVisible()
  await page.getByLabel('Prompt').fill('A short note on the new Guji lot')
  await page.getByRole('button', { name: 'Generate' }).click()
  await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible({ timeout: 15_000 })

  // F1 renders D2's card, so the same button is there, wired to the same modal.
  await page.getByRole('button', { name: 'Create visual' }).click()
  const dialog = visualDialog(page)
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Image or video').selectOption('video')
  await dialog.getByRole('button', { name: 'Create visual' }).click()
  await expect(dialog.getByRole('status')).toContainText('Rendering')
  await expect(dialog.getByText(SIMULATED)).toBeVisible({ timeout: 10_000 })
  await dialog.getByRole('button', { name: 'Done' }).click()

  // The Generate page's card is D2's card: still awaiting review, gate intact.
  await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Create image or video/ })).toHaveCount(0)
})

test('@axe the Create visual modal is clean', async ({ page }) => {
  await openToday(page)
  await pendingCard(page).getByRole('button', { name: 'Create visual' }).click()
  await expect(visualDialog(page)).toBeVisible()
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(results.violations).toEqual([])
})

// ---------------------------------------------------------------------------
// HSN-03 — tone language + length
// ---------------------------------------------------------------------------

test('a tone needs a language, defaults only its length, shows both on its card, and edits them', async ({
  page,
}) => {
  await open(page, 'Settings')
  await page.getByRole('tab', { name: 'Tones' }).click()
  await page.getByRole('link', { name: 'Create custom tone' }).first().click()
  await expect(page.getByLabel('Tone name')).toBeVisible()

  await page.getByLabel('Tone name').fill('Souq morning')
  await page.getByLabel('What this tone sounds like').fill('Warm, quick, first person.')
  await page.getByLabel('Do', { exact: true }).fill('Name the roast date')

  // Length has a FORM default; language has none and is required.
  await expect(page.getByLabel('Length')).toHaveValue('medium')
  await expect(page.getByLabel('Language')).toHaveValue('')
  await page.getByRole('button', { name: 'Create tone' }).click()
  await expect(page.getByText(/Pick the language this tone writes in/)).toBeVisible()
  await expect(page.getByText('Tone created')).toHaveCount(0)

  await page.getByLabel('Language').selectOption('ar')
  await page.getByRole('button', { name: 'Create tone' }).click()
  await expect(page.getByText('Tone created')).toBeVisible()

  const card = page.locator('[data-slot="card"]').filter({ hasText: 'Souq morning' })
  await expect(card).toContainText(/Language\s*Arabic/)
  await expect(card).toContainText(/Length\s*Medium/)

  // Edit keeps the language and changes the length.
  await card.getByRole('link', { name: 'Edit' }).click()
  await expect(page.getByLabel('Tone name')).toHaveValue('Souq morning')
  await expect(page.getByLabel('Language')).toHaveValue('ar')
  await page.getByLabel('Length').selectOption('long')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Tone saved')).toBeVisible()
  await expect(card).toContainText(/Language\s*Arabic/)
  await expect(card).toContainText(/Length\s*Long/)
})

// ---------------------------------------------------------------------------
// HSN-04 — the caps
// ---------------------------------------------------------------------------

test('sources stop at 10 and topics at 30: the counter, the disabled add, and room again after a removal', async ({
  page,
}) => {
  await open(page, 'Settings')
  await page.getByRole('tab', { name: 'Sources & topics' }).click()
  const sourceInput = page.getByLabel('Add a source')
  const addSource = page.getByRole('button', { name: 'Add source' })
  await expect(sourceInput).toBeVisible()

  // Fill up to the cap through the real add path; the demo starts below it.
  for (let n = 1; n <= 10; n += 1) {
    if (await addSource.isDisabled()) break
    await sourceInput.fill(`cap-source-${n}.example/feed`)
    await addSource.click()
    await expect(page.getByText(`cap-source-${n}.example/feed`)).toBeVisible()
  }
  await expect(page.getByText('10 / 10')).toBeVisible()
  await expect(sourceInput).toBeDisabled()
  await expect(addSource).toBeDisabled()
  await expect(page.getByRole('status').filter({ hasText: 'at most 10 sources' })).toBeVisible()

  // Shrink is always allowed, and it makes room again.
  await page.getByRole('button', { name: 'Remove Cap Source 1' }).click()
  await expect(page.getByText('9 / 10')).toBeVisible()
  await expect(sourceInput).toBeEnabled()
  await expect(addSource).toBeEnabled()

  const topicInput = page.getByLabel('Add a topic')
  const addTopic = page.getByRole('button', { name: 'Add', exact: true })
  for (let n = 1; n <= 30; n += 1) {
    if (await topicInput.isDisabled()) break
    await topicInput.fill(`cap topic ${n}`)
    await topicInput.press('Enter')
    await expect(page.getByText(`cap topic ${n}`, { exact: true })).toBeVisible()
  }
  await expect(page.getByText('30 / 30')).toBeVisible()
  await expect(topicInput).toBeDisabled()
  await expect(addTopic).toBeDisabled()
  await expect(page.getByRole('status').filter({ hasText: 'at most 30 topics' })).toBeVisible()

  await page.getByRole('button', { name: 'Remove cap topic 1', exact: true }).click()
  await expect(page.getByText('29 / 30')).toBeVisible()
  await expect(topicInput).toBeEnabled()
  await expect(addTopic).toBeEnabled()
})

// ---------------------------------------------------------------------------
// HSN-04 — the Knowledge upload form
// ---------------------------------------------------------------------------

test('the Knowledge upload asks what it is, filters by type, refuses the wrong MIME, and needs a description', async ({
  page,
}) => {
  await open(page, 'Settings')
  await page.getByRole('tab', { name: 'Knowledge' }).click()
  await expect(page.getByRole('heading', { name: 'Knowledge', level: 1 })).toBeVisible()

  const browse = page.getByRole('button', { name: 'Browse files' })
  const input = page.getByLabel('Choose documents to upload')
  const description = page.getByLabel('What is it?', { exact: true })
  const rows = page.getByRole('main').getByRole('listitem')
  // count() never waits (trap 14): the seeded batch must be on screen first.
  await expect(rows.first()).toBeVisible()
  const before = await rows.count()

  // Nothing chosen: the picker is disabled and carries no filter.
  await expect(browse).toBeDisabled()
  expect(await input.getAttribute('accept')).toBeNull()

  // The type filters the picker.
  await page.getByRole('radio', { name: 'Image' }).click()
  await expect(input).toHaveAttribute('accept', 'image/png,image/jpeg,image/webp')
  await page.getByRole('radio', { name: 'Video' }).click()
  await expect(input).toHaveAttribute('accept', 'video/mp4')
  await page.getByRole('radio', { name: 'Document' }).click()
  await expect(input).toHaveAttribute('accept', /application\/pdf/)
  // A type alone is not enough.
  await expect(browse).toBeDisabled()

  // The description is required — `setInputFiles` bypasses the disabled
  // button, and the form still refuses.
  await input.setInputFiles({
    name: 'price-list.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Filter 12.00'),
  })
  await expect(page.getByRole('alert').filter({ hasText: 'Describe what this is' })).toBeVisible()
  await expect(rows).toHaveCount(before)

  await description.fill('Spring price list')
  await expect(browse).toBeEnabled()

  // The file's REAL type is checked against the choice: a PNG declared as a
  // document is refused by name, and nothing is listed.
  await input.setInputFiles({
    name: 'roastery.png',
    mimeType: 'image/png',
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  })
  await expect(page.getByRole('alert').filter({ hasText: 'not the type you chose' })).toContainText(
    'roastery.png',
  )
  await expect(rows).toHaveCount(before)

  // A matching file goes through, and the row carries the type and description.
  await input.setInputFiles({
    name: 'price-list.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Filter 12.00\nEspresso 14.00'),
  })
  const uploaded = rows.filter({ hasText: 'price-list.txt' })
  await expect(uploaded).toContainText('document · Spring price list')
  await expect(uploaded.getByText('Ready')).toBeVisible({ timeout: 15_000 })
  // The next upload is a different thing: its description starts blank.
  await expect(description).toHaveValue('')
  await expect(browse).toBeDisabled()
})
