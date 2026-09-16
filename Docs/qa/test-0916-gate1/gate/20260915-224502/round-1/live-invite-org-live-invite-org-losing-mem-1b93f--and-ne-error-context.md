# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-invite-org.spec.ts >> losing membership falls back honestly, and never to a dead screen
- Location: e2e\live-invite-org.spec.ts:169:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Dashboard', level: 1 })
Expected: visible
Timeout: 40000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 40000ms
  - waiting for getByRole('heading', { name: 'Dashboard', level: 1 })

```

```yaml
- link "Malaky":
  - /url: /
  - img "Malaky"
- heading "Welcome back" [level=1]
- paragraph: Pick up where your queue left off.
- alert: The server did not answer. Try again.
- group:
  - text: Work email
  - textbox "Work email":
    - /placeholder: you@company.com
    - text: qa+1789513223445930im@alphapromena.com
- group:
  - text: Password
  - textbox "Password": Roasted2Order!
- checkbox "Keep me signed in on this device"
- text: Keep me signed in on this device
- link "Forgot password?":
  - /url: /reset-password
- button "Sign in"
- text: New here?
- link "Create an account":
  - /url: /signup
- complementary:
  - blockquote:
    - paragraph: Nothing waiting on you goes unnoticed.
    - paragraph: The beacon only pulses when something genuinely needs review — so an empty queue means you are actually done.
