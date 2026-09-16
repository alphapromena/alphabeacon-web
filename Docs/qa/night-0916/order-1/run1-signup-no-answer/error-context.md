# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-timeout.spec.ts >> a fresh owner + org, made through the product
- Location: e2e\live-timeout.spec.ts:22:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Check your inbox' })
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByRole('heading', { name: 'Check your inbox' })

```

```yaml
- link "Malaky":
  - /url: /
  - img "Malaky"
- heading "Create your account" [level=1]
- paragraph: Connect your channels, review what we draft, and publish everywhere.
- alert: The server did not answer. Try again.
- group:
  - text: Full name
  - textbox "Full name":
    - /placeholder: Maya Haddad
    - text: QA Timeout Owner
- group:
  - text: Work email
  - textbox "Work email":
    - /placeholder: you@company.com
    - text: qa+1789506063918450t@alphapromena.com
- group:
  - text: Password
  - textbox "Password": Roasted2Order!
  - text: Strong
  - list:
    - listitem: At least 8 characters — met
    - listitem: An upper and a lower case letter — met
    - listitem: A number or a symbol — met
- group:
  - text: Organization name
  - textbox "Organization name":
    - /placeholder: Your company or team name
    - text: QA Timeout Org 1789506063918450
  - paragraph: This is what your team and your drafts are grouped under.
- group:
  - text: I agree to the terms of service and the privacy policy.
  - paragraph:
    - text: Read the
    - link "Terms of Service":
      - /url: /terms
    - text: and the
    - link "Privacy Policy":
      - /url: /privacy
    - text: .
  - checkbox "I agree to the terms of service and the privacy policy." [checked]
- button "Create account"
- text: Already have an account?
- link "Sign in":
  - /url: /login
- complementary:
  - blockquote:
    - paragraph: Marketing that arrives ready — you keep the final say.
    - paragraph: Drafts arrive every morning. You approve what fits, create the art, and publish across every channel you connect.
