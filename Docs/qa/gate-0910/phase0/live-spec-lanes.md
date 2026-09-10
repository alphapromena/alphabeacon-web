# GATE-0910 Phase 0 §2.1 — the 21 live specs, measured and classified

Durations from the HSN-0910 gate's logs (`Docs/qa/hsn-0910/gate/`, 2026-09-10,
one file at a time, `--workers=1`, a dev server started per file, the API warm);
the classification from the specs' own code (every `e2e/live-*.spec.ts` and
`e2e/live-setup.ts`), read on `main` at `4d98942`. "green s" is the file's
last green duration: round 2 where it was green, the recorded solo supplement
where round 2 was red. **The rule applied for the lane column** (ORDER
GATE-0910 §3.2): lane B = the file spends, writes shared state, or exercises
billing / the wallet / generation on the funded org; lane A = the file mints
its own org(s) and touches nothing outside them. Own-org writes are lane A —
that is the fan-out rule's premise ("each file owns its org").

| file                    | round 2 result       | r1 s | r2 s | green s | org                                                                       | spends                                                                                                          | shared state                                                                                      | writes                                             | lane |
| ----------------------- | -------------------- | ---: | ---: | ------: | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---- |
| live-auth               | 7 passed             |   58 |   50 |      50 | fresh ×2 by its own signup walk, plus one invitee that owns no org        | no                                                                                                              | own orgs only                                                                                     | own org (signups, resend, reset, invite, sign-out) | A    |
| live-billing            | 7 passed             |  129 |  126 |     126 | fresh ×1 (`signUpAndEnter`) plus one member-less account by API           | no balance moves; one Stripe TEST-mode Checkout Session is created and abandoned (never opened)                 | own org; the abandoned Stripe session is an external write outside any org                        | own org (checkout session, invite, brand setup)    | B    |
| live-brand-kit          | 3 passed             |   36 |   37 |      37 | fresh ×1                                                                  | no                                                                                                              | own org (a PDF in the media bucket, deleted in-test)                                              | own org                                            | A    |
| live-brand-rules        | 5 passed (r1: 1 red) |  198 |   65 |      65 | both: tests 1–4 fresh; test 5 signs in as the FUNDED org's owner          | YES — test 5 "Preview this tone" is a paid run on org 1813's wallet (`skipUnlessFunded`)                        | org 1813: `ensureFundedBrand` re-saves the "Roastery floor" tone language every run; wallet debit | shared (test 5) + own org (tests 3–4)              | B    |
| live-brand              | 5 passed             |   54 |   55 |      55 | fresh ×1                                                                  | no                                                                                                              | own org                                                                                           | own org (tone, voice, source, topic, a schedule)   | A    |
| live-country            | 4 passed             |   54 |   53 |      53 | fresh ×1                                                                  | no wallet movement; two metered `holidays.lookup` calls (10–15 s each), which live-wallet proves spend nothing  | own org                                                                                           | own org (country ×2)                               | A    |
| live-create-visual      | 3 skipped            |   10 |    6 |       6 | both under `LIVE_MEDIA=1`: test 1 fresh, test 2 on org 1813, test 3 fresh | YES under `LIVE_MEDIA=1` — one text run + one image render on org 1813's wallet; skips entirely without it      | org 1813 (a run, a media job, the tone re-save); wallet debit                                     | shared (test 2) + own org                          | B    |
| live-generate           | 2 passed             |   99 |   66 |      66 | both: test 1 fresh; test 2 on org 1813                                    | YES — test 2 is one balanced text run on org 1813's wallet                                                      | org 1813 (a run + proposal; the tone-language PATCH); wallet debit                                | shared (test 2) + own org                          | B    |
| live-invite-org         | 3 passed             |   46 |   45 |      45 | fresh ×2                                                                  | no                                                                                                              | own orgs                                                                                          | own org (invite, member delete by API)             | A    |
| live-knowledge          | 3 passed             |   51 |   46 |      46 | fresh ×1                                                                  | no balance asserted; one paste + one file go through RAG ingestion (never called billable)                      | own org (one file stays in the RAG bucket)                                                        | own org                                            | A    |
| live-media-capabilities | 1 red (network-lost) |   72 |   23 |      85 | fresh ×1; never switches                                                  | no — every valid body stops at 402, every trap at 400 (the five-reference one at 502), wallet `{0,0,0}` after   | own org (2 PNGs + 1 mp4 stub, deleted in-test)                                                    | own org (~30 `POST /media/jobs`, all refused)      | A    |
| live-media-upload       | 3 passed             |   40 |   38 |      38 | fresh ×1                                                                  | no                                                                                                              | own org (a Knowledge image + the org logo, removed in-test)                                       | own org                                            | A    |
| live-notifications      | 1 passed             |   19 |   24 |      24 | fresh ×1                                                                  | no                                                                                                              | own org                                                                                           | own org (`read-all` ×2, a no-op inbox)             | A    |
| live-onboarding         | 6 passed             |   71 |   82 |      82 | both: tests 1–5 fresh; test 6 on org 1813                                 | YES — test 6 is one balanced text run on org 1813's wallet                                                      | org 1813 (a run + proposal; the tone-language PATCH); wallet debit                                | shared (test 6) + own org                          | B    |
| live-proposals          | 1 passed + 4 skipped |   46 |   48 |      48 | fresh ×1; never the funded org by design                                  | none in practice — tests 2–5 skip on a $0 wallet (a fresh org is always $0 since BIL-0902)                      | own org                                                                                           | own org (test 1's brand setup)                     | A    |
| live-schedule-repair    | 3 passed             |   33 |   28 |      28 | fresh ×1 by direct API calls (`POST /orgs`)                               | no                                                                                                              | own org                                                                                           | own org (3 preset tones, a schedule)               | A    |
| live-scheduling         | 2 passed + 1 skipped |   31 |   33 |      33 | fresh ×1                                                                  | no                                                                                                              | own org                                                                                           | own org (tone, schedule POST/PATCH)                | A    |
| live-studio             | 3 passed + 1 skipped |   64 |   30 |      43 | fresh ×1; never switches                                                  | no; under `LIVE_MEDIA=1` test 4 would submit one render on its own $0 org, which can only reach the gate or 402 | own org                                                                                           | reads (tests 2–3); own-org job under `LIVE_MEDIA`  | A    |
| live-team               | 6 passed             |   95 |   98 |      98 | fresh ×2 plus one invitee                                                 | no                                                                                                              | own orgs                                                                                          | own org (rename, password, invites, roles, remove) | A    |
| live-video-duration     | 2 passed + 1 skipped |   26 |   34 |      34 | fresh ×1; never the funded org                                            | no — the valid body stops at 402 (test 3 self-skips on it), wallet still 0 and `jobs: []`                       | own org                                                                                           | own org (3 refused `POST /media/jobs`)             | A    |
| live-wallet             | 4 passed             |   42 |   42 |      42 | fresh ×1                                                                  | no — one metered `holidays.lookup`, the wallet asserted `{0,0,0}` after it                                      | own org                                                                                           | own org (country, test 1); reads (tests 2–4)       | B\*  |

\* live-wallet is in lane B only by the rule's word "wallet": it reads its own
fresh org's wallet and usage and touches nothing shared. It is the first
candidate to move to lane A on the founder's word; live-billing (no balance
moves, but a real Stripe test-mode session per run) is the second.

