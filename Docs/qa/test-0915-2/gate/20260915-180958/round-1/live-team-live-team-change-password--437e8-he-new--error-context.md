# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-team.spec.ts >> change-password keeps this session and only the new password works after
- Location: e2e\live-team.spec.ts:116:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('heading', { level: 1 })
Expected substring: "before you were."
Received string:    "Welcome back"
Timeout: 20000ms

Call log:
  - Expect "toContainText" with timeout 20000ms
  - waiting for getByRole('heading', { level: 1 })
    3 × locator resolved to <h1 class="truncate font-display text-lg font-semibold tracking-tight">Organization</h1>
      - unexpected value "Organization"
    37 × locator resolved to <h1 class="font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
       - unexpected value "Welcome back"

```

```yaml
- heading "Welcome back" [level=1]
```

# Test source

```ts
  1   | ﻿/**
  2   |  * INT-2's verify: me + orgs + members + invites against the DEPLOYED API,
  3   |  * driven through the real UI â€” the wizard creates the org, I1 renames it,
  4   |  * the account section changes the password, and the team screen exercises
  5   |  * invite (new AND existing user), resend's rate limit, cancel, the
  6   |  * three-tier role ladder, the last-owner laws, leave, and remove.
  7   |  *
  8   |  * Live-mode runs only; fresh qa+<timestamp> addresses; each purpose sends at
  9   |  * most one code per address (the one deliberate immediate resend exists to
  10  |  * prove the 429 toast).
  11  |  */
  12  | import type { Page } from '@playwright/test'
  13  | import { expect, test } from './fixtures'
  14  | import { signUpAndEnter } from './live-setup'
  15  | import { ONE_CALL, SCREEN_SYNC } from './live-clocks'
  16  | import { runStamp } from './live-setup'
  17  | 
  18  | const API_BASE = process.env.VITE_API_BASE_URL
  19  | const RUN = runStamp()
  20  | const PASSWORD = 'Roasted2Order!'
  21  | const NEW_PASSWORD = 'FreshlyGround3!'
  22  | 
  23  | const owner = `qa+${RUN}o@alphapromena.com`
  24  | const invitee = `qa+${RUN}m@alphapromena.com`
  25  | /** An admin who arrives through the INVITE, not through signup — so this
  26  |  *  account owns no workspace of its own. See the test below for why that
  27  |  *  distinction became load-bearing under ONB-0827. */
  28  | const adminInvitee = `qa+${RUN}a@alphapromena.com`
  29  | const ORG_NAME = `QA Live Org ${RUN}`
  30  | const ORG_RENAMED = `QA Live Org ${RUN} v2`
  31  | 
  32  | test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
  33  | test.describe.configure({ mode: 'serial' })
  34  | 
  35  | /**
  36  |  * This file had no cap, so every test in it ran under the suite's 30 s default
  37  |  * — and the signup -> wizard -> Finish walk alone measures 27-29 s door to door
  38  |  * against today's API (Docs/api/live-red-2026-08-23.md). It could not pass at
  39  |  * any wait value. Aligned with the 150 s `live-country` set when Finish became
  40  |  * idempotent (E2E-0820 B7); no wait value and no assertion here changed.
  41  |  */
  42  | test.beforeEach(() => {
  43  |   test.setTimeout(150_000)
  44  | })
  45  | 
  46  | async function login(page: Page, email: string, password: string) {
  47  |   await page.goto('/login')
  48  |   await page.getByLabel('Work email').fill(email)
  49  |   await page.getByLabel('Password', { exact: true }).fill(password)
  50  |   await page.getByRole('button', { name: 'Sign in' }).click()
  51  | }
  52  | 
  53  | async function signOut(page: Page) {
  54  |   await page.getByRole('button', { name: 'Account menu' }).click()
  55  |   await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
  56  |   // The signed-out front door is the concept-v2 marketing site (M2): its h1
  57  |   // is the hero headline, which spans three lines.
  58  |   // One POST round-trip — live-red-2026-08-23.
> 59  |   await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.', {
      |                                                         ^ Error: expect(locator).toContainText(expected) failed
  60  |     timeout: ONE_CALL,
  61  |   })
  62  | }
  63  | 
  64  | async function openTeam(page: Page) {
  65  |   await page.getByRole('link', { name: 'Settings' }).first().click()
  66  |   await page.getByRole('tab', { name: 'Team' }).click()
  67  |   // "1 member" or "3 members" — the noun agrees with the count now, so this
  68  |   // can no longer assume the plural (E2E-0820 F11).
  69  |   // The tab's whole sync — live-red-2026-08-23.
  70  |   await expect(
  71  |     page.getByRole('heading', { level: 2 }).filter({ hasText: /\d+ member/ }),
  72  |   ).toBeVisible({ timeout: SCREEN_SYNC })
  73  | }
  74  | 
  75  | test('verifying creates the org LIVE; the dashboard follows immediately', async ({ page }) => {
  76  |   // ORDER ONB-0827, D-ONB-C: there is no wizard between verifying and the
  77  |   // product. The org is created from the name typed at signup, the resync
  78  |   // flips the world onto it, and the dashboard is the next thing on screen.
  79  |   await signUpAndEnter(page, {
  80  |     name: 'QA Owner',
  81  |     email: owner,
  82  |     password: PASSWORD,
  83  |     orgName: ORG_NAME,
  84  |   })
  85  | })
  86  | 
  87  | test('I1 renames the org through PATCH, and the name survives a reload', async ({ page }) => {
  88  |   await login(page, owner, PASSWORD)
  89  |   // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  90  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  91  |     timeout: SCREEN_SYNC,
  92  |   })
  93  | 
  94  |   await page.getByRole('link', { name: 'Settings' }).first().click()
  95  |   // The screen's whole sync — live-red-2026-08-23.
  96  |   await expect(page.getByLabel('Organization name')).toHaveValue(ORG_NAME, {
  97  |     timeout: SCREEN_SYNC,
  98  |   })
  99  |   await page.getByLabel('Organization name').fill(ORG_RENAMED)
  100 |   // On production a new org's offer line is empty and REQUIRED (GATE-0910,
  101 |   // item 62): the form refuses any save without it — a rename included — so
  102 |   // the walk fills it, as a user must. The demo world pre-filled it on dev.
  103 |   await page.getByLabel('What you offer, in one line').fill('Small-batch coffee, roasted to order.')
  104 |   await page.getByRole('button', { name: 'Save changes' }).click()
  105 |   // One PATCH round-trip — live-red-2026-08-23.
  106 |   await expect(page.getByText('Organization saved')).toBeVisible({ timeout: ONE_CALL })
  107 | 
  108 |   // A reload re-syncs from the server â€” the rename was real, not local.
  109 |   await page.goto('/settings/organization')
  110 |   // First wait after a reload — the whole org sync — live-red-2026-08-23.
  111 |   await expect(page.getByLabel('Organization name')).toHaveValue(ORG_RENAMED, {
  112 |     timeout: SCREEN_SYNC,
  113 |   })
  114 | })
  115 | 
  116 | test('change-password keeps this session and only the new password works after', async ({
  117 |   page,
  118 | }) => {
  119 |   await login(page, owner, PASSWORD)
  120 |   await page.getByRole('link', { name: 'Settings' }).first().click()
  121 | 
  122 |   await page.getByRole('button', { name: 'Change password' }).click()
  123 |   await page.getByLabel('Current password').fill(PASSWORD)
  124 |   await page.getByLabel('New password').fill(NEW_PASSWORD)
  125 |   await page.getByRole('button', { name: 'Change password' }).last().click()
  126 |   // One POST round-trip — live-red-2026-08-23.
  127 |   await expect(page.getByText('Password changed')).toBeVisible({ timeout: ONE_CALL })
  128 | 
  129 |   await signOut(page)
  130 |   await login(page, owner, PASSWORD)
  131 |   // One POST round-trip — live-red-2026-08-23.
  132 |   await expect(page.getByRole('alert')).toContainText('Incorrect email or password', {
  133 |     timeout: ONE_CALL,
  134 |   })
  135 |   await login(page, owner, NEW_PASSWORD)
  136 |   // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  137 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  138 |     timeout: SCREEN_SYNC,
  139 |   })
  140 | })
  141 | 
  142 | test('inviting a NEW user: coded email, resend rate-limits honestly, cancel removes', async ({
  143 |   page,
  144 | }) => {
  145 |   await login(page, owner, NEW_PASSWORD)
  146 |   await openTeam(page)
  147 | 
  148 |   await page.getByRole('button', { name: 'Invite member' }).click()
  149 |   await page.getByLabel('Work email').fill(invitee)
  150 |   await page.getByRole('button', { name: 'Send invite' }).click()
  151 |   // One POST round-trip — live-red-2026-08-23.
  152 |   await expect(page.getByText('Invite sent')).toBeVisible({ timeout: ONE_CALL })
  153 |   await expect(page.getByText(invitee)).toBeVisible()
  154 | 
  155 |   // A second send inside 60 s is the documented rate limit â€” the toast says
  156 |   // the wait, never a silent refusal.
  157 |   await page.getByRole('button', { name: 'Resend' }).click()
  158 |   // One POST round-trip — live-red-2026-08-23.
  159 |   await expect(page.getByText(/Too many requests/)).toBeVisible({ timeout: ONE_CALL })
```