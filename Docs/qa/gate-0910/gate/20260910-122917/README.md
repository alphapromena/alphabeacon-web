# gate-0910 — `pnpm gate` 20260910-122917

Tree `e155055` + uncommitted changes (hash `938b66075271`) · started 2026-09-10T12:29:17.881Z · **1.0 min end to end** · workers 2 · rounds 1 · lanes A · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

_skipped (--skip-static)_

## Round 1 — the gate (0.6 min wall)

| File | Lane | Passed | Skipped | Failed | Seconds | Classification | Skips, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| live-notifications | A | 0 | 0 | 1 | 11 | **UNCLASSIFIED** — classify before any fix |  |
| live-wallet | A | 4 | 0 | 0 | 34 | green |  |

### Round 1 reds

- **live-notifications** › the inbox endpoints hold their contract, and the bell tells the truth: `TypeError: Cannot read properties of undefined (reading '0')` — unclassified; log `round-1/live-notifications.log`

## Verdict

**RED** — 1.0 min end to end. See the rounds above; an UNCLASSIFIED red is classified before any fix.

## The runner log

```
12:29:18Z pnpm gate · series gate-0910 · record Docs\qa\gate-0910\gate\20260910-122917
12:29:18Z keep-awake held (pid 11088)
12:29:18Z build with the round's API base inlined
12:29:42Z built in 24 s
12:29:43Z preview served on 5199 (pid 32684), entry assets/index-Zm_se-OD.js, the API host inlined 1 time(s)
12:29:44Z API answers /health 200 in 219 ms (a 429 is an answer)
12:29:44Z round 1 lane A: 2 files, 2 in flight
12:29:55Z round 1 lane A live-notifications: 0 passed / 0 skipped / 1 failed in 11 s → unclassified
12:30:19Z round 1 lane A live-wallet: 4 passed / 0 skipped / 0 failed in 34 s → green
12:30:19Z round 1 lane A done in 35 s
12:30:19Z round 1 done in 35 s
12:30:19Z preview server stopped
12:30:19Z keep-awake released
```
