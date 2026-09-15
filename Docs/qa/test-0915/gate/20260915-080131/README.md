# test-0915 — `pnpm gate` 20260915-080131

Tree `f2b1adc` + uncommitted changes (hash `a40ec04168f2`) · started 2026-09-15T08:01:31.084Z · **1.0 min end to end** · workers 1 · rounds 1 · lanes A · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

_skipped (--skip-static)_

## Round 1 — the gate (0.5 min wall)

| File | Lane | Passed | Skipped | Not run | Failed | Seconds | Classification | Skips and not-runs, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| live-scheduling | A | 2 | 1 | 0 | 0 | 28 | green | slots, if ingestion produced any, honour skip/un-skip and ne — _ingestion has not produced slots for this org yet_ |

## Verdict

**GREEN** — 1.0 min end to end. Every red in the gate round was classified network-lost and re-run green, or there was none.

## The runner log

```
08:01:31Z pnpm gate · series test-0915 · record Docs\qa\test-0915\gate\20260915-080131
08:01:31Z keep-awake held (pid 26860)
08:01:31Z build with the round's API base inlined
08:01:58Z built in 27 s
08:02:00Z preview served on 5199 (pid 28876), entry assets/index-Ba0MfkxF.js, the API host inlined 1 time(s)
08:02:01Z warm-up: 12-way fleet warm after 1 burst(s) in 1.0 s — slowest 284 ms (a 429 is an answer)
08:02:01Z heartbeat: one probe every 5 s for the round; the files stand down from their own warm-ups
08:02:01Z round 1 lane A: 1 files, 1 in flight
08:02:29Z round 1 lane A live-scheduling: 2 passed / 1 skipped / 0 failed in 28 s → green
08:02:29Z round 1 lane A done in 28 s
08:02:29Z round 1 done in 28 s
08:02:29Z preview server stopped
08:02:30Z keep-awake released
```
