# TEST-0915 — proofs I against the deployed dev API (live-run6)

- app: `http://localhost:5199` (the built app, the dev API base inlined) · API host redacted · started 2026-09-15T08:33:38.093Z
- orgs: A = `qa+1789459369070865pa@alphapromena.com`, B = `qa+1789459377712684pb@alphapromena.com`, F = minted through the product in-run

| Proof | Check | Result | Detail |
| --- | --- | --- | --- |
| I | revocation | **NOTE** | POST /auth/logout with the app's own token → 204 (request 3c6f25d3-3bd7-43cb-9ee5-9773d83f955c) |
| I | a REVOKED token: the next read answers 401, the session is purged, the toast shows, the app lands on login | **FAIL** | url trajectory / → /settings → /; toast first seen at 413 ms; session purged at 413 ms; final url /; Sign in button: 0 |
| I | an EXPIRED token at boot: the first sync answers 401, the session is purged, the toast shows, the app lands on login (no refresh endpoint — api.md:21) | **PASS** | url /login; toast ×1; session in storage: false |
