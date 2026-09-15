# TEST-0915 — proofs A, B, C, F, I against the deployed dev API (live)

- app: `http://localhost:5199` (the built app, the dev API base inlined) · API host redacted · started 2026-09-15T08:17:16.039Z
- orgs: A = `qa+1789459369070865pa@alphapromena.com`, B = `qa+1789459377712684pb@alphapromena.com`, F = minted through the product in-run

| Proof | Check | Result | Detail |
| --- | --- | --- | --- |
| A | wire order | **NOTE** | GET voices (request 0a3747fe-123b-4f09-b8ad-28c7ce1b3fb2) lists newest first: [372, 371]; the OLDEST same-named row is 371 with ["dont: Canonical dont rule"]; extra row(s) 372 ["do: Extra do rule","dont: Extra dont rule"] |
| A | the wire lists the newer row first (createdAt DESC), so a first-item read would pick the wrong row | **PASS** | items[0].id = 372, canonical (oldest) = 371 |
| A | proof ran to the end | **FAIL** | TimeoutError: locator.inputValue: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for getByRole('textbox', { name: 'Do rule 1', exact: true })[22m
 |
| C | a 400 from the wire never becomes "saved": no success toast, and the error toast carries the wire's own field message | **PASS** | PATCH intercepted 1×; "Brand voice saved" on screen: 0; error toast: "Too big: expected array to have <=50 items" |
| C | the in-screen refusal (role=alert with the request id) is still on screen 3 s later, with the draft and the Save button | **FAIL** | alert seen at all: false; after 3 s — draft "Proof C rule" still in an input: false; Save button: 0; aria-busy regions: 0 |
| C | the wire holds exactly what it held before the refused save | **PASS** | request 5293b483-5c1e-41fe-ba96-23d5506e856e: canonical 371 → ["dont: Canonical dont rule"] (before: ["dont: Canonical dont rule"]) |
| B | the contract number | **NOTE** | Docs/api/api.md:675 — "at most **50** rules per create/PATCH" (the wire); the product cap is MAX_BRAND_VOICE_RULES = 40 (D-INT-B amended). Org B stores 45 rules (request 71549491-c9a1-4955-aa93-866317ad9b2a) |
| B | above the cap: the counter says so, both Add controls are disabled, every row is still listed | **PASS** | counter "45 / 40 across Do and Don’t"; cap sentence present: true ("You can keep at most 40 brand voice rules across Do and Don’t. Remove one to add another."); Add do disabled: true; Add don't disabled: true; 30 do + 15 dont inputs |
| B | a list above the cap still shrinks and saves; Add stays disabled while still at or above 40 | **FAIL** | counter after removal "45 / 40 across Do and Don’t"; Add still disabled: true; wire after save: 44 rules (request df14b6ee-1f17-453c-b9df-1e2a443a11ae) |
| B | the wire refuses 51 rules and accepts 50 — the contract number stands, and the product stops at 40 below it | **PASS** | 51 rules → 400 "validation_failed" (request 525504b0-313c-43db-be5c-6695fe60c671); 50 rules → 201 (request 39713604-02a7-4555-87d1-529b16daaa4c); probe row deleted → 204 (request cf2e9625-174d-42c4-a8f0-6138ad77ea33) |
| F | first light in LIVE mode on a fresh account | **NOTE** | visible to the harness: false; ever mounted (in-page observer): false; account flag ab-first-light:qa+17… = "1" |
| F | the fresh live org | **NOTE** | org 2202, qa+1789460307617410f@alphapromena.com |
| F | a fresh LIVE org receives no seeded drafts, brand voice, sources or topics (live dispatches live/resync and never reaches the seed) | **PASS** | Today: 0 Approve buttons, empty state "Nothing here": true; wire: voices 0 (fe9ffa38-1c0f-4982-8e65-abaaf400aca9), sources 0 (3eb0df2f-b584-40f2-ba20-85ba726b1d75), topics 0 (833aee01-acb3-4168-9f11-96f5cbacce53), proposals 200 → 0 (f9b70b6b-7845-4ccf-ba73-82511e9aae1f); Today reads: "0 need review Needs review Approved Declined Publishing and channel connections are not wired up yet. Approving records the post; copying it is how it goes out. Nothing here Nothing waiting for review — generate posts to start. Finish setup to generate" |
| F | LIVE Analytics says what is true and asks for no work | **PASS** | title present: true; "Go to Connections": 0; buttons in main: [] |
| F | LIVE Connections says what is true | **PASS** | notice present: true; status badges: ["Not connected","Not connected","Not connected","Not connected"] |
| F | the Connect flow never shows a success state (LIVE) | **PASS** | mid-flow url /connections?connect=success&platform=facebook: "Facebook is not linked yet Connecting walks the flow, but no channel is linked to a platform yet — that arrives with publishing. Nothing here posts on your behalf. Back to connections"; after 2.2 s: toasts []; status badges after: ["Not connected","Not connected","Not connected","Not connected"]; "connected" in the return text: false |
| I | revocation | **NOTE** | POST /auth/logout with the app's own token → 204 (request d3269df4-fba2-4a75-90e0-c8cfb9577ca4) |
| I | variant 1 ran to the end | **FAIL** | TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for getByRole('tab', { name: 'Team' })[22m
 |
| I | an EXPIRED token at boot: the first sync answers 401, the session is purged, the toast shows, the app lands on login (no refresh endpoint — api.md:21) | **PASS** | url /login; toast ×1; session in storage: false |
