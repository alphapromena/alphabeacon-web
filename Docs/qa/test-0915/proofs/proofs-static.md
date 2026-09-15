# TEST-0915 — proofs E, F (static) and G, measured in the moving state

- app: `http://localhost:5199` (a STATIC dev server; zero network) · seeded DEMO-0914 review world · started 2026-09-15T08:34:29.463Z

| Proof | Check | Result | Detail |
| --- | --- | --- | --- |
| E | first light plays on a fresh account and axe is clean while it is on screen | **PASS** | seen: true; violations mid-animation: 0  |
| E | first light is under the 2000 ms ceiling (page-time insertion → removal) | **FAIL** | 0 ms (FIRST_LIGHT_MS is 1800) |
| E | the account flag is written at the start, long before the moment ends | **FAIL** | flag landed 0 ms after the overlay mounted; at removal the key read null |
| E | where first light resolves | **NOTE** | the Dashboard (the post-verify destination, deliberate — not changed) |
| E | an account that has been welcomed is never welcomed again (flag present → no overlay, same landing) | **PASS** | overlay count 0; Dashboard 1 |
| E | a reload never replays it | **PASS** | overlay count after reload 0 |
| E | a storage that throws counts as already seen: no overlay, and the app still lands | **PASS** | overlay count 0; Dashboard 1 |
| E | under prefers-reduced-motion first light is not mounted and the landing is the same | **PASS** | overlay count 0; Dashboard 1 |
| G | the press state steps the accent down its own ramp (--primary-pressed #e84122) and the label still clears AA | **PASS** | "Approve" at rest rgb(255, 78, 45), pressed rgb(232, 65, 34), label rgb(26, 10, 5), ratio 4.78:1; --primary-pressed = #e84122 |
| G | the website's --c-accent-lo (4.49:1) is not defined on the app's root | **PASS** | --c-accent-lo on :root = "" |
| G | the gold navigation indicator is ONE element in the rail, and the same node travels between routes | **FAIL** | count 1; same node across 3 moves: false; transforms: matrix(1, 0, 0, 1, 0, 36) → matrix(1, 0, 0, 1, 0, 132) → matrix(1, 0, 0, 1, 0, 228) → matrix(1, 0, 0, 1, 0, 260) |
| E | moment 1 (tone sample) rewrites beside the picker and axe is clean at rest and mid-rewrite | **PASS** | moment 1 — schedule, tone sample at rest: 0  · moment 1 — mid-rewrite: 0  |
| E | moment 4 (generating) shows an honest stage line, no percentage, and axe is clean mid-stage | **PASS** | stage: "Writing your draft…"; moment 4 — generating, mid-stage: 0  |
| E | moment 3 (approve) settles without costing the click, and axe is clean mid-animation | **FAIL** | click → settled: n=2, median 41 ms (41, 37); color-contrast (serious, 1 node: div[data-description=""]) |
| E | with the Approve toast up axe is clean and the description clears AA (was 1.46:1 before D-MOTION-0914-L) | **PASS** | toast "Approved" / "Create the art, or schedule it as it is.": rgb(232, 232, 232) on rgb(22, 31, 38) = 13.62:1 ; violations 0  |
| E | every app screen scans clean while its content entrance is in flight (22 routes) | **PASS** | /: 0 · /today: 0 · /calendar: 0 · /calendar/settings: 0 · /calendar/sources: 0 · /connections: 0 · /studio: 0 · /studio/new: 0 · /studio/jobs: 0 · /billing: 0 · /billing/plans: 0 · /billing/subscription: 0 · /billing/balance: 0 · /generate: 0 · /analytics: 0 · /settings: 0 · /settings/organization: 0 · /settings/brand-voice: 0 · /settings/tones: 0 · /settings/sources: 0 · /settings/knowledge: 0 · /settings/team: 0 |
| E | a waiting screen mounts role="status" + aria-busy at the true start and paints nothing before 220 ms | **PASS** | aria-busy at mount: true; first paint above 2% opacity 231 ms after mount (4 ms polling, 60 samples) |
| F | STATIC Connections says what is true | **PASS** | notice present: true; status badges before: ["Not connected","Not connected","Not connected","Not connected"] |
| F | the Connect flow never shows a success state (STATIC) | **PASS** | mid-flow url /connections?connect=success&platform=facebook: "Facebook is not linked yet Connecting walks the flow, but no channel is linked to a platform yet — that arrives with publishing. Nothing here posts on your behalf. Back to connections"; after 2.2 s: toasts []; status badges []; "connected" in the card text: false |
| F | STATIC Analytics says what is true and asks for no work | **PASS** | title present: true; "Go to Connections": 0; buttons in main: [] |
| E | under reduced motion every duration in the scale collapses to 0ms and every transition to 0s; the skeleton threshold does not | **PASS** | reduced: fast 0ms, medium 0ms, slow 0ms, skeleton-delay 220ms, button transitions ["0s","0s","0s","0s","0s"]; normal: fast 120ms, medium 220ms, slow 900ms, skeleton-delay 220ms |
| E | under reduced motion every data-ab-motion element is removed, none of them is or contains a control, and no control disappears | **PASS** | Today controls: 40 normal vs 40 reduced; data-ab-motion elements: 2 (hidden 2); controls inside/at data-ab-motion: 0 / 0 |
| E | under reduced motion the approve settle is its end state at once (0s animation, no fade, the card still there) | **PASS** | click → settled 48 ms; [data-ab-approving] present: true, animation-duration 0s, opacity 1, transform none; Approved badge: true |
| E | under reduced motion a finished screen never flashes a skeleton (five routes, seeded world) | **PASS** | Today: 75 ms, skeleton not seen · Billing: 354 ms, skeleton not seen · Settings: 668 ms, skeleton not seen · Studio: 345 ms, skeleton not seen · Calendar: 326 ms, skeleton not seen |

## axe — WCAG 2 A + AA, scanned DURING each moment

| Where | Violations | Detail |
| --- | --- | --- |
| moment 1 — schedule, tone sample at rest | **0** | — |
| moment 1 — mid-rewrite | **0** | — |
| moment 4 — generating, mid-stage | **0** | — |
| moment 3 — approve, mid-animation | **1** | color-contrast (serious, 1 node: div[data-description=""]) |
| moment 3 — Approve toast up | **0** | — |
