# test-0915-2 — `pnpm gate` 20260915-192419

Tree `7d256a9` (hash `e4ad93a74f60`) · started 2026-09-15T19:24:19.872Z · **25.2 min end to end** · workers 1 · rounds 1 · lanes A,B · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

| Step | Result | Seconds |
| --- | --- | ---: |
| verify:all | PASS | 448 |
| verify:w00 | PASS | 7 |
| verify:w01 | PASS | 3 |
| verify:w02 | PASS | 1 |
| verify:w03 | PASS | 1 |
| verify:w04 | PASS | 1 |
| verify:w05 | PASS | 1 |
| verify:w06 | PASS | 1 |

unit: **829 passed / 0 failed / 74 files**
static e2e: **119 passed / 90 skipped / 0 failed**

## Round 1 — the gate (17.0 min wall)

| File | Lane | Passed | Skipped | Not run | Failed | Seconds | Classification | Skips and not-runs, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| live-auth | A | 7 | 0 | 0 | 0 | 51 | green |  |
| live-auth-401 | A | 4 | 0 | 0 | 0 | 25 | green |  |
| live-billing | B | 7 | 0 | 0 | 0 | 125 | green |  |
| live-brand | A | 6 | 0 | 0 | 0 | 63 | green |  |
| live-brand-kit | A | 3 | 0 | 0 | 0 | 34 | green |  |
| live-brand-rules | B | 5 | 0 | 0 | 0 | 66 | green |  |
| live-country | A | 4 | 0 | 0 | 0 | 44 | green |  |
| live-create-visual | B | 0 | 3 | 0 | 0 | 1 | skipped-all | a fresh owner + org with its brand set up — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>one run, then Create visual on its result renders ONE image  — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>Today offers the same button on the ledger row, and the Stud — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_ |
| live-generate | B | 2 | 0 | 0 | 0 | 98 | green |  |
| live-invite-org | A | 3 | 0 | 0 | 0 | 41 | green |  |
| live-knowledge | A | 3 | 0 | 0 | 0 | 41 | green |  |
| live-media-capabilities | A | 1 | 0 | 1 | 1 | 42 | **UNCLASSIFIED** — classify before any fix | the Studio grid lists what the catalog grants, by name, with — _not run, an earlier test in this file failed_ |
| live-media-upload | A | 3 | 0 | 0 | 0 | 36 | green |  |
| live-notifications | A | 1 | 0 | 0 | 0 | 12 | green |  |
| live-onboarding | B | 6 | 0 | 0 | 0 | 75 | green |  |
| live-proposals | A | 1 | 4 | 0 | 0 | 42 | green | one balanced run — the drafts it produces become the proposa — _402 wallet_insufficient would refuse the balanced run: the org's wallet is $0.00 — the plan is the only funding, and no _<br>after a RELOAD, Today shows the draft from the ledger — _402 wallet_insufficient would refuse the run this ledger read depends on: the org's wallet is $0.00 — the plan is the on_<br>approving records it as posted, and the decision survives a  — _402 wallet_insufficient would refuse the run this approval depends on: the org's wallet is $0.00 — the plan is the only _<br>declining asks why, keeps the row, and is reversible — _402 wallet_insufficient would refuse the second run this decline depends on: the org's wallet is $0.00 — the plan is the_ |
| live-schedule-repair | A | 3 | 0 | 0 | 0 | 21 | green |  |
| live-scheduling | A | 2 | 1 | 0 | 0 | 26 | green | slots, if ingestion produced any, honour skip/un-skip and ne — _ingestion has not produced slots for this org yet_ |
| live-studio | A | 3 | 1 | 0 | 0 | 22 | green | E2 renders for real, and E4 opens the asset it made — _set LIVE_MEDIA=1 to spend on one real render_ |
| live-team | A | 6 | 0 | 0 | 0 | 107 | green |  |
| live-video-duration | A | 1 | 0 | 1 | 1 | 13 | **UNCLASSIFIED** — classify before any fix | the valid video body clears validation — and self-skips on 4 — _not run, an earlier test in this file failed_ |
| live-wallet | A | 4 | 0 | 0 | 0 | 35 | green |  |

### Round 1 reds

- **live-media-capabilities** › every granted capability: the document’s example stops at the wallet (402), its trap before it (400) — zero spend: `Error: photoshoot.generate · five referenceImages: {"error":{"code":"bad_request","message":"The media service rejected the request — check the body against the capability's schema","requestId":"20bf5` — unclassified; log `round-1/live-media-capabilities.log`
- **live-video-duration** › a bad durationS is refused with 400 BEFORE the wallet check — the field is known, a maximum is enforced: `Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m` — unclassified; log `round-1/live-video-duration.log`

