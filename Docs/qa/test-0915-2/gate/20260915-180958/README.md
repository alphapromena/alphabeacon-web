# test-0915-2 — `pnpm gate` 20260915-180958

Tree `96e1c25` (hash `614809d3ebca`) · started 2026-09-15T18:09:58.849Z · **21.9 min end to end** · workers 1 · rounds 1 · lanes A,B · unfunded (the nine skip with their reasons) · no paid render · no org pool · verify-once · `E2E_API_ENV=dev` and `assertNotProduction` in front of every live step · the API host redacted to `<api-host>`.

## The static half — the suites once, the seven checks over the report

| Step | Result | Seconds |
| --- | --- | ---: |
| verify:all | PASS | 486 |
| verify:w00 | PASS | 18 |
| verify:w01 | PASS | 3 |
| verify:w02 | PASS | 1 |
| verify:w03 | PASS | 1 |
| verify:w04 | PASS | 1 |
| verify:w05 | PASS | 1 |
| verify:w06 | PASS | 1 |

unit: **829 passed / 0 failed / 74 files**
static e2e: **119 passed / 90 skipped / 0 failed**

## Round 1 — the gate (12.8 min wall)

| File | Lane | Passed | Skipped | Not run | Failed | Seconds | Classification | Skips and not-runs, with their reasons |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| live-auth | A | 7 | 0 | 0 | 0 | 54 | green |  |
| live-auth-401 | A | 4 | 0 | 0 | 0 | 28 | green |  |
| live-billing | B | 0 | 0 | 6 | 1 | 22 | **UNCLASSIFIED** — classify before any fix | the five endpoints answer the shapes the UI is built on — an — _not run, an earlier test in this file failed_<br>/billing renders the plans FROM THE WIRE, Subscribe for the  — _not run, an earlier test in this file failed_<br>the abandoned-checkout return shows the plans plus the note — _not run, an earlier test in this file failed_<br>the success route polls, shows the wire’s status every tick, — _not run, an earlier test in this file failed_<br>a member cannot start checkout: 403 forbidden, and any membe — _not run, an earlier test in this file failed_<br>a generation on the unfunded org is refused with 402, and th — _not run, an earlier test in this file failed_ |
| live-brand | A | 6 | 0 | 0 | 0 | 66 | green |  |
| live-brand-kit | A | 3 | 0 | 0 | 0 | 35 | green |  |
| live-brand-rules | B | 0 | 0 | 4 | 1 | 22 | **UNCLASSIFIED** — classify before any fix | a fresh org has no tones at all, and the screen says what th — _not run, an earlier test in this file failed_<br>a tone keeps its rules, and a PATCH replaces the whole list — _not run, an earlier test in this file failed_<br>the brand voice writes to one row, and an edit does not reor — _not run, an earlier test in this file failed_<br>Preview this tone returns a real sample from the platform — _not run, an earlier test in this file failed_ |
| live-country | A | 4 | 0 | 0 | 0 | 48 | green |  |
| live-create-visual | B | 0 | 3 | 0 | 0 | 1 | skipped-all | a fresh owner + org with its brand set up — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>one run, then Create visual on its result renders ONE image  — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_<br>Today offers the same button on the ledger row, and the Stud — _set LIVE_MEDIA=1 to spend on one generate run and one real visual_ |
| live-generate | B | 0 | 0 | 1 | 1 | 22 | **UNCLASSIFIED** — classify before any fix | one balanced run returns a draft with its tone and its ratio — _not run, an earlier test in this file failed_ |
| live-invite-org | A | 1 | 0 | 1 | 1 | 43 | **UNCLASSIFIED** — classify before any fix | losing membership falls back honestly, and never to a dead s — _not run, an earlier test in this file failed_ |
| live-knowledge | A | 3 | 0 | 0 | 0 | 41 | green |  |
| live-media-capabilities | A | 1 | 0 | 1 | 1 | 42 | **UNCLASSIFIED** — classify before any fix | the Studio grid lists what the catalog grants, by name, with — _not run, an earlier test in this file failed_ |
| live-media-upload | A | 1 | 0 | 1 | 1 | 29 | **UNCLASSIFIED** — classify before any fix | the logo uploads with desc "logo", shows as the logo, stays  — _not run, an earlier test in this file failed_ |
| live-notifications | A | 1 | 0 | 0 | 0 | 12 | green |  |
| live-onboarding | B | 6 | 0 | 0 | 0 | 81 | green |  |
| live-proposals | A | 1 | 4 | 0 | 0 | 50 | green | one balanced run — the drafts it produces become the proposa — _402 wallet_insufficient would refuse the balanced run: the org's wallet is $0.00 — the plan is the only funding, and no _<br>after a RELOAD, Today shows the draft from the ledger — _402 wallet_insufficient would refuse the run this ledger read depends on: the org's wallet is $0.00 — the plan is the on_<br>approving records it as posted, and the decision survives a  — _402 wallet_insufficient would refuse the run this approval depends on: the org's wallet is $0.00 — the plan is the only _<br>declining asks why, keeps the row, and is reversible — _402 wallet_insufficient would refuse the second run this decline depends on: the org's wallet is $0.00 — the plan is the_ |
| live-schedule-repair | A | 3 | 0 | 0 | 0 | 21 | green |  |
| live-scheduling | A | 2 | 1 | 0 | 0 | 29 | green | slots, if ingestion produced any, honour skip/un-skip and ne — _ingestion has not produced slots for this org yet_ |
| live-studio | A | 3 | 1 | 0 | 0 | 23 | green | E2 renders for real, and E4 opens the asset it made — _set LIVE_MEDIA=1 to spend on one real render_ |
| live-team | A | 2 | 0 | 3 | 1 | 46 | **UNCLASSIFIED** — classify before any fix | inviting a NEW user: coded email, resend rate-limits honestl — _not run, an earlier test in this file failed_<br>inviting an EXISTING user adds them immediately, and the rol — _not run, an earlier test in this file failed_<br>an ADMIN viewing a team with an owner: no remove on the owne — _not run, an earlier test in this file failed_ |
| live-video-duration | A | 1 | 0 | 1 | 1 | 15 | **UNCLASSIFIED** — classify before any fix | the valid video body clears validation — and self-skips on 4 — _not run, an earlier test in this file failed_ |
| live-wallet | A | 1 | 0 | 2 | 1 | 39 | **UNCLASSIFIED** — classify before any fix | H3 is a balance and a real usage read-back, in both allowed  — _not run, an earlier test in this file failed_<br>the wallet and usage endpoints answer the shapes the UI is b — _not run, an earlier test in this file failed_ |

