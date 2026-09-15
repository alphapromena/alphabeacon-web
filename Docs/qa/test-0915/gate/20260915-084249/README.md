# test-0915 — `pnpm gate` 20260915-084249

Tree `fb5c33b` + uncommitted changes (hash `dac92d64bac0`) · started 2026-09-15T08:42:49.884Z · **1.0 min end to end** · workers 1 · rounds 1 · lanes A · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

_skipped (--skip-static)_

## Round 1 — the gate (0.5 min wall)

| File | Lane | Passed | Skipped | Not run | Failed | Seconds | Classification | Skips and not-runs, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| live-brand-kit | A | 3 | 0 | 0 | 0 | 29 | green |  |

## Verdict

**GREEN** — 1.0 min end to end. Every red in the gate round was classified network-lost and re-run green, or there was none.

## The runner log

```
08:42:50Z pnpm gate · series test-0915 · record Docs\qa\test-0915\gate\20260915-084249
08:42:50Z keep-awake held (pid 2548)
08:42:50Z build with the round's API base inlined
08:43:15Z built in 25 s
08:43:17Z preview served on 5199 (pid 27700), entry assets/index-DtaK8Nrx.js, the API host inlined 1 time(s)
08:43:18Z warm-up: 12-way fleet warm after 1 burst(s) in 1.3 s — slowest 683 ms (a 429 is an answer)
08:43:18Z heartbeat: one probe every 5 s for the round; the files stand down from their own warm-ups
08:43:18Z round 1 lane A: 1 files, 1 in flight
08:43:47Z round 1 lane A live-brand-kit: 3 passed / 0 skipped / 0 failed in 29 s → green
08:43:47Z round 1 lane A done in 29 s
08:43:47Z round 1 done in 29 s
08:43:47Z preview server stopped
08:43:47Z keep-awake released
```