- region "Notifications alt+T"
```

# Test source

```ts
  209 |   }
  210 | }
  211 | 
  212 | /**
  213 |  * THE 402 RULE for the live gate (founder, ORDER HSN-0902, 2026-09-02) —
  214 |  * and, since BIL-0902/R §4, THE ONE MECHANISM that routes a generating spec
  215 |  * to the designated funded QA org.
  216 |  *
  217 |  * A fresh org's wallet is ZERO — the plan is the only funding (Ward's model,
  218 |  * measured 2026-09-02; open-item 46, closed by the founder's ruling) — so
  219 |  * every generation answers `402 wallet_insufficient` at intake, before any
  220 |  * spend. ONE spec asserts that refusal (`live-generate`); every OTHER
  221 |  * generating spec calls this first. What happens next, in order:
  222 |  *
  223 |  * 1. the current org's wallet is read — funded, and the spec simply runs on;
  224 |  * 2. zero, and a funded QA org is configured (`fundedOrgCredentials`), and
  225 |  *    the spec allows the switch (the default — a spec whose assertions count
  226 |  *    a FRESH org's queue opts out): the page signs in as that org's owner,
  227 |  *    its brand setup is ensured idempotently, and the spec runs THERE. Its
  228 |  *    wallet must be funded too — an empty funded org means "pay again"
  229 |  *    (M-BIL-1 step 8) and skips with that reason;
  230 |  * 3. zero, and nothing configured: the spec self-skips with the honest
  231 |  *    reason, the way `live-create-visual` self-skips on `LIVE_MEDIA`. "No
  232 |  *    red that is only no funding."
  233 |  *
  234 |  * The wallet is read BEFORE any body is sent: nothing here ever sends a body
  235 |  * the wire is known to refuse. A precondition, never an assertion.
  236 |  */
  237 | export async function skipUnlessFunded(
  238 |   page: Page,
  239 |   request: APIRequestContext,
  240 |   what: string,
  241 |   options: { switchToFundedOrg?: boolean } = {},
  242 | ): Promise<WalletRead> {
  243 |   const wallet = await readWallet(page, request)
  244 |   if (wallet.availableCents > 0) return wallet
  245 | 
  246 |   // A spec that opts out of the switch stays out — unless this run carries
  247 |   // the founder's word (`pnpm gate --funded`), which is what puts the dormant
  248 |   // tests on the funded org for one run (item 60).
  249 |   const maySwitch = options.switchToFundedOrg !== false || fundedRunsRequested()
  250 |   const funded = maySwitch ? fundedOrgCredentials() : null
  251 |   if (funded) {
  252 |     await signInAsFundedOwner(page, funded)
  253 |     const fundedWallet = await readWallet(page, request)
  254 |     test.skip(
  255 |       fundedWallet.availableCents === 0,
  256 |       `the designated funded QA org (${funded.email}) has an EMPTY wallet — pay it again with the test card (M-BIL-1 step 8) before ${what} can run there`,
  257 |     )
  258 |     await ensureFundedBrand(page, request, fundedWallet)
  259 |     return fundedWallet
  260 |   }
  261 | 
  262 |   test.skip(
  263 |     true,
  264 |     `402 wallet_insufficient would refuse ${what}: the org's wallet is $0.00 — the plan is the only funding, and no funded QA org is configured (QA_FUNDED_EMAIL / QA_FUNDED_PASSWORD; M-BIL-1 step 8) — not a product failure`,
  265 |   )
  266 |   return wallet
  267 | }
  268 | 
  269 | /**
  270 |  * Signup → verify → THE APP, which since ONB-0827 (D-ONB-C) is the whole
  271 |  * journey: verifying creates the workspace from the org name typed at signup
  272 |  * and lands on the dashboard. Every live file used to inline this walk plus
  273 |  * five wizard steps; the wizard is deleted and the walk is one call.
  274 |  *
  275 |  * `WORKSPACE_READY` is the wait it needs: signup, verify, `POST /orgs` and the
  276 |  * resync that follows, back to back. It is the same class of burst the old
  277 |  * Finish was, minus the country lookup that made that one the slowest thing in
  278 |  * the suite.
  279 |  */
  280 | export async function signUpAndEnter(
  281 |   page: Page,
  282 |   account: { name: string; email: string; password: string; orgName: string },
  283 |   options: { pool?: boolean } = {},
  284 | ) {
  285 |   // HSN-0910/D: this is the ONE place a spec creates a company, so it refuses
  286 |   // to do that anywhere but dev — the same rule `global-setup.ts` applies
  287 |   // before the run, kept here for a spec run outside it.
  288 |   assertNotProduction()
  289 |   // GATE-0910 §3.4: a file that opted into the org pool signs into the
  290 |   // round's shared org instead of minting one — only when the pool is on.
  291 |   const pool = options.pool ? poolOrgCredentials() : null
  292 |   if (pool) {
  293 |     await page.goto('/login')
  294 |     await page.getByLabel('Work email').fill(pool.email)
  295 |     await page.getByLabel('Password', { exact: true }).fill(pool.password)
  296 |     await page.getByRole('button', { name: 'Sign in' }).click()
  297 |     await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  298 |       timeout: SCREEN_SYNC,
  299 |     })
  300 |     return
  301 |   }
  302 |   await page.goto('/signup')
  303 |   await page.getByLabel('Full name').fill(account.name)
  304 |   await page.getByLabel('Work email').fill(account.email)
  305 |   await page.getByLabel('Password', { exact: true }).fill(account.password)
  306 |   await page.getByLabel('Organization name').fill(account.orgName)
  307 |   await page.getByRole('checkbox', { name: /terms of service/ }).click()
  308 |   await page.getByRole('button', { name: 'Create account' }).click()
