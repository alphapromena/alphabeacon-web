# test-0915 — `pnpm gate` 20260915-084209

Tree `fb5c33b` + uncommitted changes (hash `a868408fe01a`) · started 2026-09-15T08:42:09.235Z · **0.6 min end to end** · workers 1 · rounds 1 · lanes A · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

_skipped (--skip-static)_

## Round 1 — the gate (0.2 min wall)

| File | Lane | Passed | Skipped | Not run | Failed | Seconds | Classification | Skips and not-runs, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| live-brand-kit | A | 0 | 0 | 2 | 1 | 10 | **UNCLASSIFIED** — classify before any fix | the wire, from Node (NOT browser truth): presign the closed  — _not run, an earlier test in this file failed_<br>browser truth: the Brand kit type sends a PDF from Chromium  — _not run, an earlier test in this file failed_ |

### Round 1 reds

- **live-brand-kit** › a fresh owner + org, made through the product: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-brand-kit.log`

## Verdict

**RED** — 0.6 min end to end. See the rounds above; an UNCLASSIFIED red is classified before any fix.

## The runner log

```
08:42:09Z pnpm gate · series test-0915 · record Docs\qa\test-0915\gate\20260915-084209
08:42:09Z keep-awake held (pid 39716)
08:42:09Z build with the round's API base inlined
08:42:35Z built in 25 s
08:42:36Z preview served on 5199 (pid 39504), entry assets/index-DtaK8Nrx.js, the API host inlined 1 time(s)
08:42:37Z warm-up: 12-way fleet warm after 1 burst(s) in 1.2 s — slowest 325 ms (a 429 is an answer)
08:42:37Z heartbeat: one probe every 5 s for the round; the files stand down from their own warm-ups
08:42:37Z round 1 lane A: 1 files, 1 in flight
08:42:47Z round 1 lane A live-brand-kit: 0 passed / 2 skipped / 1 failed in 10 s → unclassified
08:42:47Z round 1 lane A done in 10 s
08:42:47Z round 1 done in 10 s
08:42:47Z preview server stopped
08:42:48Z keep-awake released
```
