# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-team.spec.ts >> I1 renames the org through PATCH, and the name survives a reload
- Location: e2e\live-team.spec.ts:87:1

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator: getByLabel('Organization name')
Expected: "QA Live Org 1789044156794047"
Timeout: 40000ms
Error: element(s) not found

Call log:
  - Expect "toHaveValue" with timeout 40000ms
  - waiting for getByLabel('Organization name')

```

```yaml
- img "Malaky"
- text: Workspace
- list:
  - listitem:
    - link "Dashboard":
      - /url: /
  - listitem:
    - link "Today":
      - /url: /today
  - listitem:
    - link "Generate":
      - /url: /generate
  - listitem:
    - link "Calendar":
      - /url: /calendar
  - listitem:
    - link "Studio":
      - /url: /studio
  - listitem:
    - link "Analytics":
      - /url: /analytics
  - listitem:
    - link "Connections":
      - /url: /connections
  - listitem:
    - link "Billing":
      - /url: /billing
  - listitem:
    - link "Settings":
      - /url: /settings
- text: Q QA Live Org 1789044156794047
- button "Toggle Sidebar"
- banner:
  - button "Toggle Sidebar"
  - heading "Settings" [level=1]
  - link "Balance could not be read":
    - /url: /billing/balance
  - button "Notifications"
  - button "Switch to dark theme"
  - button "Account menu": QO
- main:
  - navigation "Settings sections":
    - tablist:
      - tab "Organization" [selected]
      - tab "Brand voice"
      - tab "Tones"
      - tab "Sources & topics"
      - tab "Knowledge"
      - tab "Team"
  - tabpanel "Organization":
    - alert:
      - paragraph: Something went wrong
      - paragraph: We couldn't load this screen. Try again in a moment.
      - button "Try again"
- region "Notifications alt+T"
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
  59  |   await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.', {
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
> 96  |   await expect(page.getByLabel('Organization name')).toHaveValue(ORG_NAME, {
      |                                                      ^ Error: expect(locator).toHaveValue(expected) failed
  97  |     timeout: SCREEN_SYNC,
  98  |   })
  99  |   await page.getByLabel('Organization name').fill(ORG_RENAMED)
  100 |   await page.getByRole('button', { name: 'Save changes' }).click()
  101 |   // One PATCH round-trip — live-red-2026-08-23.
  102 |   await expect(page.getByText('Organization saved')).toBeVisible({ timeout: ONE_CALL })
  103 | 
  104 |   // A reload re-syncs from the server â€” the rename was real, not local.
  105 |   await page.goto('/settings/organization')
  106 |   // First wait after a reload — the whole org sync — live-red-2026-08-23.
  107 |   await expect(page.getByLabel('Organization name')).toHaveValue(ORG_RENAMED, {
  108 |     timeout: SCREEN_SYNC,
  109 |   })
  110 | })
  111 | 
  112 | test('change-password keeps this session and only the new password works after', async ({
  113 |   page,
  114 | }) => {
  115 |   await login(page, owner, PASSWORD)
  116 |   await page.getByRole('link', { name: 'Settings' }).first().click()
  117 | 
  118 |   await page.getByRole('button', { name: 'Change password' }).click()
  119 |   await page.getByLabel('Current password').fill(PASSWORD)
  120 |   await page.getByLabel('New password').fill(NEW_PASSWORD)
  121 |   await page.getByRole('button', { name: 'Change password' }).last().click()
  122 |   // One POST round-trip — live-red-2026-08-23.
  123 |   await expect(page.getByText('Password changed')).toBeVisible({ timeout: ONE_CALL })
  124 | 
  125 |   await signOut(page)
  126 |   await login(page, owner, PASSWORD)
  127 |   // One POST round-trip — live-red-2026-08-23.
  128 |   await expect(page.getByRole('alert')).toContainText('Incorrect email or password', {
  129 |     timeout: ONE_CALL,
  130 |   })
  131 |   await login(page, owner, NEW_PASSWORD)
  132 |   // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  133 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  134 |     timeout: SCREEN_SYNC,
  135 |   })
  136 | })
  137 | 
  138 | test('inviting a NEW user: coded email, resend rate-limits honestly, cancel removes', async ({
  139 |   page,
  140 | }) => {
  141 |   await login(page, owner, NEW_PASSWORD)
  142 |   await openTeam(page)
  143 | 
  144 |   await page.getByRole('button', { name: 'Invite member' }).click()
  145 |   await page.getByLabel('Work email').fill(invitee)
  146 |   await page.getByRole('button', { name: 'Send invite' }).click()
  147 |   // One POST round-trip — live-red-2026-08-23.
  148 |   await expect(page.getByText('Invite sent')).toBeVisible({ timeout: ONE_CALL })
  149 |   await expect(page.getByText(invitee)).toBeVisible()
  150 | 
  151 |   // A second send inside 60 s is the documented rate limit â€” the toast says
  152 |   // the wait, never a silent refusal.
  153 |   await page.getByRole('button', { name: 'Resend' }).click()
  154 |   // One POST round-trip — live-red-2026-08-23.
  155 |   await expect(page.getByText(/Too many requests/)).toBeVisible({ timeout: ONE_CALL })
  156 | 
  157 |   await page.getByRole('button', { name: 'Revoke' }).click()
  158 |   // One DELETE round-trip — live-red-2026-08-23.
  159 |   await expect(page.getByText(invitee)).toHaveCount(0, { timeout: ONE_CALL })
  160 | })
  161 | 
  162 | test('inviting an EXISTING user adds them immediately, and the role ladder holds', async ({
  163 |   page,
  164 | }) => {
  165 |   // The invitee gets a real account first. Since ONB-0827 that account also
  166 |   // gets a workspace of its own — every signup does — which is exactly what
  167 |   // makes them an EXISTING user for the invite below rather than a new one.
  168 |   await signUpAndEnter(page, {
  169 |     name: 'QA Member',
  170 |     email: invitee,
  171 |     password: PASSWORD,
  172 |     orgName: `QA Member Org ${RUN}`,
  173 |   })
  174 |   // SIGN OUT, do not just navigate. Since ONB-0827 this account has a
  175 |   // workspace, so `SignedOutOnly` redirects a signed-in user away from /login
  176 |   // and the form never renders — a bare `goto('/login')` used to work only
  177 |   // because an invitee had no org to be redirected into (D-ONB-C).
  178 |   await signOut(page)
  179 | 
  180 |   await login(page, owner, NEW_PASSWORD)
  181 |   await openTeam(page)
  182 | 
  183 |   // Existing user â†’ membership added on the spot; no pending invite.
  184 |   await page.getByRole('button', { name: 'Invite member' }).click()
  185 |   await page.getByLabel('Work email').fill(invitee)
  186 |   await page.getByRole('button', { name: 'Send invite' }).click()
  187 |   // One POST round-trip — live-red-2026-08-23.
  188 |   await expect(page.getByText('Added to the workspace')).toBeVisible({ timeout: ONE_CALL })
  189 | 
  190 |   const memberRow = page.locator('tr').filter({ hasText: invitee })
  191 |   await expect(memberRow).toHaveCount(1)
  192 | 
  193 |   // Sole owner: own row explains why leaving is impossible, offers no Leave.
  194 |   const ownerRow = page.locator('tr').filter({ hasText: owner })
  195 |   await expect(ownerRow.getByText(/You are the only owner/)).toBeVisible()
  196 |   await expect(ownerRow.getByRole('button', { name: 'Leave' })).toHaveCount(0)
```