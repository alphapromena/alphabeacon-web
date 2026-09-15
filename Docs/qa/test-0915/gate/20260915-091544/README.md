# test-0915 — `pnpm gate` 20260915-091544

Tree `d793cb1` + uncommitted changes (hash `3cd959f7ecbb`) · started 2026-09-15T09:15:44.309Z · **2.8 min end to end** · workers 1 · rounds 1 · lanes A · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

_skipped (--skip-static)_

## Round 1 — the gate (0.9 min wall)

| File | Lane | Passed | Skipped | Not run | Failed | Seconds | Classification | Skips and not-runs, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| live-brand-kit | A | 1 | 0 | 1 | 1 | 55 | error-page, re-run 3/3 | browser truth: the Brand kit type sends a PDF from Chromium  — _not run, an earlier test in this file failed_ |

### Round 1 reds

- **live-brand-kit** › the wire, from Node (NOT browser truth): presign the closed pair, PUT a tiny PDF, read the row back under Files, Delete, re-read: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — error-page; log `round-1/live-brand-kit.log`
  - re-run 1: 3 passed / 0 failed in 28 s (`round-1/live-brand-kit-rerun1.log`)
  - re-run 2: 3 passed / 0 failed in 27 s (`round-1/live-brand-kit-rerun2.log`)
  - re-run 3: 3 passed / 0 failed in 27 s (`round-1/live-brand-kit-rerun3.log`)

## Verdict

**GREEN** — 2.8 min end to end. Every red in the gate round was classified network-lost or error-page and re-run green 3/3, or there was none.

## The runner log

```
09:15:45Z pnpm gate · series test-0915 · record Docs\qa\test-0915\gate\20260915-091544
09:15:45Z keep-awake held (pid 20712)
09:15:45Z build with the round's API base inlined
09:16:09Z built in 25 s
09:16:10Z preview served on 5199 (pid 27640), entry assets/index-DtaK8Nrx.js, the API host inlined 1 time(s)
09:16:12Z warm-up: 12-way fleet warm after 1 burst(s) in 1.3 s — slowest 735 ms (a 429 is an answer)
09:16:12Z heartbeat: one probe every 5 s for the round; the files stand down from their own warm-ups
09:16:12Z round 1 lane A: 1 files, 1 in flight
09:17:06Z round 1 lane A live-brand-kit: 1 passed / 1 skipped / 1 failed in 55 s → error-page
09:17:06Z round 1 lane A done in 55 s
09:17:34Z round 1 lane A live-brand-kit-rerun1: 3 passed / 0 skipped / 0 failed in 28 s → green
09:18:02Z round 1 lane A live-brand-kit-rerun2: 3 passed / 0 skipped / 0 failed in 27 s → green
09:18:29Z round 1 lane A live-brand-kit-rerun3: 3 passed / 0 skipped / 0 failed in 27 s → green
09:18:29Z round 1 done in 137 s
09:18:29Z preview server stopped
09:18:29Z keep-awake released
```
