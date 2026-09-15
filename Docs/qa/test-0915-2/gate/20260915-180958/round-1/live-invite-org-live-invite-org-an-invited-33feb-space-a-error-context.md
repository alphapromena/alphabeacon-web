# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-invite-org.spec.ts >> an invited existing user can REACH the inviting workspace, and a reload keeps it
- Location: e2e\live-invite-org.spec.ts:106:1

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
    4 × locator resolved to <h1 class="truncate font-display text-lg font-semibold tracking-tight">Team</h1>
      - unexpected value "Team"
    36 × locator resolved to <h1 class="font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
       - unexpected value "Welcome back"

```

```yaml
- heading "Welcome back" [level=1]
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
  55  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
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
> 68  |   await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.', {
      |                                                         ^ Error: expect(locator).toContainText(expected) failed
  69  |     timeout: ONE_CALL,
  70  |   })
  71  | }
  72  | 
  73  | /** Add the member to the owner's workspace. No code: they already exist. */
  74  | async function inviteMember(page: Page) {
  75  |   await page.getByRole('link', { name: 'Settings' }).first().click()
  76  |   await page.getByRole('tab', { name: 'Team' }).click()
  77  |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  78  |   await page.getByRole('button', { name: 'Invite member' }).click()
  79  |   await page.getByLabel('Work email').fill(member)
  80  |   await page.getByRole('button', { name: 'Send invite' }).click()
  81  |   await expect(page.getByText('Added to the workspace')).toBeVisible({ timeout: ONE_CALL })
  82  | }
  83  | 
  84  | test('two accounts, each owning a workspace', async ({ page }) => {
  85  |   await signUpAndEnter(page, {
  86  |     name: 'QA Invite Owner',
  87  |     email: owner,
  88  |     password: PASSWORD,
  89  |     orgName: OWNER_ORG,
  90  |   })
  91  |   await signOut(page)
  92  | 
  93  |   await signUpAndEnter(page, {
  94  |     name: 'QA Invite Member',
  95  |     email: member,
  96  |     password: PASSWORD,
  97  |     orgName: MEMBER_ORG,
  98  |   })
  99  |   // One workspace each, so the footer is identity and offers no menu.
  100 |   await expect(workspaceLabel(page).getByText(MEMBER_ORG)).toBeVisible()
  101 |   await expect(workspaceLabel(page).getByRole('button', { name: /Switch workspace/ })).toHaveCount(
  102 |     0,
  103 |   )
  104 | })
  105 | 
  106 | test('an invited existing user can REACH the inviting workspace, and a reload keeps it', async ({
  107 |   page,
  108 | }) => {
  109 |   // The owner invites them. An existing user is added on the spot — no code.
  110 |   await login(page, owner)
  111 |   await inviteMember(page)
  112 |   await signOut(page)
  113 | 
  114 |   await login(page, member)
  115 | 
  116 |   // Where they left off is their OWN org — correct, and still the answer
  117 |   // `orgs[0]` would give. The next lines are the part that used to be
  118 |   // impossible.
  119 |   await expect(workspaceLabel(page).getByText(MEMBER_ORG)).toBeVisible()
  120 | 
  121 |   // THE FIX: two workspaces means the footer is a switcher, and the inviting
  122 |   // org is in it and reachable.
  123 |   const switcher = workspaceLabel(page).getByRole('button', { name: /Switch workspace/ })
  124 |   await expect(switcher).toBeVisible()
  125 |   await switcher.click()
  126 |   await page.getByRole('menuitem', { name: OWNER_ORG }).click()
  127 |   await expect(workspaceLabel(page).getByText(OWNER_ORG)).toBeVisible({ timeout: SCREEN_SYNC })
  128 |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  129 | 
  130 |   /**
  131 |    * AND A RELOAD KEEPS IT (part 2). This is the assertion that would fail on
  132 |    * `orgs[0]`: the member's own org is first in `/me/orgs` (joinedAt
  133 |    * ascending, measured), so landing back in the INVITING org after a full
  134 |    * reload can only mean the remembered choice was honoured.
  135 |    */
  136 |   await page.goto('/')
  137 |   await expect(workspaceLabel(page).getByText(OWNER_ORG)).toBeVisible({ timeout: SCREEN_SYNC })
  138 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  139 | 
  140 |   /**
  141 |    * @axe ON THE SWITCHER, which is the one surface this change adds — and it
  142 |    * can only be scanned HERE. The menu appears at two workspaces, and static
  143 |    * mode has one per world by construction, so the static suite never renders
  144 |    * it at all.
  145 |    *
  146 |    * SCANNED CLOSED, deliberately. Scanning it OPEN was tried first and
  147 |    * reported 142 `aria-hidden-focus` violations — an open Radix menu is modal,
  148 |    * so everything behind it is `aria-hidden` and axe flags every focusable
  149 |    * element back there (state.md trap 10, in its axe form). Those are a fact
  150 |    * about a modal menu, not about this one; the repo's other menus are scanned
  151 |    * closed for the same reason, and shadcn's primitive owns the focus
  152 |    * behaviour inside it by policy (conventions.md).
  153 |    */
  154 |   const switcherTrigger = workspaceLabel(page).getByRole('button', { name: /Switch workspace/ })
  155 |   await expect(switcherTrigger).toBeVisible()
  156 |   expect(
  157 |     (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  158 |   ).toEqual([])
  159 | 
  160 |   // The trigger still says what it is and what it does, with the menu shut.
  161 |   await expect(switcherTrigger).toHaveAttribute('aria-haspopup', 'menu')
  162 |   await expect(switcherTrigger).toHaveAttribute('aria-expanded', 'false')
  163 | })
  164 | 
  165 | test('losing membership falls back honestly, and never to a dead screen', async ({
  166 |   page,
  167 |   request,
  168 | }) => {
```