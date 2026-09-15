/**
 * TEST-0915 · Phase 3 proofs A, B, C, F (the live half) and I — against the
 * DEPLOYED dev API through the built app served on a local port. Zero spend:
 * auth, org creation, brand reads and writes, one revoked session.
 *
 * Every check writes PASS/FAIL with the measured value and the request ids
 * into `<out>/proofs-<label>.md`, plus one screenshot per state. A failing
 * check never stops the next proof: the record needs every number, not the
 * first.
 *
 * Usage (the API base is VITE_API_BASE_URL, the same value the served build
 * inlines; E2E_API_ENV=dev is required, HSN-0910/D):
 *   pnpm exec tsx scripts/probe-test-0915-live.ts --base <served app> \
 *     --out Docs/qa/test-0915/proofs --org-a <email> --org-b <email> --password <pw> \
 *     [--proofs A,B,C,F,I] [--label live]
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import {
  chromium,
  request as playwrightRequest,
  type APIRequestContext,
  type Browser,
  type Page,
} from '@playwright/test'

const args = process.argv.slice(2)
function arg(name: string, fallback?: string): string {
  const index = args.indexOf(`--${name}`)
  const value = index >= 0 ? args[index + 1] : undefined
  if (value === undefined) {
    if (fallback === undefined) throw new Error(`missing --${name}`)
    return fallback
  }
  return value
}

if (process.env.E2E_API_ENV !== 'dev') {
  console.error(
    'refusing: E2E_API_ENV must be "dev" for anything that writes to the API (HSN-0910/D)',
  )
  process.exit(2)
}
const API = (process.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '')
if (!API) {
  console.error('refusing: VITE_API_BASE_URL is not set')
  process.exit(2)
}

const BASE = arg('base').replace(/\/+$/, '')
const OUT = arg('out')
const ORG_A = arg('org-a')
const ORG_B = arg('org-b')
const PASSWORD = arg('password')
const PROOFS = arg('proofs', 'A,B,C,F,I').split(',')
const LABEL = arg('label', 'live')
const SCREEN_SYNC = 40_000
const ONE_CALL = 20_000

const NOTICE_EXTRA_ROWS =
  'This workspace has extra brand voice rows that this screen cannot edit. Their rules still shape every draft, and the count below covers only the rules shown here. Ask a workspace owner or admin to merge them into this list.'
const CAP_SENTENCE =
  'You can keep at most 40 brand voice rules across Do and Don’t. Remove one to add another.'
const SESSION_ENDED = 'Your session ended. Sign in again to continue.'
const CONNECTIONS_PREVIEW =
  'Connecting walks the flow, but no channel is linked to a platform yet — that arrives with publishing. Nothing here posts on your behalf.'

/** Records whether the first-light overlay ever mounted, however briefly. */
const FIRST_LIGHT_WATCH = `
  (() => {
    window.__fl = { mounted: false, at: -1, removedAt: -1 };
    new MutationObserver(() => {
      const el = document.querySelector('[data-slot="first-light"]');
      if (el && !window.__fl.mounted) { window.__fl.mounted = true; window.__fl.at = performance.now(); }
      if (!el && window.__fl.mounted && window.__fl.removedAt < 0) window.__fl.removedAt = performance.now();
    }).observe(document.documentElement, { childList: true, subtree: true });
  })()
`

interface Row {
  proof: string
  check: string
  result: 'PASS' | 'FAIL' | 'NOTE'
  detail: string
}
const rows: Row[] = []
const record = (proof: string, check: string, ok: boolean, detail: string) => {
  rows.push({ proof, check, result: ok ? 'PASS' : 'FAIL', detail })
  console.log(`[${proof}] ${ok ? 'PASS' : 'FAIL'} · ${check} · ${detail}`)
}
const note = (proof: string, check: string, detail: string) => {
  rows.push({ proof, check, result: 'NOTE', detail })
  console.log(`[${proof}] NOTE · ${check} · ${detail}`)
}

