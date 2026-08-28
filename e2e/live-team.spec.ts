/**
 * INT-2's verify: me + orgs + members + invites against the DEPLOYED API,
 * driven through the real UI â€” the wizard creates the org, I1 renames it,
 * the account section changes the password, and the team screen exercises
 * invite (new AND existing user), resend's rate limit, cancel, the
 * three-tier role ladder, the last-owner laws, leave, and remove.
 *
 * Live-mode runs only; fresh qa+<timestamp> addresses; each purpose sends at
 * most one code per address (the one deliberate immediate resend exists to
 * prove the 429 toast).
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { AFTER_COUNTRY, ONE_CALL, SCREEN_SYNC } from './live-clocks'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const NEW_PASSWORD = 'FreshlyGround3!'
const CODE = '000000'

const owner = `qa+${RUN}o@alphapromena.com`
const invitee = `qa+${RUN}m@alphapromena.com`
const ORG_NAME = `QA Live Org ${RUN}`
const ORG_RENAMED = `QA Live Org ${RUN} v2`

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

/**
 * This file had no cap, so every test in it ran under the suite's 30 s default
 * — and the signup -> wizard -> Finish walk alone measures 27-29 s door to door
 * against today's API (Docs/api/live-red-2026-08-23.md). It could not pass at
 * any wait value. Aligned with the 150 s `live-country` set when Finish became
 * idempotent (E2E-0820 B7); no wait value and no assertion here changed.
 */
test.beforeEach(() => {
  test.setTimeout(150_000)
})

async function signUpAndVerify(page: Page, name: string, email: string) {
  await page.goto('/signup')
  await page.getByLabel('Full name').fill(name)
  await page.getByLabel('Work email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Organization name').fill(ORG_NAME)
  await page.getByRole('checkbox', { name: /terms of service/ }).click()
  await page.getByRole('button', { name: 'Create account' }).click()
  // The run's first POST can hit a cold Lambda; give first contact headroom.
  // One POST round-trip — live-red-2026-08-23.
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({
    timeout: ONE_CALL,
  })
  await page.locator('[data-input-otp]').click()
  await page.keyboard.type(CODE)
  // The verify POST and the auth snapshot behind it — live-red-2026-08-23.
  await expect(page.getByText('finish setting up your workspace')).toBeVisible({
    timeout: ONE_CALL,
  })
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Work email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
  // The signed-out front door is the concept-v2 marketing site (M2): its h1
  // is the hero headline, which spans three lines.
  // One POST round-trip — live-red-2026-08-23.
  await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.', {
    timeout: ONE_CALL,
  })
}

async function openTeam(page: Page) {
  await page.getByRole('link', { name: 'Settings' }).first().click()
  await page.getByRole('tab', { name: 'Team' }).click()
  // "1 member" or "3 members" — the noun agrees with the count now, so this
  // can no longer assume the plural (E2E-0820 F11).
  // The tab's whole sync — live-red-2026-08-23.
  await expect(
    page.getByRole('heading', { level: 2 }).filter({ hasText: /\d+ member/ }),
  ).toBeVisible({ timeout: SCREEN_SYNC })
}

test('the onboarding wizard creates the org LIVE; the dashboard follows', async ({ page }) => {
  await signUpAndVerify(page, 'QA Owner', owner)

  await page.getByRole('link', { name: /Resume setup/ }).click()
  await expect(page.getByRole('heading', { name: 'Tell us about your brand' })).toBeVisible()
  await page.getByLabel('Company name').fill(ORG_NAME)
  await page.getByLabel('What you offer, in one line').fill('Coffee, roasted to order.')
  await page.getByLabel('What sets you apart').fill('Small batch')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Skip for now' }).click()
  await page.getByRole('button', { name: 'Skip for now' }).click()
  await expect(page.getByRole('heading', { name: 'Start your pipeline' })).toBeVisible()
  await page.getByRole('button', { name: 'Start pipeline' }).click()
  await expect(page.getByRole('heading', { name: 'Your pipeline is running' })).toBeVisible()
  await page.getByRole('button', { name: 'Go to your dashboard' }).click()

  // The org now EXISTS server-side; the resync flipped the world onto it.
  // Finish is org + schedule + sources â€” give the burst room.
  // Downstream of PUT /orgs/:id/country — live-red-2026-08-23.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: AFTER_COUNTRY,
  })
})

