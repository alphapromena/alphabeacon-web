/**
 * W3's verify: the review queue (D1–D5).
 *
 * NAVIGATION RULE (carried from W2, applied here from the start): after
 * switching datasets, move only through in-app links. `page.goto` reloads the
 * SPA and a reload rebuilds the default dataset, so a deep link would silently
 * test the wrong tenant. Within one world, links are also how a user gets
 * anywhere — so the walk doubles as a check that the routes are connected.
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { activateDataset } from './datasets'
import { expect, test } from './fixtures'

const WCAG_TAGS = ['wcag2a', 'wcag2aa']

/** Dashboard → Today, the way the product intends it. */
async function openTodayQueue(page: Page, dataset = 'Active org') {
  await activateDataset(page, dataset)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: /Drafts awaiting review/ }).click()
  await expect(page.getByRole('heading', { name: 'Today', level: 1 })).toBeVisible()
  // The shell's h1 renders during the skeleton too, so wait for the queue
  // itself — counting before this point counts an empty page.
  await expect(page.locator('[data-slot="card"]').first()).toBeVisible()
}

/** The first card still awaiting review. */
const pendingCard = (page: Page) =>
  page.locator('[data-slot="card"]').filter({ hasText: 'Needs review' }).first()

test('the queue groups drafts by slot and offers only legal actions', async ({ page }) => {
  await openTodayQueue(page)

  const card = pendingCard(page)
  await expect(card.getByRole('button', { name: 'Approve' })).toBeVisible()
  await expect(card.getByRole('button', { name: 'Reject' })).toBeVisible()

  // THE approval gate: media generation is absent, not disabled.
  await expect(card.getByRole('button', { name: /Create image or video/ })).toHaveCount(0)
  await expect(card.getByRole('button', { name: 'Schedule' })).toHaveCount(0)
})

test('@golden approving moves the card and updates the dashboard in the same session', async ({
  page,
}) => {
  await openTodayQueue(page)

  const before = await page
    .locator('[data-slot="card"]')
    .filter({ hasText: 'Needs review' })
    .count()
  const card = pendingCard(page)
  await card.getByRole('button', { name: 'Approve' }).click()

  // One fewer awaiting, and the media path has appeared on the approved card.
  await expect(page.locator('[data-slot="card"]').filter({ hasText: 'Needs review' })).toHaveCount(
    before - 1,
  )
  await expect(
    page.locator('[data-slot="card"]').filter({ hasText: 'Approved' }).first(),
  ).toContainText('Create image or video')

  // D1's stat must agree with what just happened in D2.
  await page.getByRole('link', { name: 'Dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  const stat = page.getByRole('link', { name: /Drafts awaiting review/ })
  await expect(stat).toContainText(String(before - 1))
})

test('generating media spends credits, and the balance follows', async ({ page }) => {
  await openTodayQueue(page)

  const mediaReady = page.locator('[data-slot="card"]').filter({ hasText: 'Media ready' })
  // This world already ships a media-ready draft, so the assertion is the
  // delta, not an absolute count.
  const readyBefore = await mediaReady.count()

  await pendingCard(page).getByRole('button', { name: 'Approve' }).click()
  const approved = page.locator('[data-slot="card"]').filter({ hasText: 'Approved' }).first()
  await approved.getByRole('button', { name: /Create image or video/ }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/This will use/)).toBeVisible()
  await dialog.getByLabel('Prompt').fill('Overhead flat-lay, morning light')
  await dialog.getByRole('button', { name: 'Generate' }).click()

  // Runs on a timer, then attaches — the draft moves to media_ready.
  // The panel's own line, not the button label — both say "Generating…".
  await expect(dialog.getByText('Usually takes about 30 seconds.')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10_000 })
  await expect(mediaReady).toHaveCount(readyBefore + 1)
})

test('a short balance refuses the run and keeps the prompt', async ({ page }) => {
  await openTodayQueue(page, 'Low credits')

  await pendingCard(page).getByRole('button', { name: 'Approve' }).click()
  const approved = page.locator('[data-slot="card"]').filter({ hasText: 'Approved' }).first()
  await approved.getByRole('button', { name: /Create image or video/ }).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Prompt').fill('A prompt worth keeping')
  await expect(dialog.getByRole('alert')).toContainText('Not enough credits')
  await expect(dialog.getByRole('button', { name: 'Generate' })).toBeDisabled()
  // The refusal must not cost the user their typing.
  await expect(dialog.getByLabel('Prompt')).toHaveValue('A prompt worth keeping')
})

test('scheduling reports per channel, and a re-auth channel cannot be picked', async ({ page }) => {
  await openTodayQueue(page)

  await pendingCard(page).getByRole('button', { name: 'Approve' }).click()
  const approved = page.locator('[data-slot="card"]').filter({ hasText: 'Approved' }).first()
  await approved.getByRole('button', { name: 'Schedule' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  // LinkedIn needs re-auth in this world: shown, disabled, with the fix inline.
  const linkedin = dialog.getByRole('listitem').filter({ hasText: 'LinkedIn' })
  await expect(linkedin.getByRole('checkbox')).toBeDisabled()
  await expect(linkedin.getByRole('link', { name: 'reconnect' })).toBeVisible()

  await dialog.getByRole('listitem').filter({ hasText: 'Instagram' }).getByRole('checkbox').click()
  await dialog.getByRole('button', { name: 'Publish now' }).click()

  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(
    page.locator('[data-slot="card"]').filter({ hasText: 'instagram — published' }),
  ).toHaveCount(1)
})

test('draft detail shows the timeline and mirrors the queue actions', async ({ page }) => {
  await openTodayQueue(page)

  await pendingCard(page).getByRole('link', { name: 'Open' }).click()
  await expect(page.getByRole('heading', { name: 'Timeline' })).toBeVisible()
  await expect(page.getByText('Quality score')).toBeVisible()

  // Same gate as the card: no media path until this is approved.
  await expect(page.getByRole('button', { name: /Create image or video/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Approve' }).click()
  await expect(page.getByRole('button', { name: /Create image or video/ })).toBeVisible()
})

test('rejecting asks why, and the draft leaves the queue', async ({ page }) => {
  await openTodayQueue(page)

  await pendingCard(page).getByRole('button', { name: 'Reject' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: 'Reject draft' })).toBeDisabled()
  await dialog.getByRole('radio', { name: 'Off brand' }).click()
  await dialog.getByRole('button', { name: 'Reject draft' }).click()

  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('[data-slot="card"]').filter({ hasText: 'Rejected' })).toHaveCount(1)
})

test('@axe the queue and draft detail scan clean', async ({ page }) => {
  await openTodayQueue(page)
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])

  await pendingCard(page).getByRole('link', { name: 'Open' }).click()
  await expect(page.getByRole('heading', { name: 'Timeline' })).toBeVisible()
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
})
