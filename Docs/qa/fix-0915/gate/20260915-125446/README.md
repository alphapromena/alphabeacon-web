# fix-0915 — `pnpm gate` 20260915-125446

Tree `7249bb4` + uncommitted changes (hash `116343c80d6d`) · started 2026-09-15T12:54:46.958Z · **7.5 min end to end** · workers 1 · rounds 2 · lanes A,B · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

| Step | Result | Seconds |
| --- | --- | ---: |
| verify:all | PASS | 426 |
| verify:w00 | FAIL | 15 |
| verify:w01 | FAIL | 1 |
| verify:w02 | FAIL | 1 |
| verify:w03 | FAIL | 1 |
| verify:w04 | FAIL | 1 |
| verify:w05 | FAIL | 1 |
| verify:w06 | FAIL | 1 |

unit: **825 passed / 0 failed / 73 files**
static e2e: **117 passed / 90 skipped / 0 failed**

## Verdict

**RED** — 7.5 min end to end. See the rounds above; an UNCLASSIFIED red is classified before any fix.

## The runner log

```
12:54:47Z pnpm gate · series fix-0915 · record Docs\qa\fix-0915\gate\20260915-125446
12:54:47Z keep-awake held (pid 15116)
12:54:47Z verify:all — the suites once
13:01:53Z verify:all PASS in 426 s
13:02:08Z verify:w00 FAIL in 15 s
13:02:09Z verify:w01 FAIL in 1 s
13:02:10Z verify:w02 FAIL in 1 s
13:02:11Z verify:w03 FAIL in 1 s
13:02:12Z verify:w04 FAIL in 1 s
13:02:12Z verify:w05 FAIL in 1 s
13:02:13Z verify:w06 FAIL in 1 s
13:02:14Z keep-awake released
```
