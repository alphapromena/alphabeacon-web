/**
 * M-BIL-1/auto — RECOVERY of the screenshots after Playwright's step-9 run
 * cleaned test-results/ (its outputDir) and deleted the run's frames.
 *
 * READ-ONLY. Signs in as the two orgs' owners on production and re-takes the
 * frames of PERSISTED state: org 1813's dashboard chip, /billing (Manage
 * billing + the invoice row), /billing/balance, the bell; org 1814's
 * `/billing?orgId=1814&checkout=cancelled` deep link (the note renders from
 * the param — a deep link by design). Every API read here is a GET with a NEW
 * request-id, recorded as "recovery reads"; the run's own rids live in
 * report.json. Nothing here touches a Stripe page, POSTs a checkout or a
 * portal, or can bill — so the Stripe checkout frame, the portal frame and
 * the confirming/active success frames are NOT re-taken; they are lost.
 *
 * Run from the repo root (headed, so the founder can watch):
 *   node <this file> <outDir>
 * Env: QA_FUNDED_EMAIL, QA_FUNDED_PASSWORD (org 1813's owner), M_BIL_1_ORG2_EMAIL
 * (org 1814's owner; same password).
 */
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = process.argv[2]
if (!OUT) {
  console.error('usage: node recover-m-bil-1.mjs <outDir>')
  process.exit(2)
}
mkdirSync(OUT, { recursive: true })
const BASE = 'https://1.malaky.ai'
const ORG1 = { email: process.env.QA_FUNDED_EMAIL, orgId: '1813' }
const ORG2 = { email: process.env.M_BIL_1_ORG2_EMAIL, orgId: '1814' }
const PASSWORD = process.env.QA_FUNDED_PASSWORD
if (!ORG1.email || !ORG2.email || !PASSWORD) {
  console.error('QA_FUNDED_EMAIL, M_BIL_1_ORG2_EMAIL and QA_FUNDED_PASSWORD must be set')
  process.exit(2)
}

const now = () => new Date().toISOString()
const log = (line) => console.log(`${now()} ${line}`)
const record = { recoveredAt: now(), note: 'read-only recovery frames; rids are NEW (see report.json for the run\'s own)', frames: [], reads: {} }
let apiBase = null
const apiCalls = []

async function shot(page, name) {
  const file = `recovered-${name}.png`
  await page.screenshot({ path: join(OUT, file), fullPage: true })
  record.frames.push(file)
  log(`screenshot ${file}`)
}

function recordApi(page) {
  page.on('request', (request) => {
    const match = /^(https?:\/\/[^/]+\/api)\//.exec(request.url())
    if (match && !apiBase) apiBase = match[1]
  })
  page.on('response', async (response) => {
    const url = response.url()
    if (!/\/api\//.test(url)) return
    const entry = { ts: now(), method: response.request().method(), url, status: response.status(), requestId: response.headers()['x-request-id'] ?? null, body: null }
    try {
      const text = await response.text()
      entry.body = text.length > 4000 ? `${text.slice(0, 4000)}…` : text
    } catch {
      entry.body = '(unavailable)'
    }
    apiCalls.push(entry)
  })
}

async function apiGet(page, path) {
  const token = await page.evaluate(() => {
    const raw = window.sessionStorage.getItem('ab-live-session') ?? window.localStorage.getItem('ab-live-session')
    return raw ? JSON.parse(raw).token : null
  })
  const result = await page.evaluate(
    async ({ apiBase, path, token }) => {
      const r = await fetch(`${apiBase}${path}`, { headers: { accept: 'application/json', authorization: `Bearer ${token}` } })
      return { status: r.status, text: await r.text() }
    },
    { apiBase, path, token },
  )
  await page.waitForTimeout(300)
  const logged = [...apiCalls].reverse().find((c) => c.url === `${apiBase}${path}`)
  let json = null
  try {
    json = JSON.parse(result.text)
  } catch {
    /* not json */
  }
  return { status: result.status, requestId: logged?.requestId ?? null, body: json ?? result.text }
}

async function signIn(page, email) {
  await page.goto(`${BASE}/login`)
  await page.evaluate(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
  })
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Work email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: 90_000 })
}

const browser = await chromium.launch({ headless: false, slowMo: 40 })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordHar: { path: join(OUT, 'network-recovery.har'), content: 'embed' } })
const page = await context.newPage()
page.setDefaultTimeout(40_000)
recordApi(page)
try {
  log('org 1813 — the funded org')
  await signIn(page, ORG1.email)
  await page.getByRole('banner').getByRole('link', { name: /Available balance|No balance/ }).waitFor({ timeout: 60_000 }).catch(() => {})
  await shot(page, 'org1813-dashboard-chip')
  await page.goto(`${BASE}/billing`)
  await page.getByRole('button', { name: 'Manage billing' }).waitFor({ timeout: 60_000 })
  await page.locator('[aria-busy="true"]').waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {})
  await shot(page, 'org1813-billing-manage-and-history')
  await page.goto(`${BASE}/billing/balance`)
  await page.getByRole('heading', { name: 'Available' }).waitFor({ timeout: 60_000 })
  await page.getByRole('table').waitFor({ timeout: 30_000 }).catch(() => {})
  await shot(page, 'org1813-balance')
  await page.goto(`${BASE}/`)
  await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: 60_000 })
  const bell = page.getByRole('banner').getByRole('button', { name: /notification/i }).first()
  if (await bell.isVisible().catch(() => false)) {
    await bell.click()
    await page.getByText(/Wallet credited/).first().waitFor({ timeout: 20_000 }).catch(() => {})
    await shot(page, 'org1813-bell-wallet-credited')
  }
  record.reads.org1813 = {
    wallet: await apiGet(page, `/orgs/${ORG1.orgId}/alphastudio/wallet`),
    subscription: await apiGet(page, `/orgs/${ORG1.orgId}/billing/subscription`),
    credits: await apiGet(page, `/orgs/${ORG1.orgId}/billing/credits`),
    notifications: await apiGet(page, `/orgs/${ORG1.orgId}/notifications`),
  }

  log('org 1814 — the abandoned checkout')
  await signIn(page, ORG2.email)
  await page.goto(`${BASE}/billing?orgId=${ORG2.orgId}&checkout=cancelled`)
  await page.getByText(/Payment cancelled — nothing was charged/).waitFor({ timeout: 60_000 })
  await page.getByRole('region', { name: 'Plans' }).waitFor({ timeout: 60_000 })
  await shot(page, 'org1814-billing-cancelled-deeplink')
  record.reads.org1814 = {
    subscription: await apiGet(page, `/orgs/${ORG2.orgId}/billing/subscription`),
    wallet: await apiGet(page, `/orgs/${ORG2.orgId}/alphastudio/wallet`),
  }
  record.ok = true
} catch (error) {
  record.ok = false
  record.error = String(error).slice(0, 1000)
  await page.screenshot({ path: join(OUT, 'recovered-FAIL.png'), fullPage: true }).catch(() => {})
} finally {
  writeFileSync(join(OUT, 'recovery.json'), JSON.stringify(record, null, 2))
  writeFileSync(join(OUT, 'recovery-api-calls.json'), JSON.stringify(apiCalls, null, 2))
  await context.close()
  await browser.close()
  log(record.ok ? 'recovery done' : `recovery FAILED: ${record.error}`)
}
