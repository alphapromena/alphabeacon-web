# TEST-0915 — proofs C against the deployed dev API (t2-item73)

- app: `http://localhost:5197` (the built app, the dev API base inlined) · API host redacted · started 2026-09-15T18:50:13.539Z
- orgs: A = `qa+1789498198767463a@alphapromena.com`, B = `qa+1789498198767463a@alphapromena.com`, F = minted through the product in-run

| Proof | Check | Result | Detail |
| --- | --- | --- | --- |
| C | a 400 from the wire never becomes "saved": no success toast, and the error toast carries the wire's own field message | **PASS** | PATCH intercepted 1×; "Brand voice saved" on screen: 0; error toast: "Too big: expected array to have <=50 items" |
| C | the in-screen refusal (role=alert with the request id) is still on screen 3 s later, with the draft and the Save button | **PASS** | alert seen at all: true ("Too big: expected array to have <=50 items request test-0915-proof-c-1789498229836"); after 3 s — draft "Proof C rule" still in an input: true; Save button: 1; aria-busy regions: 0 |
| C | the wire holds exactly what it held before the refused save | **PASS** | request a3334c31-d5ba-4a97-9b77-63fcbdc7e8a8: canonical 398 → ["do: Name the roast date when it matters"] (before: ["do: Name the roast date when it matters"]) |
