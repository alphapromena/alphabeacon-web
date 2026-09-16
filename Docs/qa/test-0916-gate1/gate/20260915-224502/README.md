# test-0916-gate1 — `pnpm gate` 20260915-224502

Tree `60be807` + uncommitted changes (hash `748c34d75fa8`) · started 2026-09-15T22:45:02.608Z · **30.3 min end to end** · workers 1 · rounds 1 · lanes A,B · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

| Step | Result | Seconds |
| --- | --- | ---: |
| verify:all | PASS | 457 |
| verify:w00 | PASS | 8 |
| verify:w01 | PASS | 3 |
| verify:w02 | PASS | 1 |
| verify:w03 | PASS | 1 |
| verify:w04 | PASS | 1 |
| verify:w05 | PASS | 1 |
| verify:w06 | PASS | 1 |

unit: **899 passed / 0 failed / 79 files**
static e2e: **122 passed / 99 skipped / 0 failed**

## Round 1 — the gate (20.7 min wall)

| File | Lane | Passed | Skipped | Not run | Failed | Seconds | Classification | Skips and not-runs, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| live-auth | A | 7 | 0 | 0 | 0 | 57 | green |  |
| live-auth-401 | A | 8 | 0 | 0 | 0 | 55 | green |  |
| live-billing | B | 7 | 0 | 0 | 0 | 129 | green |  |
| live-brand | A | 4 | 0 | 1 | 1 | 71 | **UNCLASSIFIED** — classify before any fix | deleting a tone reflects in the schedules that referenced it — _not run, an earlier test in this file failed_ |
| live-brand-kit | A | 3 | 0 | 0 | 0 | 40 | green |  |
| live-brand-rules | B | 5 | 0 | 0 | 0 | 56 | green |  |
| live-country | A | 4 | 0 | 0 | 0 | 51 | green |  |
| live-create-visual | B | 0 | 3 | 0 | 0 | 1 | skipped-all | a fresh owner + org with its brand set up — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>one run, then Create visual on its result renders ONE image  — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>Today offers the same button on the ledger row, and the Stud — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_ |
| live-first-light | A | 1 | 0 | 0 | 0 | 15 | green |  |
| live-generate | B | 2 | 0 | 0 | 0 | 88 | green |  |
| live-invite-org | A | 2 | 0 | 0 | 1 | 104 | **UNCLASSIFIED** — classify before any fix |  |
| live-knowledge | A | 0 | 0 | 2 | 1 | 23 | **UNCLASSIFIED** — classify before any fix | pasted text becomes a Ready source, and removing it removes  — _not run, an earlier test in this file failed_<br>a FILE uploads straight to storage from the browser (open-it — _not run, an earlier test in this file failed_ |
| live-media-capabilities | A | 0 | 0 | 2 | 1 | 23 | **UNCLASSIFIED** — classify before any fix | every granted capability: the document’s example stops at th — _not run, an earlier test in this file failed_<br>the Studio grid lists what the catalog grants, by name, with — _not run, an earlier test in this file failed_ |
| live-media-upload | A | 0 | 0 | 2 | 1 | 23 | **UNCLASSIFIED** — classify before any fix | an image upload becomes a WIRE-listed Files row, and Delete  — _not run, an earlier test in this file failed_<br>the logo uploads with desc "logo", shows as the logo, stays  — _not run, an earlier test in this file failed_ |
| live-notifications | A | 0 | 0 | 0 | 1 | 23 | **UNCLASSIFIED** — classify before any fix |  |
| live-onboarding | B | 6 | 0 | 0 | 0 | 71 | green |  |
| live-proposals | A | 0 | 0 | 4 | 1 | 23 | **UNCLASSIFIED** — classify before any fix | one balanced run — the drafts it produces become the proposa — _not run, an earlier test in this file failed_<br>after a RELOAD, Today shows the draft from the ledger — _not run, an earlier test in this file failed_<br>approving records it as posted, and the decision survives a  — _not run, an earlier test in this file failed_<br>declining asks why, keeps the row, and is reversible — _not run, an earlier test in this file failed_ |
| live-schedule-repair | A | 0 | 0 | 2 | 1 | 24 | network-lost, re-run 3/3 | C1 creates the missing schedule through the POST fallback, w — _not run, an earlier test in this file failed_<br>and it survives a reload, still clean — _not run, an earlier test in this file failed_ |
| live-scheduling | A | 2 | 1 | 0 | 0 | 40 | green | slots, if ingestion produced any, honour skip/un-skip and ne — _ingestion has not produced slots for this org yet_ |
| live-studio | A | 0 | 0 | 3 | 1 | 23 | **UNCLASSIFIED** — classify before any fix | E1 is built from the catalog: the granted capabilities, real — _not run, an earlier test in this file failed_<br>E3 lists renders, and is honest when there are none — _not run, an earlier test in this file failed_<br>E2 renders for real, and E4 opens the asset it made — _not run, an earlier test in this file failed_ |
| live-team | A | 0 | 0 | 5 | 1 | 23 | **UNCLASSIFIED** — classify before any fix | I1 renames the org through PATCH, and the name survives a re — _not run, an earlier test in this file failed_<br>change-password keeps this session and only the new password — _not run, an earlier test in this file failed_<br>inviting a NEW user: coded email, resend rate-limits honestl — _not run, an earlier test in this file failed_<br>inviting an EXISTING user adds them immediately, and the rol — _not run, an earlier test in this file failed_<br>an ADMIN viewing a team with an owner: no remove on the owne — _not run, an earlier test in this file failed_ |
| live-timeout | A | 2 | 0 | 0 | 0 | 35 | green |  |
| live-topics-refused | A | 2 | 0 | 0 | 0 | 25 | green |  |
| live-video-duration | A | 1 | 0 | 1 | 1 | 15 | **UNCLASSIFIED** — classify before any fix | the valid video body clears validation — and self-skips on 4 — _not run, an earlier test in this file failed_ |
| live-wallet | A | 0 | 0 | 3 | 1 | 23 | **UNCLASSIFIED** — classify before any fix | the balance chip shows money — and over a zero wallet, the i — _not run, an earlier test in this file failed_<br>H3 is a balance and a real usage read-back, in both allowed  — _not run, an earlier test in this file failed_<br>the wallet and usage endpoints answer the shapes the UI is b — _not run, an earlier test in this file failed_ |

### Round 1 reds

- **live-brand** › sources and topics: scheme-less display, real persistence: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-brand.log`
- **live-invite-org** › losing membership falls back honestly, and never to a dead screen: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-invite-org.log`
- **live-knowledge** › a fresh owner + org, made through the product: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-knowledge.log`
- **live-media-capabilities** › a fresh owner + org, made through the product: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-media-capabilities.log`
- **live-media-upload** › a fresh owner + org, made through the product: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-media-upload.log`
- **live-notifications** › the inbox endpoints hold their contract, and the bell tells the truth: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-notifications.log`
- **live-proposals** › a fresh owner + org, with its brand set up: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-proposals.log`
- **live-schedule-repair** › a live org in the 619 shape: tones seeded, no schedule: `Error: apiRequestContext.post: connect ETIMEDOUT 51.24.30.245:443` — network-lost; log `round-1/live-schedule-repair.log`
  - re-run 1: 3 passed / 0 failed in 22 s (`round-1/live-schedule-repair-rerun1.log`)
  - re-run 2: 3 passed / 0 failed in 25 s (`round-1/live-schedule-repair-rerun2.log`)
  - re-run 3: 3 passed / 0 failed in 23 s (`round-1/live-schedule-repair-rerun3.log`)
- **live-studio** › a fresh owner + org, made through the product: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-studio.log`
- **live-team** › verifying creates the org LIVE; the dashboard follows immediately: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-team.log`
- **live-video-duration** › a bad durationS is refused with 400 BEFORE the wallet check — the field is known, a maximum is enforced: `Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m` — unclassified; log `round-1/live-video-duration.log`
- **live-wallet** › a fresh owner + org, made through the product: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-wallet.log`

## Verdict

**RED** — 30.3 min end to end. See the rounds above; an UNCLASSIFIED red is classified before any fix.

## The runner log

```
22:45:03Z pnpm gate · series test-0916-gate1 · record Docs\qa\test-0916-gate1\gate\20260915-224502
22:45:03Z keep-awake held (pid 40844)
22:45:03Z verify:all — the suites once
22:52:40Z verify:all PASS in 457 s
22:52:47Z verify:w00 PASS in 8 s
22:52:51Z verify:w01 PASS in 3 s
22:52:52Z verify:w02 PASS in 1 s
22:52:53Z verify:w03 PASS in 1 s
22:52:54Z verify:w04 PASS in 1 s
22:52:55Z verify:w05 PASS in 1 s
22:52:56Z verify:w06 PASS in 1 s
22:52:56Z build with the round's API base inlined
22:53:24Z built in 28 s
22:53:25Z preview served on 5199 (pid 32832), entry assets/index-iFEiG8T_.js, the API host inlined 1 time(s)
22:53:29Z warm-up: 12-way fleet warm after 2 burst(s) in 3.9 s — slowest 527 ms (a 429 is an answer)
22:53:29Z heartbeat: one probe every 5 s for the round; the files stand down from their own warm-ups
22:53:29Z round 1 lane A: 20 files, 1 in flight, 8 s between starts
22:54:26Z round 1 lane A live-auth: 7 passed / 0 skipped / 0 failed in 57 s → green
22:55:09Z round 1 lane A live-timeout: 2 passed / 0 skipped / 0 failed in 35 s → green
22:56:12Z round 1 lane A live-auth-401: 8 passed / 0 skipped / 0 failed in 55 s → green
22:56:34Z round 1 lane A live-first-light: 1 passed / 0 skipped / 0 failed in 15 s → green
22:57:22Z round 1 lane A live-brand-kit: 3 passed / 0 skipped / 0 failed in 40 s → green
22:57:55Z round 1 lane A live-topics-refused: 2 passed / 0 skipped / 0 failed in 25 s → green
22:59:14Z round 1 lane A live-brand: 4 passed / 1 skipped / 1 failed in 71 s → unclassified
23:00:13Z round 1 lane A live-country: 4 passed / 0 skipped / 0 failed in 51 s → green
23:02:06Z round 1 lane A live-invite-org: 2 passed / 0 skipped / 1 failed in 104 s → unclassified
23:02:36Z round 1 lane A live-knowledge: 0 passed / 2 skipped / 1 failed in 23 s → unclassified
23:03:07Z round 1 lane A live-media-capabilities: 0 passed / 2 skipped / 1 failed in 23 s → unclassified
23:03:37Z round 1 lane A live-media-upload: 0 passed / 2 skipped / 1 failed in 23 s → unclassified
23:04:08Z round 1 lane A live-notifications: 0 passed / 0 skipped / 1 failed in 23 s → unclassified
23:04:38Z round 1 lane A live-proposals: 0 passed / 4 skipped / 1 failed in 23 s → unclassified
23:05:11Z round 1 lane A live-schedule-repair: 0 passed / 2 skipped / 1 failed in 24 s → network-lost
23:05:59Z round 1 lane A live-scheduling: 2 passed / 1 skipped / 0 failed in 40 s → green
23:06:29Z round 1 lane A live-studio: 0 passed / 3 skipped / 1 failed in 23 s → unclassified
23:07:00Z round 1 lane A live-team: 0 passed / 5 skipped / 1 failed in 23 s → unclassified
23:07:22Z round 1 lane A live-video-duration: 1 passed / 1 skipped / 1 failed in 15 s → unclassified
23:07:53Z round 1 lane A live-wallet: 0 passed / 3 skipped / 1 failed in 23 s → unclassified
23:07:53Z round 1 lane A done in 864 s
23:07:53Z round 1 lane B: 5 files, serial, 8 s between starts
23:10:02Z round 1 lane B live-billing: 7 passed / 0 skipped / 0 failed in 129 s → green
23:11:06Z round 1 lane B live-brand-rules: 5 passed / 0 skipped / 0 failed in 56 s → green
23:11:15Z round 1 lane B live-create-visual: 0 passed / 3 skipped / 0 failed in 1 s → skipped-all
23:12:51Z round 1 lane B live-generate: 2 passed / 0 skipped / 0 failed in 88 s → green
23:14:10Z round 1 lane B live-onboarding: 6 passed / 0 skipped / 0 failed in 71 s → green
23:14:10Z round 1 lane B done in 377 s
23:14:32Z round 1 lane A live-schedule-repair-rerun1: 3 passed / 0 skipped / 0 failed in 22 s → green
23:14:57Z round 1 lane A live-schedule-repair-rerun2: 3 passed / 0 skipped / 0 failed in 25 s → green
23:15:20Z round 1 lane A live-schedule-repair-rerun3: 3 passed / 0 skipped / 0 failed in 23 s → green
23:15:20Z round 1 done in 1311 s
23:15:20Z preview server stopped
23:15:20Z keep-awake released
```
