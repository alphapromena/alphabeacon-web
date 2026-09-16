# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-media-capabilities.spec.ts >> every granted capability: the document’s example stops at the wallet (402), its trap before it (400) — zero spend
- Location: e2e\live-media-capabilities.spec.ts:338:1

# Error details

```
Error: video-ads.generate valid body: {"error":{"code":"bad_request","message":"The media service rejected the request — check the body against the capability's schema","requestId":"499f11e0-a3da-4acf-b5cb-b555102ea877"}}

expect(received).toBe(expected) // Object.is equality

Expected: 402
Received: 400
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
            - link "Today" [ref=e26] [cursor=pointer]:
              - /url: /today
          - listitem [ref=e31]:
            - link "Generate" [ref=e32] [cursor=pointer]:
              - /url: /generate
          - listitem [ref=e36]:
            - link "Calendar" [ref=e37] [cursor=pointer]:
              - /url: /calendar
          - listitem [ref=e41]:
            - link "Studio" [ref=e42] [cursor=pointer]:
              - /url: /studio
          - listitem [ref=e47]:
            - link "Analytics" [ref=e48] [cursor=pointer]:
              - /url: /analytics
          - listitem [ref=e53]:
            - link "Connections" [ref=e54] [cursor=pointer]:
              - /url: /connections
          - listitem [ref=e58]:
            - link "Billing" [ref=e59] [cursor=pointer]:
              - /url: /billing
          - listitem [ref=e63]:
            - link "Settings" [ref=e64] [cursor=pointer]:
              - /url: /settings
      - generic [ref=e70]:
        - generic [ref=e71]: Q
        - generic [ref=e73]: QA Media Capabilities Org 1789516943986207
      - button "Toggle Sidebar" [ref=e74]
    - generic [ref=e75]:
      - banner [ref=e76]:
        - button "Toggle Sidebar" [ref=e77]
        - generic [ref=e79]:
          - heading "Dashboard" [level=1] [ref=e80]
          - paragraph [ref=e81]: Good to see you, QA — nothing is waiting on you right now
        - generic [ref=e82]:
          - link "No balance yet — subscribe" [ref=e83] [cursor=pointer]:
            - /url: /billing
          - button "Notifications" [ref=e85]
          - button "Account menu" [ref=e86]:
            - generic [ref=e87]: QM
      - main [ref=e89]:
        - generic [ref=e90]:
          - region "Brand setup" [ref=e91]:
            - generic [ref=e92]:
              - heading "Finish setting up" [level=2] [ref=e93]
              - paragraph [ref=e94]: Finish these and this workspace can write. Each one has its own screen — do them in any order.
            - list [ref=e95]:
              - listitem [ref=e96]:
                - generic [ref=e97]:
                  - generic [ref=e100]: Brand voice
                  - generic [ref=e101]: The rules every draft follows, whatever tone it is written in.
                - link "Set up Brand voice" [ref=e102] [cursor=pointer]:
                  - /url: /settings/brand-voice
                  - text: Set up
                  - generic [ref=e103]: Brand voice
              - listitem [ref=e104]:
                - generic [ref=e105]:
                  - generic [ref=e108]: At least one tone
                  - generic [ref=e109]: How a draft should sound. Nothing generates without one.
                - link "Set up At least one tone" [ref=e110] [cursor=pointer]:
                  - /url: /settings/tones
                  - text: Set up
                  - generic [ref=e111]: At least one tone
              - listitem [ref=e112]:
                - generic [ref=e113]:
                  - generic [ref=e116]: Sources
                  - generic [ref=e117]: What drafts read before they write.
                - link "Set up Sources" [ref=e118] [cursor=pointer]:
                  - /url: /settings/sources
                  - text: Set up
                  - generic [ref=e119]: Sources
              - listitem [ref=e120]:
                - generic [ref=e121]:
                  - generic [ref=e124]: Topics
                  - generic [ref=e125]: What this workspace talks about.
                - link "Set up Topics" [ref=e126] [cursor=pointer]:
                  - /url: /settings/sources
                  - text: Set up
                  - generic [ref=e127]: Topics
              - listitem [ref=e128]:
                - generic [ref=e129]:
                  - generic [ref=e132]: Country
                  - generic [ref=e133]: Needed for holidays — drafts work around your calendar. (optional for generating)
                - link "Set up Country" [ref=e134] [cursor=pointer]:
                  - /url: /settings/organization
                  - text: Set up
                  - generic [ref=e135]: Country
              - listitem [ref=e136]:
                - generic [ref=e137]:
                  - generic [ref=e140]: Posting rhythm
                  - generic [ref=e141]: Needed for scheduled posting — which days, and how many. (optional for generating)
                - link "Set up Posting rhythm" [ref=e142] [cursor=pointer]:
                  - /url: /calendar/settings
                  - text: Set up
                  - generic [ref=e143]: Posting rhythm
          - region "Key stats" [ref=e144]:
            - link "Drafts awaiting review 0" [ref=e145] [cursor=pointer]:
              - /url: /today
              - generic [ref=e146]:
                - generic [ref=e147]: Drafts awaiting review
                - generic [ref=e153]: "0"
            - link "Scheduled this week 0" [ref=e155] [cursor=pointer]:
              - /url: /calendar
              - generic [ref=e156]:
                - generic [ref=e157]: Scheduled this week
                - generic [ref=e163]: "0"
            - link "Available balance $0.00 Needs attention" [ref=e165] [cursor=pointer]:
              - /url: /billing
              - generic [ref=e166]:
                - generic [ref=e167]: Available balance
                - generic [ref=e175]:
                  - generic [ref=e176]: $0.00
                  - generic [ref=e177]: Needs attention
            - link "Connections needing attention 0" [ref=e178] [cursor=pointer]:
              - /url: /connections
              - generic [ref=e179]:
                - generic [ref=e180]: Connections needing attention
                - generic [ref=e185]: "0"
          - generic [ref=e187]:
            - region "Go to" [ref=e188]:
              - heading "Go to" [level=2] [ref=e189]
              - generic [ref=e190]:
                - link "Today's queue Approve, edit, reject" [ref=e191] [cursor=pointer]:
                  - /url: /today
                  - generic [ref=e192]: Today's queue
                  - generic [ref=e196]: Approve, edit, reject
                - link "Generate A post, on demand" [ref=e197] [cursor=pointer]:
                  - /url: /generate
                  - generic [ref=e198]: Generate
                  - generic [ref=e201]: A post, on demand
                - link "Calendar What is scheduled, and how it did" [ref=e202] [cursor=pointer]:
                  - /url: /calendar
                  - generic [ref=e203]: Calendar
                  - generic [ref=e206]: What is scheduled, and how it did
                - link "Creative Studio Images and video" [ref=e207] [cursor=pointer]:
                  - /url: /studio
                  - generic [ref=e208]: Creative Studio
                  - generic [ref=e212]: Images and video
                - link "Analytics Reach and engagement" [ref=e213] [cursor=pointer]:
                  - /url: /analytics
                  - generic [ref=e214]: Analytics
                  - generic [ref=e217]: Reach and engagement
                - link "Connections Channels and permissions" [ref=e218] [cursor=pointer]:
                  - /url: /connections
                  - generic [ref=e219]: Connections
                  - generic [ref=e222]: Channels and permissions
                - link "Billing Plan and balance" [ref=e223] [cursor=pointer]:
                  - /url: /billing
                  - generic [ref=e224]: Billing
                  - generic [ref=e227]: Plan and balance
                - link "Settings Brand voice, tones, team" [ref=e228] [cursor=pointer]:
                  - /url: /settings
                  - generic [ref=e229]: Settings
                  - generic [ref=e233]: Brand voice, tones, team
            - region "Notifications and activity" [ref=e234]:
              - heading "Notifications & activity" [level=2] [ref=e236]
              - radiogroup "Filter the feed" [ref=e240]:
                - radio "All" [checked] [ref=e241]
                - radio "Notifications" [ref=e242]
                - radio "Activity" [ref=e243]
              - generic [ref=e245]:
                - generic [ref=e247]: Approvals and alerts land here
                - generic [ref=e248]: You're all caught up.
  - region "Notifications alt+T"
```

