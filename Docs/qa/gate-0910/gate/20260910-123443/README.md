# gate-0910 — `pnpm gate` 20260910-123443

Tree `a3755d3` (hash `cbed54777daa`) · started 2026-09-10T12:34:43.797Z · **13.4 min end to end** · workers 3 · rounds 1 · lanes A · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

_skipped (--skip-static)_

## Round 1 — the gate (9.3 min wall)

| File | Lane | Passed | Skipped | Failed | Seconds | Classification | Skips, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| live-auth | A | 3 | 3 | 1 | 101 | **UNCLASSIFIED** — classify before any fix | the shell appears; sign out and logout-all both really revok — __<br>a new user accepts an invite through the documented deep lin — __<br>a token-carrying 401 purges the session and lands on login w — __ |
| live-brand | A | 5 | 0 | 0 | 55 | green |  |
| live-brand-kit | A | 2 | 0 | 1 | 66 | **UNCLASSIFIED** — classify before any fix |  |
| live-country | A | 0 | 3 | 1 | 188 | **UNCLASSIFIED** — classify before any fix | the calendar carries real holidays, each with the rules for  — __<br>re-saving the same country is a quiet no-op, not a fake relo — __<br>C2 no longer offers an event source it cannot create — __ |
| live-invite-org | A | 3 | 0 | 0 | 45 | green |  |
| live-knowledge | A | 0 | 0 | 0 | 91 | network-lost, re-run 3/3 |  |
| live-media-capabilities | A | 0 | 2 | 1 | 133 | **UNCLASSIFIED** — classify before any fix | every granted capability: the document’s example stops at th — __<br>the Studio grid lists what the catalog grants, by name, with — __ |
| live-media-upload | A | 3 | 0 | 0 | 55 | green |  |
| live-notifications | A | 0 | 0 | 0 | 91 | network-lost, re-run 3/3 |  |
| live-proposals | A | 0 | 4 | 1 | 274 | **UNCLASSIFIED** — classify before any fix | one balanced run — the drafts it produces become the proposa — __<br>after a RELOAD, Today shows the draft from the ledger — __<br>approving records it as posted, and the decision survives a  — __<br>declining asks why, keeps the row, and is reversible — __ |
| live-schedule-repair | A | 0 | 0 | 0 | 91 | **UNCLASSIFIED** — classify before any fix |  |
| live-scheduling | A | 1 | 1 | 1 | 91 | **UNCLASSIFIED** — classify before any fix | slots, if ingestion produced any, honour skip/un-skip and ne — __ |
| live-studio | A | 3 | 1 | 0 | 93 | green | E2 renders for real, and E4 opens the asset it made — _set LIVE_MEDIA=1 to spend on one real render_ |
| live-team | A | 1 | 4 | 1 | 70 | **UNCLASSIFIED** — classify before any fix | change-password keeps this session and only the new password — __<br>inviting a NEW user: coded email, resend rate-limits honestl — __<br>inviting an EXISTING user adds them immediately, and the rol — __<br>an ADMIN viewing a team with an owner: no remove on the owne — __ |
| live-video-duration | A | 2 | 1 | 0 | 59 | green | the valid video body clears validation — and self-skips on 4 — _402 wallet_insufficient: params.durationS cleared validation but the org cannot pay — the render proof is the founder’s _ |
| live-wallet | A | 4 | 0 | 0 | 70 | green |  |

### Round 1 reds

