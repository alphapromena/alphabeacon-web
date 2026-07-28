/**
 * W2's verify: the marketing → signup → verify → onboarding → dashboard walk,
 * plus the states screens4.md calls out for Area A.
 *
 * NAVIGATION RULE for this file: after switching datasets, move only through
 * in-app links. `page.goto` reloads the SPA, and a reload rebuilds the default
 * dataset — which is the app behaving correctly (nothing persists), but it
 * means a deep link would silently land in the wrong world.
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { activateDataset } from './datasets'
import { expect, test } from './fixtures'

const WCAG_TAGS = ['wcag2a', 'wcag2aa']

/** A signed-out prospect: '/' is the marketing site. */
const asVisitor = (page: Page) => activateDataset(page, 'Visitor (signed out)')

/** Signed in, onboarding unfinished: '/' is N3, one click from the wizard. */
async function asFreshOrgAtWizard(page: Page) {
  await activateDataset(page, 'Fresh org')
  await page.getByRole('link', { name: /Resume setup/ }).click()
  await expect(page.getByRole('heading', { name: 'Tell us about your brand' })).toBeVisible()
}

/** Step 1 is the only gate before the pipeline step; 2 and 3 are skippable. */
async function walkToPipelineStep(page: Page) {
  await page.getByLabel('What you offer, in one line').fill('Clean skincare, in small batches.')
  await page.getByLabel('What sets you apart').fill('Small batch')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Skip for now' }).click()
  await page.getByRole('button', { name: 'Skip for now' }).click()
  await expect(page.getByRole('heading', { name: 'Start your pipeline' })).toBeVisible()
}

test('marketing is the front door when signed out', async ({ page }) => {
  await asVisitor(page)

  await expect(page.getByRole('heading', { name: /AI co-pilot/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Simple, predictable pricing' })).toBeVisible()
  // Pricing renders from the same module Billing reads.
  for (const plan of ['Free', 'Pro', 'Studio']) {
    await expect(page.getByRole('heading', { name: plan, exact: true })).toBeVisible()
  }
  await expect(page.getByText('Cancel anytime, no long-term contracts.')).toBeVisible()
})

test('@axe marketing and auth screens scan clean', async ({ page }) => {
  await asVisitor(page)
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])

  await page.getByRole('link', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])

  await page.getByRole('link', { name: 'Create an account' }).click()
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
})

test('@golden signup → verify → onboarding → dashboard', async ({ page }) => {
  await asVisitor(page)

  await page.getByRole('link', { name: 'Start free' }).first().click()
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()

  await page.getByLabel('Full name').fill('Lena Park')
  await page.getByLabel('Work email').fill('lena@novaskincare.example')
  await page.getByLabel('Password', { exact: true }).fill('Roasted2Order')
  await page.getByLabel('Organization name').fill('Nova Skincare')
  await page.getByRole('checkbox').click()
  await page.getByRole('button', { name: 'Create account' }).click()

  // A3 — verify
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()
  await expect(page.getByText('lena@novaskincare.example')).toBeVisible()
  await page.getByRole('button', { name: "I've verified my email" }).click()

  // A5 step 1 — brand basics
  await expect(page.getByRole('heading', { name: 'Tell us about your brand' })).toBeVisible()
  await page.getByLabel('What you offer, in one line').fill('Clean skincare, in small batches.')
  await page.getByLabel('What sets you apart').fill('Small batch')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 2 — connect one channel so the summary has something real to say
  await expect(page.getByRole('heading', { name: 'Connect your accounts' })).toBeVisible()
  await page
    .getByRole('listitem')
    .filter({ hasText: 'Instagram' })
    .getByRole('button', { name: 'Connect' })
    .click()
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 3 — skipped, to prove skipping works
  await expect(page.getByRole('heading', { name: 'Connect your calendar' })).toBeVisible()
  await page.getByRole('button', { name: 'Skip for now' }).click()

  // Step 4 — the point of the whole flow
  await expect(page.getByRole('heading', { name: 'Start your pipeline' })).toBeVisible()
  await page.getByRole('button', { name: 'Monday' }).click()
  await page.getByRole('button', { name: 'Wednesday' }).click()
  await page.getByRole('radio', { name: /Balanced/ }).check()
  await page.getByRole('button', { name: 'Provocative' }).click()
  await expect(page.getByText(/drafts a week/)).toBeVisible()
  await page.getByRole('button', { name: 'Start pipeline' }).click()

  // Step 5 — ready
  await expect(page.getByRole('heading', { name: 'Your pipeline is running' })).toBeVisible()
  await expect(page.getByText('Pipeline active')).toBeVisible()
  await page.getByRole('button', { name: 'Go to your dashboard' }).click()

  // D1 — the product, carrying the org this walk just created
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await expect(page.getByText('Drafts awaiting review')).toBeVisible()
})

