/**
 * W2's verify: the marketing → signup → verify → **the app** walk, plus the
 * states screens4.md calls out for Area A.
 *
 * THIS FILE WAS `onboarding.spec.ts`. The wizard it was named after is deleted
 * (ORDER ONB-0827, D-ONB-C): signup is minimal, verifying creates the
 * workspace, and the user lands in the product. What used to be five steps of
 * setup now happens in Settings and on the Calendar, whenever the user wants
 * it — so the journey this file signs off is shorter, and the tests that drove
 * the wizard are gone rather than adapted. A test for a screen that no longer
 * exists is worse than no test: it is a green check on a fiction.
 *
 * SCOPE (M2): the visitor world's own coverage — sections, CTA wiring, pricing,
 * the demo request, the legal pages, reduced motion, the approval loop — lives
 * in `marketing.spec.ts`. What stays here is the SEAM: that the front door is
 * the marketing site when signed out, and that "Get started" opens the real
 * account-creation journey this file walks end to end.
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

/** Signup, through the real form, from the visitor world. */
async function signUp(page: Page) {
  await page.getByLabel('Full name').fill('Lena Park')
  await page.getByLabel('Work email').fill('lena@novaskincare.example')
  await page.getByLabel('Password', { exact: true }).fill('Roasted2Order')
  await page.getByLabel('Organization name').fill('Nova Skincare')
  await page.getByRole('checkbox').click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()
}

test('marketing is the front door when signed out', async ({ page }) => {
  await asVisitor(page)

  // The concept-v2 hero (M2): the headline is the h1, the wordmark lives in
  // the navigation, and the way into the product is one click from here.
  // What the page SAYS is marketing.spec.ts's business; this is the seam.
  await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.')
  await expect(
    page.getByRole('banner').getByRole('link', { name: 'Get started' }).first(),
  ).toHaveAttribute('href', '/signup')
  await expect(page.getByRole('banner').getByRole('link', { name: 'Login' })).toHaveAttribute(
    'href',
    '/login',
  )
})

test('@axe the auth screens reached from marketing scan clean', async ({ page }) => {
  // The marketing routes are scanned in marketing.spec.ts; this walks the
  // seam and scans what is on the other side of it.
  await asVisitor(page)

  await page.getByRole('banner').getByRole('link', { name: 'Login' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])

  await page.getByRole('link', { name: 'Create an account' }).click()
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
})

test('@golden signup → verify → the app, with no wizard in between', async ({ page }) => {
  await asVisitor(page)

  // M2's launch model (D-M2-D): "Get started" IS the app's own signup, so the
  // golden walk starts where a real visitor starts — one click, no detour
  // through a second door.
  await page.getByRole('banner').getByRole('link', { name: 'Get started' }).first().click()
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()

  await signUp(page)
  await expect(page.getByText('lena@novaskincare.example')).toBeVisible()

  // A3 — verifying is what creates the workspace, from the name typed at
  // signup. There is nothing between this press and the product.
  await page.getByRole('button', { name: "I've verified my email" }).click()

  // D1 — the product, carrying the org this walk just created. The whole
  // point of the ruling: five steps of setup did not stand in the way.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await expect(page.getByText('Drafts awaiting review')).toBeVisible()
  // And the workspace really wears the name from signup.
  await expect(page.getByText('Nova Skincare').first()).toBeVisible()
})

test('a signed-in account with no workspace gets the creation retry, not a wizard', async ({
  page,
}) => {
  await asVisitor(page)
  await page.getByRole('banner').getByRole('link', { name: 'Get started' }).first().click()
  await signUp(page)

  // The wordmark is an in-app link home, so this reaches '/' without the
  // reload that would rebuild the default dataset (trap 1). At this point the
  // account exists and the workspace does not — which is exactly the state N3
  // is for now.
  await page.getByRole('link', { name: 'Malaky' }).first().click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('workspace was never created')
  // One press, not five steps — and no "resume at step N of 5" anywhere.
  await expect(page.getByText(/step \d of 5/i)).toHaveCount(0)

  await page.getByRole('button', { name: 'Create my workspace' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
})

test('@axe the workspace-creation retry scans clean', async ({ page }) => {
  await asVisitor(page)
  await page.getByRole('banner').getByRole('link', { name: 'Get started' }).first().click()
  await signUp(page)
  await page.getByRole('link', { name: 'Malaky' }).first().click()

  await expect(page.getByRole('button', { name: 'Create my workspace' })).toBeVisible()
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
})

test('sign-in locks out after repeated failures and counts down', async ({ page }) => {
  await asVisitor(page)
  await page.getByRole('banner').getByRole('link', { name: 'Login' }).click()

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel('Work email').fill('nobody@example.com')
    await page.getByLabel('Password').fill('whatever1A')
    await page.getByRole('button', { name: 'Sign in' }).click()
  }

  await expect(page.getByRole('alert')).toContainText('Too many attempts')
  await expect(page.getByRole('button', { name: 'Locked' })).toBeDisabled()
})
