# gate-0910 — `pnpm gate` 20260910-133645

Tree `8a4b52c` + uncommitted changes (hash `a1ff47b290f6`) · started 2026-09-10T13:36:45.054Z · **1.2 min end to end** · workers 1 · rounds 1 · lanes A · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

_skipped (--skip-static)_

## Round 1 — the gate (0.8 min wall)

| File | Lane | Passed | Skipped | Failed | Seconds | Classification | Skips, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| live-auth | A | 7 | 0 | 0 | 45 | green |  |

## Verdict

**GREEN** — 1.2 min end to end. Every red in the gate round was classified network-lost and re-run green, or there was none.

## The runner log

```
13:36:45Z pnpm gate · series gate-0910 · record Docs\qa\gate-0910\gate\20260910-133645
13:36:45Z keep-awake held (pid 18132)
13:36:45Z build with the round's API base inlined
13:37:09Z built in 23 s
13:37:10Z preview served on 5199 (pid 28720), entry assets/index-CK7x87Cs.js, the API host inlined 1 time(s)
13:37:11Z warm-up: 12-way fleet warm after 1 burst(s) in 0.8 s — slowest 223 ms (a 429 is an answer)
13:37:11Z heartbeat: one probe every 5 s for the round; the files stand down from their own warm-ups
13:37:11Z round 1 lane A: 1 files, 1 in flight
13:37:56Z round 1 lane A live-auth: 7 passed / 0 skipped / 0 failed in 45 s → green
13:37:56Z round 1 lane A done in 45 s
13:37:56Z round 1 done in 45 s
13:37:56Z preview server stopped
13:37:56Z keep-awake released
```
