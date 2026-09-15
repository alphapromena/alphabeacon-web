# TEST-0915 — proofs I against the deployed dev API (live-run5)

- app: `http://localhost:5199` (the built app, the dev API base inlined) · API host redacted · started 2026-09-15T08:31:34.174Z
- orgs: A = `qa+1789459369070865pa@alphapromena.com`, B = `qa+1789459377712684pb@alphapromena.com`, F = minted through the product in-run

| Proof | Check | Result | Detail |
| --- | --- | --- | --- |
| I | revocation | **NOTE** | POST /auth/logout with the app's own token → 204 (request e2b8101c-7069-4bc5-90ba-39ab60126c20) |
| I | variant 1 ran to the end | **FAIL** | TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for getByRole('link', { name: 'Settings' }).first()[22m
 |
| I | an EXPIRED token at boot: the first sync answers 401, the session is purged, the toast shows, the app lands on login (no refresh endpoint — api.md:21) | **PASS** | url /login; toast ×1; session in storage: false |
