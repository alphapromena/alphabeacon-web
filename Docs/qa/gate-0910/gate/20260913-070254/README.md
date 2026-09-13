# gate-0910 — `pnpm gate` 20260913-070254

Tree `8c0694a` + uncommitted changes (hash `fd405bbc6908`) · started 2026-09-13T07:02:54.524Z · **32.9 min end to end** · workers 1 · rounds 2 · lanes A,B · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

| Step | Result | Seconds |
| --- | --- | ---: |
| verify:all | PASS | 151 |
| verify:w00 | PASS | 6 |
| verify:w01 | PASS | 3 |
| verify:w02 | PASS | 1 |
| verify:w03 | PASS | 1 |
| verify:w04 | PASS | 1 |
| verify:w05 | PASS | 1 |
| verify:w06 | PASS | 1 |

unit: **656 passed / 0 failed / 58 files**
static e2e: **115 passed / 84 skipped / 0 failed**

## Round 1 (14.9 min wall)

| File | Lane | Passed | Skipped | Failed | Seconds | Classification | Skips, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| live-auth | A | 7 | 0 | 0 | 45 | green |  |
| live-billing | B | 7 | 0 | 0 | 119 | green |  |
| live-brand | A | 5 | 0 | 0 | 47 | green |  |
| live-brand-kit | A | 3 | 0 | 0 | 30 | green |  |
| live-brand-rules | B | 5 | 0 | 0 | 53 | green |  |
| live-country | A | 4 | 0 | 0 | 43 | green |  |
| live-create-visual | B | 0 | 3 | 0 | 1 | skipped-all | a fresh owner + org with its brand set up — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>one run, then Create visual on its result renders ONE image  — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>Today offers the same button on the ledger row, and the Stud — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_ |
| live-generate | B | 2 | 0 | 0 | 67 | green |  |
| live-invite-org | A | 3 | 0 | 0 | 39 | green |  |
| live-knowledge | A | 3 | 0 | 0 | 41 | green |  |
| live-media-capabilities | A | 3 | 0 | 0 | 79 | green |  |
| live-media-upload | A | 3 | 0 | 0 | 30 | green |  |
| live-notifications | A | 1 | 0 | 0 | 13 | green |  |
| live-onboarding | B | 6 | 0 | 0 | 69 | green |  |
| live-proposals | A | 1 | 4 | 0 | 38 | green | one balanced run — the drafts it produces become the proposa — _402 wallet_insufficient would refuse the balanced run: the org's wallet is $0.00 — the plan is the only funding, and no _<br>after a RELOAD, Today shows the draft from the ledger — _402 wallet_insufficient would refuse the run this ledger read depends on: the org's wallet is $0.00 — the plan is the on_<br>approving records it as posted, and the decision survives a  — _402 wallet_insufficient would refuse the run this approval depends on: the org's wallet is $0.00 — the plan is the only _<br>declining asks why, keeps the row, and is reversible — _402 wallet_insufficient would refuse the second run this decline depends on: the org's wallet is $0.00 — the plan is the_ |
| live-schedule-repair | A | 1 | 1 | 1 | 35 | **UNCLASSIFIED** — classify before any fix | and it survives a reload, still clean — __ |
| live-scheduling | A | 1 | 1 | 1 | 42 | **UNCLASSIFIED** — classify before any fix | slots, if ingestion produced any, honour skip/un-skip and ne — __ |
| live-studio | A | 3 | 1 | 0 | 22 | green | E2 renders for real, and E4 opens the asset it made — _set LIVE_MEDIA=1 to spend on one real render_ |
| live-team | A | 1 | 4 | 1 | 33 | **UNCLASSIFIED** — classify before any fix | change-password keeps this session and only the new password — __<br>inviting a NEW user: coded email, resend rate-limits honestl — __<br>inviting an EXISTING user adds them immediately, and the rol — __<br>an ADMIN viewing a team with an owner: no remove on the owne — __ |
| live-video-duration | A | 1 | 1 | 1 | 15 | **UNCLASSIFIED** — classify before any fix | the valid video body clears validation — and self-skips on 4 — __ |
| live-wallet | A | 4 | 0 | 0 | 33 | green |  |

