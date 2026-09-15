# test-0915 — `pnpm gate` 20260915-073808

Tree `3576305` + uncommitted changes (hash `fdbd0de51fdc`) · started 2026-09-15T07:38:08.883Z · **15.7 min end to end** · workers 1 · rounds 1 · lanes A,B · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

_skipped (--skip-static)_

## Round 1 — the gate (15.1 min wall)

| File | Lane | Passed | Skipped | Not run | Failed | Seconds | Classification | Skips and not-runs, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| live-auth | A | 7 | 0 | 0 | 0 | 50 | green |  |
| live-billing | B | 7 | 0 | 0 | 0 | 117 | green |  |
| live-brand | A | 5 | 0 | 0 | 0 | 45 | green |  |
| live-brand-kit | A | 3 | 0 | 0 | 0 | 30 | green |  |
| live-brand-rules | B | 5 | 0 | 0 | 0 | 54 | green |  |
| live-country | A | 4 | 0 | 0 | 0 | 44 | green |  |
| live-create-visual | B | 0 | 3 | 0 | 0 | 1 | skipped-all | a fresh owner + org with its brand set up — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>one run, then Create visual on its result renders ONE image  — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>Today offers the same button on the ledger row, and the Stud — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_ |
| live-generate | B | 2 | 0 | 0 | 0 | 70 | green |  |
| live-invite-org | A | 3 | 0 | 0 | 0 | 37 | green |  |
| live-knowledge | A | 3 | 0 | 0 | 0 | 38 | green |  |
| live-media-capabilities | A | 3 | 0 | 0 | 0 | 78 | green |  |
| live-media-upload | A | 3 | 0 | 0 | 0 | 30 | green |  |
| live-notifications | A | 1 | 0 | 0 | 0 | 11 | green |  |
| live-onboarding | B | 6 | 0 | 0 | 0 | 68 | green |  |
| live-proposals | A | 1 | 4 | 0 | 0 | 37 | green | one balanced run — the drafts it produces become the proposa — _402 wallet_insufficient would refuse the balanced run: the org's wallet is $0.00 — the plan is the only funding, and no _<br>after a RELOAD, Today shows the draft from the ledger — _402 wallet_insufficient would refuse the run this ledger read depends on: the org's wallet is $0.00 — the plan is the on_<br>approving records it as posted, and the decision survives a  — _402 wallet_insufficient would refuse the run this approval depends on: the org's wallet is $0.00 — the plan is the only _<br>declining asks why, keeps the row, and is reversible — _402 wallet_insufficient would refuse the second run this decline depends on: the org's wallet is $0.00 — the plan is the_ |
| live-schedule-repair | A | 3 | 0 | 0 | 0 | 20 | green |  |
| live-scheduling | A | 1 | 0 | 1 | 1 | 24 | **UNCLASSIFIED** — classify before any fix | slots, if ingestion produced any, honour skip/un-skip and ne — _not run, an earlier test in this file failed_ |
| live-studio | A | 3 | 1 | 0 | 0 | 20 | green | E2 renders for real, and E4 opens the asset it made — _set LIVE_MEDIA=1 to spend on one real render_ |
| live-team | A | 6 | 0 | 0 | 0 | 88 | green |  |
| live-video-duration | A | 1 | 0 | 1 | 1 | 13 | **UNCLASSIFIED** — classify before any fix | the valid video body clears validation — and self-skips on 4 — _not run, an earlier test in this file failed_ |
| live-wallet | A | 4 | 0 | 0 | 0 | 32 | green |  |

### Round 1 reds

- **live-scheduling** › C1 creates the schedule on first save, then PATCHes it — and it survives a reload: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-scheduling.log`
- **live-video-duration** › a bad durationS is refused with 400 BEFORE the wallet check — the field is known, a maximum is enforced: `Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m` — unclassified; log `round-1/live-video-duration.log`

## Verdict

**RED** — 15.7 min end to end. See the rounds above; an UNCLASSIFIED red is classified before any fix.

## The runner log

```
07:38:09Z pnpm gate · series test-0915 · record Docs\qa\test-0915\gate\20260915-073808
07:38:09Z keep-awake held (pid 24316)
07:38:09Z build with the round's API base inlined
07:38:37Z built in 28 s
07:38:38Z preview served on 5199 (pid 36756), entry assets/index-BA8lPKYr.js, the API host inlined 1 time(s)
07:38:41Z warm-up: 12-way fleet warm after 1 burst(s) in 2.4 s — slowest 375 ms (a 429 is an answer)
07:38:41Z heartbeat: one probe every 5 s for the round; the files stand down from their own warm-ups
07:38:41Z round 1 lane A: 16 files, 1 in flight
07:39:30Z round 1 lane A live-auth: 7 passed / 0 skipped / 0 failed in 50 s → green
07:40:01Z round 1 lane A live-brand-kit: 3 passed / 0 skipped / 0 failed in 30 s → green
07:40:46Z round 1 lane A live-brand: 5 passed / 0 skipped / 0 failed in 45 s → green
07:41:30Z round 1 lane A live-country: 4 passed / 0 skipped / 0 failed in 44 s → green
07:42:07Z round 1 lane A live-invite-org: 3 passed / 0 skipped / 0 failed in 37 s → green
07:42:45Z round 1 lane A live-knowledge: 3 passed / 0 skipped / 0 failed in 38 s → green
07:44:03Z round 1 lane A live-media-capabilities: 3 passed / 0 skipped / 0 failed in 78 s → green
07:44:33Z round 1 lane A live-media-upload: 3 passed / 0 skipped / 0 failed in 30 s → green
07:44:44Z round 1 lane A live-notifications: 1 passed / 0 skipped / 0 failed in 11 s → green
07:45:22Z round 1 lane A live-proposals: 1 passed / 4 skipped / 0 failed in 37 s → green
07:45:41Z round 1 lane A live-schedule-repair: 3 passed / 0 skipped / 0 failed in 20 s → green
07:46:06Z round 1 lane A live-scheduling: 1 passed / 1 skipped / 1 failed in 24 s → unclassified
07:46:25Z round 1 lane A live-studio: 3 passed / 1 skipped / 0 failed in 20 s → green
07:47:54Z round 1 lane A live-team: 6 passed / 0 skipped / 0 failed in 88 s → green
07:48:07Z round 1 lane A live-video-duration: 1 passed / 1 skipped / 1 failed in 13 s → unclassified
07:48:39Z round 1 lane A live-wallet: 4 passed / 0 skipped / 0 failed in 32 s → green
07:48:39Z round 1 lane A done in 598 s
07:48:39Z round 1 lane B: 5 files, serial
07:50:36Z round 1 lane B live-billing: 7 passed / 0 skipped / 0 failed in 117 s → green
07:51:30Z round 1 lane B live-brand-rules: 5 passed / 0 skipped / 0 failed in 54 s → green
07:51:32Z round 1 lane B live-create-visual: 0 passed / 3 skipped / 0 failed in 1 s → skipped-all
07:52:41Z round 1 lane B live-generate: 2 passed / 0 skipped / 0 failed in 70 s → green
07:53:49Z round 1 lane B live-onboarding: 6 passed / 0 skipped / 0 failed in 68 s → green
07:53:49Z round 1 lane B done in 310 s
07:53:49Z round 1 done in 908 s
07:53:49Z preview server stopped
07:53:49Z keep-awake released
```
