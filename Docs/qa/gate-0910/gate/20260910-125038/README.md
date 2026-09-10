# gate-0910 — `pnpm gate` 20260910-125038

Tree `6c10e04` (hash `0295ffcb2894`) · started 2026-09-10T12:50:38.537Z · **7.7 min end to end** · workers 3 · rounds 1 · lanes A · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

_skipped (--skip-static)_

## Round 1 — the gate (7.3 min wall)

| File | Lane | Passed | Skipped | Failed | Seconds | Classification | Skips, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| live-auth | A | 7 | 0 | 0 | 44 | green |  |
| live-brand | A | 0 | 4 | 1 | 66 | **UNCLASSIFIED** — classify before any fix | a custom tone: created under the adapter, edited, and it sur — __<br>voice rules: the flat live list persists through the API — __<br>sources and topics: scheme-less display, real persistence — __<br>deleting a tone reflects in the schedules that referenced it — __ |
| live-brand-kit | A | 3 | 0 | 0 | 28 | green |  |
| live-country | A | 0 | 3 | 1 | 183 | **UNCLASSIFIED** — classify before any fix | the calendar carries real holidays, each with the rules for  — __<br>re-saving the same country is a quiet no-op, not a fake relo — __<br>C2 no longer offers an event source it cannot create — __ |
| live-invite-org | A | 3 | 0 | 0 | 39 | green |  |
| live-knowledge | A | 3 | 0 | 0 | 39 | green |  |
| live-media-capabilities | A | 2 | 0 | 1 | 353 | **UNCLASSIFIED** — classify before any fix |  |
| live-media-upload | A | 3 | 0 | 0 | 30 | green |  |
| live-notifications | A | 0 | 0 | 1 | 8 | **UNCLASSIFIED** — classify before any fix |  |
| live-proposals | A | 1 | 4 | 0 | 38 | green | one balanced run — the drafts it produces become the proposa — _402 wallet_insufficient would refuse the balanced run: the org's wallet is $0.00 — the plan is the only funding, and no _<br>after a RELOAD, Today shows the draft from the ledger — _402 wallet_insufficient would refuse the run this ledger read depends on: the org's wallet is $0.00 — the plan is the on_<br>approving records it as posted, and the decision survives a  — _402 wallet_insufficient would refuse the run this approval depends on: the org's wallet is $0.00 — the plan is the only _<br>declining asks why, keeps the row, and is reversible — _402 wallet_insufficient would refuse the second run this decline depends on: the org's wallet is $0.00 — the plan is the_ |
| live-schedule-repair | A | 1 | 1 | 1 | 35 | **UNCLASSIFIED** — classify before any fix | and it survives a reload, still clean — __ |
| live-scheduling | A | 1 | 1 | 1 | 41 | **UNCLASSIFIED** — classify before any fix | slots, if ingestion produced any, honour skip/un-skip and ne — __ |
| live-studio | A | 3 | 1 | 0 | 20 | green | E2 renders for real, and E4 opens the asset it made — _set LIVE_MEDIA=1 to spend on one real render_ |
| live-team | A | 1 | 4 | 1 | 32 | **UNCLASSIFIED** — classify before any fix | change-password keeps this session and only the new password — __<br>inviting a NEW user: coded email, resend rate-limits honestl — __<br>inviting an EXISTING user adds them immediately, and the rol — __<br>an ADMIN viewing a team with an owner: no remove on the owne — __ |
| live-video-duration | A | 2 | 1 | 0 | 19 | green | the valid video body clears validation — and self-skips on 4 — _402 wallet_insufficient: params.durationS cleared validation but the org cannot pay — the render proof is the founder’s _ |
| live-wallet | A | 4 | 0 | 0 | 33 | green |  |

### Round 1 reds

