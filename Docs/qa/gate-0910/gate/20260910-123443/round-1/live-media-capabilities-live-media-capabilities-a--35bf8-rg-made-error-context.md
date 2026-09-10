# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-media-capabilities.spec.ts >> a fresh owner + org, made through the product
- Location: e2e\live-media-capabilities.spec.ts:328:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Dashboard', level: 1 })
Expected: visible
Timeout: 60000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 60000ms
  - waiting for getByRole('heading', { name: 'Dashboard', level: 1 })

```

```yaml
- heading "Name your workspace and we will finish setting it up." [level=1]
- paragraph: Everything else — your brand voice, tones, sources and posting rhythm — is set up inside the app, whenever you are ready.
- text: Organization name
- textbox "Organization name":
  - /placeholder: Atlas Roasters
- button "Create my workspace" [disabled]
- region "Notifications alt+T"
```

# Test source

```ts
  218 |  * A fresh org's wallet is ZERO — the plan is the only funding (Ward's model,
  219 |  * measured 2026-09-02; open-item 46, closed by the founder's ruling) — so
  220 |  * every generation answers `402 wallet_insufficient` at intake, before any
  221 |  * spend. ONE spec asserts that refusal (`live-generate`); every OTHER
  222 |  * generating spec calls this first. What happens next, in order:
  223 |  *
  224 |  * 1. the current org's wallet is read — funded, and the spec simply runs on;
  225 |  * 2. zero, and a funded QA org is configured (`fundedOrgCredentials`), and
  226 |  *    the spec allows the switch (the default — a spec whose assertions count
  227 |  *    a FRESH org's queue opts out): the page signs in as that org's owner,
  228 |  *    its brand setup is ensured idempotently, and the spec runs THERE. Its
  229 |  *    wallet must be funded too — an empty funded org means "pay again"
  230 |  *    (M-BIL-1 step 8) and skips with that reason;
  231 |  * 3. zero, and nothing configured: the spec self-skips with the honest
  232 |  *    reason, the way `live-create-visual` self-skips on `LIVE_MEDIA`. "No
  233 |  *    red that is only no funding."
  234 |  *
  235 |  * The wallet is read BEFORE any body is sent: nothing here ever sends a body
  236 |  * the wire is known to refuse. A precondition, never an assertion.
  237 |  */
  238 | export async function skipUnlessFunded(
  239 |   page: Page,
  240 |   request: APIRequestContext,
  241 |   what: string,
  242 |   options: { switchToFundedOrg?: boolean } = {},
  243 | ): Promise<WalletRead> {
  244 |   const wallet = await readWallet(page, request)
  245 |   if (wallet.availableCents > 0) return wallet
  246 | 
  247 |   // A spec that opts out of the switch stays out — unless this run carries
  248 |   // the founder's word (`pnpm gate --funded`), which is what puts the dormant
  249 |   // tests on the funded org for one run (item 60).
  250 |   const maySwitch = options.switchToFundedOrg !== false || fundedRunsRequested()
  251 |   const funded = maySwitch ? fundedOrgCredentials() : null
  252 |   if (funded) {
  253 |     await signInAsFundedOwner(page, funded)
  254 |     const fundedWallet = await readWallet(page, request)
  255 |     test.skip(
  256 |       fundedWallet.availableCents === 0,
  257 |       `the designated funded QA org (${funded.email}) has an EMPTY wallet — pay it again with the test card (M-BIL-1 step 8) before ${what} can run there`,
  258 |     )
  259 |     await ensureFundedBrand(page, request, fundedWallet)
  260 |     return fundedWallet
  261 |   }
  262 | 
  263 |   test.skip(
  264 |     true,
  265 |     `402 wallet_insufficient would refuse ${what}: the org's wallet is $0.00 — the plan is the only funding, and no funded QA org is configured (QA_FUNDED_EMAIL / QA_FUNDED_PASSWORD; M-BIL-1 step 8) — not a product failure`,
  266 |   )
  267 |   return wallet
  268 | }
  269 | 
  270 | /**
  271 |  * Signup → verify → THE APP, which since ONB-0827 (D-ONB-C) is the whole
  272 |  * journey: verifying creates the workspace from the org name typed at signup
  273 |  * and lands on the dashboard. Every live file used to inline this walk plus
  274 |  * five wizard steps; the wizard is deleted and the walk is one call.
  275 |  *
  276 |  * `WORKSPACE_READY` is the wait it needs: signup, verify, `POST /orgs` and the
  277 |  * resync that follows, back to back. It is the same class of burst the old
  278 |  * Finish was, minus the country lookup that made that one the slowest thing in
  279 |  * the suite.
  280 |  */
  281 | export async function signUpAndEnter(
  282 |   page: Page,
  283 |   account: { name: string; email: string; password: string; orgName: string },
  284 |   options: { pool?: boolean } = {},
  285 | ) {
  286 |   // HSN-0910/D: this is the ONE place a spec creates a company, so it refuses
  287 |   // to do that anywhere but dev — the same rule `global-setup.ts` applies
  288 |   // before the run, kept here for a spec run outside it.
  289 |   assertNotProduction()
  290 |   // GATE-0910 §3.4: a file that opted into the org pool signs into the
  291 |   // round's shared org instead of minting one — only when the pool is on.
  292 |   const pool = options.pool ? poolOrgCredentials() : null
  293 |   if (pool) {
  294 |     await page.goto('/login')
  295 |     await page.getByLabel('Work email').fill(pool.email)
  296 |     await page.getByLabel('Password', { exact: true }).fill(pool.password)
  297 |     await page.getByRole('button', { name: 'Sign in' }).click()
  298 |     await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  299 |       timeout: SCREEN_SYNC,
  300 |     })
  301 |     return
  302 |   }
  303 |   await page.goto('/signup')
  304 |   await page.getByLabel('Full name').fill(account.name)
  305 |   await page.getByLabel('Work email').fill(account.email)
  306 |   await page.getByLabel('Password', { exact: true }).fill(account.password)
  307 |   await page.getByLabel('Organization name').fill(account.orgName)
  308 |   await page.getByRole('checkbox', { name: /terms of service/ }).click()
  309 |   await page.getByRole('button', { name: 'Create account' }).click()
  310 |   await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({
  311 |     timeout: 20_000,
  312 |   })
  313 | 
  314 |   await page.locator('[data-input-otp]').click()
  315 |   await page.keyboard.type(CODE)
  316 | 
  317 |   // No wizard in between: the next thing on screen is the product.