interface Wire {
  status: number
  rid: string
  json: unknown
}
async function api(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  token?: string,
  body?: unknown,
): Promise<Wire> {
  const res = await request.fetch(`${API}${path}`, {
    method,
    headers: {
      accept: 'application/json',
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    data: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const rid = res.headers()['x-request-id'] ?? '(unexposed)'
  let json: unknown
  try {
    json = await res.json()
  } catch {
    json = await res.text()
  }
  return { status: res.status(), rid, json }
}

interface VoiceRow {
  id: string
  name: string
  rules: { kind: string; text: string }[]
}
async function voices(request: APIRequestContext, token: string, orgId: string) {
  const r = await api(request, 'GET', `/orgs/${orgId}/brand/voices`, token)
  const items = ((r.json as { items?: VoiceRow[] }).items ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    rules: v.rules.map((x) => `${x.kind}: ${x.text}`),
  }))
  return { rid: r.rid, status: r.status, items }
}

async function login(page: Page, email: string) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Work email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: SCREEN_SYNC })
}

async function openTab(page: Page, tab: string) {
  await page.getByRole('link', { name: 'Settings' }).first().click()
  await page.getByRole('tab', { name: tab }).click()
  await page
    .locator('[aria-busy="true"]')
    .first()
    .waitFor({ state: 'detached', timeout: SCREEN_SYNC })
    .catch(() => {})
  await page.waitForTimeout(300)
}

async function sessionToken(page: Page): Promise<string> {
  const raw = await page.evaluate(
    () =>
      window.sessionStorage.getItem('ab-live-session') ??
      window.localStorage.getItem('ab-live-session'),
  )
  if (!raw) throw new Error('no live session in storage')
  return (JSON.parse(raw) as { token: string }).token
}

async function orgIdOf(request: APIRequestContext, token: string): Promise<string> {
  const r = await api(request, 'GET', '/me/orgs', token)
  return ((r.json as { items: { id: string }[] }).items[0] ?? { id: '' }).id
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
}

