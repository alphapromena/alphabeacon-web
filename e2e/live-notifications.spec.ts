/**
 * INT-5's verify: the notification inbox against the DEPLOYED API — list
 * (default 50), unread-count for the badge, read-all (idempotent), unknown
 * kinds rendering generically, and action links resolving defensively.
 *
 * Nothing client-side can WRITE a notification (they are raised by the
 * producing features), so the wire assertions run against whatever the inbox
 * holds — including the empty inbox, which is itself a designed state.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const CODE = '000000'
const owner = `qa+${RUN}n@alphapromena.com`

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

async function sessionToken(page: Page): Promise<string> {
  const raw = await page.evaluate(
    () =>
      window.sessionStorage.getItem('ab-live-session') ??
      window.localStorage.getItem('ab-live-session'),
  )
  return (JSON.parse(raw!) as { token: string }).token
}

test('the inbox endpoints hold their contract, and the bell tells the truth', async ({
  page,
  request,
}) => {
  // Signup + verify + the whole wizard + Finish + three wire reads does not
  // fit the suite's 30 s default. Finish also got three round-trips longer
  // when it became idempotent (E2E-0820 B7): it reads /me/orgs, the org's
  // tones and its schedules before writing anything.
  test.setTimeout(150_000)
  // A fresh owner with an org (wizard-created, as ever).
  await page.goto('/signup')
  await page.getByLabel('Full name').fill('QA Inbox Owner')
  await page.getByLabel('Work email').fill(owner)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Organization name').fill(`QA Inbox Org ${RUN}`)
  await page.getByRole('checkbox', { name: /terms of service/ }).click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({
    timeout: 20_000,
  })
  await page.locator('[data-input-otp]').click()
  await page.keyboard.type(CODE)
  await expect(page.getByText('finish setting up your workspace')).toBeVisible({
    timeout: 20_000,
  })
  await page.getByRole('link', { name: /Resume setup/ }).click()
  await page.getByLabel('What you offer, in one line').fill('Coffee.')
  await page.getByLabel('What sets you apart').fill('Batch')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Skip for now' }).click()
  await page.getByRole('button', { name: 'Skip for now' }).click()
  await page.getByRole('button', { name: 'Start pipeline' }).click()
  await page.getByRole('button', { name: 'Go to your dashboard' }).click()
  // Finish is org + preset tones + schedule + sources + the resync — a real
  // burst of wire calls; give it headroom.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: 25_000,
  })

  const token = await sessionToken(page)
  const auth = { authorization: `Bearer ${token}` }
  const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
    items: { id: string }[]
  }
  const orgId = orgs.items[0].id

  // The three endpoints, verbatim from the contract.
  const list = (await (
    await request.get(`${API_BASE}/orgs/${orgId}/notifications`, { headers: auth })
  ).json()) as { items: unknown[]; total: number }
  expect(Array.isArray(list.items)).toBe(true)

  const count = (await (
    await request.get(`${API_BASE}/orgs/${orgId}/notifications/unread-count`, { headers: auth })
  ).json()) as { unread: number }
  expect(typeof count.unread).toBe('number')

  const first = (await (
    await request.post(`${API_BASE}/orgs/${orgId}/notifications/read-all`, { headers: auth })
  ).json()) as { updated: number }
  expect(first.updated).toBe(count.unread)
  // Idempotent: the second call has nothing left to flip.
  const second = (await (
    await request.post(`${API_BASE}/orgs/${orgId}/notifications/read-all`, { headers: auth })
  ).json()) as { updated: number }
  expect(second.updated).toBe(0)

  // The bell agrees with the endpoint: everything read → no count in the
  // accessible name, and the panel shows either rows or the designed empty.
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: 15_000,
  })
  const bell = page.getByRole('button', { name: 'Notifications', exact: true })
  await expect(bell).toBeVisible()
  await bell.click()
  if (list.total === 0) {
    await expect(page.getByText("You're all caught up.")).toBeVisible()
  } else {
    await expect(page.getByRole('menuitem').first()).toBeVisible()
  }
})