## Verdict

**RED** — 25.2 min end to end. See the rounds above; an UNCLASSIFIED red is classified before any fix.

## The runner log

```
19:24:20Z pnpm gate · series test-0915-2 · record Docs\qa\test-0915-2\gate\20260915-192419
19:24:20Z keep-awake held (pid 26568)
19:24:20Z verify:all — the suites once
19:31:48Z verify:all PASS in 448 s
19:31:55Z verify:w00 PASS in 7 s
19:31:58Z verify:w01 PASS in 3 s
19:31:59Z verify:w02 PASS in 1 s
19:32:00Z verify:w03 PASS in 1 s
19:32:01Z verify:w04 PASS in 1 s
19:32:02Z verify:w05 PASS in 1 s
19:32:03Z verify:w06 PASS in 1 s
19:32:03Z build with the round's API base inlined
19:32:29Z built in 26 s
19:32:30Z preview served on 5199 (pid 27136), entry assets/index-Crboq77r.js, the API host inlined 1 time(s)
19:32:32Z warm-up: 12-way fleet warm after 1 burst(s) in 1.3 s — slowest 609 ms (a 429 is an answer)
19:32:32Z heartbeat: one probe every 5 s for the round; the files stand down from their own warm-ups
19:32:32Z round 1 lane A: 17 files, 1 in flight
19:33:22Z round 1 lane A live-auth: 7 passed / 0 skipped / 0 failed in 51 s → green
19:33:47Z round 1 lane A live-auth-401: 4 passed / 0 skipped / 0 failed in 25 s → green
19:34:21Z round 1 lane A live-brand-kit: 3 passed / 0 skipped / 0 failed in 34 s → green
19:35:25Z round 1 lane A live-brand: 6 passed / 0 skipped / 0 failed in 63 s → green
19:36:09Z round 1 lane A live-country: 4 passed / 0 skipped / 0 failed in 44 s → green
19:36:50Z round 1 lane A live-invite-org: 3 passed / 0 skipped / 0 failed in 41 s → green
19:37:31Z round 1 lane A live-knowledge: 3 passed / 0 skipped / 0 failed in 41 s → green
19:38:12Z round 1 lane A live-media-capabilities: 1 passed / 1 skipped / 1 failed in 42 s → unclassified
19:38:48Z round 1 lane A live-media-upload: 3 passed / 0 skipped / 0 failed in 36 s → green
19:39:01Z round 1 lane A live-notifications: 1 passed / 0 skipped / 0 failed in 12 s → green
19:39:43Z round 1 lane A live-proposals: 1 passed / 4 skipped / 0 failed in 42 s → green
19:40:04Z round 1 lane A live-schedule-repair: 3 passed / 0 skipped / 0 failed in 21 s → green
19:40:30Z round 1 lane A live-scheduling: 2 passed / 1 skipped / 0 failed in 26 s → green
19:40:52Z round 1 lane A live-studio: 3 passed / 1 skipped / 0 failed in 22 s → green
19:42:38Z round 1 lane A live-team: 6 passed / 0 skipped / 0 failed in 107 s → green
19:42:52Z round 1 lane A live-video-duration: 1 passed / 1 skipped / 1 failed in 13 s → unclassified
19:43:27Z round 1 lane A live-wallet: 4 passed / 0 skipped / 0 failed in 35 s → green
19:43:27Z round 1 lane A done in 655 s
19:43:27Z round 1 lane B: 5 files, serial
19:45:32Z round 1 lane B live-billing: 7 passed / 0 skipped / 0 failed in 125 s → green
19:46:37Z round 1 lane B live-brand-rules: 5 passed / 0 skipped / 0 failed in 66 s → green
19:46:39Z round 1 lane B live-create-visual: 0 passed / 3 skipped / 0 failed in 1 s → skipped-all
19:48:17Z round 1 lane B live-generate: 2 passed / 0 skipped / 0 failed in 98 s → green
19:49:32Z round 1 lane B live-onboarding: 6 passed / 0 skipped / 0 failed in 75 s → green
19:49:32Z round 1 lane B done in 365 s
19:49:32Z round 1 done in 1020 s
19:49:32Z preview server stopped
19:49:32Z keep-awake released
```
