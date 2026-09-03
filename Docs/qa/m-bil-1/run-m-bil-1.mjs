/**
 * M-BIL-1/auto — the founder's billing manual gate, run ONCE by a headed
 * Chromium session on production (https://1.malaky.ai), recorded.
 *
 * NOT a spec. The suite's rule "never drive the Stripe page" stands; this is
 * the one-off recorded run the order asked for. Stripe is in TEST mode: card
 * 4242 4242 4242 4242, nothing is charged. Org 619 is never touched — every
 * org here is minted fresh by the app.
 *
 * Output (all under test-results/m-bil-1/, gitignored):
 *   NN-<step>.png        a screenshot per step (and FAIL-<step>.png on a stop)
 *   network-org1.har     every request of the first browser context (steps 1–7)
 *   network-org2.har     every request of the second context (step 8)
 *   api-calls.json       every API response: ts, method, url, status, x-request-id, body
 *   report.json          the rids, timings and observations the journal cites
 *
 * Run from the repo root:  node test-results/m-bil-1/run-m-bil-1.mjs
 * Env: M_BIL_1_PASSWORD (the funded org's password — never printed, never
 * written to any file here).
 *
 * RECORD NOTE (added after the run): this is the runner exactly as it ran at
 * 13:01–13:04Z on 2026-09-03. Its output folder was Playwright's outputDir,
 * which the step-9 `pnpm e2e` run cleaned — see sessions.md.
 */
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
mkdirSync(DIR, { recursive: true })

const BASE = 'https://1.malaky.ai'
const CODE = '000000'
const RUN = Date.now()
const STAMP = new Date(RUN).toISOString()
const PASSWORD = process.env.M_BIL_1_PASSWORD
if (!PASSWORD) {
  console.error('M_BIL_1_PASSWORD is not set — refusing to mint an org with no known password.')
  process.exit(2)
}
const ORG1 = {
  name: 'QA Funded Owner',
  email: `qa+${RUN}@alphapromena.com`,
  orgName: `QA Funded Org ${RUN}`,
}
const ORG2 = {
  name: 'QA Cancel Owner',
  email: `qa+${RUN}c@alphapromena.com`,
  orgName: `QA Cancel Org ${RUN}`,
}

// ---------------------------------------------------------------------------
// The record
// ---------------------------------------------------------------------------
const report = {
  order: 'M-BIL-1/auto',
  startedAt: STAMP,
  base: BASE,
  apiBase: null,
  org1: { email: ORG1.email, orgName: ORG1.orgName, orgId: null },
  org2: { email: ORG2.email, orgName: ORG2.orgName, orgId: null },
  steps: {},
  failedStep: null,
  error: null,
  finishedAt: null,
}
const apiCalls = []
let apiBase = process.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? null
let shotIndex = 0

const now = () => new Date().toISOString()
const log = (line) => console.log(`${now()} ${line}`)
const save = () => {
  report.finishedAt = now()
  writeFileSync(join(DIR, 'report.json'), JSON.stringify(report, null, 2))
  writeFileSync(join(DIR, 'api-calls.json'), JSON.stringify(apiCalls, null, 2))
}

async function shot(page, name) {
  shotIndex += 1
  const file = `${String(shotIndex).padStart(2, '0')}-${name}.png`
  await page.screenshot({ path: join(DIR, file), fullPage: true })
  log(`screenshot ${file}`)
  return file
}