- **live-auth** › forgot â†’ reset via the documented deep link revokes everything; only the new password works: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-auth.log`
- **live-brand-kit** › browser truth: the Brand kit type sends a PDF from Chromium with nothing typed, it lists, and Delete removes it: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-brand-kit.log`
- **live-country** › a fresh workspace has NO country, and I1 is where one is set: `[31mTest timeout of 180000ms exceeded.[39m` — unclassified; log `round-1/live-country.log`
- **live-media-capabilities** › a fresh owner + org, made through the product: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-media-capabilities.log`
- **live-proposals** › a fresh owner + org, with its brand set up: `[31mTest timeout of 240000ms exceeded.[39m` — unclassified; log `round-1/live-proposals.log`
- **live-scheduling** › C1 creates the schedule on first save, then PATCHes it — and it survives a reload: `[31mTest timeout of 30000ms exceeded.[39m` — unclassified; log `round-1/live-scheduling.log`
- **live-team** › I1 renames the org through PATCH, and the name survives a reload: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveValue[2m([22m[32mexpected[39m[2m)[22m failed` — unclassified; log `round-1/live-team.log`

## Verdict

**RED** — 13.4 min end to end. See the rounds above; an UNCLASSIFIED red is classified before any fix.

## The runner log

```
12:34:44Z pnpm gate · series gate-0910 · record Docs\qa\gate-0910\gate\20260910-123443
12:34:44Z keep-awake held (pid 22352)
12:34:44Z build with the round's API base inlined
12:35:08Z built in 24 s
12:35:09Z preview served on 5199 (pid 31620), entry assets/index-Zm_se-OD.js, the API host inlined 1 time(s)
12:35:09Z API answers /health 200 in 308 ms (a 429 is an answer)
12:35:09Z round 1 lane A: 16 files, 3 in flight
12:36:05Z round 1 lane A live-brand: 5 passed / 0 skipped / 0 failed in 55 s → green
12:36:16Z round 1 lane A live-brand-kit: 2 passed / 0 skipped / 1 failed in 66 s → unclassified
12:36:50Z round 1 lane A live-auth: 3 passed / 3 skipped / 1 failed in 101 s → unclassified
12:37:01Z round 1 lane A live-invite-org: 3 passed / 0 skipped / 0 failed in 45 s → green
12:38:22Z round 1 lane A live-knowledge: 0 passed / 0 skipped / 0 failed in 91 s → network-lost
12:39:14Z round 1 lane A live-country: 0 passed / 3 skipped / 1 failed in 188 s → unclassified
12:39:14Z round 1 lane A live-media-capabilities: 0 passed / 2 skipped / 1 failed in 133 s → unclassified
12:39:16Z round 1 lane A live-media-upload: 3 passed / 0 skipped / 0 failed in 55 s → green
12:40:45Z round 1 lane A live-notifications: 0 passed / 0 skipped / 0 failed in 91 s → network-lost
12:40:48Z round 1 lane A live-schedule-repair: 0 passed / 0 skipped / 0 failed in 91 s → network-lost
12:42:16Z round 1 lane A live-scheduling: 1 passed / 1 skipped / 1 failed in 91 s → unclassified
12:42:20Z round 1 lane A live-studio: 3 passed / 1 skipped / 0 failed in 93 s → green
12:43:19Z round 1 lane A live-video-duration: 2 passed / 1 skipped / 0 failed in 59 s → green
12:43:26Z round 1 lane A live-team: 1 passed / 4 skipped / 1 failed in 70 s → unclassified
12:43:47Z round 1 lane A live-proposals: 0 passed / 4 skipped / 1 failed in 274 s → unclassified
12:44:29Z round 1 lane A live-wallet: 4 passed / 0 skipped / 0 failed in 70 s → green
12:44:29Z round 1 lane A done in 560 s
12:45:24Z round 1 lane A live-knowledge-rerun1: 3 passed / 0 skipped / 0 failed in 55 s → green
12:46:04Z round 1 lane A live-knowledge-rerun2: 3 passed / 0 skipped / 0 failed in 40 s → green
12:46:41Z round 1 lane A live-knowledge-rerun3: 3 passed / 0 skipped / 0 failed in 37 s → green
12:46:57Z round 1 lane A live-notifications-rerun1: 1 passed / 0 skipped / 0 failed in 16 s → green
12:47:18Z round 1 lane A live-notifications-rerun2: 1 passed / 0 skipped / 0 failed in 21 s → green
12:47:32Z round 1 lane A live-notifications-rerun3: 1 passed / 0 skipped / 0 failed in 14 s → green
12:48:07Z round 1 lane A live-schedule-repair-rerun1: 1 passed / 1 skipped / 1 failed in 36 s → unclassified
12:48:07Z round 1 done in 778 s
12:48:08Z preview server stopped
12:48:08Z keep-awake released
```
