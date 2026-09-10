# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-media-capabilities.spec.ts >> the Studio grid lists what the catalog grants, by name, with the catalog’s price
- Location: e2e\live-media-capabilities.spec.ts:413:1

# Error details

```
Test timeout of 300000ms exceeded.
```

```
Error: locator.fill: Test timeout of 300000ms exceeded.
Call log:
  - waiting for getByLabel('Add a topic')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e6]:
      - img "Malaky" [ref=e9]
      - generic [ref=e11]:
        - generic [ref=e12]: Workspace
        - list [ref=e14]:
          - listitem [ref=e15]:
            - link "Dashboard" [ref=e16] [cursor=pointer]:
              - /url: /
          - listitem [ref=e23]:
            - link "Today" [ref=e24] [cursor=pointer]:
              - /url: /today
          - listitem [ref=e29]:
            - link "Generate" [ref=e30] [cursor=pointer]:
              - /url: /generate
          - listitem [ref=e34]:
            - link "Calendar" [ref=e35] [cursor=pointer]:
              - /url: /calendar
          - listitem [ref=e39]:
            - link "Studio" [ref=e40] [cursor=pointer]:
              - /url: /studio
          - listitem [ref=e45]:
            - link "Analytics" [ref=e46] [cursor=pointer]:
              - /url: /analytics
          - listitem [ref=e51]:
            - link "Connections" [ref=e52] [cursor=pointer]:
              - /url: /connections
          - listitem [ref=e56]:
            - link "Billing" [ref=e57] [cursor=pointer]:
              - /url: /billing
          - listitem [ref=e61]:
            - link "Settings" [ref=e62] [cursor=pointer]:
              - /url: /settings
      - generic [ref=e68]:
        - generic [ref=e69]: Q
        - generic [ref=e71]: QA Media Capabilities Org 1789044750301717
      - button "Toggle Sidebar" [ref=e72]
    - generic [ref=e73]:
      - banner [ref=e74]:
        - button "Toggle Sidebar" [ref=e75]
        - generic [ref=e77]:
          - heading "Sources & topics" [level=1] [ref=e78]
          - paragraph [ref=e79]: What drafts read, and what they talk about
        - generic [ref=e80]:
          - link "No balance yet — subscribe" [ref=e81] [cursor=pointer]:
            - /url: /billing
          - button "Notifications" [ref=e83]
          - button "Switch to dark theme" [ref=e84]
          - button "Account menu" [ref=e85]:
            - generic [ref=e86]: QM
      - main [ref=e88]:
        - generic [ref=e89]:
          - navigation "Settings sections" [ref=e90]:
            - tablist [ref=e91]:
              - tab "Organization" [ref=e92] [cursor=pointer]
              - tab "Brand voice" [ref=e93] [cursor=pointer]
              - tab "Tones" [ref=e94] [cursor=pointer]
              - tab "Sources & topics" [selected] [ref=e95] [cursor=pointer]
              - tab "Knowledge" [ref=e96] [cursor=pointer]
              - tab "Team" [ref=e97] [cursor=pointer]
          - tabpanel "Sources & topics" [ref=e98]:
            - alert [ref=e99]:
              - generic [ref=e103]:
                - paragraph [ref=e104]: Something went wrong
                - paragraph [ref=e105]: We couldn't load this screen. Try again in a moment.
              - button "Try again" [ref=e106]
  - region "Notifications alt+T"
```

# Test source

```ts
  310 |   await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({
  311 |     timeout: 20_000,
  312 |   })
  313 | 
  314 |   await page.locator('[data-input-otp]').click()
  315 |   await page.keyboard.type(CODE)
  316 | 
  317 |   // No wizard in between: the next thing on screen is the product.
  318 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
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
> 410 |   await page.getByLabel('Add a topic').fill('single origin')
      |                                        ^ Error: locator.fill: Test timeout of 300000ms exceeded.
  411 |   await page.keyboard.press('Enter')
  412 |   await expect(page.getByText('single origin')).toBeVisible()
  413 |   // The topic chip is optimistic; let its POST land before navigating away.
  414 |   await page.waitForTimeout(2000)
  415 | }
  416 | 
```