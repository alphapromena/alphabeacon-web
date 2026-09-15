# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-wallet.spec.ts >> the balance chip shows money — and over a zero wallet, the instruction to subscribe
- Location: e2e\live-wallet.spec.ts:76:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Dashboard', level: 1 })
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByRole('heading', { name: 'Dashboard', level: 1 })

```

```yaml
- link "Malaky":
  - /url: /
  - img "Malaky"
- heading "Welcome back" [level=1]
- paragraph: Pick up where your queue left off.
- group:
  - text: Work email
  - textbox "Work email":
    - /placeholder: you@company.com
    - text: qa+1789496924814744w@alphapromena.com
- group:
  - text: Password
  - textbox "Password": Roasted2Order!
- group:
  - text: Keep me signed in on this device
  - checkbox "Keep me signed in on this device"
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
  2   |  * INT-9's verify: money, not credits (decisions.md D-INT-E).
  3   |  *
  4   |  * What is worth proving against the live API:
  5   |  * - a fresh org reads back a ZERO wallet — the plan is the only funding since
  6   |  *   BIL-0902 (Ward's guide; measured on org 1670, 2026-09-02: no starter
  7   |  *   funding any more) — and the chip says "subscribe" rather than "funding
  8   |  *   pending" or a comforting number;
  9   |  * - H3 in live mode is a balance plus a real metering read-back, with no
  10  |  *   credits anywhere and no invented exchange rate;
  11  |  * - both end-user grains round-trip, and `tenant` is unreachable from the UI
  12  |  *   by construction (the seam's type forbids it, so this asserts the two that
  13  |  *   ARE offered);
  14  |  * - a malformed window is refused locally by the API, which is why the view
  15  |  *   can render its answer without defending against nonsense.
  16  |  */
  17  | import type { Page } from '@playwright/test'
  18  | import { expect, test } from './fixtures'
  19  | import { AFTER_COUNTRY, SCREEN_SYNC } from './live-clocks'
  20  | import { signUpAndEnter } from './live-setup'
  21  | import { runStamp } from './live-setup'
  22  | 
  23  | const API_BASE = process.env.VITE_API_BASE_URL
  24  | const RUN = runStamp()
  25  | const PASSWORD = 'Roasted2Order!'
  26  | const owner = `qa+${RUN}w@alphapromena.com`
  27  | const ORG_NAME = `QA Wallet Org ${RUN}`
  28  | 
  29  | test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
  30  | test.describe.configure({ mode: 'serial' })
  31  | 
  32  | async function login(page: Page) {
  33  |   await page.goto('/login')
  34  |   await page.getByLabel('Work email').fill(owner)
  35  |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  36  |   await page.getByRole('button', { name: 'Sign in' }).click()
> 37  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
      |                                                                            ^ Error: expect(locator).toBeVisible() failed
  38  |     timeout: 20_000,
  39  |   })
  40  | }
  41  | 
  42  | async function sessionToken(page: Page): Promise<string> {
  43  |   const raw = await page.evaluate(
  44  |     () =>
  45  |       window.sessionStorage.getItem('ab-live-session') ??
  46  |       window.localStorage.getItem('ab-live-session'),
  47  |   )
  48  |   return (JSON.parse(raw!) as { token: string }).token
  49  | }
  50  | 
  51  | test('a fresh owner + org, made through the product', async ({ page }) => {
  52  |   test.setTimeout(180_000)
  53  |   await signUpAndEnter(page, {
  54  |     name: 'QA Wallet Owner',
  55  |     email: owner,
  56  |     password: PASSWORD,
  57  |     orgName: ORG_NAME,
  58  |   })
  59  | 
  60  |   // METERED USAGE, deliberately produced. H3 below reads real metering back,
  61  |   // and its rows used to come from the country lookup the WIZARD performed on
  62  |   // the way in. The wizard is gone (ONB-0827, D-ONB-C), so a fresh org now has
  63  |   // no usage at all and the table is honestly absent. Setting the country from
  64  |   // I1 — the surface that owns it now — restores exactly the precondition the
  65  |   // test was written around: `holidays.lookup` is metered, and it spends
  66  |   // nothing from the wallet, so the balance assertions above stay true.
  67  |   await page.getByRole('link', { name: 'Settings' }).first().click()
  68  |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  69  |   await page.locator('#i1-country').selectOption('JO')
  70  |   await page.getByRole('button', { name: 'Save country' }).click()
  71  |   await expect(page.getByText(/public holidays loaded for the year/)).toBeVisible({
  72  |     timeout: AFTER_COUNTRY,
  73  |   })
  74  | })
  75  | 
  76  | test('the balance chip shows money — and over a zero wallet, the instruction to subscribe', async ({
  77  |   page,
  78  | }) => {
  79  |   await login(page)
  80  |   // A fresh org starts at zero (BIL-0902): the chip lives in the header and
  81  |   // says so, leading to Billing; the dashboard tile shows the honest $0.00.
  82  |   const chip = page
  83  |     .getByRole('banner')
  84  |     .getByRole('link', { name: 'No balance yet — subscribe', exact: true })
  85  |   await expect(chip).toBeVisible({ timeout: 20_000 })
  86  |   await expect(chip).toHaveAttribute('href', '/billing')
  87  |   // Nothing is held on a fresh org, so no reserved clause is shown.
  88  |   await expect(page.getByText(/reserved/)).toHaveCount(0)
  89  |   await expect(page.getByRole('link', { name: 'Available balance $0.00' })).toBeVisible()
  90  |   // Zeros are "never subscribed", not "funding pending" (INT-9's reading, superseded).
  91  |   await expect(page.getByText(/funding pending/i)).toHaveCount(0)
  92  |   // And no credits vocabulary survives into live mode.
  93  |   await expect(page.getByText(/\bcredits\b/i)).toHaveCount(0)
  94  | })
  95  | 
  96  | test('H3 is a balance and a real usage read-back, in both allowed grains', async ({ page }) => {
  97  |   await login(page)
  98  |   await page.goto('/billing/balance')
  99  |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  100 | 
  101 |   await expect(page.getByRole('heading', { name: 'Available' })).toBeVisible()
  102 |   // Scoped to main and EXACT: a zero wallet reads as $0.00 plus the instruction,
  103 |   // and every usage cell below also begins "$0.00…" — substring matching tripped
  104 |   // strict mode the first time this re-targeted spec ran (2026-09-03). The
  105 |   // wallet read is its own request, so it gets the same wait as the table.
  106 |   await expect(page.getByRole('main').getByText('$0.00', { exact: true })).toBeVisible({
  107 |     timeout: 20_000,
  108 |   })
  109 |   await expect(page.getByText(/Your wallet is empty\. Subscribe to a plan/)).toBeVisible()
  110 |   // The 402's instruction lives here too: the plan is the only funding.
  111 |   await expect(page.getByText(/funded by your plan/i)).toBeVisible()
  112 | 
  113 |   // Both end-user grains round-trip against real metering. The wizard's
  114 |   // country lookup is itself metered (`holidays.lookup`), so a fresh org has
  115 |   // rows here — which is a better proof than an empty state would be.
  116 |   await expect(page.getByRole('group', { name: 'Group usage by' })).toBeVisible()
  117 |   await expect(page.getByRole('table')).toBeVisible({ timeout: 20_000 })
  118 |   await expect(page.getByRole('columnheader', { name: 'capability' })).toBeVisible()
  119 |   // Costs render as trimmed decimal strings, never as floats.
  120 |   await expect(page.getByRole('cell', { name: /^\$0\.\d+/ }).first()).toBeVisible()
  121 |   await expect(page.getByRole('cell', { name: 'Total, estimated' })).toBeVisible()
  122 | 
  123 |   await page.getByRole('button', { name: 'model' }).click()
  124 |   await expect(page.getByRole('button', { name: 'model' })).toHaveAttribute('aria-pressed', 'true')
  125 |   await expect(page.getByRole('columnheader', { name: 'model' })).toBeVisible({ timeout: 20_000 })
  126 | 
  127 |   // `tenant` is a cross-org billing view and must never be offered here.
  128 |   await expect(page.getByRole('button', { name: 'tenant' })).toHaveCount(0)
  129 | })
  130 | 
  131 | test('the wallet and usage endpoints answer the shapes the UI is built on', async ({
  132 |   page,
  133 |   request,
  134 | }) => {
  135 |   await login(page)
  136 |   const token = await sessionToken(page)
  137 |   const auth = { authorization: `Bearer ${token}` }
```