## The arithmetic (round 2's durations, the green solo where round 2 was red)

| Lane                                       | Files | Serial sum | Projected                                                          |
| ------------------------------------------ | ----: | ---------: | ------------------------------------------------------------------ |
| A, parallel                                |    15 |      717 s | 4 workers: 3.0 min ideal, floor 98 s (live-team); expect 3.5–5 min |
| B, serial                                  |     6 |      387 s | 6.5 min (3.7 min if wallet and billing move to A)                  |
| Round today, serial, a dev server per file |    21 |     1029 s | 17.2 min measured (round 2)                                        |
| Round projected                            |    21 |            | **~10–11 min** (~9 with the move), warm-up included                |

Two rounds ≈ 21 min (≈ 18 with the move). The static half once — lint,
typecheck, guard-static, unit (21 s), build (`tsc -b` + 11 s of vite), the
static suite (99 s) — ≈ 3.5 min, the seven w-checks seconds. **End to end
≈ 25 min against today's ≈ 60** (the static chain 21 min, two rounds 38.5).
One server per round also removes the per-file dev-server start that sits
inside every file's seconds today.

## What a parallel lane A has to respect (from the specs' own code)

1. **`RUN = Date.now()` names the QA emails**, and the suffixes repeat across
   files (`a`/`b`/`c` in live-auth, live-brand, live-country; `r` in
   live-brand-rules and live-schedule-repair; `s` in live-scheduling and
   live-studio; `o` in live-onboarding and live-team). Serial today, that can
   never collide; four files loading in the same millisecond can. The build
   salts `RUN` per file.
2. **The send limit is counted on** by live-auth (test 2) and live-team
   (test 4): an immediate resend must answer 429. Documented as per
   email + purpose (60 s between sends, 5 per hour) — parallel-safe if that
   is really per email; an IP-level limit would cross-talk. §3.2's 3/4/6
   measurement is the proof.
3. **Short waits below the live rungs** — a 15 s Dashboard wait in
   live-notifications and live-scheduling, 20–25 s waits in
   live-schedule-repair, a fixed 1.5 s in live-brand and 2 s in
   live-onboarding — are where a loaded API first shows as a red. Classify
   before touching them.
4. **The funded org is one resource.** live-brand-rules, live-generate,
   live-onboarding and live-create-visual each re-save the same tone through
   `ensureFundedBrand`; two at once can create a duplicate "Roastery floor"
   and break the next file's strict-mode locator. Lane B stays serial for
   exactly this.
5. **Nine tests are dormant as written** since fresh orgs stopped being
   funded (BIL-0902): live-proposals 2–5, live-scheduling 3, live-studio 4,
   live-create-visual 3. Item 60.
6. **Two files skip `live-setup`'s guard** by not using `signUpAndEnter`
   (live-auth, live-schedule-repair); the global setup's `assertNotProduction`
   still covers every Playwright invocation, so nothing is unguarded.
