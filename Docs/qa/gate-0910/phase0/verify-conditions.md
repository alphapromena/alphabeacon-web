# GATE-0910 Phase 0 §2.2 — what `verify:w00`–`w06` actually prove, and how

Read from `scripts/verify-w00.ts` … `verify-w06.ts` on `main` at `4d98942`,
2026-09-10. Three kinds of condition live in every script; only the first
kind is duplicated across the seven.

## A. The suite runs — identical in all seven scripts

Every script spawns the same six steps, in this order, before its own checks:

| Step         | Command                                                                                          | Measured 2026-09-10 (the gate's chain) |
| ------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------- |
| lint         | `pnpm lint`                                                                                      | seconds                                |
| typecheck    | `pnpm typecheck` (`tsc -b`)                                                                      | seconds                                |
| unit tests   | `pnpm test` (vitest, 633 tests / 55 files)                                                       | ~21 s                                  |
| guard-static | `pnpm guard:static` (352 files)                                                                  | seconds                                |
| build        | `pnpm build` (`tsc -b && vite build`)                                                            | ~1 min                                 |
| e2e          | `pnpm exec playwright install chromium` + `pnpm e2e` (the static suite, 115 passed / 84 skipped) | ~1.6 min                               |

`--skip-e2e` is honoured locally and ignored in CI. Per script the six steps
took **152–202 s**; the seven together **19.0 min** (09:22:59Z → 09:42:01Z)
on a tree that did not change between them — the same 633 + 115 tests and
the same build, seven times. This is the whole of the duplication §3.1
removes: run once, write the reports (unit JSON, Playwright JSON, the guard
output, the `dist/` tree hash), and let each w-script assert over them.

What each script's e2e step is _named_ (the fact it wants from the suite):
w00 the static suite green; w01 "the kitchen-sink axe run (light + dark) and
the reduced-motion assertion"; w02 "@golden walk, marketing + auth axe";
w03 "@golden approve walk, queue axe"; w04 "calendar, connections, axe";
w05 "studio, billing, axe"; w06 "compose, analytics, settings, axe". All of
these are facts a Playwright JSON report carries (which tests ran, which
passed, by title and tag) — none needs a second run.

## B. The scripts' own assertions — over the tree and its artifacts, kept as they are

These read the source tree, the data modules and the deliverables with
`readFileSync`, or invoke one tool on one planted file; each takes seconds
and none re-runs a suite. They stay in their scripts.

| Script | Own assertions (function names in the script)                                                                                                                                                                                                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| w00    | `checkShadcnConfig` (components.json + the committed skill); `canaryGuardStatic` (a planted `fetch` must fail `guard:static` — one tool run on one file); `canaryRawColor` (a planted raw color must fail lint)                                                                                                           |
| w01    | `canaryRawColorInAb` (a raw color under `ab/` fails lint); `checkDeliverables` (the W1 compositions exist)                                                                                                                                                                                                                |
| w02    | `capIsDeclaredOnce`; `marketingLawsHold` (the long structural check: marketing owns its data, the visitor world's routes and states); `productionBootsVisitor`; `deliverablesExist`                                                                                                                                       |
| w03    | `approvalGateIsStructural` (media entry points absent pre-approval, in source); `e2eNavigationRuleHolds`; `deliverablesExist`                                                                                                                                                                                             |
| w04    | `syncingIsStructural` ("Syncing…" never shows a stale zero); `deliverablesExist`; `e2eNavigationRuleHolds`                                                                                                                                                                                                                |
| w05    | `composerIsShared`; `paramsFormIsGenerated`; `balanceIsComputed` (the ledger sums, never a literal); `pastDueGatesProductWide`; `e2eNavigationRuleHolds`; `deliverablesExist`                                                                                                                                             |
| w06    | `toneEditorIsShared`; `readinessGateIsOneSelector`; `customToneRendersTheSameEverywhere`; `analyticsNeverInventsANumber`; `generateReusesTheQueuesCard`; `composeIsScriptDriven`; `settingsShareOneSaveBar`; `focusRulesHold`; `timesAreHonestAboutZones`; `noStubsRemain`; `e2eNavigationRuleHolds`; `deliverablesExist` |

33 assertions in all. Two of w00's and one of w01's are canaries that run a
tool on a planted file (guard-static, eslint) — tool invocations, not suite
runs; they stay.

## C. The manual checklists — human judgement, printed, kept

Each script ends by printing its MANUAL list from `web-plan.md`, plus the
items carried forward from earlier weeks; none is executed by the script.

| Script | Manual items (verbatim intent)                                                                                                                              |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| w00    | a canary PR is blocked by every check (needs the GitHub repo); the staging URL serves the shell (needs AWS + the domain/cert)                               |
| w01    | the visual pass of `/dev/kitchen-sink` in light + dark against `design.md`; the keyboard-only walk of the shell on a real screen reader                     |
| w02    | read the visitor world as a prospect; walk the wizard at phone width; the seam at "Get started"; scroll the homepage at 1440 and 390 with reduced motion on |
| w03    | approve → generate media → schedule as one continuous tool; the queue on a phone; carried forward: W1, W2                                                   |
| w04    | the month grid at 360px; the timezone switch as the audience sees it; carried forward: W1–W3                                                                |
| w05    | D4 and E2 back to back; the credits ledger read as a charge query; carried forward: W1–W4                                                                   |
| w06    | watch a compose run at full length; read G1 as someone who did not publish; walk Settings by keyboard, tab by tab; carried forward: W1–W5                   |

## The answer to §2.2

Both kinds stay; only the re-running goes. Under §3.1, `verify:all` runs
section A once and writes the reports and the tree hash; each `verify:wNN`
becomes: (1) assert the reports exist for the current tree hash and carry
the facts it names (its e2e step's tests present and passed, the unit
report at zero failures, the guard output clean, the build present),
(2) run its own section-B assertions unchanged, (3) print its section-C
list unchanged. The rule for the record: **a verify never re-runs a suite
that already ran on the same tree hash.**
