# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-scheduling.spec.ts >> C1 creates the schedule on first save, then PATCHes it — and it survives a reload
- Location: e2e\live-scheduling.spec.ts:93:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByText('You have unsaved changes.')
Expected: 0
Received: 1

Call log:
  - Expect "toHaveCount" with timeout 40000ms
  - waiting for getByText('You have unsaved changes.')
    52 × locator resolved to 1 element
       - unexpected value "1"
  - Test timeout of 30000ms exceeded.

```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - generic [ref=f1e3]:
    - generic [ref=f1e6]:
      - img "Malaky" [ref=f1e9]
      - generic [ref=f1e11]:
        - generic [ref=f1e12]: Workspace
        - list [ref=f1e14]:
          - listitem [ref=f1e15]:
            - link "Dashboard" [ref=f1e16] [cursor=pointer]:
              - /url: /
          - listitem [ref=f1e23]:
            - link "Today" [ref=f1e24] [cursor=pointer]:
              - /url: /today
          - listitem [ref=f1e29]:
            - link "Generate" [ref=f1e30] [cursor=pointer]:
              - /url: /generate
          - listitem [ref=f1e34]:
            - link "Calendar" [ref=f1e35] [cursor=pointer]:
              - /url: /calendar
          - listitem [ref=f1e39]:
            - link "Studio" [ref=f1e40] [cursor=pointer]:
              - /url: /studio
          - listitem [ref=f1e45]:
            - link "Analytics" [ref=f1e46] [cursor=pointer]:
              - /url: /analytics
          - listitem [ref=f1e51]:
            - link "Connections" [ref=f1e52] [cursor=pointer]:
              - /url: /connections
          - listitem [ref=f1e56]:
            - link "Billing" [ref=f1e57] [cursor=pointer]:
              - /url: /billing
          - listitem [ref=f1e61]:
            - link "Settings" [ref=f1e62] [cursor=pointer]:
              - /url: /settings
      - generic [ref=f1e68]:
        - generic [ref=f1e69]: Q
        - generic [ref=f1e71]: QA Sched Org 1789283608151779
      - button "Toggle Sidebar" [ref=f1e72]
    - generic [ref=f1e73]:
      - banner [ref=f1e74]:
        - button "Toggle Sidebar" [ref=f1e75]
        - generic [ref=f1e77]:
          - heading "Schedule" [level=1] [ref=f1e78]
          - paragraph [ref=f1e79]: When drafts are generated, how many, and in which voices
        - generic [ref=f1e80]:
          - link "No balance yet — subscribe" [ref=f1e81] [cursor=pointer]:
            - /url: /billing
          - button "Notifications" [ref=f1e83]
          - button "Switch to dark theme" [ref=f1e84]
          - button "Account menu" [ref=f1e85]:
            - generic [ref=f1e86]: QS
      - main [ref=f1e88]:
        - generic [ref=f1e89]:
          - generic [ref=f1e90]:
            - heading "When" [level=2] [ref=f1e91]
            - generic [ref=f1e92]:
              - generic [ref=f1e93]: Timezone
              - paragraph [ref=f1e94]: Slot times are wall-clock in this zone, so daylight saving never moves your posts.
              - combobox "Timezone" [ref=f1e95]:
                - option "Asia/Amman (GMT+3)" [selected]
                - option "Asia/Dubai (GMT+4)"
                - option "Asia/Riyadh (GMT+3)"
                - option "Asia/Beirut (GMT+3)"
                - option "Africa/Cairo (GMT+3)"
                - option "Europe/London (GMT+1)"
                - option "Europe/Paris (GMT+2)"
                - option "Europe/Berlin (GMT+2)"
                - option "Europe/Istanbul (GMT+3)"
                - option "America/New York (GMT-4)"
                - option "America/Chicago (GMT-5)"
                - option "America/Los Angeles (GMT-7)"
                - option "Asia/Karachi (GMT+5)"
                - option "Asia/Kolkata (GMT+5:30)"
                - option "Asia/Singapore (GMT+8)"
                - option "Australia/Sydney (GMT+10)"
                - option "UTC (GMT+0)"
            - group "Active days" [ref=f1e96]:
              - paragraph [ref=f1e98]: Drafts are generated on the days you pick.
              - toolbar [ref=f1e99]:
                - button "Monday" [pressed] [ref=f1e100]: M
                - button "Tuesday" [ref=f1e101]: T
                - button "Wednesday" [ref=f1e102]: W
                - button "Thursday" [ref=f1e103]: T
                - button "Friday" [ref=f1e104]: F
                - button "Saturday" [ref=f1e105]: S
                - button "Sunday" [ref=f1e106]: S
            - generic [ref=f1e107]:
              - generic [ref=f1e108]: Generate at
              - paragraph [ref=f1e109]: Drafts are ready by this time, so they are waiting when you start.
              - textbox "Generate at" [ref=f1e110]: 09:00
          - generic [ref=f1e111]:
            - heading "How much, and how" [level=2] [ref=f1e112]
            - generic [ref=f1e113]:
              - generic [ref=f1e114]: Posts per day
              - paragraph [ref=f1e115]: At most 3 a day, so the queue stays reviewable.
              - generic [ref=f1e116]:
                - button "One fewer post per day" [disabled]: −
                - status "Posts per day" [ref=f1e117]: "1"
                - button "One more post per day" [ref=f1e118]: +
            - group "Generation model" [ref=f1e119]:
              - paragraph [ref=f1e121]: Which model drafts your copy.
              - generic [ref=f1e122]:
                - generic [ref=f1e123] [cursor=pointer]:
                  - radio "Balanced Reliable everyday drafts — the sensible default." [ref=f1e124]
                  - generic [ref=f1e125]:
                    - generic [ref=f1e126]: Balanced
                    - generic [ref=f1e127]: Reliable everyday drafts — the sensible default.
                - generic [ref=f1e128]:
                  - radio "Creative Pro plan Bolder angles and fresher hooks; a touch slower." [disabled] [ref=f1e129]
                  - generic [ref=f1e130]:
                    - generic [ref=f1e131]:
                      - text: Creative
                      - generic [ref=f1e132]: Pro plan
                    - generic [ref=f1e136]: Bolder angles and fresher hooks; a touch slower.
                - generic [ref=f1e137]:
                  - radio "Precise Pro plan Tightest grounding to your sources; best for regulated topics." [disabled] [ref=f1e138]
                  - generic [ref=f1e139]:
                    - generic [ref=f1e140]:
                      - text: Precise
                      - generic [ref=f1e141]: Pro plan
                    - generic [ref=f1e145]: Tightest grounding to your sources; best for regulated topics.
            - alert [ref=f1e146]: Pick which model drafts your copy.
          - generic [ref=f1e147]:
            - generic [ref=f1e148]:
              - heading "Tones" [level=2] [ref=f1e149]
              - link "Manage tones →" [ref=f1e150] [cursor=pointer]:
                - /url: /settings/tones
            - group "Tones" [ref=f1e151]:
              - paragraph [ref=f1e153]: Drafts rotate through the tones you pick.
              - generic [ref=f1e154]:
                - button "Roastery floor" [pressed] [ref=f1e155]
                - button "Create custom tone" [ref=f1e157]
          - generic [ref=f1e158]:
            - heading "Events" [level=2] [ref=f1e159]
            - generic [ref=f1e160]:
              - generic [ref=f1e161]:
                - generic [ref=f1e162]: Attach posts to events
                - paragraph [ref=f1e163]: Slots near a holiday or launch borrow its name and date.
              - switch "Attach posts to events" [ref=f1e164]
          - paragraph [ref=f1e165]: Up to 1 drafts a week, in 1 tone, drafted by —.
        - generic [ref=f1e167]:
          - paragraph [ref=f1e168]: You have unsaved changes.
          - generic [ref=f1e169]:
            - button "Cancel" [ref=f1e170]
            - button "Save changes" [active] [ref=f1e171]
  - region "Notifications alt+T"
```