test('I1 renames the org through PATCH, and the name survives a reload', async ({ page }) => {
  await login(page, owner, PASSWORD)
  // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })

  await page.getByRole('link', { name: 'Settings' }).first().click()
  // The screen's whole sync — live-red-2026-08-23.
  await expect(page.getByLabel('Organization name')).toHaveValue(ORG_NAME, {
    timeout: SCREEN_SYNC,
  })
  await page.getByLabel('Organization name').fill(ORG_RENAMED)
  await page.getByRole('button', { name: 'Save changes' }).click()
  // One PATCH round-trip — live-red-2026-08-23.
  await expect(page.getByText('Organization saved')).toBeVisible({ timeout: ONE_CALL })

  // A reload re-syncs from the server â€” the rename was real, not local.
  await page.goto('/settings/organization')
  // First wait after a reload — the whole org sync — live-red-2026-08-23.
  await expect(page.getByLabel('Organization name')).toHaveValue(ORG_RENAMED, {
    timeout: SCREEN_SYNC,
  })
})

test('change-password keeps this session and only the new password works after', async ({
  page,
}) => {
  await login(page, owner, PASSWORD)
  await page.getByRole('link', { name: 'Settings' }).first().click()

  await page.getByRole('button', { name: 'Change password' }).click()
  await page.getByLabel('Current password').fill(PASSWORD)
  await page.getByLabel('New password').fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Change password' }).last().click()
  // One POST round-trip — live-red-2026-08-23.
  await expect(page.getByText('Password changed')).toBeVisible({ timeout: ONE_CALL })

  await signOut(page)
  await login(page, owner, PASSWORD)
  // One POST round-trip — live-red-2026-08-23.
  await expect(page.getByRole('alert')).toContainText('Incorrect email or password', {
    timeout: ONE_CALL,
  })
  await login(page, owner, NEW_PASSWORD)
  // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
})

test('inviting a NEW user: coded email, resend rate-limits honestly, cancel removes', async ({
  page,
}) => {
  await login(page, owner, NEW_PASSWORD)
  await openTeam(page)

  await page.getByRole('button', { name: 'Invite member' }).click()
  await page.getByLabel('Work email').fill(invitee)
  await page.getByRole('button', { name: 'Send invite' }).click()
  // One POST round-trip — live-red-2026-08-23.
  await expect(page.getByText('Invite sent')).toBeVisible({ timeout: ONE_CALL })
  await expect(page.getByText(invitee)).toBeVisible()

  // A second send inside 60 s is the documented rate limit â€” the toast says
  // the wait, never a silent refusal.
  await page.getByRole('button', { name: 'Resend' }).click()
  // One POST round-trip — live-red-2026-08-23.
  await expect(page.getByText(/Too many requests/)).toBeVisible({ timeout: ONE_CALL })

  await page.getByRole('button', { name: 'Revoke' }).click()
  // One DELETE round-trip — live-red-2026-08-23.
  await expect(page.getByText(invitee)).toHaveCount(0, { timeout: ONE_CALL })
})