- **live-brand** › a fresh owner + org, made through the product: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-brand.log`
- **live-country** › a fresh workspace has NO country, and I1 is where one is set: `[31mTest timeout of 180000ms exceeded.[39m` — unclassified; log `round-1/live-country.log`
- **live-media-capabilities** › the Studio grid lists what the catalog grants, by name, with the catalog’s price: `[31mTest timeout of 300000ms exceeded.[39m` — unclassified; log `round-1/live-media-capabilities.log`
- **live-notifications** › the inbox endpoints hold their contract, and the bell tells the truth: `Error: GET /me/orgs → 429 {"Reason":"ConcurrentInvocationLimitExceeded","Type":"User","message":"Rate Exceeded."}` — unclassified; log `round-1/live-notifications.log`
- **live-schedule-repair** › C1 creates the missing schedule through the POST fallback, with the exact tones picked: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-schedule-repair.log`
- **live-scheduling** › C1 creates the schedule on first save, then PATCHes it — and it survives a reload: `[31mTest timeout of 30000ms exceeded.[39m` — unclassified; log `round-1/live-scheduling.log`
- **live-team** › I1 renames the org through PATCH, and the name survives a reload: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-team.log`

## Verdict

**RED** — 7.7 min end to end. See the rounds above; an UNCLASSIFIED red is classified before any fix.

## The runner log

```
12:50:39Z pnpm gate · series gate-0910 · record Docs\qa\gate-0910\gate\20260910-125038
12:50:39Z keep-awake held (pid 33168)
12:50:39Z build with the round's API base inlined
12:51:03Z built in 24 s
12:51:04Z preview served on 5199 (pid 34160), entry assets/index-Zm_se-OD.js, the API host inlined 1 time(s)
12:51:05Z warm-up: 12-way fleet warm after 1 burst(s) in 0.9 s — slowest 246 ms (a 429 is an answer)
12:51:05Z heartbeat: 4 probes every 5 s for the round; the files stand down from their own warm-ups
12:51:05Z round 1 lane A: 16 files, 3 in flight
12:51:36Z round 1 lane A live-brand-kit: 3 passed / 0 skipped / 0 failed in 28 s → green
12:51:49Z round 1 lane A live-auth: 7 passed / 0 skipped / 0 failed in 44 s → green
12:52:19Z round 1 lane A live-brand: 0 passed / 4 skipped / 1 failed in 66 s → unclassified
12:52:28Z round 1 lane A live-invite-org: 3 passed / 0 skipped / 0 failed in 39 s → green
12:52:58Z round 1 lane A live-knowledge: 3 passed / 0 skipped / 0 failed in 39 s → green
12:53:28Z round 1 lane A live-media-upload: 3 passed / 0 skipped / 0 failed in 30 s → green
12:53:36Z round 1 lane A live-notifications: 0 passed / 0 skipped / 1 failed in 8 s → unclassified
12:54:14Z round 1 lane A live-proposals: 1 passed / 4 skipped / 0 failed in 38 s → green
12:54:39Z round 1 lane A live-country: 0 passed / 3 skipped / 1 failed in 183 s → unclassified
12:54:49Z round 1 lane A live-schedule-repair: 1 passed / 1 skipped / 1 failed in 35 s → unclassified
12:55:09Z round 1 lane A live-studio: 3 passed / 1 skipped / 0 failed in 20 s → green
12:55:21Z round 1 lane A live-scheduling: 1 passed / 1 skipped / 1 failed in 41 s → unclassified
12:55:40Z round 1 lane A live-video-duration: 2 passed / 1 skipped / 0 failed in 19 s → green
12:55:42Z round 1 lane A live-team: 1 passed / 4 skipped / 1 failed in 32 s → unclassified
12:56:12Z round 1 lane A live-wallet: 4 passed / 0 skipped / 0 failed in 33 s → green
12:58:22Z round 1 lane A live-media-capabilities: 2 passed / 0 skipped / 1 failed in 353 s → unclassified
12:58:22Z round 1 lane A done in 437 s
12:58:22Z round 1 done in 437 s
12:58:22Z preview server stopped
12:58:22Z keep-awake released
```
