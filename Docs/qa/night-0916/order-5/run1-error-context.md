# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-topics-refused.spec.ts >> a refused topic write keeps the chip, says why with the request id, and does not resync; a landed one resyncs once
- Location: e2e\live-topics-refused.spec.ts:49:1

# Error details

```
Test timeout of 150000ms exceeded.
```

```
Error: the chip the person typed stays

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e6]:
      - img "Malaky" [ref=e9]
      - generic [ref=e11]:
        - generic [ref=e12]: Workspace
        - list [ref=e16]:
          - listitem [ref=e17]:
            - link "Dashboard" [ref=e18] [cursor=pointer]:
              - /url: /
          - listitem [ref=e25]:
            - link "Today 2 drafts need review" [ref=e26] [cursor=pointer]:
              - /url: /today
              - generic [ref=e30]: Today
              - generic [ref=e31]:
                - generic [ref=e35]: "2"
                - generic [ref=e36]: drafts need review
          - listitem [ref=e37]:
            - link "Generate" [ref=e38] [cursor=pointer]:
              - /url: /generate
          - listitem [ref=e42]:
            - link "Calendar" [ref=e43] [cursor=pointer]:
              - /url: /calendar
          - listitem [ref=e47]:
            - link "Studio" [ref=e48] [cursor=pointer]:
              - /url: /studio
          - listitem [ref=e53]:
            - link "Analytics" [ref=e54] [cursor=pointer]:
              - /url: /analytics
          - listitem [ref=e59]:
            - link "Connections" [ref=e60] [cursor=pointer]:
              - /url: /connections
          - listitem [ref=e64]:
            - link "Billing" [ref=e65] [cursor=pointer]:
              - /url: /billing
          - listitem [ref=e69]:
            - link "Settings" [ref=e70] [cursor=pointer]:
              - /url: /settings
      - generic [ref=e76]:
        - generic [ref=e77]: Q
        - generic [ref=e79]: QA Topics Org 1789510706335904
      - button "Toggle Sidebar" [ref=e80]
    - generic [ref=e81]:
      - banner [ref=e82]:
        - button "Toggle Sidebar" [ref=e83]
        - generic [ref=e85]:
          - heading "Sources & topics" [level=1] [ref=e86]
          - paragraph [ref=e87]: Sources are what Malaky watches. Topics are what Malaky cares about.
        - generic [ref=e88]:
          - link "No balance yet — subscribe" [ref=e89] [cursor=pointer]:
            - /url: /billing
          - button "Notifications" [ref=e91]
          - button "Account menu" [ref=e92]:
            - generic [ref=e93]: QT
      - main [ref=e95]:
        - generic [ref=e96]:
          - navigation "Settings sections" [ref=e97]:
            - tablist [ref=e99]:
              - tab "Organization" [ref=e100] [cursor=pointer]
              - tab "Brand voice" [ref=e101] [cursor=pointer]
              - tab "Tones" [ref=e102] [cursor=pointer]
              - tab "Sources & topics" [selected] [ref=e103] [cursor=pointer]
              - tab "Knowledge" [ref=e104] [cursor=pointer]
              - tab "Team" [ref=e105] [cursor=pointer]
          - tabpanel "Sources & topics" [ref=e106]:
            - generic [ref=e107]:
              - generic [ref=e108]:
                - generic [ref=e109]:
                  - heading "Sources" [level=2] [ref=e110]
                  - paragraph [ref=e111]: RSS feeds, news pages, and blogs. Connected social accounts are publish targets, not sources — nothing is read back from them.
                - generic [ref=e112]:
                  - generic [ref=e113]:
                    - generic [ref=e114]: Add a source
                    - generic [ref=e115]: 0 / 10
                  - generic [ref=e116]:
                    - textbox "Add a source" [ref=e117]:
                      - /placeholder: example.com/blog
                    - button "Add source" [ref=e118]
                - generic [ref=e120]:
                  - generic [ref=e122]: No sources yet
                  - generic [ref=e123]: No sources yet — add a feed so drafts have something current to work from.
              - generic [ref=e124]:
                - generic [ref=e125]:
                  - heading "Topics" [level=2] [ref=e126]
                  - paragraph [ref=e127]: Subjects worth writing about, whether or not a source mentions them this week.
                - generic [ref=e128]:
                  - generic [ref=e129]:
                    - generic [ref=e130]: Add a topic
                    - generic [ref=e131]: 0 / 30
                  - paragraph [ref=e132]: Be specific. 'Data governance regulation in Saudi Arabia' works better than 'Technology'.
                  - generic [ref=e133]:
                    - textbox "Add a topic" [ref=e134]:
                      - /placeholder: A specific subject, not a category
                    - button "Add" [ref=e135]
                - paragraph [ref=e136]: No topics yet — add a few so drafts stay on subjects you care about.
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | /**
  2   |  * A refused topic write (NIGHT-0916 order 5, item 78) — against the deployed
  3   |  * dev API on one fresh QA org, zero spend, the refusal made at the browser.
  4   |  *
  5   |  * Item 73's rule, applied to the topics seam: a refused write never resyncs,
  6   |  * the chip the person typed stays, an alert says why in the wire's words with
  7   |  * the request id; a landed write resyncs once. Measured first: before this
  8   |  * order the seam dispatched the chip optimistically, then resynced on the
  9   |  * refusal too, and the screen never looked at the result — the chip vanished
  10  |  * with nothing said (this file's first run, order-5/live-topics-refused-run1.log).
  11  |  */
  12  | import type { Page } from '@playwright/test'
  13  | import { expect, test } from './fixtures'
  14  | import { SCREEN_SYNC } from './live-clocks'
  15  | import { openSettingsTab, runStamp, signUpAndEnter } from './live-setup'
  16  | 
  17  | const API_BASE = process.env.VITE_API_BASE_URL
  18  | const RUN = runStamp()
  19  | 
  20  | test.skip(!API_BASE, 'live-mode run only (export VITE_API_BASE_URL)')
  21  | const PASSWORD = 'Roasted2Order!'
  22  | const owner = `qa+${RUN}x@alphapromena.com`
  23  | const REFUSAL = 'Topic refused by the probe'
  24  | const REQUEST_ID = 'probe-78-request'
  25  | 
  26  | test.describe.configure({ mode: 'serial' })
  27  | 
  28  | async function login(page: Page) {
  29  |   await page.goto('/login')
  30  |   await page.getByLabel('Work email').fill(owner)
  31  |   await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  32  |   await page.getByRole('button', { name: 'Sign in' }).click()
  33  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  34  |     timeout: SCREEN_SYNC,
  35  |   })
  36  |   await page.waitForLoadState('networkidle', { timeout: SCREEN_SYNC })
  37  | }
  38  | 
  39  | test('a fresh owner + org, made through the product', async ({ page }) => {
  40  |   test.setTimeout(150_000)
  41  |   await signUpAndEnter(page, {
  42  |     name: 'QA Topics Owner',
  43  |     email: owner,
  44  |     password: PASSWORD,
  45  |     orgName: `QA Topics Org ${RUN}`,
  46  |   })
  47  | })
  48  | 
  49  | test('a refused topic write keeps the chip, says why with the request id, and does not resync; a landed one resyncs once', async ({
  50  |   page,
  51  | }) => {
  52  |   test.setTimeout(150_000)
  53  |   await login(page)
  54  |   await openSettingsTab(page, 'Sources & topics')
  55  |   await expect(page.getByLabel('Add a topic')).toBeVisible({ timeout: SCREEN_SYNC })
  56  |   await page.waitForLoadState('networkidle', { timeout: SCREEN_SYNC })
  57  | 
  58  |   // Every read after this point is counted: a resync is a burst of GETs.
  59  |   let reads = 0
  60  |   page.on('request', (request) => {
  61  |     if (request.method() === 'GET' && request.url().includes('/orgs/')) reads += 1
  62  |   })
  63  |   // The refusal, at the browser: the topic POST answers 400 in the contract's
  64  |   // envelope, with a request id in the header and the body.
  65  |   let refused = 0
  66  |   const topicsPost = (url: URL) => /\/topics(\?|$)/.test(url.pathname + url.search)
  67  |   await page.route(topicsPost, async (route) => {
  68  |     if (route.request().method() !== 'POST') return route.fallback()
  69  |     refused += 1
  70  |     await route.fulfill({
  71  |       status: 400,
  72  |       headers: { 'content-type': 'application/json', 'x-request-id': REQUEST_ID },
  73  |       body: JSON.stringify({
  74  |         error: { code: 'bad_request', message: REFUSAL, requestId: REQUEST_ID },
  75  |       }),
  76  |     })
  77  |   })
  78  | 
  79  |   const readsBefore = reads
  80  |   await page.getByLabel('Add a topic').fill('single origin')
  81  |   await page.keyboard.press('Enter')
  82  |   await expect.poll(() => refused, { timeout: 10_000 }).toBe(1)
  83  |   // Give a resync, if one fires, the time it needs to show.
  84  |   await page.waitForTimeout(2_500)
  85  | 
  86  |   const chip = page.getByText('single origin', { exact: true })
  87  |   const alert = page.getByRole('alert')
  88  |   const observed = {
  89  |     chipVisible: await chip.isVisible(),
  90  |     alertVisible: await alert.first().isVisible(),
  91  |     alertText:
  92  |       (await alert
  93  |         .first()
  94  |         .textContent()
  95  |         .catch(() => null)) ?? '',
  96  |     readsAfterRefusal: reads - readsBefore,
  97  |   }
  98  |   console.log(`[item 78] after the refusal: ${JSON.stringify(observed)}`)
  99  | 
> 100 |   expect(observed.chipVisible, 'the chip the person typed stays').toBe(true)
      |                                                                   ^ Error: the chip the person typed stays
  101 |   expect(observed.alertVisible, 'an alert names the refusal').toBe(true)
  102 |   expect(observed.alertText).toContain(REFUSAL)
  103 |   expect(observed.alertText).toContain(REQUEST_ID)
  104 |   expect(observed.readsAfterRefusal, 'a refused write never resyncs').toBe(0)
  105 | 
  106 |   // The wire again: the next topic lands, the alert clears, and the seam
  107 |   // resyncs once (its reads are the org's bundle — more than one GET, one burst).
  108 |   await page.unroute(topicsPost)
  109 |   const readsBeforeLanded = reads
  110 |   await page.getByLabel('Add a topic').fill('cold brew')
  111 |   await page.keyboard.press('Enter')
  112 |   await expect(page.getByText('cold brew', { exact: true })).toBeVisible()
  113 |   await expect.poll(() => reads - readsBeforeLanded, { timeout: 10_000 }).toBeGreaterThan(0)
  114 |   await page.waitForLoadState('networkidle', { timeout: SCREEN_SYNC })
  115 |   await expect(alert).toHaveCount(0)
  116 |   // Landed on the server: a reload shows it; the refused one is gone with the reload.
  117 |   await page.goto('/settings/sources')
  118 |   await expect(page.getByText('cold brew', { exact: true })).toBeVisible({ timeout: SCREEN_SYNC })
  119 |   await expect(page.getByText('single origin', { exact: true })).toHaveCount(0)
  120 | })
  121 | 
```