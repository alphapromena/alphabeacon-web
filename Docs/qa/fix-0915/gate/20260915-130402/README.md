# fix-0915 — `pnpm gate` 20260915-130402

Tree `96b3435` + uncommitted changes (hash `535e07b93ff1`) · started 2026-09-15T13:04:02.424Z · **7.3 min end to end** · workers 1 · rounds 2 · lanes A,B · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

| Step | Result | Seconds |
| --- | --- | ---: |
| verify:all | PASS | 424 |
| verify:w00 | PASS | 6 |
| verify:w01 | PASS | 3 |
| verify:w02 | PASS | 1 |
| verify:w03 | PASS | 1 |
| verify:w04 | PASS | 1 |
| verify:w05 | PASS | 1 |
| verify:w06 | PASS | 1 |

unit: **825 passed / 0 failed / 73 files**
static e2e: **117 passed / 90 skipped / 0 failed**

## Verdict

**GREEN** — 7.3 min end to end. Every red in the gate round was classified network-lost or error-page and re-run green 3/3, or there was none.

## The runner log

```
13:04:03Z pnpm gate · series fix-0915 · record Docs\qa\fix-0915\gate\20260915-130402
13:04:03Z keep-awake held (pid 37580)
13:04:03Z verify:all — the suites once
13:11:06Z verify:all PASS in 424 s
13:11:12Z verify:w00 PASS in 6 s
13:11:15Z verify:w01 PASS in 3 s
13:11:16Z verify:w02 PASS in 1 s
13:11:17Z verify:w03 PASS in 1 s
13:11:18Z verify:w04 PASS in 1 s
13:11:19Z verify:w05 PASS in 1 s
13:11:20Z verify:w06 PASS in 1 s
13:11:20Z keep-awake released
```
