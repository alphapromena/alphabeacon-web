/**
 * ONB-0827-B's verify: open-item 38, closed against the DEPLOYED API
 * (decisions.md D-ONB-F).
 *
 * ## The measured problem this reproduces
 *
 * Since ONB-0827 every signup mints a workspace. Probing on 2026-08-28 with
 * two fresh accounts that each owned an org (1064 and 1065) showed that an
 * existing user invited to another workspace **could not reach it**: the app
 * worked in `orgs[0]`, `/me/orgs` orders by `joinedAt` ASCENDING, so the first
 * entry is always the org they made first.
 *
 * ## One correction to the order's brief, measured rather than assumed
 *
 * ORDER ONB-0827-B describes this as "existing user … accepts an invite".
 * **An existing user cannot accept an invite** — `POST /orgs/:id/members/
 * invite` answers `invitedNewUser: false` and sends no code, and
 * `POST /auth/accept-invite` for that address answers `400 bad_request
 * "Invalid or expired code"` (request `4b0959ba-b8d1-409a-9816-b93aaa83ef13`).
 * Their membership is simply added. So this file drives the journey the
 * product actually has: invited -> switch -> reload -> revoked -> fallback.
 * The accept path (part 1 of the rule) is a NEW user's, and `live-auth`
 * already walks it; the assertion that it lands in the inviting org is added
 * there rather than duplicated here.
 *
 * Cost: nothing. No generation happens in this file.
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { ONE_CALL, SCREEN_SYNC } from './live-clocks'
import { signUpAndEnter } from './live-setup'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const owner = `qa+${RUN}io@alphapromena.com`
const member = `qa+${RUN}im@alphapromena.com`
const OWNER_ORG = `QA Inviting Org ${RUN}`
const MEMBER_ORG = `QA Member Own Org ${RUN}`

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

test.beforeEach(() => {
  test.setTimeout(180_000)
})

async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Work email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: SCREEN_SYNC,
  })
}

/** The workspace name the rail is currently showing. */
function workspaceLabel(page: Page) {
  return page.locator('[data-sidebar="sidebar"]')
}

async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('before you were.', {
    timeout: ONE_CALL,
  })
}

/** Add the member to the owner's workspace. No code: they already exist. */
async function inviteMember(page: Page) {
  await page.getByRole('link', { name: 'Settings' }).first().click()
  await page.getByRole('tab', { name: 'Team' }).click()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  await page.getByRole('button', { name: 'Invite member' }).click()
  await page.getByLabel('Work email').fill(member)
  await page.getByRole('button', { name: 'Send invite' }).click()
  await expect(page.getByText('Added to the workspace')).toBeVisible({ timeout: ONE_CALL })
}

test('two accounts, each owning a workspace', async ({ page }) => {
  await signUpAndEnter(page, {
    name: 'QA Invite Owner',
    email: owner,
    password: PASSWORD,
    orgName: OWNER_ORG,
  })
  await signOut(page)

  await signUpAndEnter(page, {
    name: 'QA Invite Member',
    email: member,
    password: PASSWORD,
    orgName: MEMBER_ORG,
  })
  // One workspace each, so the footer is identity and offers no menu.
  await expect(workspaceLabel(page).getByText(MEMBER_ORG)).toBeVisible()
  await expect(workspaceLabel(page).getByRole('button', { name: /Switch workspace/ })).toHaveCount(
    0,
  )
})