# Test source

```ts
  288 |       expect: 400,
  289 |       body: {
  290 |         ...(valid['film.generate'] as object),
  291 |         scenes: [
  292 |           { sec: 2, camera: 'wide' },
  293 |           { sec: 2, camera: 'push' },
  294 |         ],
  295 |       },
  296 |     },
  297 |     {
  298 |       capability: 'motion.generate',
  299 |       name: 'no orientation',
  300 |       expect: 400,
  301 |       body: {
  302 |         capability: 'motion.generate',
  303 |         plan: 'balanced',
  304 |         image: assetA,
  305 |         video: assetV,
  306 |         keepSound: true,
  307 |       },
  308 |     },
  309 |     {
  310 |       capability: 'motion.generate',
  311 |       name: 'lang ar (item 57)',
  312 |       expect: 400,
  313 |       body: { ...(valid['motion.generate'] as object), lang: 'ar' },
  314 |     },
  315 |     {
  316 |       capability: 'media.generate',
  317 |       name: 'an unknown params key',
  318 |       expect: 400,
  319 |       body: {
  320 |         ...(valid['media.generate'] as object),
  321 |         params: { aspectRatio: '1:1', outputFormat: 'png', foo: 'bar' },
  322 |       },
  323 |     },
  324 |   ]
  325 |   return { valid, traps }
  326 | }
  327 | 
  328 | test('a fresh owner + org, made through the product', async ({ page }) => {
  329 |   test.setTimeout(150_000)
  330 |   await signUpAndEnter(page, {
  331 |     name: 'QA Media Capabilities Owner',
  332 |     email: owner,
  333 |     password: PASSWORD,
  334 |     orgName: ORG_NAME,
  335 |   })
  336 | })
  337 | 
  338 | test('every granted capability: the document’s example stops at the wallet (402), its trap before it (400) — zero spend', async ({
  339 |   page,
  340 |   request,
  341 | }) => {
  342 |   test.setTimeout(300_000)
  343 |   await login(page)
  344 |   const wallet = await readWallet(page, request)
  345 |   test.skip(wallet.availableCents !== 0, FUNDED_REASON)
  346 |   const auth = { authorization: `Bearer ${wallet.token}` }
  347 |   const base = `${API_BASE}/orgs/${wallet.orgId}/alphastudio`
  348 | 
  349 |   // Two references and a clip of our own — the presign door, exactly as the app walks it.
  350 |   const a = await uploadPng(request, auth, wallet.orgId, 'live-media-capabilities — reference A')
  351 |   const b = await uploadPng(request, auth, wallet.orgId, 'live-media-capabilities — reference B')
  352 |   const clip = await request.post(`${base}/media/assets/presign`, {
  353 |     headers: auth,
  354 |     data: { mediaType: 'video/mp4', desc: 'live-media-capabilities — a clip' },
  355 |   })
  356 |   expect(clip.status(), await clip.text()).toBe(201)
  357 |   const clipTicket = (await clip.json()) as {
  358 |     assetId: string
  359 |     uploadUrl: string
  360 |     mediaType: string
  361 |   }
  362 |   // A 24-byte ftyp stub: the zero-wallet probe validates the BODY, not the bytes (Phase 0).
  363 |   const put = await request.put(clipTicket.uploadUrl, {
  364 |     headers: { 'content-type': clipTicket.mediaType },
  365 |     data: Buffer.from([
  366 |       0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109, 0, 0, 2, 0, 105, 115, 111, 109, 105, 115,
  367 |       111, 50,
  368 |     ]),
  369 |   })
  370 |   expect(put.status()).toBe(200)
  371 | 
  372 |   const { valid, traps } = bodies(a.url, b.url, a.assetId, clipTicket.assetId)
  373 |   const granted: string[] = []
  374 |   for (const capability of Object.keys(valid)) {
  375 |     const catalog = await request.get(`${base}/catalog/capabilities/${capability}`, {
  376 |       headers: auth,
  377 |     })
  378 |     // A 404 is unknown OR not granted, identically: listed nowhere, sent nothing.
  379 |     if (catalog.status() === 200) granted.push(capability)
  380 |   }
  381 |   expect(granted.length).toBeGreaterThan(0)
  382 | 
  383 |   for (const capability of granted) {
  384 |     const answer = await request.post(`${base}/media/jobs`, {
  385 |       headers: auth,
  386 |       data: valid[capability],
  387 |     })
> 388 |     expect(answer.status(), `${capability} valid body: ${await answer.text()}`).toBe(402)
      |                                                                                 ^ Error: video-ads.generate valid body: {"error":{"code":"bad_request","message":"The media service rejected the request — check the body against the capability's schema","requestId":"499f11e0-a3da-4acf-b5cb-b555102ea877"}}
  389 |   }
  390 |   for (const trap of traps) {
  391 |     if (!granted.includes(trap.capability)) continue
  392 |     const answer = await request.post(`${base}/media/jobs`, { headers: auth, data: trap.body })
  393 |     expect(answer.status(), `${trap.capability} · ${trap.name}: ${await answer.text()}`).toBe(
  394 |       trap.expect,
  395 |     )
  396 |   }
  397 | 
  398 |   // Nothing moved: the wallet is still zero and no job exists.
  399 |   const after = await readWallet(page, request)
  400 |   expect(after.availableCents).toBe(0)
  401 |   const listed = (await (await request.get(`${base}/media/jobs`, { headers: auth })).json()) as {
  402 |     jobs: unknown[]
  403 |   }
  404 |   expect(listed.jobs).toEqual([])
  405 | 
  406 |   // Leave nothing behind.
  407 |   for (const assetId of [a.assetId, b.assetId, clipTicket.assetId]) {
  408 |     const del = await request.delete(`${base}/media/assets/${assetId}`, { headers: auth })
  409 |     expect(del.status()).toBe(204)
  410 |   }
  411 | })
  412 | 
  413 | test('the Studio grid lists what the catalog grants, by name, with the catalog’s price', async ({
  414 |   page,
  415 | }) => {
  416 |   test.setTimeout(300_000)
  417 |   await login(page)
  418 |   // The readiness gate reaches the capability composers too (D-ONB-D): a
  419 |   // fresh org opens a card onto "finish your brand setup first", so the
  420 |   // composer is only reachable once the four brand entities exist.
  421 |   await completeBrandSetup(page, {
  422 |     toneName: 'Roastery floor',
  423 |     toneDescription: 'Warm, specific, smells of coffee.',
  424 |     doRule: 'Name the roast date',
  425 |   })
  426 |   // A fresh load after the setup (live-create-visual starts a new test for
  427 |   // the same reason): the readiness gate reads the synced brand state, which
  428 |   // a reload settles. Not `login()` — a signed-in `/login` redirects home
  429 |   // before the form exists, and the fill waits for the whole test budget.
  430 |   await page.goto('/')
  431 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  432 |     timeout: SCREEN_SYNC,
  433 |   })
  434 |   await page.getByRole('link', { name: 'Studio', exact: true }).first().click()
  435 |   await expect(page.getByRole('heading', { name: 'Studio', level: 1 })).toBeVisible()
  436 |   await expect(
  437 |     page.getByRole('main').getByRole('link', { name: 'Generate', exact: true }),
  438 |   ).toBeVisible({
  439 |     timeout: 40_000,
  440 |   })
  441 |   await expect(page.getByRole('link', { name: 'Voiceover', exact: true })).toBeVisible()
  442 |   await expect(page.getByRole('link', { name: 'Motion transfer', exact: true })).toBeVisible()
  443 |   // A real decimal-string price, rendered as money, from the wire.
  444 |   await expect(page.getByText(/from \$0\.03 per image/).first()).toBeVisible()
  445 |   // No vendor name may ever appear — the catalog speaks only in app aliases.
  446 |   const body = (await page.getByRole('main').textContent()) ?? ''
  447 |   for (const vendor of ['openai', 'gpt', 'bedrock', 'replicate', 'fal', 'runware', 'nano banana']) {
  448 |     expect(body.toLowerCase()).not.toContain(vendor)
  449 |   }
  450 |   // The composer reads the catalog: the approved voices are in the select,
  451 |   // and the row the plan resolved to is named — both from the wire.
  452 |   await page.getByRole('main').getByRole('link', { name: 'Voiceover', exact: true }).click()
  453 |   // The composer, not the gate: its own heading first, so a blocked org fails
  454 |   // with the reason rather than on a control that was never rendered.
  455 |   await expect(page.getByRole('heading', { name: 'Voiceover', level: 2 })).toBeVisible({
  456 |     timeout: SCREEN_SYNC,
  457 |   })
  458 |   // The select's accessible name carries the required marker ("Voice
  459 |   // (required)"), so it is found by role and a prefix, never by an exact label.
  460 |   const voice = page.getByRole('combobox', { name: /^Voice/ })
  461 |   await expect(voice).toBeVisible({ timeout: SCREEN_SYNC })
  462 |   await expect(voice.locator('option', { hasText: 'Rachel' })).toHaveCount(1, {
  463 |     timeout: SCREEN_SYNC,
  464 |   })
  465 |   await expect(page.getByText(/Rendering on Voice \(fast\)/)).toBeVisible({ timeout: SCREEN_SYNC })
  466 | })
  467 | 
```