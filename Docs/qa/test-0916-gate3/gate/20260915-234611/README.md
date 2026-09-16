# test-0916-gate3 — `pnpm gate` 20260915-234611

Tree `60be807` + uncommitted changes (hash `bbd73b87f0ff`) · started 2026-09-15T23:46:11.050Z · **29.1 min end to end** · workers 1 · rounds 1 · lanes A,B · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

| Step | Result | Seconds |
| --- | --- | ---: |
| verify:all | PASS | 455 |
| verify:w00 | PASS | 7 |
| verify:w01 | PASS | 3 |
| verify:w02 | PASS | 1 |
| verify:w03 | PASS | 1 |
| verify:w04 | PASS | 1 |
| verify:w05 | PASS | 1 |
| verify:w06 | PASS | 1 |

unit: **899 passed / 0 failed / 79 files**
static e2e: **122 passed / 99 skipped / 0 failed**

## Round 1 — the gate (20.8 min wall)

| File | Lane | Passed | Skipped | Not run | Failed | Seconds | Classification | Skips and not-runs, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| live-auth | A | 7 | 0 | 0 | 0 | 51 | green |  |
| live-auth-401 | A | 8 | 0 | 0 | 0 | 48 | green |  |
| live-billing | B | 7 | 0 | 0 | 0 | 121 | green |  |
| live-brand | A | 6 | 0 | 0 | 0 | 70 | green |  |
| live-brand-kit | A | 3 | 0 | 0 | 0 | 31 | green |  |
| live-brand-rules | B | 5 | 0 | 0 | 0 | 58 | green |  |
| live-country | A | 4 | 0 | 0 | 0 | 47 | green |  |
| live-create-visual | B | 0 | 3 | 0 | 0 | 1 | skipped-all | a fresh owner + org with its brand set up — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>one run, then Create visual on its result renders ONE image  — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>Today offers the same button on the ledger row, and the Stud — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_ |
| live-first-light | A | 1 | 0 | 0 | 0 | 13 | green |  |
| live-generate | B | 2 | 0 | 0 | 0 | 85 | green |  |
| live-invite-org | A | 3 | 0 | 0 | 0 | 41 | green |  |
| live-knowledge | A | 3 | 0 | 0 | 0 | 42 | green |  |
| live-media-capabilities | A | 1 | 0 | 1 | 1 | 37 | **UNCLASSIFIED** — classify before any fix | the Studio grid lists what the catalog grants, by name, with — _not run, an earlier test in this file failed_ |
| live-media-upload | A | 3 | 0 | 0 | 0 | 31 | green |  |
| live-notifications | A | 1 | 0 | 0 | 0 | 12 | green |  |
| live-onboarding | B | 6 | 0 | 0 | 0 | 71 | green |  |
| live-proposals | A | 1 | 4 | 0 | 0 | 44 | green | one balanced run — the drafts it produces become the proposa — _402 wallet_insufficient would refuse the balanced run: the org's wallet is $0.00 — the plan is the only funding, and no _<br>after a RELOAD, Today shows the draft from the ledger — _402 wallet_insufficient would refuse the run this ledger read depends on: the org's wallet is $0.00 — the plan is the on_<br>approving records it as posted, and the decision survives a  — _402 wallet_insufficient would refuse the run this approval depends on: the org's wallet is $0.00 — the plan is the only _<br>declining asks why, keeps the row, and is reversible — _402 wallet_insufficient would refuse the second run this decline depends on: the org's wallet is $0.00 — the plan is the_ |
| live-schedule-repair | A | 3 | 0 | 0 | 0 | 20 | green |  |
| live-scheduling | A | 2 | 1 | 0 | 0 | 26 | green | slots, if ingestion produced any, honour skip/un-skip and ne — _ingestion has not produced slots for this org yet_ |
| live-studio | A | 3 | 1 | 0 | 0 | 22 | green | E2 renders for real, and E4 opens the asset it made — _set LIVE_MEDIA=1 to spend on one real render_ |
| live-team | A | 6 | 0 | 0 | 0 | 94 | green |  |
| live-timeout | A | 2 | 0 | 0 | 0 | 28 | green |  |
| live-topics-refused | A | 2 | 0 | 0 | 0 | 23 | green |  |
| live-video-duration | A | 1 | 0 | 1 | 1 | 15 | **UNCLASSIFIED** — classify before any fix | the valid video body clears validation — and self-skips on 4 — _not run, an earlier test in this file failed_ |
| live-wallet | A | 4 | 0 | 0 | 0 | 34 | green |  |

### Round 1 reds

- **live-media-capabilities** › every granted capability: the document’s example stops at the wallet (402), its trap before it (400) — zero spend: `Error: video-ads.generate valid body: {"error":{"code":"bad_request","message":"The media service rejected the request — check the body against the capability's schema","requestId":"499f11e0-a3da-4acf` — unclassified; log `round-1/live-media-capabilities.log`
- **live-video-duration** › a bad durationS is refused with 400 BEFORE the wallet check — the field is known, a maximum is enforced: `Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m` — unclassified; log `round-1/live-video-duration.log`