const doInputs = (page: Page) => page.getByRole('textbox', { name: /^Do rule \d+$/ })
const dontInputs = (page: Page) => page.getByRole('textbox', { name: /^Don't rule \d+$/ })
/** The combined counter — the `aria-live` span, not the cap sentence that also names the lists. */
const counterOf = async (page: Page) =>
  (await page.locator('span[aria-live="polite"]').filter({ hasText: '/ 40' }).innerText()).replace(
    /\s+/g,
    ' ',
  )

// ---------------------------------------------------------------- proof A
async function proofA(browser: Browser, request: APIRequestContext) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  try {
    await login(page, ORG_A)
    const token = await sessionToken(page)
    const orgId = await orgIdOf(request, token)
    const before = await voices(request, token, orgId)
    const canonical = [...before.items].sort((a, b) => Number(a.id) - Number(b.id))[0]
    const extra = before.items.filter((v) => v.id !== canonical.id)
    note(
      'A',
      'wire order',
      `GET voices (request ${before.rid}) lists newest first: [${before.items.map((v) => v.id).join(', ')}]; the OLDEST same-named row is ${canonical.id} with ${JSON.stringify(canonical.rules)}; extra row(s) ${extra.map((v) => `${v.id} ${JSON.stringify(v.rules)}`).join('; ')}`,
    )
    record(
      'A',
      'the wire lists the newer row first (createdAt DESC), so a first-item read would pick the wrong row',
      before.items[0]?.id !== canonical.id,
      `items[0].id = ${before.items[0]?.id}, canonical (oldest) = ${canonical.id}`,
    )

    await openTab(page, 'Brand voice')
    const doVal = await page.getByRole('textbox', { name: 'Do rule 1', exact: true }).inputValue()
    const dontVal = await page
      .getByRole('textbox', { name: "Don't rule 1", exact: true })
      .inputValue()
    const nDo = await doInputs(page).count()
    const nDont = await dontInputs(page).count()
    record(
      'A',
      'the screen reads the CANONICAL row (creation order), not the newest',
      doVal === 'Canonical do rule' &&
        dontVal === 'Canonical dont rule' &&
        nDo === 1 &&
        nDont === 1,
      `Do rule 1 = ${JSON.stringify(doVal)}, Don't rule 1 = ${JSON.stringify(dontVal)}, ${nDo} do + ${nDont} dont inputs (the extra row's "Extra do rule" is not on screen)`,
    )
    const extraValues = await page
      .locator('input')
      .evaluateAll((els) =>
        els.map((el) => (el as HTMLInputElement).value).filter((v) => v.includes('Extra')),
      )
    record(
      'A',
      'no extra-row rule is editable on screen',
      extraValues.length === 0,
      `inputs carrying "Extra": ${JSON.stringify(extraValues)}`,
    )

    const notice = page.getByRole('status').filter({ hasText: 'extra brand voice rows' })
    const noticeText = (await notice.count())
      ? (await notice.first().innerText()).replace(/\s+/g, ' ').trim()
      : '(no notice)'
    record(
      'A',
      'the extra-rows notice renders with the owner-or-admin wording',
      noticeText.includes(NOTICE_EXTRA_ROWS) && /\(\s*1 extra row,\s*2 rules\s*\)/.test(noticeText),
      `notice: "${noticeText}"`,
    )
    const counter = await counterOf(page)
    record(
      'A',
      'the counter covers only the rules shown',
      /^2 \/ 40/.test(counter),
      `counter: "${counter}"`,
    )
    await shot(page, 'proof-a-1-canonical-and-notice')

    // Removal, through the screen, and the wire is the record.
    await page.getByRole('button', { name: 'Remove do rule 1', exact: true }).click()
    await page.getByRole('button', { name: 'Save changes' }).click()
    await page.getByText('Brand voice saved').waitFor({ timeout: ONE_CALL })
    await page.waitForTimeout(1500)
    const after = await voices(request, token, orgId)
    const canonicalAfter = after.items.find((v) => v.id === canonical.id)
    const extraAfter = after.items.filter((v) => v.id !== canonical.id)
    record(
      'A',
      'removing a rule through the screen shrinks ONLY the canonical row on the wire',
      JSON.stringify(canonicalAfter?.rules) === JSON.stringify(['dont: Canonical dont rule']) &&
        JSON.stringify(extraAfter.map((v) => v.rules)) ===
          JSON.stringify(extra.map((v) => v.rules)),
      `request ${after.rid}: canonical ${canonical.id} → ${JSON.stringify(canonicalAfter?.rules)}; extra untouched: ${JSON.stringify(extraAfter.map((v) => v.rules))}`,
    )
    await shot(page, 'proof-a-2-after-removal')

    await page.goto(`${BASE}/settings/brand-voice`, { waitUntil: 'domcontentloaded' })
    await page
      .getByRole('textbox', { name: "Don't rule 1", exact: true })
      .waitFor({ timeout: SCREEN_SYNC })
    const reloadDont = await page
      .getByRole('textbox', { name: "Don't rule 1", exact: true })
      .inputValue()
    const reloadDo = await doInputs(page).count()
    record(
      'A',
      'after a reload the screen still shows the canonical row only',
      reloadDont === 'Canonical dont rule' && reloadDo === 0,
      `Don't rule 1 = ${JSON.stringify(reloadDont)}, do inputs = ${reloadDo}`,
    )
  } catch (error) {
    record('A', 'proof ran to the end', false, String(error).slice(0, 300))
    await shot(page, 'proof-a-error').catch(() => {})
  } finally {
    await context.close()
  }
}

// ---------------------------------------------------------------- proof C
async function proofC(browser: Browser, request: APIRequestContext) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  try {
    await login(page, ORG_A)
    const token = await sessionToken(page)
    const orgId = await orgIdOf(request, token)
    const before = await voices(request, token, orgId)
    const canonical = [...before.items].sort((a, b) => Number(a.id) - Number(b.id))[0]
    await openTab(page, 'Brand voice')

    const RID = `test-0915-proof-c-${Date.now()}`
    let intercepted = 0
    await page.route('**/brand/voices/*', async (route) => {
      const req = route.request()
      if (req.method() !== 'PATCH') return route.continue()
      intercepted += 1
      await route.fulfill({
        status: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': new URL(BASE).origin,
          'access-control-expose-headers': 'x-request-id',
          'x-request-id': RID,
        },
        body: JSON.stringify({
          error: {
            code: 'validation_failed',
            message: 'Validation failed',
            details: [{ field: 'rules', message: 'Too big: expected array to have <=50 items' }],
            requestId: RID,
          },
        }),
      })
    })
    const beforeCount = await doInputs(page).count()
    await page.getByRole('button', { name: 'Add do', exact: true }).click()
    await page
      .getByRole('textbox', { name: `Do rule ${beforeCount + 1}`, exact: true })
      .fill('Proof C rule')
    await page.getByRole('button', { name: 'Save changes' }).click()
    // Watch the whole window: the toast, the in-screen alert, and any "saved".
    const errorToast = page.locator('[data-sonner-toast]').filter({ hasText: 'Too big' })
    await errorToast
      .first()
      .waitFor({ timeout: ONE_CALL })
      .catch(() => {})
    const toastText = (await errorToast.count())
      ? (await errorToast.first().innerText()).replace(/\s+/g, ' ')
      : '(no error toast)'
    const alert = page.getByRole('alert').filter({ hasText: 'Too big' })
    const alertSeen = await alert
      .first()
      .waitFor({ timeout: 3000 })
      .then(() => true)
      .catch(() => false)
    const alertText = alertSeen ? (await alert.first().innerText()).replace(/\s+/g, ' ') : ''
    await shot(page, 'proof-c-1-refused-save')
    await page.waitForTimeout(3000)
    const savedCount = await page.getByText('Brand voice saved').count()
    const busy = await page.locator('[aria-busy="true"]').count()
    const draftStill = await page
      .locator('input')
      .evaluateAll((els) => els.some((el) => (el as HTMLInputElement).value === 'Proof C rule'))
    const saveButton = await page.getByRole('button', { name: 'Save changes' }).count()
    record(
      'C',
      'a 400 from the wire never becomes "saved": no success toast, and the error toast carries the wire\'s own field message',
      intercepted >= 1 &&
        savedCount === 0 &&
        toastText.includes('Too big: expected array to have <=50 items'),
      `PATCH intercepted ${intercepted}×; "Brand voice saved" on screen: ${savedCount}; error toast: "${toastText}"`,
    )
    record(
      'C',
      'the in-screen refusal (role=alert with the request id) is still on screen 3 s later, with the draft and the Save button',
      alertSeen && alertText.includes(`request ${RID}`) && draftStill && saveButton === 1,
      `alert seen at all: ${alertSeen}${alertSeen ? ` ("${alertText}")` : ''}; after 3 s — draft "Proof C rule" still in an input: ${draftStill}; Save button: ${saveButton}; aria-busy regions: ${busy}`,
    )
    await shot(page, 'proof-c-2-three-seconds-later')
    await page.unroute('**/brand/voices/*')
    const wire = await voices(request, token, orgId)
    const canonicalC = wire.items.find((v) => v.id === canonical.id)
    record(
      'C',
      'the wire holds exactly what it held before the refused save',
      JSON.stringify(canonicalC?.rules) === JSON.stringify(canonical.rules),
      `request ${wire.rid}: canonical ${canonical.id} → ${JSON.stringify(canonicalC?.rules)} (before: ${JSON.stringify(canonical.rules)})`,
    )
  } catch (error) {
    record('C', 'proof ran to the end', false, String(error).slice(0, 300))
    await shot(page, 'proof-c-error').catch(() => {})
  } finally {
    await context.close()
  }
}

