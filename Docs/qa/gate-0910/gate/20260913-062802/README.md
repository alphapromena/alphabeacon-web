# gate-0910 — `pnpm gate` 20260913-062802

Tree `8c0694a` + uncommitted changes (hash `1f59f844ffa1`) · started 2026-09-13T06:28:02.823Z · **34.8 min end to end** · workers 1 · rounds 2 · lanes A,B · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

| Step | Result | Seconds |
| --- | --- | ---: |
| verify:all | PASS | 150 |
| verify:w00 | PASS | 19 |
| verify:w01 | PASS | 3 |
| verify:w02 | PASS | 1 |
| verify:w03 | PASS | 1 |
| verify:w04 | PASS | 1 |
| verify:w05 | PASS | 1 |
| verify:w06 | PASS | 1 |

unit: **656 passed / 0 failed / 58 files**
static e2e: **115 passed / 84 skipped / 0 failed**

## Round 1 (14.6 min wall)

| File | Lane | Passed | Skipped | Failed | Seconds | Classification | Skips, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| live-auth | A | 7 | 0 | 0 | 46 | green |  |
| live-billing | B | 7 | 0 | 0 | 119 | green |  |
| live-brand | A | 5 | 0 | 0 | 45 | green |  |
| live-brand-kit | A | 3 | 0 | 0 | 27 | green |  |
| live-brand-rules | B | 5 | 0 | 0 | 54 | green |  |
| live-country | A | 4 | 0 | 0 | 44 | green |  |
| live-create-visual | B | 0 | 3 | 0 | 1 | skipped-all | a fresh owner + org with its brand set up — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>one run, then Create visual on its result renders ONE image  — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>Today offers the same button on the ledger row, and the Stud — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_ |
| live-generate | B | 2 | 0 | 0 | 59 | green |  |
| live-invite-org | A | 3 | 0 | 0 | 40 | green |  |
| live-knowledge | A | 3 | 0 | 0 | 40 | green |  |
| live-media-capabilities | A | 3 | 0 | 0 | 79 | green |  |
| live-media-upload | A | 3 | 0 | 0 | 30 | green |  |
| live-notifications | A | 1 | 0 | 0 | 12 | green |  |
| live-onboarding | B | 6 | 0 | 0 | 63 | green |  |
| live-proposals | A | 1 | 4 | 0 | 38 | green | one balanced run — the drafts it produces become the proposa — _402 wallet_insufficient would refuse the balanced run: the org's wallet is $0.00 — the plan is the only funding, and no _<br>after a RELOAD, Today shows the draft from the ledger — _402 wallet_insufficient would refuse the run this ledger read depends on: the org's wallet is $0.00 — the plan is the on_<br>approving records it as posted, and the decision survives a  — _402 wallet_insufficient would refuse the run this approval depends on: the org's wallet is $0.00 — the plan is the only _<br>declining asks why, keeps the row, and is reversible — _402 wallet_insufficient would refuse the second run this decline depends on: the org's wallet is $0.00 — the plan is the_ |
| live-schedule-repair | A | 1 | 1 | 1 | 35 | **UNCLASSIFIED** — classify before any fix | and it survives a reload, still clean — __ |
| live-scheduling | A | 1 | 1 | 1 | 42 | **UNCLASSIFIED** — classify before any fix | slots, if ingestion produced any, honour skip/un-skip and ne — __ |
| live-studio | A | 3 | 1 | 0 | 22 | green | E2 renders for real, and E4 opens the asset it made — _set LIVE_MEDIA=1 to spend on one real render_ |
| live-team | A | 1 | 4 | 1 | 33 | **UNCLASSIFIED** — classify before any fix | change-password keeps this session and only the new password — __<br>inviting a NEW user: coded email, resend rate-limits honestl — __<br>inviting an EXISTING user adds them immediately, and the rol — __<br>an ADMIN viewing a team with an owner: no remove on the owne — __ |
| live-video-duration | A | 1 | 1 | 1 | 14 | **UNCLASSIFIED** — classify before any fix | the valid video body clears validation — and self-skips on 4 — __ |
| live-wallet | A | 4 | 0 | 0 | 32 | green |  |