### Round 1 reds

- **live-billing** › a fresh owner + org, made through the product: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-billing.log`
- **live-brand-rules** › a fresh owner + org, made through the product: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-brand-rules.log`
- **live-generate** › a fresh owner + org, made through the product: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-generate.log`
- **live-invite-org** › an invited existing user can REACH the inviting workspace, and a reload keeps it: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoContainText[2m([22m[32mexpected[39m[2m)[22m failed` — unclassified; log `round-1/live-invite-org.log`
- **live-media-capabilities** › every granted capability: the document’s example stops at the wallet (402), its trap before it (400) — zero spend: `Error: photoshoot.generate · five referenceImages: {"error":{"code":"bad_request","message":"The media service rejected the request — check the body against the capability's schema","requestId":"8c8bb` — unclassified; log `round-1/live-media-capabilities.log`
- **live-media-upload** › an image upload becomes a WIRE-listed Files row, and Delete removes it from the wire: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-media-upload.log`
- **live-team** › change-password keeps this session and only the new password works after: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoContainText[2m([22m[32mexpected[39m[2m)[22m failed` — unclassified; log `round-1/live-team.log`
- **live-video-duration** › a bad durationS is refused with 400 BEFORE the wallet check — the field is known, a maximum is enforced: `Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m` — unclassified; log `round-1/live-video-duration.log`
- **live-wallet** › the balance chip shows money — and over a zero wallet, the instruction to subscribe: `Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed` — unclassified; log `round-1/live-wallet.log`

## Verdict

**RED** — 21.9 min end to end. See the rounds above; an UNCLASSIFIED red is classified before any fix.