## Verdict

**RED** — 29.1 min end to end. See the rounds above; an UNCLASSIFIED red is classified before any fix.

## The runner log

```
23:46:11Z pnpm gate · series test-0916-gate3 · record Docs\qa\test-0916-gate3\gate\20260915-234611
23:46:11Z keep-awake held (pid 24144)
23:46:11Z verify:all — the suites once
23:53:47Z verify:all PASS in 455 s
23:53:53Z verify:w00 PASS in 7 s
23:53:57Z verify:w01 PASS in 3 s
23:53:58Z verify:w02 PASS in 1 s
23:53:59Z verify:w03 PASS in 1 s
23:54:00Z verify:w04 PASS in 1 s
23:54:01Z verify:w05 PASS in 1 s
23:54:02Z verify:w06 PASS in 1 s
23:54:02Z build with the round's API base inlined
23:54:26Z built in 25 s
23:54:28Z preview served on 5199 (pid 28568), entry assets/index-iFEiG8T_.js, the API host inlined 1 time(s)
23:54:29Z warm-up: 12-way fleet warm after 1 burst(s) in 1.1 s — slowest 368 ms (a 429 is an answer)
23:54:29Z heartbeat: one probe every 5 s for the round; the files stand down from their own warm-ups
23:54:29Z round 1 lane A: 20 files, 1 in flight, 8 s between starts
23:55:20Z round 1 lane A live-auth: 7 passed / 0 skipped / 0 failed in 51 s → green
23:55:56Z round 1 lane A live-timeout: 2 passed / 0 skipped / 0 failed in 28 s → green
23:56:51Z round 1 lane A live-auth-401: 8 passed / 0 skipped / 0 failed in 48 s → green
23:57:12Z round 1 lane A live-first-light: 1 passed / 0 skipped / 0 failed in 13 s → green
23:57:51Z round 1 lane A live-brand-kit: 3 passed / 0 skipped / 0 failed in 31 s → green
23:58:22Z round 1 lane A live-topics-refused: 2 passed / 0 skipped / 0 failed in 23 s → green
23:59:40Z round 1 lane A live-brand: 6 passed / 0 skipped / 0 failed in 70 s → green
00:00:35Z round 1 lane A live-country: 4 passed / 0 skipped / 0 failed in 47 s → green
00:01:24Z round 1 lane A live-invite-org: 3 passed / 0 skipped / 0 failed in 41 s → green
00:02:14Z round 1 lane A live-knowledge: 3 passed / 0 skipped / 0 failed in 42 s → green
00:02:59Z round 1 lane A live-media-capabilities: 1 passed / 1 skipped / 1 failed in 37 s → unclassified
00:03:38Z round 1 lane A live-media-upload: 3 passed / 0 skipped / 0 failed in 31 s → green
00:03:58Z round 1 lane A live-notifications: 1 passed / 0 skipped / 0 failed in 12 s → green
00:04:50Z round 1 lane A live-proposals: 1 passed / 4 skipped / 0 failed in 44 s → green
00:05:18Z round 1 lane A live-schedule-repair: 3 passed / 0 skipped / 0 failed in 20 s → green
00:05:52Z round 1 lane A live-scheduling: 2 passed / 1 skipped / 0 failed in 26 s → green
00:06:22Z round 1 lane A live-studio: 3 passed / 1 skipped / 0 failed in 22 s → green
00:08:04Z round 1 lane A live-team: 6 passed / 0 skipped / 0 failed in 94 s → green
00:08:27Z round 1 lane A live-video-duration: 1 passed / 1 skipped / 1 failed in 15 s → unclassified
00:09:09Z round 1 lane A live-wallet: 4 passed / 0 skipped / 0 failed in 34 s → green
00:09:09Z round 1 lane A done in 880 s
00:09:09Z round 1 lane B: 5 files, serial, 8 s between starts
00:11:11Z round 1 lane B live-billing: 7 passed / 0 skipped / 0 failed in 121 s → green
00:12:17Z round 1 lane B live-brand-rules: 5 passed / 0 skipped / 0 failed in 58 s → green
00:12:26Z round 1 lane B live-create-visual: 0 passed / 3 skipped / 0 failed in 1 s → skipped-all
00:13:59Z round 1 lane B live-generate: 2 passed / 0 skipped / 0 failed in 85 s → green
00:15:18Z round 1 lane B live-onboarding: 6 passed / 0 skipped / 0 failed in 71 s → green
00:15:18Z round 1 lane B done in 369 s
00:15:18Z round 1 done in 1249 s
00:15:19Z preview server stopped
00:15:19Z keep-awake released
```