### Round 1 reds

- **live-schedule-repair** › C1 creates the missing schedule through the POST fallback, with the exact tones picked: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-schedule-repair.log`
- **live-scheduling** › C1 creates the schedule on first save, then PATCHes it — and it survives a reload: `[31mTest timeout of 30000ms exceeded.[39m` — unclassified; log `round-1/live-scheduling.log`
- **live-team** › I1 renames the org through PATCH, and the name survives a reload: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-team.log`
- **live-video-duration** › a bad durationS is refused with 400 BEFORE the wallet check — the field is known, a maximum is enforced: `Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m` — unclassified; log `round-1/live-video-duration.log`

## Round 2 — the gate (14.8 min wall)

| File | Lane | Passed | Skipped | Failed | Seconds | Classification | Skips, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| live-auth | A | 7 | 0 | 0 | 44 | green |  |
| live-billing | B | 7 | 0 | 0 | 118 | green |  |
| live-brand | A | 5 | 0 | 0 | 46 | green |  |
| live-brand-kit | A | 3 | 0 | 0 | 28 | green |  |
| live-brand-rules | B | 5 | 0 | 0 | 53 | green |  |
| live-country | A | 4 | 0 | 0 | 43 | green |  |
| live-create-visual | B | 0 | 3 | 0 | 1 | skipped-all | a fresh owner + org with its brand set up — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>one run, then Create visual on its result renders ONE image  — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>Today offers the same button on the ledger row, and the Stud — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_ |
| live-generate | B | 2 | 0 | 0 | 69 | green |  |
| live-invite-org | A | 3 | 0 | 0 | 39 | green |  |
| live-knowledge | A | 3 | 0 | 0 | 39 | green |  |
| live-media-capabilities | A | 3 | 0 | 0 | 79 | green |  |
| live-media-upload | A | 3 | 0 | 0 | 30 | green |  |
| live-notifications | A | 1 | 0 | 0 | 12 | green |  |
| live-onboarding | B | 6 | 0 | 0 | 69 | green |  |
| live-proposals | A | 1 | 4 | 0 | 38 | green | one balanced run — the drafts it produces become the proposa — _402 wallet_insufficient would refuse the balanced run: the org's wallet is $0.00 — the plan is the only funding, and no _<br>after a RELOAD, Today shows the draft from the ledger — _402 wallet_insufficient would refuse the run this ledger read depends on: the org's wallet is $0.00 — the plan is the on_<br>approving records it as posted, and the decision survives a  — _402 wallet_insufficient would refuse the run this approval depends on: the org's wallet is $0.00 — the plan is the only _<br>declining asks why, keeps the row, and is reversible — _402 wallet_insufficient would refuse the second run this decline depends on: the org's wallet is $0.00 — the plan is the_ |
| live-schedule-repair | A | 1 | 1 | 1 | 35 | **UNCLASSIFIED** — classify before any fix | and it survives a reload, still clean — __ |
| live-scheduling | A | 1 | 1 | 1 | 42 | **UNCLASSIFIED** — classify before any fix | slots, if ingestion produced any, honour skip/un-skip and ne — __ |
| live-studio | A | 3 | 1 | 0 | 23 | green | E2 renders for real, and E4 opens the asset it made — _set LIVE_MEDIA=1 to spend on one real render_ |
| live-team | A | 1 | 4 | 1 | 33 | **UNCLASSIFIED** — classify before any fix | change-password keeps this session and only the new password — __<br>inviting a NEW user: coded email, resend rate-limits honestl — __<br>inviting an EXISTING user adds them immediately, and the rol — __<br>an ADMIN viewing a team with an owner: no remove on the owne — __ |
| live-video-duration | A | 1 | 1 | 1 | 15 | **UNCLASSIFIED** — classify before any fix | the valid video body clears validation — and self-skips on 4 — __ |
| live-wallet | A | 4 | 0 | 0 | 34 | green |  |

### Round 2 reds

- **live-schedule-repair** › C1 creates the missing schedule through the POST fallback, with the exact tones picked: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-2/live-schedule-repair.log`
- **live-scheduling** › C1 creates the schedule on first save, then PATCHes it — and it survives a reload: `[31mTest timeout of 30000ms exceeded.[39m` — unclassified; log `round-2/live-scheduling.log`
- **live-team** › I1 renames the org through PATCH, and the name survives a reload: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-2/live-team.log`
- **live-video-duration** › a bad durationS is refused with 400 BEFORE the wallet check — the field is known, a maximum is enforced: `Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m` — unclassified; log `round-2/live-video-duration.log`

## Verdict

**RED** — 32.9 min end to end. See the rounds above; an UNCLASSIFIED red is classified before any fix.

## The runner log

```
07:02:55Z pnpm gate · series gate-0910 · record Docs\qa\gate-0910\gate\20260913-070254
07:02:55Z keep-awake held (pid 3464)
07:02:55Z verify:all — the suites once
07:05:26Z verify:all PASS in 151 s
07:05:32Z verify:w00 PASS in 6 s
07:05:35Z verify:w01 PASS in 3 s
07:05:37Z verify:w02 PASS in 1 s
07:05:37Z verify:w03 PASS in 1 s
07:05:38Z verify:w04 PASS in 1 s
07:05:39Z verify:w05 PASS in 1 s
07:05:40Z verify:w06 PASS in 1 s
07:05:40Z build with the round's API base inlined
07:06:05Z built in 24 s
07:06:06Z preview served on 5199 (pid 38292), entry assets/index-CK7x87Cs.js, the API host inlined 1 time(s)
07:06:07Z warm-up: 12-way fleet warm after 1 burst(s) in 1.4 s — slowest 758 ms (a 429 is an answer)
07:06:07Z heartbeat: one probe every 5 s for the round; the files stand down from their own warm-ups
07:06:07Z round 1 lane A: 16 files, 1 in flight
07:06:52Z round 1 lane A live-auth: 7 passed / 0 skipped / 0 failed in 45 s → green
07:07:22Z round 1 lane A live-brand-kit: 3 passed / 0 skipped / 0 failed in 30 s → green
07:08:10Z round 1 lane A live-brand: 5 passed / 0 skipped / 0 failed in 47 s → green
07:08:53Z round 1 lane A live-country: 4 passed / 0 skipped / 0 failed in 43 s → green
07:09:32Z round 1 lane A live-invite-org: 3 passed / 0 skipped / 0 failed in 39 s → green
07:10:13Z round 1 lane A live-knowledge: 3 passed / 0 skipped / 0 failed in 41 s → green
07:11:32Z round 1 lane A live-media-capabilities: 3 passed / 0 skipped / 0 failed in 79 s → green
07:12:01Z round 1 lane A live-media-upload: 3 passed / 0 skipped / 0 failed in 30 s → green
07:12:14Z round 1 lane A live-notifications: 1 passed / 0 skipped / 0 failed in 13 s → green
07:12:51Z round 1 lane A live-proposals: 1 passed / 4 skipped / 0 failed in 38 s → green
07:13:26Z round 1 lane A live-schedule-repair: 1 passed / 1 skipped / 1 failed in 35 s → unclassified
07:14:08Z round 1 lane A live-scheduling: 1 passed / 1 skipped / 1 failed in 42 s → unclassified
07:14:30Z round 1 lane A live-studio: 3 passed / 1 skipped / 0 failed in 22 s → green
07:15:03Z round 1 lane A live-team: 1 passed / 4 skipped / 1 failed in 33 s → unclassified
07:15:18Z round 1 lane A live-video-duration: 1 passed / 1 skipped / 1 failed in 15 s → unclassified
07:15:51Z round 1 lane A live-wallet: 4 passed / 0 skipped / 0 failed in 33 s → green
07:15:51Z round 1 lane A done in 584 s
07:15:51Z round 1 lane B: 5 files, serial
07:17:50Z round 1 lane B live-billing: 7 passed / 0 skipped / 0 failed in 119 s → green
07:18:44Z round 1 lane B live-brand-rules: 5 passed / 0 skipped / 0 failed in 53 s → green
07:18:45Z round 1 lane B live-create-visual: 0 passed / 3 skipped / 0 failed in 1 s → skipped-all
07:19:52Z round 1 lane B live-generate: 2 passed / 0 skipped / 0 failed in 67 s → green
07:21:01Z round 1 lane B live-onboarding: 6 passed / 0 skipped / 0 failed in 69 s → green
07:21:01Z round 1 lane B done in 309 s
07:21:01Z round 1 done in 893 s
07:21:01Z round 2 lane A: 16 files, 1 in flight
07:21:44Z round 2 lane A live-auth: 7 passed / 0 skipped / 0 failed in 44 s → green
07:22:13Z round 2 lane A live-brand-kit: 3 passed / 0 skipped / 0 failed in 28 s → green
07:22:58Z round 2 lane A live-brand: 5 passed / 0 skipped / 0 failed in 46 s → green
07:23:41Z round 2 lane A live-country: 4 passed / 0 skipped / 0 failed in 43 s → green
07:24:20Z round 2 lane A live-invite-org: 3 passed / 0 skipped / 0 failed in 39 s → green
07:25:00Z round 2 lane A live-knowledge: 3 passed / 0 skipped / 0 failed in 39 s → green
07:26:18Z round 2 lane A live-media-capabilities: 3 passed / 0 skipped / 0 failed in 79 s → green
07:26:48Z round 2 lane A live-media-upload: 3 passed / 0 skipped / 0 failed in 30 s → green
07:27:00Z round 2 lane A live-notifications: 1 passed / 0 skipped / 0 failed in 12 s → green
07:27:38Z round 2 lane A live-proposals: 1 passed / 4 skipped / 0 failed in 38 s → green
07:28:13Z round 2 lane A live-schedule-repair: 1 passed / 1 skipped / 1 failed in 35 s → unclassified
07:28:55Z round 2 lane A live-scheduling: 1 passed / 1 skipped / 1 failed in 42 s → unclassified
07:29:18Z round 2 lane A live-studio: 3 passed / 1 skipped / 0 failed in 23 s → green
07:29:51Z round 2 lane A live-team: 1 passed / 4 skipped / 1 failed in 33 s → unclassified
07:30:06Z round 2 lane A live-video-duration: 1 passed / 1 skipped / 1 failed in 15 s → unclassified
07:30:39Z round 2 lane A live-wallet: 4 passed / 0 skipped / 0 failed in 34 s → green
07:30:39Z round 2 lane A done in 579 s
07:30:39Z round 2 lane B: 5 files, serial
07:32:37Z round 2 lane B live-billing: 7 passed / 0 skipped / 0 failed in 118 s → green
07:33:30Z round 2 lane B live-brand-rules: 5 passed / 0 skipped / 0 failed in 53 s → green
07:33:31Z round 2 lane B live-create-visual: 0 passed / 3 skipped / 0 failed in 1 s → skipped-all
07:34:40Z round 2 lane B live-generate: 2 passed / 0 skipped / 0 failed in 69 s → green
07:35:49Z round 2 lane B live-onboarding: 6 passed / 0 skipped / 0 failed in 69 s → green
07:35:49Z round 2 lane B done in 310 s
07:35:49Z round 2 done in 889 s
07:35:49Z preview server stopped
07:35:49Z keep-awake released
```