test('inviting an EXISTING user adds them immediately, and the role ladder holds', async ({
  page,
}) => {
  // The invitee gets a real account first (no org).
  await signUpAndVerify(page, 'QA Member', invitee)
  await page.goto('/login')

  await login(page, owner, NEW_PASSWORD)
  await openTeam(page)

  // Existing user â†’ membership added on the spot; no pending invite.
  await page.getByRole('button', { name: 'Invite member' }).click()
  await page.getByLabel('Work email').fill(invitee)
  await page.getByRole('button', { name: 'Send invite' }).click()
  // One POST round-trip — live-red-2026-08-23.
  await expect(page.getByText('Added to the workspace')).toBeVisible({ timeout: ONE_CALL })

  const memberRow = page.locator('tr').filter({ hasText: invitee })
  await expect(memberRow).toHaveCount(1)

  // Sole owner: own row explains why leaving is impossible, offers no Leave.
  const ownerRow = page.locator('tr').filter({ hasText: owner })
  await expect(ownerRow.getByText(/You are the only owner/)).toBeVisible()
  await expect(ownerRow.getByRole('button', { name: 'Leave' })).toHaveCount(0)

  // Up the ladder: member â†’ admin (immediate) â†’ owner (ownership transfer).
  await memberRow.getByLabel(/Role for/).selectOption('admin')
  // One PATCH round-trip — live-red-2026-08-23.
  await expect(page.getByText(/is now an admin/)).toBeVisible({ timeout: ONE_CALL })
  await memberRow.getByLabel(/Role for/).selectOption('owner')
  // One PATCH round-trip — live-red-2026-08-23.
  await expect(page.getByText(/is now an owner/)).toBeVisible({ timeout: ONE_CALL })

  // Two owners: Leave now exists for the signed-in owner.
  await expect(ownerRow.getByRole('button', { name: 'Leave' })).toBeVisible()

  // Down the ladder is confirmed, because it takes access away.
  await memberRow.getByLabel(/Role for/).selectOption('admin')
  await page.getByRole('button', { name: 'Change to admin' }).click()
  // One PATCH round-trip — live-red-2026-08-23.
  await expect(page.getByText(/is now an admin/)).toBeVisible({ timeout: ONE_CALL })
  await expect(ownerRow.getByText(/You are the only owner/)).toBeVisible()

  // And to member, then out entirely.
  await memberRow.getByLabel(/Role for/).selectOption('member')
  await page.getByRole('button', { name: 'Change to member' }).click()
  await memberRow.getByRole('button', { name: 'Remove' }).click()
  await page.getByRole('button', { name: 'Remove member' }).click()
  // One DELETE round-trip — live-red-2026-08-23.
  await expect(page.getByText('Member removed')).toBeVisible({ timeout: ONE_CALL })
  await expect(page.locator('tr').filter({ hasText: invitee })).toHaveCount(0)
})

test('an ADMIN viewing a team with an owner: no remove on the owner, no role selects at all', async ({
  page,
}) => {
  // The owner re-adds the (existing) invitee and makes them an admin.
  await login(page, owner, NEW_PASSWORD)
  await openTeam(page)
  await page.getByRole('button', { name: 'Invite member' }).click()
  await page.getByLabel('Work email').fill(invitee)
  await page.getByRole('button', { name: 'Send invite' }).click()
  // One POST round-trip — live-red-2026-08-23.
  await expect(page.getByText('Added to the workspace')).toBeVisible({ timeout: ONE_CALL })
  const memberRow = page.locator('tr').filter({ hasText: invitee })
  await memberRow.getByLabel(/Role for/).selectOption('admin')
  // One PATCH round-trip — live-red-2026-08-23.
  await expect(page.getByText(/is now an admin/)).toBeVisible({ timeout: ONE_CALL })
  await signOut(page)

  // The ADMIN's view. Their power comes from their OWN membership role (the
  // workspace root), so the owner's presence in the list grants them nothing:
  await login(page, invitee, PASSWORD)
  await openTeam(page)

  // â€¦they can manage members (invite is offered),
  await expect(page.getByRole('button', { name: 'Invite member' })).toBeVisible()
  // â€¦they cannot change ANY role (owner-only on the wire) â€” badges, no selects,
  await expect(page.getByLabel(/Role for/)).toHaveCount(0)
  // â€¦and the owner's row offers no Remove (equal-or-higher is a 403 the UI
  // never renders a path to).
  const ownerRow = page.locator('tr').filter({ hasText: owner })
  await expect(ownerRow.getByText('owner', { exact: true })).toBeVisible()
  await expect(ownerRow.getByRole('button', { name: 'Remove' })).toHaveCount(0)
  // Their own row can Leave (they are not the protected tier).
  await expect(
    page.locator('tr').filter({ hasText: invitee }).getByRole('button', { name: 'Leave' }),
  ).toBeVisible()
})
