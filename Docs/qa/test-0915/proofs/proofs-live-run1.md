# TEST-0915 — proofs A, B, C, F (live) and I, against the deployed dev API

- app: `http://localhost:5199` (the built app, the dev API base inlined) · API host redacted · started 2026-09-15T08:03:47.108Z
- orgs: A = `qa+1789459369070865pa@alphapromena.com`, B = `qa+1789459377712684pb@alphapromena.com`, F = minted through the product in-run

| Proof | Check | Result | Detail |
| --- | --- | --- | --- |
| A | wire order | **NOTE** | GET voices (request 19d0f5f2-b78b-402c-96f0-23f306455614) lists newest first: [372, 371]; the OLDEST same-named row is 371 with ["do: Canonical do rule","dont: Canonical dont rule"]; extra row(s) 372 ["do: Extra do rule","dont: Extra dont rule"] |
| A | the wire lists the newer row first (createdAt DESC), so a first-item read would pick the wrong row | **PASS** | items[0].id = 372, canonical (oldest) = 371 |
| A | the screen reads the CANONICAL row (creation order), not the newest | **PASS** | Do rule 1 = "Canonical do rule", Don't rule 1 = "Canonical dont rule", 1 do + 1 dont inputs (the extra row's "Extra do rule" is not on screen) |
| A | no extra-row rule is editable on screen | **PASS** | inputs carrying "Extra": [] |
| A | the extra-rows notice renders with the owner-or-admin wording | **PASS** | notice: "This workspace has extra brand voice rows that this screen cannot edit. Their rules still shape every draft, and the count below covers only the rules shown here. Ask a workspace owner or admin to merge them into this list. (1 extra row, 2 rules)" |
| A | the counter covers only the rules shown | **PASS** | counter: "2 / 40 across Do and Don’t" |
| A | removing a rule through the screen shrinks ONLY the canonical row on the wire | **PASS** | request fa9f8c56-0e5c-4c8a-afdf-89d1ca97052b: canonical 371 → ["dont: Canonical dont rule"]; extra untouched: [["do: Extra do rule","dont: Extra dont rule"]] |
| A | after a reload the screen still shows the canonical row only | **PASS** | Don't rule 1 = "Canonical dont rule", do inputs = 0 |
| C | a 400 from the wire renders as itself — field message and request id — and the screen never says saved | **FAIL** | PATCH intercepted 1×; alert: "(no alert)"; "Brand voice saved" on screen: 0; error toasts: 1 |
| A/C | proof ran to the end | **FAIL** | TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: 'Save changes' })[22m
 |
| B | the contract number | **NOTE** | Docs/api/api.md:675 — "at most **50** rules per create/PATCH" (the wire); the product cap is MAX_BRAND_VOICE_RULES = 40 (D-INT-B amended). Org B stores 45 rules (request 5d2f0ea0-1c41-449f-8a2d-5ebddc53f2ca) |
| B | proof ran to the end | **FAIL** | Error: locator.innerText: Error: strict mode violation: getByText(/across Do and Don/) resolved to 2 elements:
    1) <span aria-live="polite" class="text-xs text-muted-foreground">…</span> aka getByText('/ 40 across Do and Don’t')
    2) <p role="status" class="text-sm text-muted-foreground">You ca |
| F | first light in LIVE mode on a fresh account | **NOTE** | did not appear within 15 s |
| F | the fresh live org | **NOTE** | org 2201, qa+1789459499697008f@alphapromena.com |
| F | a fresh LIVE org receives no seeded drafts, brand voice, sources or topics (live dispatches live/resync and never reaches the seed) | **FAIL** | Today: 0 Approve buttons, "Nothing here" ×0; wire: voices 0 (efad443f-7010-438a-8509-6b7f7c3033fd), sources 0 (234fc365-2bf6-463d-acf5-700f251d3ab7), topics 0 (33aee5d8-a5cf-40bf-829b-ed18efb04faa), proposals 200 → 0 (509f7862-a81b-43e3-a562-e2460212f1b7); Today reads: "Reading your queue… Needs review Approved Declined Publishing and channel connections are not wired up yet. Approving records the post; copying it is how it goes out." |
| F | LIVE Connections says what is true | **PASS** | notice present: true |
| F | the Connect flow never shows a success state (LIVE) | **FAIL** | mid-flow url /connections?connect=success&platform=facebook: "Connecting your Facebook account… Almost there. We are storing the permissions you granted."; after 2.2 s: toasts ["Facebook connected\nPosting and analytics are on."]; status badges ["Active","Not connected","Not connected","Not connected"]; card text has "connected": true |
| F | LIVE Analytics says what is true and asks for no work | **FAIL** | title present: false; "Go to Connections": 0; buttons in main: ["Last 7 days","Last 14 days","Last 30 days"] |
| I | revocation | **NOTE** | POST /auth/logout with the app's own token → 204 (request b3f62f14-2c20-485a-93b0-05e30e67335b) |
| I | variant 1 ran to the end | **FAIL** | TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for getByRole('tab', { name: 'Brand voice' })[22m
 |
| I | an EXPIRED token at boot: the first sync answers 401, the session is purged, the toast shows, the app lands on login (no refresh endpoint — api.md:21) | **PASS** | url /login; toast ×1; session in storage: false |
