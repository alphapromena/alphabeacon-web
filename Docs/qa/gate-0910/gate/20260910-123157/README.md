# gate-0910 — `pnpm gate` 20260910-123157

Tree `e155055` + uncommitted changes (hash `a636ead7127b`) · started 2026-09-10T12:31:57.096Z · **1.0 min end to end** · workers 2 · rounds 1 · lanes A · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

_skipped (--skip-static)_

## Round 1 — the gate (0.6 min wall)

| File | Lane | Passed | Skipped | Failed | Seconds | Classification | Skips, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| live-notifications | A | 1 | 0 | 0 | 18 | green |  |
| live-wallet | A | 4 | 0 | 0 | 35 | green |  |

## Verdict

**GREEN** — 1.0 min end to end. Every red in the gate round was classified network-lost and re-run green, or there was none.

## The runner log

```
12:31:57Z pnpm gate · series gate-0910 · record Docs\qa\gate-0910\gate\20260910-123157
12:31:57Z keep-awake held (pid 23460)
12:31:57Z build with the round's API base inlined
12:32:21Z built in 24 s
12:32:22Z preview served on 5199 (pid 33420), entry assets/index-Zm_se-OD.js, the API host inlined 1 time(s)
12:32:22Z API answers /health 200 in 235 ms (a 429 is an answer)
12:32:22Z round 1 lane A: 2 files, 2 in flight
12:32:41Z round 1 lane A live-notifications: 1 passed / 0 skipped / 0 failed in 18 s → green
12:32:58Z round 1 lane A live-wallet: 4 passed / 0 skipped / 0 failed in 35 s → green
12:32:58Z round 1 lane A done in 36 s
12:32:58Z round 1 done in 36 s
12:32:58Z preview server stopped
12:32:58Z keep-awake released
```