test('an invited existing user can REACH the inviting workspace, and a reload keeps it', async ({
  page,
}) => {
  // The owner invites them. An existing user is added on the spot — no code.
  await login(page, owner)
  await inviteMember(page)
  await signOut(page)

  await login(page, member)

  // Where they left off is their OWN org — correct, and still the answer
  // `orgs[0]` would give. The next lines are the part that used to be
  // impossible.
  await expect(workspaceLabel(page).getByText(MEMBER_ORG)).toBeVisible()

  // THE FIX: two workspaces means the footer is a switcher, and the inviting
  // org is in it and reachable.
  const switcher = workspaceLabel(page).getByRole('button', { name: /Switch workspace/ })
  await expect(switcher).toBeVisible()
  await switcher.click()
  await page.getByRole('menuitem', { name: OWNER_ORG }).click()
  await expect(workspaceLabel(page).getByText(OWNER_ORG)).toBeVisible({ timeout: SCREEN_SYNC })
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })

  /**
   * AND A RELOAD KEEPS IT (part 2). This is the assertion that would fail on
   * `orgs[0]`: the member's own org is first in `/me/orgs` (joinedAt
   * ascending, measured), so landing back in the INVITING org after a full
   * reload can only mean the remembered choice was honoured.
   */
  await page.goto('/')
  await expect(workspaceLabel(page).getByText(OWNER_ORG)).toBeVisible({ timeout: SCREEN_SYNC })
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()

  /**
   * @axe ON THE SWITCHER, which is the one surface this change adds — and it
   * can only be scanned HERE. The menu appears at two workspaces, and static
   * mode has one per world by construction, so the static suite never renders
   * it at all.
   *
   * SCANNED CLOSED, deliberately. Scanning it OPEN was tried first and
   * reported 142 `aria-hidden-focus` violations — an open Radix menu is modal,
   * so everything behind it is `aria-hidden` and axe flags every focusable
   * element back there (state.md trap 10, in its axe form). Those are a fact
   * about a modal menu, not about this one; the repo's other menus are scanned
   * closed for the same reason, and shadcn's primitive owns the focus
   * behaviour inside it by policy (conventions.md).
   */
  const switcherTrigger = workspaceLabel(page).getByRole('button', { name: /Switch workspace/ })
  await expect(switcherTrigger).toBeVisible()
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([])

  // The trigger still says what it is and what it does, with the menu shut.
  await expect(switcherTrigger).toHaveAttribute('aria-haspopup', 'menu')
  await expect(switcherTrigger).toHaveAttribute('aria-expanded', 'false')
})

test('losing membership falls back honestly, and never to a dead screen', async ({
  page,
  request,
}) => {
  // Get back into the inviting org, the way the previous test did.
  await login(page, member)
  await workspaceLabel(page)
    .getByRole('button', { name: /Switch workspace/ })
    .click()
  await page.getByRole('menuitem', { name: OWNER_ORG }).click()
  await expect(workspaceLabel(page).getByText(OWNER_ORG)).toBeVisible({ timeout: SCREEN_SYNC })

  // The owner removes them from the workspace they are sitting in. Done
  // through the API with the OWNER's own token, so the member's browser
  // context is untouched — which is the whole point: the client finds out on
  // its next read, exactly as it would in life.
  const ownerSession = await request.post(`${API_BASE}/auth/login`, {
    data: { email: owner, password: PASSWORD },
  })
  const ownerToken = ((await ownerSession.json()) as { token: string }).token
  const auth = { authorization: `Bearer ${ownerToken}` }
  const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
    items: { id: string; name: string }[]
  }
  const orgId = orgs.items.find((entry) => entry.name === OWNER_ORG)!.id
  const members = (await (
    await request.get(`${API_BASE}/orgs/${orgId}/members`, { headers: auth })
  ).json()) as { items: { id: string; email: string }[] }
  const row = members.items.find((entry) => entry.email === member)!
  const removed = await request.delete(`${API_BASE}/orgs/${orgId}/members/${row.id}`, {
    headers: auth,
  })
  expect(removed.status()).toBe(204)

  /**
   * The reload boots from a STALE snapshot that still lists the org, so the
   * app opens there — and then the sync refreshes `/me/orgs`, the membership
   * is gone, and the fallback fires. That ordering is the real one and it is
   * why the flag is sticky: the answer arrives after first paint.
   */
  await page.goto('/')
  await expect(workspaceLabel(page).getByText(MEMBER_ORG)).toBeVisible({ timeout: SCREEN_SYNC })
  await expect(page.getByText(/no longer a member of the workspace you were last in/)).toBeVisible({
    timeout: SCREEN_SYNC,
  })

  // One org again, so the menu retires with the second workspace…
  await expect(workspaceLabel(page).getByRole('button', { name: /Switch workspace/ })).toHaveCount(
    0,
  )
  // …and the product is really there, not a husk (trap 20).
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
})
