# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-scheduling.spec.ts >> C1 creates the schedule on first save, then PATCHes it — and it survives a reload
- Location: e2e\live-scheduling.spec.ts:93:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('You have unsaved changes.')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('You have unsaved changes.')

```

```yaml
- img "Malaky"
- text: Workspace
- list:
  - listitem:
    - link "Dashboard":
      - /url: /
  - listitem:
    - link "Today":
      - /url: /today
  - listitem:
    - link "Generate":
      - /url: /generate
  - listitem:
    - link "Calendar":
      - /url: /calendar
  - listitem:
    - link "Studio":
      - /url: /studio
  - listitem:
    - link "Analytics":
      - /url: /analytics
  - listitem:
    - link "Connections":
      - /url: /connections
  - listitem:
    - link "Billing":
      - /url: /billing
  - listitem:
    - link "Settings":
      - /url: /settings
- text: Q QA Sched Org 1789458343694931
- button "Toggle Sidebar"
- banner:
  - button "Toggle Sidebar"
  - heading "Schedule" [level=1]
  - paragraph: When drafts are generated, how many, and in which voices
  - link "No balance yet — subscribe":
    - /url: /billing
  - button "Notifications"
  - button "Account menu": QS
- main:
  - heading "When" [level=2]
  - text: Timezone
  - paragraph: Slot times are wall-clock in this zone, so daylight saving never moves your posts.
  - combobox "Timezone":
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
  - group "Active days":
    - text: Active days
    - paragraph: Drafts are generated on the days you pick.
    - toolbar:
      - button "Monday" [pressed]: M
      - button "Tuesday": T
      - button "Wednesday": W
      - button "Thursday": T
      - button "Friday": F
      - button "Saturday": S
      - button "Sunday": S
  - text: Generate at
  - paragraph: Drafts are ready by this time, so they are waiting when you start.
  - textbox "Generate at": 09:00
  - heading "How much, and how" [level=2]
  - text: Posts per day
  - paragraph: At most 3 a day, so the queue stays reviewable.
  - button "One fewer post per day": −
  - status "Posts per day": "2"
  - button "One more post per day": +
  - group "Generation model":
    - text: Generation model
    - paragraph: Which model drafts your copy.
    - radio "Balanced The default. Every plan can use it." [checked]
    - text: Balanced The default. Every plan can use it.
    - radio "Creative Pro plan Bolder angles and fresher hooks; a touch slower." [disabled]
    - text: Creative Pro plan Bolder angles and fresher hooks; a touch slower.
    - radio "Precise Pro plan Our highest-quality drafting model." [disabled]
    - text: Precise Pro plan Our highest-quality drafting model.
  - heading "Tones" [level=2]
  - link "Manage tones →":
    - /url: /settings/tones
  - group "Tones":
    - text: Tones
    - paragraph: Drafts rotate through the tones you pick.
    - button "Roastery floor" [pressed]
    - button "Create custom tone"
    - figure "A sample post in Roastery floor":
      - text: A sample post in Roastery floor
      - paragraph: Warm, specific, smells of coffee.
      - paragraph: Composed from the tone itself — nothing was generated.
  - heading "Events" [level=2]
  - text: Attach posts to events
  - paragraph: Slots near a holiday or launch borrow its name and date.
  - switch "Attach posts to events"
  - paragraph: Up to 2 drafts a week, in 1 tone, drafted by Balanced.
  - status: Saved
- region "Notifications alt+T"
```

# Test source

```ts
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
  133 |   // The production world starts with NO model selected (GATE-0910, item 62):
  134 |   // the form refuses to save without one — "Pick which model drafts your
  135 |   // copy." — so this walk picks Balanced, as a new org on production must.
  136 |   // The dev server's demo world had one pre-picked, which hid this for weeks.
  137 |   await page.getByRole('radio', { name: /^Balanced/ }).check()
  138 |   await expect(page.getByText('You have unsaved changes.')).toBeVisible()
  139 |   // FIRST save: the org has no schedule, so this is the POST fallback C1 grew
  140 |   // in B9 — the wizard used to create the row and no longer does.
  141 |   await page.getByRole('button', { name: 'Save changes' }).click()
  142 |   await expect(page.getByText('You have unsaved changes.')).toHaveCount(0, { timeout: SCREEN_SYNC })
  143 | 
  144 |   // The reload reads the server back through the sync: the row is really there.
  145 |   await page.goto('/calendar/settings')
  146 |   await expect(page.getByRole('heading', { name: 'Schedule', level: 1 })).toBeVisible()
  147 |   // The same sync, read back after the reload — live-red-2026-08-23.
  148 |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: SCREEN_SYNC })
  149 |   await expect(page.getByText('You have unsaved changes.')).toHaveCount(0)
  150 |   await expect(
  151 |     page.getByRole('group', { name: 'Tones' }).getByRole('button', { name: TONE_NAME }),
  152 |   ).toHaveAttribute('aria-pressed', 'true')
  153 | 
  154 |   // SECOND save: a schedule exists now, so this is the PATCH path, with the
  155 |   // toneIds replace-semantics this file was written to prove.
  156 |   //
  157 |   // INCREASE, not decrease. The wizard used to create the schedule with a
  158 |   // cadence already above the floor; C1 creates it from the BLANK graft, which
  159 |   // starts at one post a day — so "One fewer" is correctly disabled and
  160 |   // clicking it waits forever. The control that moves is the other one.
  161 |   await page.getByRole('button', { name: 'One more post per day' }).click()
