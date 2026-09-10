# gate-0910 — `pnpm gate` 20260910-122833

Tree `e155055` + uncommitted changes (hash `685f4ff88dad`) · started 2026-09-10T12:28:33.676Z · **0.7 min end to end** · workers 1 · rounds 1 · lanes A · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

_skipped (--skip-static)_

## Round 1 — the gate (0.3 min wall)

| File | Lane | Passed | Skipped | Failed | Seconds | Classification | Skips, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| live-notifications | A | 1 | 0 | 0 | 17 | green |  |

## Verdict

**GREEN** — 0.7 min end to end. Every red in the gate round was classified network-lost and re-run green, or there was none.

## The runner log

```
12:28:34Z pnpm gate · series gate-0910 · record Docs\qa\gate-0910\gate\20260910-122833
12:28:34Z keep-awake held (pid 34476)
12:28:34Z build with the round's API base inlined
12:28:58Z built in 24 s
12:28:59Z preview served on 5199 (pid 20016), entry assets/index-Zm_se-OD.js, the API host inlined 1 time(s)
12:28:59Z API answers /health 200 in 398 ms (a 429 is an answer)
12:28:59Z round 1 lane A: 1 files, 1 in flight
12:29:16Z round 1 lane A live-notifications: 1 passed / 0 skipped / 0 failed in 17 s → green
12:29:16Z round 1 lane A done in 17 s
12:29:16Z round 1 done in 17 s
12:29:16Z preview server stopped
12:29:16Z keep-awake released
```
