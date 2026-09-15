# TEST-0915 — proofs E, F (static) and G, measured in the moving state

- app: `http://localhost:5199` (a STATIC dev server; zero network) · seeded DEMO-0914 review world · started 2026-09-15T17:07:49.289Z

| Proof | Check | Result | Detail |
| --- | --- | --- | --- |
| E | under reduced motion every duration in the scale collapses to 0ms and every transition to 0s; the skeleton threshold does not | **PASS** | reduced: fast 0ms, medium 0ms, slow 0ms, skeleton-delay 220ms, button transitions ["0s","0s","0s","0s","0s"]; normal: fast 120ms, medium 220ms, slow 900ms, skeleton-delay 220ms |
| E | under reduced motion every data-ab-motion element is removed, none of them is or contains a control, and no control disappears | **PASS** | Today controls: 40 normal vs 40 reduced; data-ab-motion elements: 2 (hidden 2); controls inside/at data-ab-motion: 0 / 0 |
| E | under reduced motion the approve settle is its end state at once (0s animation, no fade, the card still there) | **PASS** | click → settled 45 ms; [data-ab-approving] present: true, animation-duration 0s, opacity 1, transform none; Approved badge: true |
| E | under reduced motion a finished screen never flashes a skeleton (five routes, seeded world) | **PASS** | Today: 69 ms, skeleton not seen · Billing: 355 ms, skeleton not seen · Settings: 671 ms, skeleton not seen · Studio: 343 ms, skeleton not seen · Calendar: 326 ms, skeleton not seen |

## axe — WCAG 2 A + AA, scanned DURING each moment

| Where | Violations | Detail |
| --- | --- | --- |