# Test source

```ts
  37  | 
  38  | async function sessionToken(page: Page): Promise<string> {
  39  |   const raw = await page.evaluate(
  40  |     () =>
  41  |       window.sessionStorage.getItem('ab-live-session') ??
  42  |       window.localStorage.getItem('ab-live-session'),
  43  |   )
  44  |   return (JSON.parse(raw!) as { token: string }).token
  45  | }
  46  | 
  47  | /**
  48  |  * The INVERSE of the test that used to open this file (ORDER ONB-0827).
  49  |  *
  50  |  * It asserted that the wizard's Finish created the org, a schedule and the
  51  |  * holiday country in one burst. Finish is deleted and so is the burst: the org
  52  |  * is the ONLY thing created for the user, on purpose, because it is the only
  53  |  * one that cannot be set from a durable screen afterwards. Proving that
  54  |  * nothing else was quietly created is what stops a half-built workspace
  55  |  * looking configured — which is the shape org 619 arrived in.
  56  |  */
  57  | test('signup creates the workspace and NOTHING else', async ({ page, request }) => {
  58  |   test.setTimeout(150_000)
  59  |   await signUpAndEnter(page, {
  60  |     name: 'QA Sched Owner',
  61  |     email: owner,
  62  |     password: PASSWORD,
  63  |     orgName: ORG_NAME,
  64  |   })
  65  | 
  66  |   const token = await sessionToken(page)
  67  |   const auth = { authorization: `Bearer ${token}` }
  68  |   const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
  69  |     items: { id: string; name: string }[]
  70  |   }
  71  |   // Exactly one workspace, wearing the name typed at signup — the idempotency
  72  |   // law: a retry must never mint a second one (E2E-0820 F12).
  73  |   expect(orgs.items).toHaveLength(1)
  74  |   expect(orgs.items[0].name).toBe(ORG_NAME)
  75  | 
  76  |   const orgId = orgs.items[0].id
  77  |   const schedules = (await (
  78  |     await request.get(`${API_BASE}/orgs/${orgId}/schedules`, { headers: auth })
  79  |   ).json()) as { total: number }
  80  |   expect(schedules.total).toBe(0)
  81  | 
  82  |   const tones = (await (
  83  |     await request.get(`${API_BASE}/orgs/${orgId}/brand/tones`, { headers: auth })
  84  |   ).json()) as { total: number }
  85  |   expect(tones.total).toBe(0)
  86  | 
  87  |   const org = (await (
  88  |     await request.get(`${API_BASE}/orgs/${orgId}`, { headers: auth })
  89  |   ).json()) as { org: { country: string | null } }
  90  |   expect(org.org.country).toBeNull()
  91  | })
  92  | 
  93  | test('C1 creates the schedule on first save, then PATCHes it — and it survives a reload', async ({
  94  |   page,
  95  |   request,
  96  | }) => {
  97  |   await login(page, owner, PASSWORD)
  98  |   // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  99  |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  100 |     timeout: SCREEN_SYNC,
  101 |   })
  102 | 
  103 |   // PRECONDITION, not the thing under test: this org has zero tones (ONB-0827,
  104 |   // D-ONB-B) and a schedule needs one. Written through the API the way this
  105 |   // suite already sets up preconditions it does not assert on.
  106 |   const token = await sessionToken(page)
  107 |   const auth = { authorization: `Bearer ${token}` }
  108 |   const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
  109 |     items: { id: string }[]
  110 |   }
  111 |   await request.post(`${API_BASE}/orgs/${orgs.items[0].id}/brand/tones`, {
  112 |     headers: auth,
  113 |     data: { name: TONE_NAME, description: 'Warm, specific, smells of coffee.', rules: [] },
  114 |   })
  115 | 
  116 |   await page.goto('/calendar/settings')
  117 |   await expect(page.getByRole('heading', { name: 'Schedule', level: 1 })).toBeVisible({
  118 |     timeout: 15_000,
  119 |   })
  120 |   // TRAP 2: that h1 belongs to the shell and renders THROUGH the loading
  121 |   // skeleton, so it is not a readiness signal. Without this wait the form is
  122 |   // dirtied against the pre-sync (static) world and the live sync then
  123 |   // replaces it underneath, leaving the save bar stuck on "unsaved changes"
  124 |   // over seven demo tones the org does not have.
  125 |   // The screen's whole sync — live-red-2026-08-23.
  126 |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  127 | 
  128 |   // Nothing is seeded any more (ORDER ONB-0827, D-ONB-B), so the org's one
  129 |   // tone is the one this test wrote for itself above; pick it so the schedule
  130 |   // is valid, then set the cadence.
  131 |   await page.getByRole('group', { name: 'Tones' }).getByRole('button', { name: TONE_NAME }).click()
  132 |   await page.getByRole('button', { name: 'Monday' }).click()
  133 |   await expect(page.getByText('You have unsaved changes.')).toBeVisible()
  134 |   // FIRST save: the org has no schedule, so this is the POST fallback C1 grew
  135 |   // in B9 — the wizard used to create the row and no longer does.
  136 |   await page.getByRole('button', { name: 'Save changes' }).click()
> 137 |   await expect(page.getByText('You have unsaved changes.')).toHaveCount(0, { timeout: SCREEN_SYNC })
      |                                                             ^ Error: expect(locator).toHaveCount(expected) failed
  138 | 
  139 |   // The reload reads the server back through the sync: the row is really there.
  140 |   await page.goto('/calendar/settings')
  141 |   await expect(page.getByRole('heading', { name: 'Schedule', level: 1 })).toBeVisible()
  142 |   // The same sync, read back after the reload — live-red-2026-08-23.
  143 |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  144 |   await expect(page.getByText('You have unsaved changes.')).toHaveCount(0)
  145 |   await expect(
  146 |     page.getByRole('group', { name: 'Tones' }).getByRole('button', { name: TONE_NAME }),
  147 |   ).toHaveAttribute('aria-pressed', 'true')
  148 | 
  149 |   // SECOND save: a schedule exists now, so this is the PATCH path, with the
  150 |   // toneIds replace-semantics this file was written to prove.
  151 |   //
  152 |   // INCREASE, not decrease. The wizard used to create the schedule with a
  153 |   // cadence already above the floor; C1 creates it from the BLANK graft, which
  154 |   // starts at one post a day — so "One fewer" is correctly disabled and
  155 |   // clicking it waits forever. The control that moves is the other one.
  156 |   await page.getByRole('button', { name: 'One more post per day' }).click()
  157 |   await expect(page.getByText('You have unsaved changes.')).toBeVisible()
  158 |   await page.getByRole('button', { name: 'Save changes' }).click()
  159 |   await expect(page.getByText('You have unsaved changes.')).toHaveCount(0, { timeout: SCREEN_SYNC })
  160 | })
  161 | 
  162 | /**
  163 |  * RETIRED 2026-08-20 (E2E-0820 B9): "event sources: the countries endpoint
  164 |  * feeds the picker; one per country".
  165 |  *
  166 |  * It asserted the INT-4 event-source surface — a "Jordan public holidays"
  167 |  * row, an "Add source" button, a duplicate-country 409 — all of which INT-8
  168 |  * superseded when the org's own country became the single holiday control
  169 |  * (D-INT-F; Ward confirmed event-sources are superseded, open-items 21). The
  170 |  * screen it drove now says so in `MESSAGES.notices.eventSourcesSuperseded`
  171 |  * and offers nothing to add, so the test could only ever fail from INT-8 on;
  172 |  * it had simply never been run since INT-4.
  173 |  *
  174 |  * What replaced it, all green in `live-country.spec.ts`: the wizard sets ONE
  175 |  * country and finishing loads its calendar · the calendar carries real
  176 |  * holidays with each day's rules · re-saving the same country is a quiet
  177 |  * no-op rather than a fake reload · and, standing in for this test directly,
  178 |  * "C2 no longer offers an event source it cannot create".
  179 |  */
  180 | test('slots, if ingestion produced any, honour skip/un-skip and never offer approve', async ({
  181 |   page,
  182 |   request,
  183 | }) => {
  184 |   await login(page, owner, PASSWORD)
  185 |   // --funded (item 60): the walk runs on the funded org, which has slots only
  186 |   // if ingestion ran there; a fresh org never has any and this skips.
  187 |   if (fundedRunsRequested()) await skipUnlessFunded(page, request, 'the slot walk')
  188 |   // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  189 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  190 |     timeout: SCREEN_SYNC,
  191 |   })
  192 |   const token = await sessionToken(page)
  193 |   const auth = { authorization: `Bearer ${token}` }
  194 |   const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
  195 |     items: { id: string }[]
  196 |   }
  197 |   const orgId = orgs.items[0].id
  198 |   const slots = (await (
  199 |     await request.get(`${API_BASE}/orgs/${orgId}/slots`, { headers: auth })
  200 |   ).json()) as { items: { id: string; status: string }[]; total: number }
  201 | 
  202 |   test.skip(slots.total === 0, 'ingestion has not produced slots for this org yet')
  203 | 
  204 |   const target = slots.items.find((slot) => slot.status === 'review')!
  205 |   const skipped = await request.patch(`${API_BASE}/orgs/${orgId}/slots/${target.id}`, {
  206 |     headers: auth,
  207 |     data: { skip: true },
  208 |   })
  209 |   expect(((await skipped.json()) as { status: string }).status).toBe('skipped')
  210 |   const restored = await request.patch(`${API_BASE}/orgs/${orgId}/slots/${target.id}`, {
  211 |     headers: auth,
  212 |     data: { skip: false },
  213 |   })
  214 |   expect(((await restored.json()) as { status: string }).status).toBe('review')
  215 | })
  216 | 
```