- region "Notifications alt+T"
```

# Test source

```ts
  1   | /**
  2   |  * ONB-0827-B's verify: open-item 38, closed against the DEPLOYED API
  3   |  * (decisions.md D-ONB-F).
  4   |  *
  5   |  * ## The measured problem this reproduces
  6   |  *
  7   |  * Since ONB-0827 every signup mints a workspace. Probing on 2026-08-28 with
  8   |  * two fresh accounts that each owned an org (1064 and 1065) showed that an
  9   |  * existing user invited to another workspace **could not reach it**: the app
  10  |  * worked in `orgs[0]`, `/me/orgs` orders by `joinedAt` ASCENDING, so the first
  11  |  * entry is always the org they made first.
  12  |  *
  13  |  * ## One correction to the order's brief, measured rather than assumed
  14  |  *
  15  |  * ORDER ONB-0827-B describes this as "existing user … accepts an invite".
  16  |  * **An existing user cannot accept an invite** — `POST /orgs/:id/members/
  17  |  * invite` answers `invitedNewUser: false` and sends no code, and
  18  |  * `POST /auth/accept-invite` for that address answers `400 bad_request
  19  |  * "Invalid or expired code"` (request `4b0959ba-b8d1-409a-9816-b93aaa83ef13`).
  20  |  * Their membership is simply added. So this file drives the journey the
  21  |  * product actually has: invited -> switch -> reload -> revoked -> fallback.
  22  |  * The accept path (part 1 of the rule) is a NEW user's, and `live-auth`
  23  |  * already walks it; the assertion that it lands in the inviting org is added
  24  |  * there rather than duplicated here.
  25  |  *
  26  |  * Cost: nothing. No generation happens in this file.
  27  |  */
  28  | import AxeBuilder from '@axe-core/playwright'
  29  | import type { Page } from '@playwright/test'
  30  | import { expect, test } from './fixtures'
  31  | import { ONE_CALL, SCREEN_SYNC } from './live-clocks'
  32  | import { signUpAndEnter } from './live-setup'
  33  | import { runStamp } from './live-setup'
  34  | 
  35  | const API_BASE = process.env.VITE_API_BASE_URL
  36  | const RUN = runStamp()
  37  | const PASSWORD = 'Roasted2Order!'
  38  | const owner = `qa+${RUN}io@alphapromena.com`
  39  | const member = `qa+${RUN}im@alphapromena.com`
  40  | const OWNER_ORG = `QA Inviting Org ${RUN}`
  41  | const MEMBER_ORG = `QA Member Own Org ${RUN}`
  42  | 
  43  | test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
  44  | test.describe.configure({ mode: 'serial' })
  45  | 
  46  | test.beforeEach(() => {
  47  |   test.setTimeout(180_000)
  48  | })
  49  | 
  50  | async function login(page: Page, email: string) {
  51  |   await page.goto('/login')
  52  |   await page.getByLabel('Work email').fill(email)
  53  |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  54  |   await page.getByRole('button', { name: 'Sign in' }).click()
> 55  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
      |                                                                            ^ Error: expect(locator).toBeVisible() failed
  56  |     timeout: SCREEN_SYNC,
  57  |   })
  58  | }
  59  | 
  60  | /** The workspace name the rail is currently showing. */
  61  | function workspaceLabel(page: Page) {
  62  |   return page.locator('[data-sidebar="sidebar"]')
  63  | }
  64  | 
  65  | async function signOut(page: Page) {
  66  |   await page.getByRole('button', { name: 'Account menu' }).click()
  67  |   await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
  68  |   // A deliberate sign-out lands on the marketing home from ANY route: the
  69  |   // action moves to `/` before the session clears (NIGHT-0916 order 2,
  70  |   // D-NIGHT-0916-B); the M2 hero headline spans three lines.
  71  |   // One POST round-trip — live-red-2026-08-23.
  72  |   await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.', {
  73  |     timeout: ONE_CALL,
  74  |   })
  75  | }
  76  | 
  77  | /** Add the member to the owner's workspace. No code: they already exist. */
  78  | async function inviteMember(page: Page) {
  79  |   await page.getByRole('link', { name: 'Settings' }).first().click()
  80  |   await page.getByRole('tab', { name: 'Team' }).click()
  81  |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  82  |   await page.getByRole('button', { name: 'Invite member' }).click()
  83  |   await page.getByLabel('Work email').fill(member)
  84  |   await page.getByRole('button', { name: 'Send invite' }).click()
  85  |   await expect(page.getByText('Added to the workspace')).toBeVisible({ timeout: ONE_CALL })
  86  | }
  87  | 
  88  | test('two accounts, each owning a workspace', async ({ page }) => {
  89  |   await signUpAndEnter(page, {
  90  |     name: 'QA Invite Owner',
  91  |     email: owner,
  92  |     password: PASSWORD,
  93  |     orgName: OWNER_ORG,
  94  |   })
  95  |   await signOut(page)
  96  | 
  97  |   await signUpAndEnter(page, {
  98  |     name: 'QA Invite Member',
  99  |     email: member,
  100 |     password: PASSWORD,
  101 |     orgName: MEMBER_ORG,
  102 |   })
  103 |   // One workspace each, so the footer is identity and offers no menu.
  104 |   await expect(workspaceLabel(page).getByText(MEMBER_ORG)).toBeVisible()
  105 |   await expect(workspaceLabel(page).getByRole('button', { name: /Switch workspace/ })).toHaveCount(
  106 |     0,
  107 |   )
  108 | })
  109 | 
  110 | test('an invited existing user can REACH the inviting workspace, and a reload keeps it', async ({
  111 |   page,
  112 | }) => {
  113 |   // The owner invites them. An existing user is added on the spot — no code.
  114 |   await login(page, owner)
  115 |   await inviteMember(page)
  116 |   await signOut(page)
  117 | 
  118 |   await login(page, member)
  119 | 
  120 |   // Where they left off is their OWN org — correct, and still the answer
  121 |   // `orgs[0]` would give. The next lines are the part that used to be
  122 |   // impossible.
  123 |   await expect(workspaceLabel(page).getByText(MEMBER_ORG)).toBeVisible()
  124 | 
  125 |   // THE FIX: two workspaces means the footer is a switcher, and the inviting
  126 |   // org is in it and reachable.
  127 |   const switcher = workspaceLabel(page).getByRole('button', { name: /Switch workspace/ })
  128 |   await expect(switcher).toBeVisible()
  129 |   await switcher.click()
  130 |   await page.getByRole('menuitem', { name: OWNER_ORG }).click()
  131 |   await expect(workspaceLabel(page).getByText(OWNER_ORG)).toBeVisible({ timeout: SCREEN_SYNC })
  132 |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  133 | 
  134 |   /**
  135 |    * AND A RELOAD KEEPS IT (part 2). This is the assertion that would fail on
  136 |    * `orgs[0]`: the member's own org is first in `/me/orgs` (joinedAt
  137 |    * ascending, measured), so landing back in the INVITING org after a full
  138 |    * reload can only mean the remembered choice was honoured.
  139 |    */
  140 |   await page.goto('/')
  141 |   await expect(workspaceLabel(page).getByText(OWNER_ORG)).toBeVisible({ timeout: SCREEN_SYNC })
  142 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  143 | 
  144 |   /**
  145 |    * @axe ON THE SWITCHER, which is the one surface this change adds — and it
  146 |    * can only be scanned HERE. The menu appears at two workspaces, and static
  147 |    * mode has one per world by construction, so the static suite never renders
  148 |    * it at all.
  149 |    *
  150 |    * SCANNED CLOSED, deliberately. Scanning it OPEN was tried first and
  151 |    * reported 142 `aria-hidden-focus` violations — an open Radix menu is modal,
  152 |    * so everything behind it is `aria-hidden` and axe flags every focusable
  153 |    * element back there (state.md trap 10, in its axe form). Those are a fact
  154 |    * about a modal menu, not about this one; the repo's other menus are scanned
  155 |    * closed for the same reason, and shadcn's primitive owns the focus
```