test('the pipeline step refuses to start without the fields it needs', async ({ page }) => {
  await asFreshOrgAtWizard(page)
  await walkToPipelineStep(page)

  await page.getByRole('button', { name: 'Start pipeline' }).click()

  // Named messages from the catalogue, not raw validation noise.
  await expect(page.getByText('Pick at least one day to generate on.')).toBeVisible()
  await expect(page.getByText('Pick at least one tone so drafts know how to sound.')).toBeVisible()
  // And it really did not start.
  await expect(page.getByRole('heading', { name: 'Start your pipeline' })).toBeVisible()
})

test('posts per day is capped at 3, and the cap is visible', async ({ page }) => {
  await asFreshOrgAtWizard(page)
  await walkToPipelineStep(page)

  await expect(page.getByText(/At most/)).toBeVisible()
  const increase = page.getByRole('button', { name: 'One more post per day' })
  await increase.click()
  await increase.click()
  // The control stops at the cap rather than wrapping or accepting a 4th.
  await expect(increase).toBeDisabled()
})

test('a tone created mid-wizard comes back selected, without losing the step', async ({ page }) => {
  await asFreshOrgAtWizard(page)
  await walkToPipelineStep(page)

  await page.getByRole('button', { name: 'Create custom tone' }).click()
  await page.getByLabel('Tone name').fill('Desk note')
  await page.getByLabel('What this tone sounds like').fill('How this desk writes to clients.')
  await page.getByLabel('Do', { exact: true }).fill('Name the source')
  await page.getByRole('button', { name: 'Save tone' }).click()

  // Back on step 4, with the new tone present and chosen.
  await expect(page.getByRole('heading', { name: 'Start your pipeline' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Desk note' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('sign-in locks out after repeated failures and counts down', async ({ page }) => {
  await asVisitor(page)
  await page.getByRole('link', { name: 'Sign in' }).click()

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel('Work email').fill('nobody@example.com')
    await page.getByLabel('Password').fill('whatever1A')
    await page.getByRole('button', { name: 'Sign in' }).click()
  }

  await expect(page.getByRole('alert')).toContainText('Too many attempts')
  await expect(page.getByRole('button', { name: 'Locked' })).toBeDisabled()
})

test('an unfinished workspace resumes at the step it stopped on (N3)', async ({ page }) => {
  await activateDataset(page, 'Fresh org')

  // '/' is N3 while onboarding is unfinished, and it names the step.
  await expect(page.getByText(/finish setting up your workspace/i)).toBeVisible()
  await expect(page.getByText(/step 1 of 5/i)).toBeVisible()

  await page.getByRole('link', { name: /Resume setup/ }).click()
  await page.getByLabel('What you offer, in one line').fill('Clean skincare.')
  await page.getByLabel('What sets you apart').fill('Small batch')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Connect your accounts' })).toBeVisible()

  // Leaving now and coming back must resume at step 2, not restart at 1.
  // goBack keeps the SPA alive, so provider state survives — a reload would
  // reset the dataset, which is the app's documented behaviour.
  await page.goBack()
  await expect(page.getByText(/step 2 of 5/i)).toBeVisible()
  await page.getByRole('link', { name: /Resume setup/ }).click()
  await expect(page.getByRole('heading', { name: 'Connect your accounts' })).toBeVisible()
})
