/**
 * E2E-0820 B9: the ORG-619 SHAPE — a live org with tones but no schedule, and
 * whether the editor alone can repair it.
 *
 * Org 619 came out of the wizard with tones seeded, the schedule missing and
 * the country unset, because Finish swallowed everything after `POST /orgs`
 * (B7 fixed the swallowing). That leaves a question B7 cannot answer: can a
 * user in that state fix it themselves, from C1, without anyone touching the
 * database? Two things have to be true for the answer to be yes, and neither
 * was covered anywhere:
 *
 * 1. `saveSchedule` falls back to `POST` when the org has no schedule to
 *    `PATCH` — the create path, which every other live spec skips because the
 *    wizard has always made a schedule first.
 * 2. The tones the user picks survive the round trip EXACTLY. That is the B9
 *    bug's own ground: the draft is seeded from the pre-sync demo world, so a
 *    screen that saved what it was holding rather than what the user chose
 *    would post ids this org has never had.
 *
 * The org is built by DIRECT API calls, not the wizard — the wizard always
 * creates a schedule, so it cannot produce the state under test.
 */
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const API_BASE = process.env.VITE_API_BASE_URL
const RUN = Date.now()
const PASSWORD = 'Roasted2Order!'
const CODE = '000000'
const owner = `qa+${RUN}r@alphapromena.com`
const ORG_NAME = `QA Repair Org ${RUN}`

test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
test.describe.configure({ mode: 'serial' })

let orgId = ''
/** name -> the id the API minted, so the assertion can name real tones. */
const toneIdByName: Record<string, string> = {}

async function json(response: { json: () => Promise<unknown> }) {
  return (await response.json()) as Record<string, never>
}

test('a live org in the 619 shape: tones seeded, no schedule', async ({ request }) => {
  test.setTimeout(120_000)

  await request.post(`${API_BASE}/auth/signup`, {
    data: { name: 'QA Repair', email: owner, password: PASSWORD },
  })
  const verified = (await json(
    await request.post(`${API_BASE}/auth/verify-email`, {
      data: { email: owner, code: CODE },
    }),
  )) as unknown as { token: string }
  const auth = { authorization: `Bearer ${verified.token}` }

  const created = (await json(
    await request.post(`${API_BASE}/orgs`, { data: { name: ORG_NAME }, headers: auth }),
  )) as unknown as { org: { id: string } }
  orgId = created.org.id

  // Tones yes — exactly the half of Finish that landed for 619.
  for (const tone of [
    { name: 'Provocative', description: 'Takes a position and defends it.' },
    { name: 'Data-driven', description: 'Leads with the number.' },
    { name: 'Educational', description: 'Explains the why before the what.' },
  ]) {
    const row = (await json(
      await request.post(`${API_BASE}/orgs/${orgId}/brand/tones`, {
        data: { ...tone, preset: true, rules: [] },
        headers: auth,
      }),
    )) as unknown as { id: string; name: string }
    toneIdByName[row.name] = row.id
  }

  // Schedule no — the state under test.
  const schedules = (await json(
    await request.get(`${API_BASE}/orgs/${orgId}/schedules`, { headers: auth }),
  )) as unknown as { total: number }
  expect(schedules.total).toBe(0)
})

test('C1 creates the missing schedule through the POST fallback, with the exact tones picked', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000)
  await signIn(page)

  await page.goto('/calendar/settings')
  await expect(page.getByRole('heading', { name: 'Schedule', level: 1 })).toBeVisible({
    timeout: 20_000,
  })
  // The tone picker is the readiness signal that matters here: it renders from
  // the SYNCED world, so a tone this org actually owns being visible proves
  // the draft is no longer sitting on the pre-sync demo schedule (trap 2 says
  // the shell's h1 cannot prove that, and trap 14 says a count cannot either).
  const tones = page.getByRole('group', { name: 'Tones' })
  await expect(tones.getByRole('button', { name: 'Provocative', exact: true })).toBeVisible({
    timeout: 20_000,
  })

  // An org with no schedule arrives BLANK — no days, no tones — rather than
  // wearing the demo's cadence (B9). That is the state being repaired, so the
  // form asks for both.
  await expect(tones.getByRole('button', { name: 'Provocative', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await page.getByRole('button', { name: 'Monday' }).click()
  await page.getByRole('button', { name: 'Wednesday' }).click()

  // Pick a deliberate, checkable subset — not all of them, so a screen that
  // saved "whatever it was holding" would be caught.
  await tones.getByRole('button', { name: 'Provocative', exact: true }).click()
  await tones.getByRole('button', { name: 'Educational', exact: true }).click()

  await expect(page.getByText('You have unsaved changes.')).toBeVisible()
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Schedule saved')).toBeVisible({ timeout: 20_000 })
  // A good save leaves nothing for the leave-guard to refuse (B9).
  await expect(page.getByText('You have unsaved changes.')).toHaveCount(0)

  // The wire agrees: one schedule where there were none, and the tone ids are
  // the ones that were clicked — no demo ghosts, nothing dropped.
  const auth = { authorization: `Bearer ${await sessionToken(page)}` }
  const after = (await json(
    await request.get(`${API_BASE}/orgs/${orgId}/schedules`, { headers: auth }),
  )) as unknown as { total: number; items: { toneIds: string[] }[] }
  expect(after.total).toBe(1)
  expect([...after.items[0].toneIds].sort()).toEqual(
    [toneIdByName['Provocative'], toneIdByName['Educational']].sort(),
  )
})

test('and it survives a reload, still clean', async ({ page }) => {
  test.setTimeout(120_000)
  await signIn(page)

  await page.goto('/calendar/settings')
  await expect(page.getByRole('heading', { name: 'Schedule', level: 1 })).toBeVisible({
    timeout: 20_000,
  })
  const tones = page.getByRole('group', { name: 'Tones' })
  await expect(tones.getByRole('button', { name: 'Provocative', exact: true })).toBeVisible({
    timeout: 20_000,
  })

  // The two picked tones read back as selected, the third does not, and the
  // form is not dirty — the three ways the B9 bug showed itself.
  await expect(tones.getByRole('button', { name: 'Provocative', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(tones.getByRole('button', { name: 'Educational', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(tones.getByRole('button', { name: 'Data-driven', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(page.getByText('You have unsaved changes.')).toHaveCount(0)
})

async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Work email').fill(owner)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
    timeout: 25_000,
  })
}

async function sessionToken(page: Page): Promise<string> {
  const raw = await page.evaluate(
    () =>
      window.sessionStorage.getItem('ab-live-session') ??
      window.localStorage.getItem('ab-live-session'),
  )
  return (JSON.parse(raw!) as { token: string }).token
}
