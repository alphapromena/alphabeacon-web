# TEST-0915 — proofs B, F, I against the deployed dev API (live-run3)

- app: `http://localhost:5199` (the built app, the dev API base inlined) · API host redacted · started 2026-09-15T08:25:48.358Z
- orgs: A = `qa+1789459369070865pa@alphapromena.com`, B = `qa+1789459377712684pb@alphapromena.com`, F = minted through the product in-run

| Proof | Check | Result | Detail |
| --- | --- | --- | --- |
| B | the contract number | **NOTE** | Docs/api/api.md:675 — "at most **50** rules per create/PATCH" (the wire); the product cap is MAX_BRAND_VOICE_RULES = 40 (D-INT-B amended). Org B stores 44 rules (request 6cac0099-9c79-4e40-95cb-1ad8eea39ce5) |
| B | above the cap: the counter says so, both Add controls are disabled, every row is still listed | **PASS** | counter "44 / 40 across Do and Don’t"; cap sentence present: true ("You can keep at most 40 brand voice rules across Do and Don’t. Remove one to add another."); Add do disabled: true; Add don't disabled: true; 29 do + 15 dont inputs |
| B | a list above the cap still shrinks and saves; Add stays disabled while still at or above 40 | **PASS** | counter after removal "43 / 40 across Do and Don’t"; Add still disabled: true; wire after save: 43 rules (request 86a19411-4aca-4069-b6d6-2822c7a1f6b5) |
| B | the wire refuses 51 rules and accepts 50 — the contract number stands, and the product stops at 40 below it | **PASS** | 51 rules → 400 "validation_failed" (request ed1a6564-0ff9-46e2-a24d-3db509e6bd8f); 50 rules → 201 (request be016822-d2e1-4141-b45e-97f619cf0fd4); probe row deleted → 204 (request 4a604ebb-5d8b-4313-bf09-8ee2ae9b7848) |
| F | first light in LIVE mode on a fresh account | **NOTE** | visible to the harness: true; ever mounted (in-page observer): false; account flag ab-first-light:qa+17… = "1" |
| F | the fresh live org | **NOTE** | org 2203, qa+1789460770126862f@alphapromena.com |
| F | a fresh LIVE org receives no seeded drafts, brand voice, sources or topics (live dispatches live/resync and never reaches the seed) | **PASS** | Today: 0 Approve buttons, empty state "Nothing here": true; wire: voices 0 (2bc9f075-6f81-489c-a6ce-a744ab3b928d), sources 0 (3f4c19fc-0413-4bda-a76b-63e16fe43828), topics 0 (bff24643-b4a0-49cf-a6a5-743db490fa80), proposals 200 → 0 (bb6a8e04-45d4-4977-a6ba-ff417c60d6be); Today reads: "0 need review Needs review Approved Declined Publishing and channel connections are not wired up yet. Approving records the post; copying it is how it goes out. Nothing here Nothing waiting for review — generate posts to start. Finish setup to generate" |
| F | LIVE Analytics says what is true and asks for no work | **PASS** | title present: true; "Go to Connections": 0; buttons in main: [] |
| F | LIVE Connections says what is true | **PASS** | notice present: true; status badges: ["Not connected","Not connected","Not connected","Not connected"] |
| F | the Connect flow never shows a success state (LIVE) | **PASS** | mid-flow url /connections?connect=success&platform=facebook: "Facebook is not linked yet Connecting walks the flow, but no channel is linked to a platform yet — that arrives with publishing. Nothing here posts on your behalf. Back to connections"; after 2.2 s: toasts []; status badges after: ["Not connected","Not connected","Not connected","Not connected"]; "connected" in the return text: false |
| I | revocation | **NOTE** | POST /auth/logout with the app's own token → 204 (request 82e6631d-6c7a-4821-9fa9-638ed4979f79) |
| I | a REVOKED token: the next read answers 401, the session is purged, the toast shows, the app lands on login | **FAIL** | url /; toast "Your session ended. Sign in again to continue." ×0; session in storage: false; Sign in button: 0 |
| I | an EXPIRED token at boot: the first sync answers 401, the session is purged, the toast shows, the app lands on login (no refresh endpoint — api.md:21) | **PASS** | url /login; toast ×1; session in storage: false |
