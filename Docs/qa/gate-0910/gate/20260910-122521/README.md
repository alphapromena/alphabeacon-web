# gate-0910 — `pnpm gate` 20260910-122521

Tree `e155055` + uncommitted changes (hash `f0a3d2f2a555`) · started 2026-09-10T12:25:21.413Z · **1.1 min end to end** · workers 2 · rounds 1 · lanes A · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

_skipped (--skip-static)_

## Round 1 — the gate (0.7 min wall)

| File | Lane | Passed | Skipped | Failed | Seconds | Classification | Skips, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| live-notifications | A | 0 | 0 | 1 | 17 | **UNCLASSIFIED** — classify before any fix |  |
| live-wallet | A | 4 | 0 | 0 | 40 | green |  |

### Round 1 reds

- **live-notifications** › the inbox endpoints hold their contract, and the bell tells the truth: `TypeError: Cannot read properties of undefined (reading '0')` — unclassified; log `Docs/qa/gate-0910/gate/20260910-122521/round-1/live-notifications.log`

## Verdict

**RED** — 1.1 min end to end. See the rounds above; an UNCLASSIFIED red is classified before any fix.

## The runner log

```
12:25:22Z pnpm gate · series gate-0910 · record Docs\qa\gate-0910\gate\20260910-122521
12:25:22Z keep-awake held (pid 34176)
12:25:22Z build with the round's API base inlined
12:25:47Z built in 25 s
12:25:48Z preview served on 5199 (pid 35092), entry assets/index-Zm_se-OD.js, the API host inlined 1 time(s)
12:25:48Z API answers /health 200 in 490 ms (a 429 is an answer)
12:25:48Z round 1 lane A: 2 files, 2 in flight
12:26:05Z round 1 lane A live-notifications: 0 passed / 0 skipped / 1 failed in 17 s → unclassified
12:26:29Z round 1 lane A live-wallet: 4 passed / 0 skipped / 0 failed in 40 s → green
12:26:29Z round 1 lane A done in 41 s
12:26:29Z round 1 done in 41 s
12:26:29Z preview server stopped
12:26:30Z keep-awake released
```