## The runner log

```
18:09:59Z pnpm gate · series test-0915-2 · record Docs\qa\test-0915-2\gate\20260915-180958
18:09:59Z keep-awake held (pid 20560)
18:09:59Z verify:all — the suites once
18:18:05Z verify:all PASS in 486 s
18:18:23Z verify:w00 PASS in 18 s
18:18:26Z verify:w01 PASS in 3 s
18:18:27Z verify:w02 PASS in 1 s
18:18:28Z verify:w03 PASS in 1 s
18:18:29Z verify:w04 PASS in 1 s
18:18:30Z verify:w05 PASS in 1 s
18:18:31Z verify:w06 PASS in 1 s
18:18:31Z build with the round's API base inlined
18:18:56Z built in 26 s
18:18:58Z preview served on 5199 (pid 3356), entry assets/index-Crboq77r.js, the API host inlined 1 time(s)
18:19:02Z warm-up: 12-way fleet warm after 2 burst(s) in 3.9 s — slowest 531 ms (a 429 is an answer)
18:19:02Z heartbeat: one probe every 5 s for the round; the files stand down from their own warm-ups
18:19:02Z round 1 lane A: 17 files, 1 in flight
18:19:56Z round 1 lane A live-auth: 7 passed / 0 skipped / 0 failed in 54 s → green
18:20:24Z round 1 lane A live-auth-401: 4 passed / 0 skipped / 0 failed in 28 s → green
18:20:59Z round 1 lane A live-brand-kit: 3 passed / 0 skipped / 0 failed in 35 s → green
18:22:05Z round 1 lane A live-brand: 6 passed / 0 skipped / 0 failed in 66 s → green
18:22:53Z round 1 lane A live-country: 4 passed / 0 skipped / 0 failed in 48 s → green
18:23:36Z round 1 lane A live-invite-org: 1 passed / 1 skipped / 1 failed in 43 s → unclassified
18:24:17Z round 1 lane A live-knowledge: 3 passed / 0 skipped / 0 failed in 41 s → green
18:24:58Z round 1 lane A live-media-capabilities: 1 passed / 1 skipped / 1 failed in 42 s → unclassified
18:25:28Z round 1 lane A live-media-upload: 1 passed / 1 skipped / 1 failed in 29 s → unclassified
18:25:40Z round 1 lane A live-notifications: 1 passed / 0 skipped / 0 failed in 12 s → green
18:26:30Z round 1 lane A live-proposals: 1 passed / 4 skipped / 0 failed in 50 s → green
18:26:51Z round 1 lane A live-schedule-repair: 3 passed / 0 skipped / 0 failed in 21 s → green
18:27:19Z round 1 lane A live-scheduling: 2 passed / 1 skipped / 0 failed in 29 s → green
18:27:43Z round 1 lane A live-studio: 3 passed / 1 skipped / 0 failed in 23 s → green
18:28:28Z round 1 lane A live-team: 2 passed / 3 skipped / 1 failed in 46 s → unclassified
18:28:43Z round 1 lane A live-video-duration: 1 passed / 1 skipped / 1 failed in 15 s → unclassified
18:29:22Z round 1 lane A live-wallet: 1 passed / 2 skipped / 1 failed in 39 s → unclassified
18:29:22Z round 1 lane A done in 620 s
18:29:22Z round 1 lane B: 5 files, serial
18:29:44Z round 1 lane B live-billing: 0 passed / 6 skipped / 1 failed in 22 s → unclassified
18:30:07Z round 1 lane B live-brand-rules: 0 passed / 4 skipped / 1 failed in 22 s → unclassified
18:30:08Z round 1 lane B live-create-visual: 0 passed / 3 skipped / 0 failed in 1 s → skipped-all
18:30:30Z round 1 lane B live-generate: 0 passed / 1 skipped / 1 failed in 22 s → unclassified
18:31:52Z round 1 lane B live-onboarding: 6 passed / 0 skipped / 0 failed in 81 s → green
18:31:52Z round 1 lane B done in 150 s
18:31:52Z round 1 done in 770 s
18:31:52Z preview server stopped
18:31:52Z keep-awake released
```
