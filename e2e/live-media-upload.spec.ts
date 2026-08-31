/**
 * ORDER MED-0831's live verify: BOTH media-door surfaces, through the UI, on
 * a fresh QA org, against the DEPLOYED API — zero spend (presigns and PUTs
 * are not billable; no job, no run, no render), so NOT LIVE_MEDIA-gated.
 *
 * - Knowledge (H1/H2): Image + description + a 1×1 PNG → a Files row read
 *   back from the WIRE's asset list (no local ledger exists) → Delete → the
 *   list re-read and empty.
 * - Organization (H3): the same PNG uploaded as the logo (`desc: "logo"`) →
 *   shown as the logo, with the ruled status line — and ABSENT from
 *   Knowledge's Files (the logo row is Organization's) → Remove → cleared.
 *
 * This spec is also the media bucket's browser-CORS proof, exactly as
 * live-knowledge.spec.ts was the RAG bucket's (open-item 24): the presign is
 * our API's, the PUT goes to storage from Chromium itself.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { SCREEN_SYNC } from './live-clocks'
import { openSettingsTab, signUpAndEnter } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}med@alphapromena.com`
const ORG_NAME = `QA Media Org ${RUN}`

/** A real 1×1 transparent PNG (70 bytes) — the byte-for-byte Phase 0 shape. */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
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
    name: 'QA Media Owner',
    email: owner,
    password: PASSWORD,
    orgName: ORG_NAME,
  })
})

test('an image upload becomes a WIRE-listed Files row, and Delete removes it from the wire', async ({
  page,
}) => {
  test.setTimeout(150_000)
  await login(page)
  await openSettingsTab(page, 'Knowledge')

  const files = page.getByRole('region', { name: 'Files' })
  await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })

  await page.getByRole('radio', { name: 'Image' }).click()
  await page.getByLabel('What is it?', { exact: true }).fill('Shop window at golden hour')
  await expect(page.getByRole('button', { name: 'Choose a file' })).toBeEnabled()

  // Presign (our API, with `desc`) → PUT to storage FROM CHROMIUM → the row
  // comes back from GET .../media/assets, nowhere else.
  await page.locator('#kn-file').setInputFiles({
    name: 'window.png',
    mimeType: 'image/png',
    buffer: PNG_1X1,
  })
  await expect(page.getByText('Uploaded — the studio has it now')).toBeVisible({
    timeout: SCREEN_SYNC,
  })

  const row = files.getByRole('listitem').filter({ hasText: 'Shop window at golden hour' })
  await expect(row).toBeVisible({ timeout: SCREEN_SYNC })
  await expect(row).toContainText('Image')
  // The live row offers Open (a fresh ~1 h presign on click) — present, not
  // clicked: a popup proves nothing a status code has not already.
  await expect(row.getByRole('button', { name: /^Open/ })).toBeVisible()

  await row.getByRole('button', { name: /^Delete/ }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Deleted')).toBeVisible({ timeout: SCREEN_SYNC })
  // The wire list was re-read; what remains is what it now says: nothing.
  await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })
})

test('the logo uploads with desc "logo", shows as the logo, stays out of Files, and removes', async ({
  page,
}) => {
  test.setTimeout(150_000)
  await login(page)
  await openSettingsTab(page, 'Organization')

  // The lazy list has answered when the button knows what it would replace.
  await expect(page.getByRole('button', { name: 'Upload', exact: true })).toBeEnabled({
    timeout: SCREEN_SYNC,
  })

  await page.getByLabel('Choose a logo image').setInputFiles({
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: PNG_1X1,
  })

  // The ruled status line, then the wire's own logo: the re-read finds the
  // desc "logo" row, read-presigns it, and the avatar shows the stored file.
  await expect(page.getByText('Sent to the studio.')).toBeVisible({ timeout: SCREEN_SYNC })
  await expect(page.getByRole('button', { name: 'Replace', exact: true })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  await expect(page.locator('[data-slot="avatar-image"]').first()).toBeVisible({
    timeout: SCREEN_SYNC,
  })

  // The logo is Organization's, never a Knowledge file: Files stays empty.
  await openSettingsTab(page, 'Knowledge')
  const files = page.getByRole('region', { name: 'Files' })
  await expect(files.getByText(/No files yet/)).toBeVisible({ timeout: SCREEN_SYNC })

  // Remove = DELETE + clear, and the wire agrees on the next read.
  await openSettingsTab(page, 'Organization')
  await expect(page.getByRole('button', { name: 'Remove', exact: true })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
  await page.getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(page.getByText('Removed.')).toBeVisible({ timeout: SCREEN_SYNC })
  await expect(page.getByRole('button', { name: 'Upload', exact: true })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
})