// ---------------------------------------------------------------- proof B
async function proofB(browser: Browser, request: APIRequestContext) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1400 } })
  const page = await context.newPage()
  try {
    await login(page, ORG_B)
    const token = await sessionToken(page)
    const orgId = await orgIdOf(request, token)
    const before = await voices(request, token, orgId)
    const total = before.items.reduce((n, v) => n + v.rules.length, 0)
    note(
      'B',
      'the contract number',
      `Docs/api/api.md:675 — "at most **50** rules per create/PATCH" (the wire); the product cap is MAX_BRAND_VOICE_RULES = 40 (D-INT-B amended). Org B stores ${total} rules (request ${before.rid})`,
    )

    await openTab(page, 'Brand voice')
    const counter = await counterOf(page)
    const capText = await page.getByRole('status').filter({ hasText: 'at most 40' }).count()
    const addDo = page.getByRole('button', { name: 'Add do', exact: true })
    const addDont = page.getByRole('button', { name: "Add don't", exact: true })
    const nDo = await doInputs(page).count()
    const nDont = await dontInputs(page).count()
    record(
      'B',
      'above the cap: the counter says so, both Add controls are disabled, every row is still listed',
      Number.parseInt(counter, 10) === total &&
        total > 40 &&
        capText === 1 &&
        (await addDo.isDisabled()) &&
        (await addDont.isDisabled()) &&
        nDo + nDont === total,
      `counter "${counter}"; cap sentence present: ${capText === 1} ("${CAP_SENTENCE}"); Add do disabled: ${await addDo.isDisabled()}; Add don't disabled: ${await addDont.isDisabled()}; ${nDo} do + ${nDont} dont inputs`,
    )
    await shot(page, 'proof-b-1-above-cap')

    const shown = Number.parseInt(counter, 10)
    await page.getByRole('button', { name: `Remove do rule ${nDo}`, exact: true }).click()
    // The counter is a MonoNumber tween (D-MOTION-0914-E): read it once the 220 ms have passed.
    await page.waitForTimeout(400)
    const counter2 = await counterOf(page)
    const stillDisabled = (await addDo.isDisabled()) && (await addDont.isDisabled())
    await page.getByRole('button', { name: 'Save changes' }).click()
    await page.getByText('Brand voice saved').waitFor({ timeout: ONE_CALL })
    await page.waitForTimeout(1500)
    const after = await voices(request, token, orgId)
    const totalAfter = after.items.reduce((n, v) => n + v.rules.length, 0)
    record(
      'B',
      'a list above the cap still shrinks and saves; Add stays disabled while still at or above 40',
      Number.parseInt(counter2, 10) === shown - 1 && stillDisabled && totalAfter === total - 1,
      `counter after removal "${counter2}"; Add still disabled: ${stillDisabled}; wire after save: ${totalAfter} rules (request ${after.rid})`,
    )
    await shot(page, 'proof-b-2-after-one-removal')

    // The wire's own number, measured once at zero spend on this throwaway org.
    const rule = (i: number) => ({ kind: i % 2 ? 'dont' : 'do', text: `Cap probe rule ${i + 1}` })
    const r51 = await api(request, 'POST', `/orgs/${orgId}/brand/voices`, token, {
      name: 'Cap probe',
      description: 'TEST-0915 cap probe',
      rules: Array.from({ length: 51 }, (_, i) => rule(i)),
    })
    const r50 = await api(request, 'POST', `/orgs/${orgId}/brand/voices`, token, {
      name: 'Cap probe',
      description: 'TEST-0915 cap probe',
      rules: Array.from({ length: 50 }, (_, i) => rule(i)),
    })
    const created = (r50.json as { id?: string }).id
    let del: Wire | null = null
    if (created) del = await api(request, 'DELETE', `/orgs/${orgId}/brand/voices/${created}`, token)
    record(
      'B',
      'the wire refuses 51 rules and accepts 50 — the contract number stands, and the product stops at 40 below it',
      r51.status === 400 && r50.status === 201 && del?.status === 204,
      `51 rules → ${r51.status} ${JSON.stringify((r51.json as { error?: { code?: string } }).error?.code)} (request ${r51.rid}); 50 rules → ${r50.status} (request ${r50.rid}); probe row deleted → ${del?.status} (request ${del?.rid})`,
    )
  } catch (error) {
    record('B', 'proof ran to the end', false, String(error).slice(0, 300))
    await shot(page, 'proof-b-error').catch(() => {})
  } finally {
    await context.close()
  }
}