> 309 |   await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({
      |                                                                         ^ Error: expect(locator).toBeVisible() failed
  310 |     timeout: 20_000,
  311 |   })
  312 | 
  313 |   await page.locator('[data-input-otp]').click()
  314 |   await page.keyboard.type(CODE)
  315 | 
  316 |   // No wizard in between: the next thing on screen is the product.
  317 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  318 |     timeout: WORKSPACE_READY,
  319 |   })
  320 | }
  321 | 
  322 | /** Signup + verify + `POST /orgs` + the resync, back to back. */
  323 | export const WORKSPACE_READY = 60_000
  324 | 
  325 | /**
  326 |  * Add ONE rule to a Brand voice list and fill it — by the label `RuleList`
  327 |  * writes (`Do rule N` / `Don't rule N`), never by an id prefix.
  328 |  *
  329 |  * Item 64 (TEST-0915): `input[id^="voice-do"]` also matched `voice-dont-0`,
  330 |  * because `voice-do` is a prefix of `voice-dont`, so `.last()` typed the
  331 |  * do-rule into the Don't input the moment a don't row existed — proven on org
  332 |  * 2170 (the stored Don't rule was overwritten and no do rule reached the
  333 |  * wire). The row count is read BEFORE Add, so the new row's label is exact
  334 |  * and nothing relies on DOM order.
  335 |  */
  336 | export async function addVoiceRule(page: Page, kind: 'Do' | "Don't", text: string) {
  337 |   const add = page.getByRole('button', {
  338 |     name: kind === 'Do' ? 'Add do' : "Add don't",
  339 |     exact: true,
  340 |   })
  341 |   await add.waitFor({ state: 'visible' })
  342 |   const before = await page
  343 |     .getByRole('textbox', { name: new RegExp(`^${kind} rule \\d+$`) })
  344 |     .count()
  345 |   await add.click()
  346 |   await page.getByRole('textbox', { name: `${kind} rule ${before + 1}`, exact: true }).fill(text)
  347 | }
  348 | 
  349 | /** Settings is a tablist above one outlet; every section is reached this way. */
  350 | export async function openSettingsTab(page: Page, tab: string) {
  351 |   await page.getByRole('link', { name: 'Settings' }).first().click()
  352 |   await page.getByRole('tab', { name: tab }).click()
  353 |   // The tab's whole sync — live-red-2026-08-23.
  354 |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  355 | }
  356 | 
  357 | /**
  358 |  * The org's FIRST tone, written the way a new owner writes it: from the empty
  359 |  * state on I3, whose CTA is "Create your first tone" rather than the header's
  360 |  * "Create custom tone" (which only exists once there is a list to add to).
  361 |  */
  362 | export async function createFirstTone(
  363 |   page: Page,
  364 |   tone: { name: string; description: string; doRule: string },
  365 | ) {
  366 |   await openSettingsTab(page, 'Tones')
  367 |   await page.getByRole('link', { name: 'Create your first tone' }).click()
  368 |   await page.getByLabel('Tone name').fill(tone.name)
  369 |   // HSN-03: a tone's language is required, with no default.
  370 |   await page.getByLabel('Language').selectOption('en')
  371 |   await page.getByLabel('What this tone sounds like').fill(tone.description)
  372 |   // NOT optional: the editor refuses a tone with no do and no dont
  373 |   // (`toneSchema`'s refine, MESSAGES.errors.toneRuleRequired). A helper that
  374 |   // let a caller omit it would build an invalid tone and fail forty seconds
  375 |   // later on a missing toast, which is how it first went wrong.
  376 |   await page.getByLabel('Do', { exact: true }).fill(tone.doRule)
  377 |   await page.getByRole('button', { name: 'Create tone' }).click()
  378 |   await expect(page.getByText('Tone created')).toBeVisible({ timeout: SCREEN_SYNC })
  379 | }
  380 | 
  381 | /**
  382 |  * CUT-0831 interim: a tone's language lives in a per-browser SIDECAR until
  383 |  * the backend persists it, so a fresh context — which every Playwright test
  384 |  * is — sees the org's tones as "Needs a language" and the Generate page has
  385 |  * nothing selectable. This performs the documented backfill gesture (open
  386 |  * the tone, pick its language, save) in THIS context, exactly the re-save
  387 |  * the founder does by hand on production after the deploy.
  388 |  */
  389 | export async function ensureToneLanguage(page: Page, toneName: string) {
  390 |   await openSettingsTab(page, 'Tones')
  391 |   await page
  392 |     .locator('[data-slot="card"]')
  393 |     .filter({ hasText: toneName })
  394 |     .getByRole('link', { name: 'Edit' })
  395 |     .click()
  396 |   await page.getByLabel('Tone name').waitFor()
  397 |   await page.getByLabel('Language').selectOption('en')
  398 |   await page.getByRole('button', { name: 'Save changes' }).click()
  399 |   await expect(page.getByText('Tone saved')).toBeVisible({ timeout: SCREEN_SYNC })
  400 | }
  401 | 
  402 | /**
  403 |  * The four brand entities, through the real screens — everything the readiness
  404 |  * gate asks for (D-ONB-D), and nothing it does not.
  405 |  *
  406 |  * A tone alone stopped being enough the moment the gate landed: any spec that
  407 |  * reaches a generation now needs a voice, a tone, a source and a topic first.
  408 |  * The country and the posting rhythm are deliberately NOT here — the Phase-0
  409 |  * probe proved a run does not need them (request
```