### Round 1 reds

- **live-schedule-repair** › C1 creates the missing schedule through the POST fallback, with the exact tones picked: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-schedule-repair.log`
- **live-scheduling** › C1 creates the schedule on first save, then PATCHes it — and it survives a reload: `[31mTest timeout of 30000ms exceeded.[39m` — unclassified; log `round-1/live-scheduling.log`
- **live-team** › I1 renames the org through PATCH, and the name survives a reload: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-team.log`
- **live-video-duration** › a bad durationS is refused with 400 BEFORE the wallet check — the field is known, a maximum is enforced: `Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m` — unclassified; log `round-1/live-video-duration.log`

## Round 2 — the gate (16.8 min wall)

| File | Lane | Passed | Skipped | Failed | Seconds | Classification | Skips, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| live-auth | A | 7 | 0 | 0 | 44 | green |  |
| live-billing | B | 7 | 0 | 0 | 119 | green |  |
| live-brand | A | 5 | 0 | 0 | 47 | green |  |
| live-brand-kit | A | 3 | 0 | 0 | 27 | green |  |
| live-brand-rules | B | 5 | 0 | 0 | 55 | green |  |
| live-country | A | 4 | 0 | 0 | 46 | green |  |
| live-create-visual | B | 0 | 3 | 0 | 1 | skipped-all | a fresh owner + org with its brand set up — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>one run, then Create visual on its result renders ONE image  — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>Today offers the same button on the ledger row, and the Stud — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_ |
| live-generate | B | 2 | 0 | 0 | 66 | green |  |
| live-invite-org | A | 3 | 0 | 0 | 40 | green |  |
| live-knowledge | A | 1 | 1 | 1 | 159 | **UNCLASSIFIED** — classify before any fix | a FILE uploads straight to storage from the browser (open-it — __ |
| live-media-capabilities | A | 3 | 0 | 0 | 81 | green |  |
| live-media-upload | A | 3 | 0 | 0 | 29 | green |  |
| live-notifications | A | 1 | 0 | 0 | 13 | green |  |
| live-onboarding | B | 6 | 0 | 0 | 67 | green |  |
| live-proposals | A | 1 | 4 | 0 | 38 | green | one balanced run — the drafts it produces become the proposa — _402 wallet_insufficient would refuse the balanced run: the org's wallet is $0.00 — the plan is the only funding, and no _<br>after a RELOAD, Today shows the draft from the ledger — _402 wallet_insufficient would refuse the run this ledger read depends on: the org's wallet is $0.00 — the plan is the on_<br>approving records it as posted, and the decision survives a  — _402 wallet_insufficient would refuse the run this approval depends on: the org's wallet is $0.00 — the plan is the only _<br>declining asks why, keeps the row, and is reversible — _402 wallet_insufficient would refuse the second run this decline depends on: the org's wallet is $0.00 — the plan is the_ |
| live-schedule-repair | A | 1 | 1 | 1 | 35 | **UNCLASSIFIED** — classify before any fix | and it survives a reload, still clean — __ |
| live-scheduling | A | 1 | 1 | 1 | 42 | **UNCLASSIFIED** — classify before any fix | slots, if ingestion produced any, honour skip/un-skip and ne — __ |
| live-studio | A | 3 | 1 | 0 | 22 | green | E2 renders for real, and E4 opens the asset it made — _set LIVE_MEDIA=1 to spend on one real render_ |
| live-team | A | 1 | 4 | 1 | 33 | **UNCLASSIFIED** — classify before any fix | change-password keeps this session and only the new password — __<br>inviting a NEW user: coded email, resend rate-limits honestl — __<br>inviting an EXISTING user adds them immediately, and the rol — __<br>an ADMIN viewing a team with an owner: no remove on the owne — __ |
| live-video-duration | A | 1 | 1 | 1 | 15 | **UNCLASSIFIED** — classify before any fix | the valid video body clears validation — and self-skips on 4 — __ |
| live-wallet | A | 4 | 0 | 0 | 32 | green |  |

### Round 2 reds

- **live-knowledge** › pasted text becomes a Ready source, and removing it removes it: `[31mTest timeout of 150000ms exceeded.[39m` — unclassified; log `round-2/live-knowledge.log`
- **live-schedule-repair** › C1 creates the missing schedule through the POST fallback, with the exact tones picked: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-2/live-schedule-repair.log`
- **live-scheduling** › C1 creates the schedule on first save, then PATCHes it — and it survives a reload: `[31mTest timeout of 30000ms exceeded.[39m` — unclassified; log `round-2/live-scheduling.log`
- **live-team** › I1 renames the org through PATCH, and the name survives a reload: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-2/live-team.log`
- **live-video-duration** › a bad durationS is refused with 400 BEFORE the wallet check — the field is known, a maximum is enforced: `Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m` — unclassified; log `round-2/live-video-duration.log`

## Verdict

**RED** — 34.8 min end to end. See the rounds above; an UNCLASSIFIED red is classified before any fix.

## The runner log

```
06:28:03Z pnpm gate · series gate-0910 · record Docs\qa\gate-0910\gate\20260913-062802
06:28:03Z keep-awake held (pid 36008)
06:28:03Z verify:all — the suites once
06:30:33Z verify:all PASS in 150 s
06:30:52Z verify:w00 PASS in 19 s
06:30:55Z verify:w01 PASS in 3 s
06:30:56Z verify:w02 PASS in 1 s
06:30:57Z verify:w03 PASS in 1 s
06:30:58Z verify:w04 PASS in 1 s
06:30:59Z verify:w05 PASS in 1 s
06:31:00Z verify:w06 PASS in 1 s
06:31:00Z build with the round's API base inlined
06:31:25Z built in 25 s
06:31:26Z preview served on 5199 (pid 31876), entry assets/index-CK7x87Cs.js, the API host inlined 1 time(s)
06:31:27Z warm-up: 12-way fleet warm after 1 burst(s) in 0.9 s — slowest 275 ms (a 429 is an answer)
06:31:27Z heartbeat: one probe every 5 s for the round; the files stand down from their own warm-ups
06:31:27Z round 1 lane A: 16 files, 1 in flight
06:32:14Z round 1 lane A live-auth: 7 passed / 0 skipped / 0 failed in 46 s → green
06:32:41Z round 1 lane A live-brand-kit: 3 passed / 0 skipped / 0 failed in 27 s → green
06:33:26Z round 1 lane A live-brand: 5 passed / 0 skipped / 0 failed in 45 s → green
06:34:09Z round 1 lane A live-country: 4 passed / 0 skipped / 0 failed in 44 s → green
06:34:49Z round 1 lane A live-invite-org: 3 passed / 0 skipped / 0 failed in 40 s → green
06:35:29Z round 1 lane A live-knowledge: 3 passed / 0 skipped / 0 failed in 40 s → green
06:36:47Z round 1 lane A live-media-capabilities: 3 passed / 0 skipped / 0 failed in 79 s → green
06:37:17Z round 1 lane A live-media-upload: 3 passed / 0 skipped / 0 failed in 30 s → green
06:37:29Z round 1 lane A live-notifications: 1 passed / 0 skipped / 0 failed in 12 s → green
06:38:08Z round 1 lane A live-proposals: 1 passed / 4 skipped / 0 failed in 38 s → green
06:38:43Z round 1 lane A live-schedule-repair: 1 passed / 1 skipped / 1 failed in 35 s → unclassified
06:39:25Z round 1 lane A live-scheduling: 1 passed / 1 skipped / 1 failed in 42 s → unclassified
06:39:47Z round 1 lane A live-studio: 3 passed / 1 skipped / 0 failed in 22 s → green
06:40:20Z round 1 lane A live-team: 1 passed / 4 skipped / 1 failed in 33 s → unclassified
06:40:34Z round 1 lane A live-video-duration: 1 passed / 1 skipped / 1 failed in 14 s → unclassified
06:41:06Z round 1 lane A live-wallet: 4 passed / 0 skipped / 0 failed in 32 s → green
06:41:06Z round 1 lane A done in 578 s
06:41:06Z round 1 lane B: 5 files, serial
06:43:04Z round 1 lane B live-billing: 7 passed / 0 skipped / 0 failed in 119 s → green
06:43:58Z round 1 lane B live-brand-rules: 5 passed / 0 skipped / 0 failed in 54 s → green
06:43:59Z round 1 lane B live-create-visual: 0 passed / 3 skipped / 0 failed in 1 s → skipped-all
06:44:59Z round 1 lane B live-generate: 2 passed / 0 skipped / 0 failed in 59 s → green
06:46:02Z round 1 lane B live-onboarding: 6 passed / 0 skipped / 0 failed in 63 s → green
06:46:02Z round 1 lane B done in 296 s
06:46:02Z round 1 done in 874 s
06:46:02Z round 2 lane A: 16 files, 1 in flight
06:46:45Z round 2 lane A live-auth: 7 passed / 0 skipped / 0 failed in 44 s → green
06:47:13Z round 2 lane A live-brand-kit: 3 passed / 0 skipped / 0 failed in 27 s → green
06:48:00Z round 2 lane A live-brand: 5 passed / 0 skipped / 0 failed in 47 s → green
06:48:46Z round 2 lane A live-country: 4 passed / 0 skipped / 0 failed in 46 s → green
06:49:26Z round 2 lane A live-invite-org: 3 passed / 0 skipped / 0 failed in 40 s → green
06:52:04Z round 2 lane A live-knowledge: 1 passed / 1 skipped / 1 failed in 159 s → unclassified
06:53:26Z round 2 lane A live-media-capabilities: 3 passed / 0 skipped / 0 failed in 81 s → green
06:53:55Z round 2 lane A live-media-upload: 3 passed / 0 skipped / 0 failed in 29 s → green
06:54:08Z round 2 lane A live-notifications: 1 passed / 0 skipped / 0 failed in 13 s → green
06:54:46Z round 2 lane A live-proposals: 1 passed / 4 skipped / 0 failed in 38 s → green
06:55:21Z round 2 lane A live-schedule-repair: 1 passed / 1 skipped / 1 failed in 35 s → unclassified
06:56:03Z round 2 lane A live-scheduling: 1 passed / 1 skipped / 1 failed in 42 s → unclassified
06:56:25Z round 2 lane A live-studio: 3 passed / 1 skipped / 0 failed in 22 s → green
06:56:58Z round 2 lane A live-team: 1 passed / 4 skipped / 1 failed in 33 s → unclassified
06:57:13Z round 2 lane A live-video-duration: 1 passed / 1 skipped / 1 failed in 15 s → unclassified
06:57:45Z round 2 lane A live-wallet: 4 passed / 0 skipped / 0 failed in 32 s → green
06:57:45Z round 2 lane A done in 704 s
06:57:45Z round 2 lane B: 5 files, serial
06:59:44Z round 2 lane B live-billing: 7 passed / 0 skipped / 0 failed in 119 s → green
07:00:38Z round 2 lane B live-brand-rules: 5 passed / 0 skipped / 0 failed in 55 s → green
07:00:39Z round 2 lane B live-create-visual: 0 passed / 3 skipped / 0 failed in 1 s → skipped-all
07:01:45Z round 2 lane B live-generate: 2 passed / 0 skipped / 0 failed in 66 s → green
07:02:52Z round 2 lane B live-onboarding: 6 passed / 0 skipped / 0 failed in 67 s → green
07:02:52Z round 2 lane B done in 307 s
07:02:52Z round 2 done in 1011 s
07:02:52Z preview server stopped
07:02:53Z keep-awake released
```