// ---------------------------------------------------------------- proof F (live)
async function proofF(browser: Browser, request: APIRequestContext) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.addInitScript({ content: FIRST_LIGHT_WATCH })
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`
  const email = `qa+${stamp}f@alphapromena.com`
  try {
    await page.goto(`${BASE}/signup`, { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Full name').fill('QA Proof F Owner')
    await page.getByLabel('Work email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByLabel('Organization name').fill(`QA Proof F Org ${stamp}`)
    await page.getByRole('checkbox', { name: /terms of service/ }).click()
    await page.getByRole('button', { name: 'Create account' }).click()
    await page.getByRole('heading', { name: 'Check your inbox' }).waitFor({ timeout: 20_000 })
    await page.locator('[data-input-otp]').click()
    await page.keyboard.type('000000')
    const firstLight = page.locator('[data-slot="first-light"]')
    const sawFirstLight = await firstLight
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false)
    await firstLight.waitFor({ state: 'detached', timeout: 10_000 }).catch(() => {})
    await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: 60_000 })
    const fl = (await page.evaluate('window.__fl')) as {
      mounted: boolean
      at: number
      removedAt: number
    }
    const flagKey = `ab-first-light:${email.toLowerCase()}`
    const flag = await page.evaluate((k) => window.localStorage.getItem(k), flagKey)
    note(
      'F',
      'first light in LIVE mode on a fresh account',
      `visible to the harness: ${sawFirstLight}; ever mounted (in-page observer): ${fl.mounted}${fl.mounted ? ` for ${Math.round(fl.removedAt - fl.at)} ms` : ''}; account flag ${flagKey.slice(0, 20)}… = ${JSON.stringify(flag)}`,
    )
    const token = await sessionToken(page)
    const orgId = await orgIdOf(request, token)
    note('F', 'the fresh live org', `org ${orgId}, ${email}`)

    await page
      .locator('[data-sidebar="sidebar"]')
      .getByRole('link', { name: /^Today/ })
      .click()
    // The queue is READ from the ledger: wait for the empty state (or a card) itself.
    const nothingHere = await page
      .getByText('Nothing here')
      .first()
      .waitFor({ timeout: SCREEN_SYNC })
      .then(() => 1)
      .catch(() => 0)
    const approveButtons = await page.getByRole('button', { name: 'Approve', exact: true }).count()
    const mainText = (await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 300)
    const v = await api(request, 'GET', `/orgs/${orgId}/brand/voices`, token)
    const s = await api(request, 'GET', `/orgs/${orgId}/brand/sources`, token)
    const t = await api(request, 'GET', `/orgs/${orgId}/brand/topics`, token)
    const p = await api(request, 'GET', `/orgs/${orgId}/alphastudio/proposals`, token)
    const count = (w: Wire) => ((w.json as { items?: unknown[] }).items ?? []).length
    record(
      'F',
      'a fresh LIVE org receives no seeded drafts, brand voice, sources or topics (live dispatches live/resync and never reaches the seed)',
      approveButtons === 0 &&
        nothingHere === 1 &&
        count(v) === 0 &&
        count(s) === 0 &&
        count(t) === 0 &&
        p.status === 200 &&
        count(p) === 0,
      `Today: ${approveButtons} Approve buttons, empty state "Nothing here": ${nothingHere === 1}; wire: voices ${count(v)} (${v.rid}), sources ${count(s)} (${s.rid}), topics ${count(t)} (${t.rid}), proposals ${p.status} → ${count(p)} (${p.rid}); Today reads: "${mainText}"`,
    )
    await shot(page, 'proof-f-live-1-today-fresh')

    // Analytics BEFORE anything touches Connections, so it reads the fresh org.
    await page
      .locator('[data-sidebar="sidebar"]')
      .getByRole('link', { name: /^Analytics/ })
      .click()
    await page.waitForTimeout(800)
    const analyticsTitle = await page.getByText('Analytics arrive with publishing').count()
    const goTo = await page.getByRole('button', { name: /Go to Connections/ }).count()
    const mainButtons = await page.locator('main button').allInnerTexts()
    record(
      'F',
      'LIVE Analytics says what is true and asks for no work',
      analyticsTitle >= 1 && goTo === 0,
      `title present: ${analyticsTitle >= 1}; "Go to Connections": ${goTo}; buttons in main: ${JSON.stringify(mainButtons)}`,
    )
    await shot(page, 'proof-f-live-2-analytics')

    await page
      .locator('[data-sidebar="sidebar"]')
      .getByRole('link', { name: /^Connections/ })
      .click()
    await page.waitForTimeout(800)
    const preview = await page.getByText(CONNECTIONS_PREVIEW).count()
    const badgesBefore = await page.locator('main [data-slot="badge"]').allInnerTexts()
    record(
      'F',
      'LIVE Connections says what is true',
      preview === 1,
      `notice present: ${preview === 1}; status badges: ${JSON.stringify(badgesBefore)}`,
    )
    const connect = page
      .locator('button:not([disabled])')
      .filter({ hasText: /^Connect$/ })
      .first()
    if (await connect.count()) {
      await connect.click()
      await page.waitForTimeout(600)
      const midUrl = page.url().replace(/^https?:\/\/[^/]+/, '')
      const midText = (await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 200)
      await shot(page, 'proof-f-live-3-connect-mid')
      await page.waitForTimeout(1600)
      const toasts = await page.locator('[data-sonner-toast]').allInnerTexts()
      const afterText = (await page.locator('main').innerText()).replace(/\s+/g, ' ')
      const backButton = page.getByRole('button', { name: 'Back to connections' })
      if (await backButton.count()) await backButton.click()
      await page.waitForTimeout(400)
      const badges = await page.locator('main [data-slot="badge"]').allInnerTexts()
      const claimsConnected =
        toasts.some((x) => /connected/i.test(x)) ||
        /Posting and analytics are on/.test(toasts.join(' ')) ||
        badges.some((b) => /^(Connected|Active)$/i.test(b.trim())) ||
        /Connecting your|Almost there/.test(midText)
      record(
        'F',
        'the Connect flow never shows a success state (LIVE)',
        !claimsConnected,
        `mid-flow url ${midUrl}: "${midText}"; after 2.2 s: toasts ${JSON.stringify(toasts)}; status badges after: ${JSON.stringify(badges)}; "connected" in the return text: ${/connected/i.test(afterText)}`,
      )
      await shot(page, 'proof-f-live-4-after-connect')
    } else {
      note('F', 'Connect flow (LIVE)', 'no enabled Connect button on the screen')
    }
  } catch (error) {
    record('F', 'proof ran to the end', false, String(error).slice(0, 300))
    await shot(page, 'proof-f-live-error').catch(() => {})
  } finally {
    await context.close()
  }
}

// ---------------------------------------------------------------- proof I
async function proofI(browser: Browser, request: APIRequestContext) {
  // Variant 1: the token is REVOKED server-side while the app still holds it;
  // the next screen that reads the wire meets the 401.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    try {
      await login(page, ORG_A)
      const token = await sessionToken(page)
      const revoke = await api(request, 'POST', '/auth/logout', token)
      note(
        'I',
        'revocation',
        `POST /auth/logout with the app's own token → ${revoke.status} (request ${revoke.rid})`,
      )
      await page.getByRole('link', { name: 'Settings' }).first().click()
      // The first read after the revocation meets the 401 — the tab list may never render.
      const team = page.getByRole('tab', { name: 'Team' })
      const tabs = await team
        .waitFor({ timeout: 5_000 })
        .then(() => true)
        .catch(() => false)
      if (tabs) await team.click().catch(() => {})
      await page.waitForURL(/\/login$/, { timeout: SCREEN_SYNC }).catch(() => {})
      const url = page.url().replace(/^https?:\/\/[^/]+/, '')
      const toast = await page.getByText(SESSION_ENDED).count()
      const stored = await page.evaluate(() =>
        Boolean(
          window.sessionStorage.getItem('ab-live-session') ||
          window.localStorage.getItem('ab-live-session'),
        ),
      )
      const signInButton = await page.getByRole('button', { name: 'Sign in' }).count()
      record(
        'I',
        'a REVOKED token: the next read answers 401, the session is purged, the toast shows, the app lands on login',
        url === '/login' && toast >= 1 && !stored && signInButton === 1,
        `url ${url}; toast "${SESSION_ENDED}" ×${toast}; session in storage: ${stored}; Sign in button: ${signInButton}`,
      )
      await shot(page, 'proof-i-1-revoked-token')
    } catch (error) {
      record('I', 'variant 1 ran to the end', false, String(error).slice(0, 300))
      await shot(page, 'proof-i-1-error').catch(() => {})
    } finally {
      await context.close()
    }
  }
  // Variant 2: an EXPIRED (tampered) token in storage at boot.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    try {
      await login(page, ORG_A)
      await page.evaluate(() => {
        for (const store of [window.sessionStorage, window.localStorage]) {
          const raw = store.getItem('ab-live-session')
          if (!raw) continue
          const session = JSON.parse(raw) as { token: string }
          session.token = 'expired-token-test-0915'
          store.setItem('ab-live-session', JSON.stringify(session))
        }
      })
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForURL(/\/login$/, { timeout: SCREEN_SYNC }).catch(() => {})
      const url = page.url().replace(/^https?:\/\/[^/]+/, '')
      const toast = await page.getByText(SESSION_ENDED).count()
      const stored = await page.evaluate(() =>
        Boolean(
          window.sessionStorage.getItem('ab-live-session') ||
          window.localStorage.getItem('ab-live-session'),
        ),
      )
      record(
        'I',
        'an EXPIRED token at boot: the first sync answers 401, the session is purged, the toast shows, the app lands on login (no refresh endpoint — api.md:21)',
        url === '/login' && toast >= 1 && !stored,
        `url ${url}; toast ×${toast}; session in storage: ${stored}`,
      )
      await shot(page, 'proof-i-2-expired-token')
    } catch (error) {
      record('I', 'variant 2 ran to the end', false, String(error).slice(0, 300))
      await shot(page, 'proof-i-2-error').catch(() => {})
    } finally {
      await context.close()
    }
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const request = await playwrightRequest.newContext()
  const startedAt = new Date().toISOString()
  try {
    if (PROOFS.includes('A')) await proofA(browser, request)
    if (PROOFS.includes('C')) await proofC(browser, request)
    if (PROOFS.includes('B')) await proofB(browser, request)
    if (PROOFS.includes('F')) await proofF(browser, request)
    if (PROOFS.includes('I')) await proofI(browser, request)
  } finally {
    await request.dispose()
    await browser.close()
  }
  const doc = [
    `# TEST-0915 — proofs ${PROOFS.join(', ')} against the deployed dev API (${LABEL})`,
    '',
    `- app: \`${BASE}\` (the built app, the dev API base inlined) · API host redacted · started ${startedAt}`,
    `- orgs: A = \`${ORG_A}\`, B = \`${ORG_B}\`, F = minted through the product in-run`,
    '',
    '| Proof | Check | Result | Detail |',
    '| --- | --- | --- | --- |',
    ...rows.map(
      (r) => `| ${r.proof} | ${r.check} | **${r.result}** | ${r.detail.replace(/\|/g, '\\|')} |`,
    ),
    '',
  ].join('\n')
  writeFileSync(`${OUT}/proofs-${LABEL}.md`, doc, 'utf8')
  console.log(`\nwritten ${OUT}/proofs-${LABEL}.md`)
  const failed = rows.filter((r) => r.result === 'FAIL').length
  console.log(
    `${rows.filter((r) => r.result === 'PASS').length} PASS · ${failed} FAIL · ${rows.filter((r) => r.result === 'NOTE').length} NOTE`,
  )
  process.exit(failed ? 1 : 0)
}

void main()
