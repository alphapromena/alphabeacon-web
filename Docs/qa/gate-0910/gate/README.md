# gate-0910 — gate runs (`pnpm gate`)

One line per run; each run's own README carries the table.

- `20260910-122521` — RED, 1.1 min, tree `e155055`+, workers 2, rounds 1, lanes A → [README](20260910-122521/README.md)
- `20260910-122833` — GREEN, 0.7 min, tree `e155055`+, workers 1, rounds 1, lanes A → [README](20260910-122833/README.md)
- `20260910-122917` — RED, 1.0 min, tree `e155055`+, workers 2, rounds 1, lanes A → [README](20260910-122917/README.md)
- `20260910-123157` — GREEN, 1.0 min, tree `e155055`+, workers 2, rounds 1, lanes A · only live-notifications+live-wallet → [README](20260910-123157/README.md)
- `20260910-123443` — RED, 13.4 min, tree `a3755d3`, workers 3, rounds 1, lanes A → [README](20260910-123443/README.md)
- `20260910-124809` — STOPPED, 0.3 min, tree ``, workers 4, rounds 1, lanes A → [README](20260910-124809/README.md)
- `20260910-125038` — RED, 7.7 min, tree `6c10e04`, workers 3, rounds 1, lanes A → [README](20260910-125038/README.md)
- `20260910-125952` — RED, 6.4 min, tree `cdfb0ef`+, workers 2, rounds 1, lanes A → [README](20260910-125952/README.md)
- `20260910-133645` — GREEN, 1.2 min, tree `8a4b52c`+, workers 1, rounds 1, lanes A · only live-auth → [README](20260910-133645/README.md)
- `20260913-062802` — RED, 34.8 min, tree `8c0694a`+, workers 1, rounds 2, lanes A,B → [README](20260913-062802/README.md)
- `20260913-070254` — RED, 32.9 min, tree `8c0694a`+, workers 1, rounds 2, lanes A,B → [README](20260913-070254/README.md)

## Two notes the record owes the reader (2026-09-13)

**Why the unit suite is 666 tests in 58 files here, against ORDER HSN-0910's
633 in 55.** Nothing was removed and nothing drifted: the difference is three
new test files this order added, plus three tests for item 59's product change.
`scripts/verify-lib.test.ts` (9) proves a verify reads the suite report instead
of re-running it and refuses a stale one; `scripts/gate/lanes.test.ts` (3)
proves every live spec on disk is laned exactly once; `scripts/gate/classify.test.ts`
(18) proves the red-classification rule, the widened re-run rule and the
skip-versus-not-run label. `src/data/auth-flow.test.ts` gained 3: the workspace
name comes from this flow's signup and never from the demo world. 633 + 30 + 3
= 666, 55 + 3 = 58. The proof's runs recorded 656 because ten of
`classify.test.ts`'s tests were written after them, with the reporting fixes
they cover.

**The old chain's one red in its bare static run, left UNCLASSIFIED.**
`calendar-connections.spec.ts › @axe calendar, connections and sources scan
clean` failed once on one axe violation in the legacy chain's bare
`pnpm e2e` (05:26Z, 114 passed + 1 failed). It went green in all seven
`verify:wNN --rerun` runs that followed on the same tree, the first of them
172 s later (115 / 84 / 0), and in every `pnpm gate` static half. Its error
context was wiped by the next Playwright run before it could be kept, so the
violation itself was never read. It is the "first Playwright run straight after
vitest" class the HSN-0910 gate recorded on 2026-09-10 (state.md trap 22's
sighting list) — but with no context on disk it stays **unclassified**, not
explained. The runner's own static half keeps every failing title in its
report, so the class cannot go nameless again.