/** Every API response, with the server's x-request-id — the Network tab. */
function recordApi(page, label) {
  page.on('response', async (response) => {
    const url = response.url()
    if (apiBase && !url.startsWith(apiBase)) return
    if (!apiBase && !/\/api\//.test(url)) return
    const request = response.request()
    const entry = {
      ts: now(),
      context: label,
      method: request.method(),
      url,
      status: response.status(),
      requestId: response.headers()['x-request-id'] ?? null,
      body: null,
    }
    try {
      const text = await response.text()
      entry.body = text.length > 6000 ? `${text.slice(0, 6000)}…(truncated)` : text
    } catch {
      entry.body = '(body unavailable)'
    }
    apiCalls.push(entry)
  })
  page.on('request', (request) => {
    if (apiBase) return
    const url = request.url()
    const match = /^(https?:\/\/[^/]+\/api)\/auth\/signup$/.exec(url)
    if (match) {
      apiBase = match[1]
      report.apiBase = apiBase
      log(`api base observed from the wire: ${apiBase}`)
    }
  })
}

const lastCall = (predicate) => [...apiCalls].reverse().find(predicate) ?? null
const parse = (entry) => {
  try {
    return JSON.parse(entry.body)
  } catch {
    return null
  }
}

/** A direct read/write from the browser with the app's own session. */
async function apiFetch(page, method, path, body) {
  const token = await page.evaluate(() => {
    const raw =
      window.sessionStorage.getItem('ab-live-session') ??
      window.localStorage.getItem('ab-live-session')
    return raw ? JSON.parse(raw).token : null
  })
  if (!token) throw new Error('no live session in storage')
  const result = await page.evaluate(
    async ({ apiBase, path, method, body, token }) => {
      const headers = { accept: 'application/json', authorization: `Bearer ${token}` }
      if (body !== undefined) headers['content-type'] = 'application/json'
      const response = await fetch(`${apiBase}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
      const text = await response.text()
      return { status: response.status, exposedRid: response.headers.get('x-request-id'), text }
    },
    { apiBase, path, method, body, token },
  )
  // Give the response listener a beat to log the same exchange with its header.
  await page.waitForTimeout(300)
  const logged = lastCall((c) => c.url === `${apiBase}${path}` && c.method === method)
  let json = null
  try {
    json = JSON.parse(result.text)
  } catch {
    /* not json */
  }
  return {
    status: result.status,
    requestId: logged?.requestId ?? result.exposedRid ?? json?.error?.requestId ?? null,
    json,
    text: result.text,
  }
}

async function firstText(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first()
    try {
      if (await locator.isVisible({ timeout: 1500 })) {
        return ((await locator.textContent()) ?? '').trim()
      }
    } catch {
      /* next */
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// The product walks (the suite's own steps, inlined — this is not a spec)
// ---------------------------------------------------------------------------
async function signUpAndEnter(page, account) {
  await page.goto(`${BASE}/signup`)
  await page.getByLabel('Full name').fill(account.name)
  await page.getByLabel('Work email').fill(account.email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Organization name').fill(account.orgName)
  await page.getByRole('checkbox', { name: /terms of service/ }).click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('heading', { name: 'Check your inbox' }).waitFor({ timeout: 30_000 })
  await page.locator('[data-input-otp]').click()
  await page.keyboard.type(CODE)
  await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({ timeout: 90_000 })
}

async function readOrgId(page) {
  const orgs = await apiFetch(page, 'GET', '/me/orgs')
  if (orgs.status !== 200 || !orgs.json?.items?.[0]?.id) {
    throw new Error(`GET /me/orgs answered ${orgs.status}: ${orgs.text.slice(0, 300)}`)
  }
  return { orgId: String(orgs.json.items[0].id), requestId: orgs.requestId }
}

async function openBillingAndReadCards(page) {
  await page.goto(`${BASE}/billing`)
  const region = page.getByRole('region', { name: 'Plans' })
  await region.waitFor({ timeout: 60_000 })
  await page.locator('[aria-busy="true"]').waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {})
  const cards = await region.locator('[data-plan]').evaluateAll((nodes) =>
    nodes.map((node) => ({
      plan: node.getAttribute('data-plan'),
      heading: node.querySelector('h3')?.textContent?.trim() ?? null,
      price: node.querySelector('h3 + p')?.textContent?.trim() ?? null,
      subscribe: [...node.querySelectorAll('button')].some((b) => b.textContent?.trim() === 'Subscribe'),
      demoLink: node.querySelector('a[href="/request-demo"]')?.textContent?.trim() ?? null,
    })),
  )
  return { region, cards }
}

/** Stripe Checkout: fill the test card and pay. Test mode; nothing is charged. */
async function payOnStripe(page) {
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 })
  // The card form. Some layouts hide it behind a "Card" accordion item.
  const cardNumber = page.locator('#cardNumber')
  try {
    await cardNumber.waitFor({ timeout: 20_000 })
  } catch {
    for (const selector of [
      '[data-testid="card-accordion-item-button"]',
      '[data-testid="card-accordion-item"]',
      'button:has-text("Card")',
    ]) {
      const opener = page.locator(selector).first()
      if (await opener.isVisible().catch(() => false)) {
        await opener.click()
        break
      }
    }
    await cardNumber.waitFor({ timeout: 20_000 })
  }
  const email = page.locator('#email')
  if (await email.isVisible().catch(() => false)) {
    const value = await email.inputValue().catch(() => '')
    if (!value && (await email.isEditable().catch(() => false))) await email.fill(ORG1.email)
  }
  await cardNumber.fill('4242 4242 4242 4242')
  await page.locator('#cardExpiry').fill('12 / 34')
  await page.locator('#cardCvc').fill('123')
  const name = page.locator('#billingName')
  if (await name.isVisible().catch(() => false)) await name.fill('QA Funded Owner')
  const country = page.locator('#billingCountry')
  if (await country.isVisible().catch(() => false)) {
    await country.selectOption('US').catch(() => {})
  }
  const postal = page.locator('#billingPostalCode')
  if (await postal.isVisible().catch(() => false)) await postal.fill('10001')
  // Link's "save my info" would ask for a phone number; leave it off.
  const savePass = page.locator('#enableStripePass')
  if (await savePass.isVisible().catch(() => false)) {
    if (await savePass.isChecked().catch(() => false)) await savePass.uncheck().catch(() => {})
  }
  const submit = page
    .locator(
      '[data-testid="hosted-payment-submit-button"], button.SubmitButton, button[type="submit"]',
    )
    .first()
  await submit.waitFor({ timeout: 15_000 })
  return submit
}

async function stripePageFacts(page) {
  return {
    url: page.url().replace(/#.*$/, '').slice(0, 120) + '…',
    title: await page.title(),
    business: await firstText(page, [
      '[data-testid="business-link"]',
      '.Header-businessLink',
      '.Header-business',
    ]),
    productName: await firstText(page, [
      '[data-testid="product-summary-name"]',
      '.ProductSummary-name',
      '[data-testid="line-item-product-name"]',
      '.LineItem-productName',
    ]),
    total: await firstText(page, [
      '[data-testid="product-summary-total-amount"]',
      '.ProductSummary-totalAmount',
      '[data-testid="line-item-total-amount"]',
    ]),
    description: await firstText(page, [
      '[data-testid="product-summary-description"]',
      '.ProductSummary-description',
    ]),
    testMode:
      (await page.getByText(/TEST MODE/i).first().isVisible().catch(() => false)) ||
      (await page.locator('.TestModeBadge, [data-testid="test-mode-badge"]').first().isVisible().catch(() => false)),
  }
}

// ---------------------------------------------------------------------------
async function main() {
  log(`M-BIL-1/auto starting — org1 ${ORG1.email} · org2 ${ORG2.email}`)
  const browser = await chromium.launch({ headless: false, slowMo: 60 })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordHar: { path: join(DIR, 'network-org1.har'), content: 'embed' },
  })
  const page = await context.newPage()
  page.setDefaultTimeout(40_000)
  recordApi(page, 'org1')

  // Subscription reads, watched for the first `active` answer.
  let firstActive = null
  let landedOnSuccessAt = null
  page.on('response', async (response) => {
    if (!/\/billing\/subscription$/.test(response.url()) || response.status() !== 200) return
    try {
      const body = JSON.parse(await response.text())
      if (body.status === 'active' && !firstActive) {
        firstActive = {
          at: now(),
          requestId: response.headers()['x-request-id'] ?? null,
          body,
          secondsAfterLanding: landedOnSuccessAt ? (Date.now() - landedOnSuccessAt) / 1000 : null,
        }
      }
    } catch {
      /* not json */
    }
  })

  let step = 'step1-signup'
  try {
    // ---- 1. fresh QA account → the app mints its org --------------------
    log('STEP 1 — sign up the funded QA account')
    await signUpAndEnter(page, ORG1)
    const org = await readOrgId(page)
    report.org1.orgId = org.orgId
    report.steps.step1 = {
      ok: true,
      orgId: org.orgId,
      meOrgsRequestId: org.requestId,
      signup: lastCall((c) => /\/auth\/signup$/.test(c.url)) && {
        status: lastCall((c) => /\/auth\/signup$/.test(c.url)).status,
        requestId: lastCall((c) => /\/auth\/signup$/.test(c.url)).requestId,
      },
      verify: lastCall((c) => /\/auth\/verify-email$/.test(c.url)) && {
        status: lastCall((c) => /\/auth\/verify-email$/.test(c.url)).status,
        requestId: lastCall((c) => /\/auth\/verify-email$/.test(c.url)).requestId,
      },
      createOrg: lastCall((c) => /\/orgs$/.test(c.url) && c.method === 'POST') && {
        status: lastCall((c) => /\/orgs$/.test(c.url) && c.method === 'POST').status,
        requestId: lastCall((c) => /\/orgs$/.test(c.url) && c.method === 'POST').requestId,
      },
      screenshot: await shot(page, 'step1-dashboard-fresh-org'),
    }
    log(`org1 = ${org.orgId}`)
    save()

    // ---- 2. /billing: two plan cards from the wire + Enterprise ----------
    step = 'step2-billing-plans'
    log('STEP 2 — /billing plan cards')
    const { cards } = await openBillingAndReadCards(page)
    const plansCall = lastCall((c) => /\/billing\/plans$/.test(c.url) && c.status === 200)
    const wirePlans = plansCall ? parse(plansCall)?.items ?? [] : []
    const dollars = (cents) => `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
    const problems = []
    if (wirePlans.length !== 2) problems.push(`wire delivered ${wirePlans.length} plans, expected 2`)
    for (const plan of wirePlans) {
      const card = cards.find((c) => c.plan === plan.plan)
      if (!card) problems.push(`no card for wire plan ${plan.plan}`)
      else {
        if (card.heading !== plan.name) problems.push(`card ${plan.plan} heading "${card.heading}" ≠ wire "${plan.name}"`)
        const expected = `${dollars(plan.amountCents)} / ${plan.interval}`
        if (card.price !== expected) problems.push(`card ${plan.plan} price "${card.price}" ≠ "${expected}"`)
        if (!card.subscribe) problems.push(`card ${plan.plan} has no Subscribe`)
      }
    }
    const business = wirePlans.find((p) => p.name === 'Malaky Business')
    const scale = wirePlans.find((p) => p.name === 'Malaky Scale')
    if (!business || business.amountCents !== 59900 || business.interval !== 'month') problems.push('Business is not $599 / month on the wire')
    if (!scale || scale.amountCents !== 89900 || scale.interval !== 'month') problems.push('Scale is not $899 / month on the wire')
    const enterprise = cards.find((c) => c.plan === 'enterprise')
    if (!enterprise) problems.push('no Enterprise card')
    else {
      if (enterprise.price !== 'Custom') problems.push(`Enterprise price cell reads "${enterprise.price}", expected "Custom"`)
      if (enterprise.subscribe) problems.push('Enterprise offers Subscribe')
      if (enterprise.demoLink !== 'Request a demo') problems.push(`Enterprise demo link reads "${enterprise.demoLink}"`)
    }
    report.steps.step2 = {
      ok: problems.length === 0,
      plansRequestId: plansCall?.requestId ?? null,
      wirePlans,
      cardsAsRendered: cards,
      problems,
      screenshot: await shot(page, 'step2-billing-plans'),
    }
    save()
    if (problems.length) throw new Error(`plan cards: ${problems.join('; ')}`)

    // ---- 3. Subscribe → Business → 201 → checkout.stripe.com -----------
    step = 'step3-checkout'
    log('STEP 3 — Subscribe → Business')
    const businessKey = business.plan
    const checkoutResponse = page.waitForResponse(
      (r) => /\/billing\/checkout$/.test(r.url()) && r.request().method() === 'POST',
      { timeout: 60_000 },
    )
    await page
      .getByRole('region', { name: 'Plans' })
      .locator(`[data-plan="${businessKey}"]`)
      .getByRole('button', { name: 'Subscribe' })
      .click()
    const checkout = await checkoutResponse
    const checkoutRid = checkout.headers()['x-request-id'] ?? null
    const checkoutStatus = checkout.status()
    let checkoutBody = null
    try {
      checkoutBody = JSON.parse(await checkout.text())
    } catch {
      /* redirect already happening */
    }
    report.steps.step3 = {
      ok: checkoutStatus === 201,
      planKey: businessKey,
      checkoutStatus,
      checkoutRequestId: checkoutRid,
      sessionId: checkoutBody?.sessionId ?? null,
      checkoutHost: checkoutBody?.url ? new URL(checkoutBody.url).host : null,
    }
    save()
    if (checkoutStatus !== 201) throw new Error(`POST /billing/checkout answered ${checkoutStatus}`)
    const submit = await payOnStripe(page)
    report.steps.step3.stripePage = await stripePageFacts(page)
    report.steps.step3.screenshot = await shot(page, 'step3-stripe-checkout')
    save()
    log(`Stripe page: ${JSON.stringify(report.steps.step3.stripePage)}`)

    // ---- 4. Pay → /billing/success → poll until active -----------------
    step = 'step4-pay-and-poll'
    log('STEP 4 — pay with the test card')
    const submittedAt = Date.now()
    await submit.click()
    await page.waitForURL(/1\.malaky\.ai\/billing\/success/, { timeout: 180_000 })
    landedOnSuccessAt = Date.now()
    const successUrl = new URL(page.url())
    report.steps.step4 = {
      returnedTo: `${successUrl.origin}${successUrl.pathname}?orgId=${successUrl.searchParams.get('orgId')}&session_id=${(successUrl.searchParams.get('session_id') ?? '').slice(0, 20)}…`,
      orgIdOnReturn: successUrl.searchParams.get('orgId'),
      sessionIdOnReturn: successUrl.searchParams.get('session_id'),
      stripeSecondsSubmitToReturn: (landedOnSuccessAt - submittedAt) / 1000,
    }
    await shot(page, 'step4-success-confirming')
    // The first `active` answer, or the honest give-up.
    const deadline = Date.now() + 120_000
    while (!firstActive && Date.now() < deadline) await page.waitForTimeout(500)
    const subscriptionReads = apiCalls.filter(
      (c) => /\/billing\/subscription$/.test(c.url) && Date.parse(c.ts) >= landedOnSuccessAt - 1000,
    )
    report.steps.step4.pollReads = subscriptionReads.map((c) => ({
      ts: c.ts,
      status: c.status,
      requestId: c.requestId,
      subscriptionStatus: parse(c)?.status ?? null,
    }))
    report.steps.step4.firstActive = firstActive
    report.steps.step4.secondsToActive = firstActive?.secondsAfterLanding ?? null
    if (!firstActive) {
      report.steps.step4.ok = false
      report.steps.step4.screenshot = await shot(page, 'FAIL-step4-never-active')
      save()
      throw new Error('GET /billing/subscription never answered active within 120 s of landing')
    }
    await page
      .getByRole('heading', { name: /You're on the .* plan|Your subscription is active/ })
      .waitFor({ timeout: 60_000 })
    report.steps.step4.successHeading = (
      await page.getByRole('heading', { name: /You're on the .* plan|Your subscription is active/ }).textContent()
    )?.trim()
    await page.getByText(/Wallet:/).waitFor({ timeout: 60_000 }).catch(() => {})
    report.steps.step4.walletLine = (await page.getByText(/Wallet:/).first().textContent().catch(() => null))?.trim() ?? null
    report.steps.step4.ok = true
    report.steps.step4.screenshot = await shot(page, 'step4-success-active')
    save()
    log(`active after ${firstActive.secondsAfterLanding}s — rid ${firstActive.requestId}`)

    // ---- 5. wallet 59900 · one credit row · the notification -----------
    step = 'step5-wallet-credits-notification'
    log('STEP 5 — wallet, credits, notification')
    const orgId = org.orgId
    const wallet = await apiFetch(page, 'GET', `/orgs/${orgId}/alphastudio/wallet`)
    const credits = await apiFetch(page, 'GET', `/orgs/${orgId}/billing/credits`)
    const notifications = await apiFetch(page, 'GET', `/orgs/${orgId}/notifications`)
    const credited = (notifications.json?.items ?? []).filter(
      (n) => n.kind === 'billing.wallet_credited',
    )
    const step5Problems = []
    if (wallet.status !== 200 || wallet.json?.availableCents !== 59900)
      step5Problems.push(`wallet ${wallet.status} ${wallet.text.slice(0, 200)} — expected availableCents 59900`)
    if (credits.status !== 200 || credits.json?.items?.length !== 1)
      step5Problems.push(`credits ${credits.status} has ${credits.json?.items?.length ?? '?'} rows — expected 1`)
    else if (!credits.json.items[0].stripeInvoiceId) step5Problems.push('the credit row carries no stripeInvoiceId')
    if (notifications.status !== 200 || credited.length === 0)
      step5Problems.push(`no billing.wallet_credited notification (notifications ${notifications.status}, kinds: ${(notifications.json?.items ?? []).map((n) => n.kind).join(', ')})`)
    await page.goto(`${BASE}/billing`)
    await page.getByRole('button', { name: 'Manage billing' }).waitFor({ timeout: 60_000 })
    const subscribeCount = await page.getByRole('button', { name: 'Subscribe' }).count()
    if (subscribeCount !== 0) step5Problems.push(`${subscribeCount} Subscribe button(s) still shown`)
    const historyRows = await page.getByRole('region', { name: 'Billing history' }).locator('tr, li').count()
    report.steps.step5 = {
      ok: step5Problems.length === 0,
      wallet: { status: wallet.status, requestId: wallet.requestId, body: wallet.json },
      credits: { status: credits.status, requestId: credits.requestId, body: credits.json },
      creditRowFields: credits.json?.items?.[0] ? Object.keys(credits.json.items[0]) : [],
      notification: {
        status: notifications.status,
        requestId: notifications.requestId,
        walletCredited: credited,
        allKinds: (notifications.json?.items ?? []).map((n) => n.kind),
      },
      manageBillingShown: true,
      subscribeButtons: subscribeCount,
      historyRowsRendered: historyRows,
      problems: step5Problems,
      screenshot: await shot(page, 'step5-billing-manage'),
    }
    save()
    if (step5Problems.length) throw new Error(`step 5: ${step5Problems.join('; ')}`)

    // ---- 6. a second checkout → 409 conflict ----------------------------
    step = 'step6-409'
    log('STEP 6 — POST /billing/checkout again → 409')
    const again = await apiFetch(page, 'POST', `/orgs/${orgId}/billing/checkout`, { plan: businessKey })
    const stillManage = await page.getByRole('button', { name: 'Manage billing' }).isVisible()
    const stillNoSubscribe = (await page.getByRole('button', { name: 'Subscribe' }).count()) === 0
    report.steps.step6 = {
      ok: again.status === 409 && again.json?.error?.code === 'conflict' && stillManage && stillNoSubscribe,
      status: again.status,
      requestId: again.requestId,
      body: again.json ?? again.text,
      pageShowsManageBilling: stillManage,
      pageShowsNoSubscribe: stillNoSubscribe,
      screenshot: await shot(page, 'step6-after-409-manage-billing'),
    }
    save()
    if (!report.steps.step6.ok) throw new Error(`second checkout answered ${again.status} ${again.text.slice(0, 200)}`)

    // ---- 7. Manage billing → portal → return → clean re-read -----------
    step = 'step7-portal'
    log('STEP 7 — Manage billing → Stripe portal → return')
    const portalResponse = page.waitForResponse(
      (r) => /\/billing\/portal$/.test(r.url()) && r.request().method() === 'POST',
      { timeout: 60_000 },
    )
    await page.getByRole('button', { name: 'Manage billing' }).click()
    const portal = await portalResponse
    const portalStatus = portal.status()
    const portalRid = portal.headers()['x-request-id'] ?? null
    report.steps.step7 = { portalStatus, portalRequestId: portalRid }
    save()
    if (portalStatus !== 201) throw new Error(`POST /billing/portal answered ${portalStatus}`)
    await page.waitForURL(/billing\.stripe\.com/, { timeout: 60_000 })
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})
    report.steps.step7.portalHost = new URL(page.url()).host
    report.steps.step7.portalTitle = await page.title()
    report.steps.step7.portalPlanLine = await firstText(page, [
      '[data-testid="subscription-details"]',
      '[data-test="subscription-details"]',
      'main',
    ])
    if (report.steps.step7.portalPlanLine) report.steps.step7.portalPlanLine = report.steps.step7.portalPlanLine.replace(/\s+/g, ' ').slice(0, 400)
    report.steps.step7.portalScreenshot = await shot(page, 'step7-stripe-portal')
    // Back: Stripe's own "Return to <business>" link, whose href is our return url.
    const returnLink = page
      .locator('a[data-testid="return-to-business-link"], a:has-text("Return to"), a[href*="1.malaky.ai"]')
      .first()
    await returnLink.waitFor({ timeout: 20_000 })
    report.steps.step7.returnHref = await returnLink.getAttribute('href')
    const returnedRead = page.waitForResponse(
      (r) => /\/billing\/subscription$/.test(r.url()) && r.url().startsWith(apiBase),
      { timeout: 90_000 },
    )
    await returnLink.click()
    await page.waitForURL(/1\.malaky\.ai\/billing\?orgId=/, { timeout: 60_000 })
    report.steps.step7.returnedTo = page.url()
    const reread = await returnedRead
    const rereadBody = JSON.parse(await reread.text())
    report.steps.step7.rereadRequestId = reread.headers()['x-request-id'] ?? null
    report.steps.step7.rereadStatus = rereadBody.status
    report.steps.step7.rereadBody = rereadBody
    await page.getByRole('button', { name: 'Manage billing' }).waitFor({ timeout: 60_000 })
    report.steps.step7.cleanReturn =
      (await page.getByRole('alert').count()) === 0 &&
      (await page.getByText(/Payment cancelled/).count()) === 0
    report.steps.step7.ok = rereadBody.status === 'active' && report.steps.step7.cleanReturn
    report.steps.step7.screenshot = await shot(page, 'step7-billing-after-portal')
    save()
    if (!report.steps.step7.ok) throw new Error(`portal return: status ${rereadBody.status}, clean ${report.steps.step7.cleanReturn}`)
    await context.close() // flushes network-org1.har

    // ---- 8. second fresh org → Subscribe → back on Stripe → cancelled ---
    step = 'step8-cancelled'
    log('STEP 8 — second fresh org, abandon on the Stripe page')
    const context2 = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordHar: { path: join(DIR, 'network-org2.har'), content: 'embed' },
    })
    const page2 = await context2.newPage()
    page2.setDefaultTimeout(40_000)
    recordApi(page2, 'org2')
    await signUpAndEnter(page2, ORG2)
    const org2 = await readOrgId(page2)
    report.org2.orgId = org2.orgId
    log(`org2 = ${org2.orgId}`)
    const cards2 = await openBillingAndReadCards(page2)
    const business2 = cards2.cards.find((c) => c.heading === 'Malaky Business') ?? cards2.cards[0]
    const checkout2Response = page2.waitForResponse(
      (r) => /\/billing\/checkout$/.test(r.url()) && r.request().method() === 'POST',
      { timeout: 60_000 },
    )
    await cards2.region.locator(`[data-plan="${business2.plan}"]`).getByRole('button', { name: 'Subscribe' }).click()
    const checkout2 = await checkout2Response
    report.steps.step8 = {
      orgId: org2.orgId,
      meOrgsRequestId: org2.requestId,
      checkoutStatus: checkout2.status(),
      checkoutRequestId: checkout2.headers()['x-request-id'] ?? null,
    }
    save()
    await page2.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 })
    await page2.locator('#cardNumber, [data-testid="card-accordion-item"], form').first().waitFor({ timeout: 30_000 }).catch(() => {})
    report.steps.step8.stripeScreenshot = await shot(page2, 'step8-stripe-checkout-org2')
    const back = page2
      .locator('a[href*="checkout=cancelled"], a[data-testid="business-link"], .Header-back a')
      .first()
    await back.waitFor({ timeout: 20_000 })
    report.steps.step8.backHref = await back.getAttribute('href')
    await back.click()
    await page2.waitForURL(/1\.malaky\.ai\/billing\?.*checkout=cancelled/, { timeout: 60_000 })
    report.steps.step8.landedOn = page2.url()
    await page2.getByText(/Payment cancelled — nothing was charged/).waitFor({ timeout: 60_000 })
    await page2.getByRole('region', { name: 'Plans' }).waitFor({ timeout: 60_000 })
    const sub2 = await apiFetch(page2, 'GET', `/orgs/${org2.orgId}/billing/subscription`)
    report.steps.step8.subscription = { status: sub2.status, requestId: sub2.requestId, body: sub2.json }
    report.steps.step8.noteShown = true
    report.steps.step8.subscribeButtons = await page2.getByRole('button', { name: 'Subscribe' }).count()
    report.steps.step8.ok =
      checkout2.status() === 201 &&
      sub2.json?.status === 'none' &&
      /orgId=\d+/.test(report.steps.step8.landedOn) &&
      report.steps.step8.subscribeButtons > 0
    report.steps.step8.screenshot = await shot(page2, 'step8-billing-cancelled')
    save()
    if (!report.steps.step8.ok) throw new Error(`step 8: subscription ${sub2.json?.status}, url ${report.steps.step8.landedOn}`)
    await context2.close()
    await browser.close()
    report.result = 'PASS — steps 1–8 green'
    save()
    log('M-BIL-1/auto steps 1–8 PASSED')
  } catch (error) {
    report.failedStep = step
    report.error = String(error?.stack ?? error).slice(0, 2000)
    report.result = `STOPPED at ${step}`
    const open = browser.contexts().flatMap((c) => c.pages())
    for (const p of open) {
      try {
        await p.screenshot({ path: join(DIR, `FAIL-${step}.png`), fullPage: true })
      } catch {
        /* page gone */
      }
    }
    report.lastApiCalls = apiCalls.slice(-6)
    save()
    for (const c of browser.contexts()) await c.close().catch(() => {})
    await browser.close().catch(() => {})
    log(`STOPPED at ${step}: ${error}`)
    process.exit(1)
  }
}

main()
