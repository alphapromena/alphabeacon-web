# HSN-0910 — the gate record (2026-09-10)

The gate at the tip of `feat/hsn-0910` (ORDER HSN-0910 §5): unit, the full
static suite, `verify:w00`–`w06`, then the live suite TWICE against the
deployed dev API — round 1 stabilises, round 2 is the gate (the two-round law,
`Docs/api/live-red-2026-08-23.md`). Every log here lives under `Docs/qa/`
because Playwright cleans `test-results/` at the start of every run (state.md
trap 24). The API host is redacted to `<api-host>` in every copy; no token or
password ever reaches a log (the auth exchanges print nothing).

## How the rounds were run

| File               | What it is                                                                                                                                                                                                                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `live-round.sh`    | The round runner: one `live-*.spec.ts` at a time with `--workers=1`, the port drained between files, `E2E_API_ENV=dev` declared (HSN-0910/D — the guard refuses a live run without it), `LIVE_MEDIA` unset, the funded QA org's owner read from the QA-creds store (User-scope env vars) so the generating text specs route to org 1813. |
| `keep-awake.ps1`   | A process-scoped `SetThreadExecutionState(ES_CONTINUOUS \| ES_SYSTEM_REQUIRED)` hold for the round's life (trap 23) — no power setting changed; the flags in decimal because Windows PowerShell 5.1 parses `0x80000000` as a negative int32.                                                                                             |
| `gate-static.log`  | The static half: unit, the bare static suite, `verify:w00`–`w06`, each after a port drain (the restart after the `testMatch` fix — trap 25).                                                                                                                                                                                             |
| `static-solo.log`  | The bare static suite once more, solo, to classify the chain's one red.                                                                                                                                                                                                                                                                  |
| `live-round-1.log` | Round 1, 21 files (09:44Z–10:05Z).                                                                                                                                                                                                                                                                                                       |
| `solo-*.log`       | The recorded supplements to round 1: the two red files solo with the FULL Playwright output (`solo-live-*`), then after each spec fix (`solo-fixed*`). Read them for the error contexts the round runner does not keep.                                                                                                                  |
| `live-round-2.log` | Round 2, the gate.                                                                                                                                                                                                                                                                                                                       |

## The static half

- lint clean · typecheck green · prettier on every new file · guard-static 352 files clean
- unit **633 passed / 55 files** (the table's 29 and the harness guard's 4 among them)
- the full static suite: the chain's bare run 114 + 1 red — the first
  Playwright run straight after vitest, trap 22's fifth-sighting class —
  then **115 passed / 84 skipped / 0 failed** inside every one of the six
  verify runs and again on the solo re-run at 09:42Z; the red did not survive
  one solo run, so it is the harness's
- `verify:w00`–`w06` **all PASS** (09:22Z–09:42Z)
- one real defect the chain found, fixed before the rounds: Playwright's
  default `testMatch` took the guard's vitest file as a spec (trap 25), so the
  first chain failed every verify at its e2e step; `testMatch` is now
  `*.spec.ts` (`2b88b62`)

## Round 1 (09:44Z–10:05Z) — 18 files green, 3 red, all three read

The API was warm on every file (no cold start, no "API cold", no refusal).
Green: auth 7/7, billing 7/7, brand-kit 3/3, brand 5/5, country 4/4,
generate 2/2, invite-org 3/3, knowledge 3/3, media-upload 3/3, notifications
1/1, onboarding 6/6, schedule-repair 3/3, team 6/6, video-duration 3/3,
wallet 4/4; scheduling 2 + 1 skipped and proposals 1 + 4 skipped by design;
create-visual 3 skipped (`LIVE_MEDIA` off).

The reds, classified:

1. **`live-media-capabilities` "the Studio grid lists what the catalog
   grants…" and `live-studio` "E1 is built from the catalog…" — SPEC DEFECTS
   of this series, one cause.** A fresh QA org opens a capability card onto
   the readiness gate (D-ONB-D), never onto the composer, so a composer
   assertion on a fresh org can only fail; both reproduced solo (10:06Z,
   10:07Z). Fixed in `8fed147`: the media spec completes the brand setup
   first, reloads (a signed-in `/login` redirects home before the form
   exists — the first attempt at the fix hung a whole test budget on
   `getByLabel('Work email')`, `solo-fixed2`), asserts the composer's own
   heading, and finds the voice select by role with a prefix (its accessible
   name carries the required marker, so an exact label never matched);
   live-studio E1 asserts the gate itself. Supplements: live-studio 3 + 1
   skipped (10:11Z, `solo-fixed-live-studio.log`), live-media-capabilities
   3/3 (10:20Z, `solo-fixed3-…`).
2. **`live-brand-rules` "Preview this tone returns a real sample from the
   platform" — red after 2.5 min on a surface this series did not touch.**
   Its error context was cleaned by the next file's run, so it is unclassified
   until round 2; if red there, a solo supplement with the full log follows.

## Round 2 — the gate (10:22Z–10:39Z, on `8fed147`) — 20 files green, 1 network-lost, re-run green

Green: auth 7/7, billing 7/7, brand-kit 3/3, **brand-rules 5/5** (round 1's
red did not recur — the API's weather, classified environmental), brand 5/5,
country 4/4, generate 2/2, invite-org 3/3, knowledge 3/3, media-upload 3/3,
notifications 1/1, onboarding 6/6, schedule-repair 3/3, team 6/6,
video-duration 2 + 1 skipped (test 3 self-skips on the expected 402), wallet 4/4, **studio 3 + 1 skipped** and
**live-media-capabilities' grid test green**; scheduling 2 + 1 skipped and
proposals 1 + 4 skipped by design; create-visual 3 skipped (`LIVE_MEDIA` off).
The API was warm on every file; no refusal, no cold start, no wrong-mode
server; the host held awake for the whole round (`keep-awake-2`, durations
match the wall clock).

**The one red:** `live-media-capabilities` "every granted capability: the
document's example stops at the wallet (402), its trap before it (400)" failed
in 4.4 s on `apiRequestContext.put: read ECONNRESET` — the storage bucket
reset the connection of the presigned PUT of the first reference image, before
any body reached our API. Not our API, not the spec, not the product:
**network-lost, and the law says re-run, not waive.** The recorded supplement
at 10:40Z (`solo-round2-live-media-capabilities.log`, full output) is **3/3**
— 13 examples at 402, every trap at 400 (the five-reference photoshoot at 502
as measured), the wallet `{0,0,0}` and the job list empty after, the assets
deleted.

**The gate closes:** static green throughout, verify w00–w06 PASS, round 2
20/21 with the one red judged and cleared by a recorded supplement. Nothing
was deployed; the branch is on origin as the record; `main` and `live` are
untouched. The merge is the founder's word.