> 318 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
      |                                                                            ^ Error: expect(locator).toBeVisible() failed
  319 |     timeout: WORKSPACE_READY,
  320 |   })
  321 | }
  322 | 
  323 | /** Signup + verify + `POST /orgs` + the resync, back to back. */
  324 | export const WORKSPACE_READY = 60_000
  325 | 
  326 | /** Settings is a tablist above one outlet; every section is reached this way. */
  327 | export async function openSettingsTab(page: Page, tab: string) {
  328 |   await page.getByRole('link', { name: 'Settings' }).first().click()
  329 |   await page.getByRole('tab', { name: tab }).click()
  330 |   // The tab's whole sync — live-red-2026-08-23.
  331 |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  332 | }
  333 | 
  334 | /**
  335 |  * The org's FIRST tone, written the way a new owner writes it: from the empty
  336 |  * state on I3, whose CTA is "Create your first tone" rather than the header's
  337 |  * "Create custom tone" (which only exists once there is a list to add to).
  338 |  */
  339 | export async function createFirstTone(
  340 |   page: Page,
  341 |   tone: { name: string; description: string; doRule: string },
  342 | ) {
  343 |   await openSettingsTab(page, 'Tones')
  344 |   await page.getByRole('link', { name: 'Create your first tone' }).click()
  345 |   await page.getByLabel('Tone name').fill(tone.name)
  346 |   // HSN-03: a tone's language is required, with no default.
  347 |   await page.getByLabel('Language').selectOption('en')
  348 |   await page.getByLabel('What this tone sounds like').fill(tone.description)
  349 |   // NOT optional: the editor refuses a tone with no do and no dont
  350 |   // (`toneSchema`'s refine, MESSAGES.errors.toneRuleRequired). A helper that
  351 |   // let a caller omit it would build an invalid tone and fail forty seconds
  352 |   // later on a missing toast, which is how it first went wrong.
  353 |   await page.getByLabel('Do', { exact: true }).fill(tone.doRule)
  354 |   await page.getByRole('button', { name: 'Create tone' }).click()
  355 |   await expect(page.getByText('Tone created')).toBeVisible({ timeout: SCREEN_SYNC })
  356 | }
  357 | 
  358 | /**
  359 |  * CUT-0831 interim: a tone's language lives in a per-browser SIDECAR until
  360 |  * the backend persists it, so a fresh context — which every Playwright test
  361 |  * is — sees the org's tones as "Needs a language" and the Generate page has
  362 |  * nothing selectable. This performs the documented backfill gesture (open
  363 |  * the tone, pick its language, save) in THIS context, exactly the re-save
  364 |  * the founder does by hand on production after the deploy.
  365 |  */
  366 | export async function ensureToneLanguage(page: Page, toneName: string) {
  367 |   await openSettingsTab(page, 'Tones')
  368 |   await page
  369 |     .locator('[data-slot="card"]')
  370 |     .filter({ hasText: toneName })
  371 |     .getByRole('link', { name: 'Edit' })
  372 |     .click()
  373 |   await page.getByLabel('Tone name').waitFor()
  374 |   await page.getByLabel('Language').selectOption('en')
  375 |   await page.getByRole('button', { name: 'Save changes' }).click()
  376 |   await expect(page.getByText('Tone saved')).toBeVisible({ timeout: SCREEN_SYNC })
  377 | }
  378 | 
  379 | /**
  380 |  * The four brand entities, through the real screens — everything the readiness
  381 |  * gate asks for (D-ONB-D), and nothing it does not.
  382 |  *
  383 |  * A tone alone stopped being enough the moment the gate landed: any spec that
  384 |  * reaches a generation now needs a voice, a tone, a source and a topic first.
  385 |  * The country and the posting rhythm are deliberately NOT here — the Phase-0
  386 |  * probe proved a run does not need them (request
  387 |  * `60c06fd5-acb7-4060-81d5-4a7b8113ebeb`), so a helper that set them would be
  388 |  * quietly asserting a stricter gate than the product has.
  389 |  */
  390 | export async function completeBrandSetup(
  391 |   page: Page,
  392 |   brand: { toneName: string; toneDescription: string; doRule: string },
  393 | ) {
  394 |   await openSettingsTab(page, 'Brand voice')
  395 |   await page.getByRole('button', { name: 'Add do', exact: true }).click()
  396 |   await page.locator('input[id^="voice-do"]').last().fill(brand.doRule)
  397 |   await page.getByRole('button', { name: 'Save changes' }).click()
  398 |   await expect(page.getByText('Brand voice saved')).toBeVisible({ timeout: SCREEN_SYNC })
  399 | 
  400 |   await createFirstTone(page, {
  401 |     name: brand.toneName,
  402 |     description: brand.toneDescription,
  403 |     doRule: brand.doRule,
  404 |   })
  405 | 
  406 |   await openSettingsTab(page, 'Sources & topics')
  407 |   await page.getByLabel('Add a source').fill('perfectdailygrind.com/feed')
  408 |   await page.getByRole('button', { name: 'Add source' }).click()
  409 |   await expect(page.getByText('Source added')).toBeVisible({ timeout: SCREEN_SYNC })
  410 |   await page.getByLabel('Add a topic').fill('single origin')
  411 |   await page.keyboard.press('Enter')
  412 |   await expect(page.getByText('single origin')).toBeVisible()
  413 |   // The topic chip is optimistic; let its POST land before navigating away.
  414 |   await page.waitForTimeout(2000)
  415 | }
  416 | 
```