> 162 |   await expect(page.getByText('You have unsaved changes.')).toBeVisible()
      |                                                             ^ Error: expect(locator).toBeVisible() failed
  163 |   await page.getByRole('button', { name: 'Save changes' }).click()
  164 |   await expect(page.getByText('You have unsaved changes.')).toHaveCount(0, { timeout: SCREEN_SYNC })
  165 | })
  166 | 
  167 | /**
  168 |  * RETIRED 2026-08-20 (E2E-0820 B9): "event sources: the countries endpoint
  169 |  * feeds the picker; one per country".
  170 |  *
  171 |  * It asserted the INT-4 event-source surface — a "Jordan public holidays"
  172 |  * row, an "Add source" button, a duplicate-country 409 — all of which INT-8
  173 |  * superseded when the org's own country became the single holiday control
  174 |  * (D-INT-F; Ward confirmed event-sources are superseded, open-items 21). The
  175 |  * screen it drove now says so in `MESSAGES.notices.eventSourcesSuperseded`
  176 |  * and offers nothing to add, so the test could only ever fail from INT-8 on;
  177 |  * it had simply never been run since INT-4.
  178 |  *
  179 |  * What replaced it, all green in `live-country.spec.ts`: the wizard sets ONE
  180 |  * country and finishing loads its calendar · the calendar carries real
  181 |  * holidays with each day's rules · re-saving the same country is a quiet
  182 |  * no-op rather than a fake reload · and, standing in for this test directly,
  183 |  * "C2 no longer offers an event source it cannot create".
  184 |  */
  185 | test('slots, if ingestion produced any, honour skip/un-skip and never offer approve', async ({
  186 |   page,
  187 |   request,
  188 | }) => {
  189 |   await login(page, owner, PASSWORD)
  190 |   // --funded (item 60): the walk runs on the funded org, which has slots only
  191 |   // if ingestion ran there; a fresh org never has any and this skips.
  192 |   if (fundedRunsRequested()) await skipUnlessFunded(page, request, 'the slot walk')
  193 |   // First wait after login — the dashboard's whole sync — live-red-2026-08-23.
  194 |   await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible({
  195 |     timeout: SCREEN_SYNC,
  196 |   })
  197 |   const token = await sessionToken(page)
  198 |   const auth = { authorization: `Bearer ${token}` }
  199 |   const orgs = (await (await request.get(`${API_BASE}/me/orgs`, { headers: auth })).json()) as {
  200 |     items: { id: string }[]
  201 |   }
  202 |   const orgId = orgs.items[0].id
  203 |   const slots = (await (
  204 |     await request.get(`${API_BASE}/orgs/${orgId}/slots`, { headers: auth })
  205 |   ).json()) as { items: { id: string; status: string }[]; total: number }
  206 | 
  207 |   test.skip(slots.total === 0, 'ingestion has not produced slots for this org yet')
  208 | 
  209 |   const target = slots.items.find((slot) => slot.status === 'review')!
  210 |   const skipped = await request.patch(`${API_BASE}/orgs/${orgId}/slots/${target.id}`, {
  211 |     headers: auth,
  212 |     data: { skip: true },
  213 |   })
  214 |   expect(((await skipped.json()) as { status: string }).status).toBe('skipped')
  215 |   const restored = await request.patch(`${API_BASE}/orgs/${orgId}/slots/${target.id}`, {
  216 |     headers: auth,
  217 |     data: { skip: false },
  218 |   })
  219 |   expect(((await restored.json()) as { status: string }).status).toBe('review')
  220 | })
  221 | 
```