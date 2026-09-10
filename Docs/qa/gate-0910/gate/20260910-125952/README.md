# gate-0910 — `pnpm gate` 20260910-125952

Tree `cdfb0ef` + uncommitted changes (hash `db60f4d6c1d2`) · started 2026-09-10T12:59:52.920Z · **6.4 min end to end** · workers 2 · rounds 1 · lanes A · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

_skipped (--skip-static)_

## Round 1 — the gate (6.0 min wall)

| File | Lane | Passed | Skipped | Failed | Seconds | Classification | Skips, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| live-auth | A | 7 | 0 | 0 | 45 | green |  |
| live-brand | A | 3 | 1 | 1 | 36 | **UNCLASSIFIED** — classify before any fix | deleting a tone reflects in the schedules that referenced it — __ |
| live-brand-kit | A | 3 | 0 | 0 | 30 | green |  |
| live-country | A | 1 | 2 | 1 | 22 | **UNCLASSIFIED** — classify before any fix | re-saving the same country is a quiet no-op, not a fake relo — __<br>C2 no longer offers an event source it cannot create — __ |
| live-invite-org | A | 3 | 0 | 0 | 38 | green |  |
| live-knowledge | A | 2 | 0 | 1 | 172 | **UNCLASSIFIED** — classify before any fix |  |
| live-media-capabilities | A | 3 | 0 | 0 | 79 | green |  |
| live-media-upload | A | 3 | 0 | 0 | 30 | green |  |
| live-notifications | A | 1 | 0 | 0 | 13 | green |  |
| live-proposals | A | 1 | 4 | 0 | 38 | green | one balanced run — the drafts it produces become the proposa — _402 wallet_insufficient would refuse the balanced run: the org's wallet is $0.00 — the plan is the only funding, and no _<br>after a RELOAD, Today shows the draft from the ledger — _402 wallet_insufficient would refuse the run this ledger read depends on: the org's wallet is $0.00 — the plan is the on_<br>approving records it as posted, and the decision survives a  — _402 wallet_insufficient would refuse the run this approval depends on: the org's wallet is $0.00 — the plan is the only _<br>declining asks why, keeps the row, and is reversible — _402 wallet_insufficient would refuse the second run this decline depends on: the org's wallet is $0.00 — the plan is the_ |
| live-schedule-repair | A | 1 | 1 | 1 | 33 | **UNCLASSIFIED** — classify before any fix | and it survives a reload, still clean — __ |
| live-scheduling | A | 1 | 1 | 1 | 41 | **UNCLASSIFIED** — classify before any fix | slots, if ingestion produced any, honour skip/un-skip and ne — __ |
| live-studio | A | 3 | 1 | 0 | 20 | green | E2 renders for real, and E4 opens the asset it made — _set LIVE_MEDIA=1 to spend on one real render_ |
| live-team | A | 1 | 4 | 1 | 33 | **UNCLASSIFIED** — classify before any fix | change-password keeps this session and only the new password — __<br>inviting a NEW user: coded email, resend rate-limits honestl — __<br>inviting an EXISTING user adds them immediately, and the rol — __<br>an ADMIN viewing a team with an owner: no remove on the owne — __ |
| live-video-duration | A | 2 | 1 | 0 | 20 | green | the valid video body clears validation — and self-skips on 4 — _402 wallet_insufficient: params.durationS cleared validation but the org cannot pay — the render proof is the founder’s _ |
| live-wallet | A | 4 | 0 | 0 | 33 | green |  |

### Round 1 reds

- **live-brand** › sources and topics: scheme-less display, real persistence: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-brand.log`
- **live-country** › the calendar carries real holidays, each with the rules for that day: `TypeError: Cannot read properties of undefined (reading 'length')` — unclassified; log `round-1/live-country.log`
- **live-knowledge** › a FILE uploads straight to storage from the browser (open-item 24): `[31mTest timeout of 150000ms exceeded.[39m` — unclassified; log `round-1/live-knowledge.log`
- **live-schedule-repair** › C1 creates the missing schedule through the POST fallback, with the exact tones picked: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-schedule-repair.log`
- **live-scheduling** › C1 creates the schedule on first save, then PATCHes it — and it survives a reload: `[31mTest timeout of 30000ms exceeded.[39m` — unclassified; log `round-1/live-scheduling.log`
- **live-team** › I1 renames the org through PATCH, and the name survives a reload: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-team.log`

## Verdict

**RED** — 6.4 min end to end. See the rounds above; an UNCLASSIFIED red is classified before any fix.

## The runner log

```
12:59:53Z pnpm gate · series gate-0910 · record Docs\qa\gate-0910\gate\20260910-125952
12:59:53Z keep-awake held (pid 21816)
12:59:53Z build with the round's API base inlined
13:00:17Z built in 24 s
13:00:18Z preview served on 5199 (pid 11660), entry assets/index-Zm_se-OD.js, the API host inlined 1 time(s)
13:00:19Z warm-up: 12-way fleet warm after 1 burst(s) in 0.9 s — slowest 239 ms (a 429 is an answer)
13:00:19Z heartbeat: one probe every 5 s for the round; the files stand down from their own warm-ups
13:00:19Z round 1 lane A: 16 files, 2 in flight
13:00:52Z round 1 lane A live-brand-kit: 3 passed / 0 skipped / 0 failed in 30 s → green
13:01:03Z round 1 lane A live-auth: 7 passed / 0 skipped / 0 failed in 45 s → green
13:01:26Z round 1 lane A live-country: 1 passed / 2 skipped / 1 failed in 22 s → unclassified
13:01:29Z round 1 lane A live-brand: 3 passed / 1 skipped / 1 failed in 36 s → unclassified
13:02:03Z round 1 lane A live-invite-org: 3 passed / 0 skipped / 0 failed in 38 s → green
13:03:23Z round 1 lane A live-media-capabilities: 3 passed / 0 skipped / 0 failed in 79 s → green
13:03:53Z round 1 lane A live-media-upload: 3 passed / 0 skipped / 0 failed in 30 s → green
13:04:05Z round 1 lane A live-notifications: 1 passed / 0 skipped / 0 failed in 13 s → green
13:04:21Z round 1 lane A live-knowledge: 2 passed / 0 skipped / 1 failed in 172 s → unclassified
13:04:44Z round 1 lane A live-proposals: 1 passed / 4 skipped / 0 failed in 38 s → green
13:04:54Z round 1 lane A live-schedule-repair: 1 passed / 1 skipped / 1 failed in 33 s → unclassified
13:05:14Z round 1 lane A live-studio: 3 passed / 1 skipped / 0 failed in 20 s → green
13:05:24Z round 1 lane A live-scheduling: 1 passed / 1 skipped / 1 failed in 41 s → unclassified
13:05:45Z round 1 lane A live-video-duration: 2 passed / 1 skipped / 0 failed in 20 s → green
13:05:47Z round 1 lane A live-team: 1 passed / 4 skipped / 1 failed in 33 s → unclassified
13:06:18Z round 1 lane A live-wallet: 4 passed / 0 skipped / 0 failed in 33 s → green
13:06:18Z round 1 lane A done in 359 s
13:06:18Z round 1 done in 359 s
13:06:18Z preview server stopped
13:06:18Z keep-awake released
```
