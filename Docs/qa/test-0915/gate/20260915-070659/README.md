# test-0915 — `pnpm gate` 20260915-070659

Tree `9d4fdbc` + uncommitted changes (hash `3d5a0feb5d1d`) · started 2026-09-15T07:06:59.930Z · **1.1 min end to end** · workers 1 · rounds 1 · lanes A · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

_skipped (--skip-static)_

## Round 1 — the gate (0.6 min wall)

| File | Lane | Passed | Skipped | Not run | Failed | Seconds | Classification | Skips and not-runs, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| live-brand-kit | A | 3 | 0 | 0 | 0 | 33 | green |  |

## Verdict

**GREEN** — 1.1 min end to end. Every red in the gate round was classified network-lost and re-run green, or there was none.

## The runner log

```
07:07:00Z pnpm gate · series test-0915 · record Docs\qa\test-0915\gate\20260915-070659
07:07:00Z keep-awake held (pid 39556)
07:07:00Z build with the round's API base inlined
07:07:31Z built in 30 s
07:07:32Z preview served on 5199 (pid 30772), entry assets/index-BA8lPKYr.js, the API host inlined 1 time(s)
07:07:33Z warm-up: 12-way fleet warm after 1 burst(s) in 1.0 s — slowest 405 ms (a 429 is an answer)
07:07:33Z heartbeat: one probe every 5 s for the round; the files stand down from their own warm-ups
07:07:33Z round 1 lane A: 1 files, 1 in flight
07:08:07Z round 1 lane A live-brand-kit: 3 passed / 0 skipped / 0 failed in 33 s → green
07:08:07Z round 1 lane A done in 33 s
07:08:07Z round 1 done in 33 s
07:08:07Z preview server stopped
07:08:07Z keep-awake released
```
