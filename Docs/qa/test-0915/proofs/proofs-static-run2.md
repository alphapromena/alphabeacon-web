# TEST-0915 — proofs E, F (static) and G, measured in the moving state

- app: `http://localhost:5199` (a STATIC dev server; zero network) · seeded DEMO-0914 review world · started 2026-09-15T08:39:43.867Z

| Proof | Check | Result | Detail |
| --- | --- | --- | --- |
| E | first light plays on a fresh account and axe is clean while it is on screen | **PASS** | seen: true; violations mid-animation: 0  |
| E | first light is under the 2000 ms ceiling (page-time insertion → removal) | **PASS** | 1806 ms (FIRST_LIGHT_MS is 1800) |
| E | the account flag is written at the start, long before the moment ends | **PASS** | flag landed 11 ms after the overlay mounted; at removal the key read "1" |
| E | where first light resolves | **NOTE** | the Dashboard (the post-verify destination, deliberate — not changed) |
| E | an account that has been welcomed is never welcomed again (flag present → no overlay, same landing) | **PASS** | overlay count 0; Dashboard 1 |
| E | a reload never replays it | **PASS** | overlay count after reload 0 |
| E | a storage that throws counts as already seen: no overlay, and the app still lands | **PASS** | overlay count 0; Dashboard 1 |
| E | under prefers-reduced-motion first light is not mounted and the landing is the same | **PASS** | overlay count 0; Dashboard 1 |
| G | the press state steps the accent down its own ramp (--primary-pressed #e84122) and the label still clears AA | **PASS** | "Approve" at rest rgb(255, 78, 45), pressed rgb(232, 65, 34), label rgb(26, 10, 5), ratio 4.78:1; --primary-pressed = #e84122 |
| G | the website's --c-accent-lo (4.49:1) is not defined on the app's root | **PASS** | --c-accent-lo on :root = "" |
| G | the gold navigation indicator is ONE element in the rail, and the same node travels between routes | **FAIL** | count 1; same node across 3 moves: false; transforms: matrix(1, 0, 0, 1, 0, 36) → matrix(1, 0, 0, 1, 0, 132) → matrix(1, 0, 0, 1, 0, 228) → matrix(1, 0, 0, 1, 0, 260) |
| G | the rail indicator SLIDES between screens (the same node, intermediate transforms) rather than re-mounting and fading in | **FAIL** | Dashboard → Today: same node: false; distinct transforms: 2 (matrix(1, 0, 0, 1, 0, 4) \| matrix(1, 0, 0, 1, 0, 36)); placed=false seen: true; opacity<1 seen: true; first new node at 77 ms · Today → Billing: same node: false; distinct transforms: 2 (matrix(1, 0, 0, 1, 0, 36) \| matrix(1, 0, 0, 1, 0, 228)); placed=false seen: true; opacity<1 seen: true; first new node at 65 ms |
| G | the settings sub-nav indicator SLIDES between tabs (the same node, intermediate transforms) | **PASS** | Organization → Brand voice: same node: true; distinct transforms: 14 (matrix(1, 0, 0, 1, 16, 0) \| matrix(1, 0, 0, 1, 59.9242, 0) \| matrix(1, 0, 0, 1, 87.4383, 0) \| matrix(1, 0, 0, 1, 103.326, 0)); placed=false seen: false; opacity<1 seen: false; first new node at never · Brand voice → Tones: same node: true; distinct transforms: 14 (matrix(1, 0, 0, 1, 125.703, 0) \| matrix(1, 0, 0, 1, 167.587, 0) \| matrix(1, 0, 0, 1, 193.712, 0) \| matrix(1, 0, 0, 1, 208.838, 0)); placed=false seen: false; opacity<1 seen: false; first new node at never |

## axe — WCAG 2 A + AA, scanned DURING each moment

| Where | Violations | Detail |
| --- | --- | --- |
