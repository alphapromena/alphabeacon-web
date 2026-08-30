# Current state — read this first

A snapshot of where the build actually stands, so a new session can start
without reconstructing it from the session log. **Update this file at the end
of any turn that finishes a phase or changes the plan.** `sessions.md` is the
chronological record; this is the current picture.

_Last updated: 2026-08-30, after **ORDER HSN-01** — item 1 of the
contract-alignment series from the founder's 2026-08-28 sync with Hasan
(AlphaStudio upstream owner). The Generate page's "drafts per tone" option is
**DELETED** — control, state, copy, plumbing — and the generate body no longer
carries `options.perTone` (the emptied `options` wrapper went with it). Probed
before built: the body without the field answered **202** (fresh QA org 1364,
request `ce257b64-e5e1-4b3a-a00f-74144dc9388a`). Hasan's reference envelope for
the generate body is recorded verbatim at the end of
`Docs/api/alphastudio-shapes.md`; every OTHER divergence from it (tone
`length`, our per-tone `language`/`example`, plan vocabulary) is reported in
the session entry and deliberately unchanged — later HSN orders converge on it
step by step. On branch **`feat/hsn-01-generate`** (off `main` = `289cad5`),
**pushed, NOT merged — every merge waits on founder review**, and later HSN
orders stack on this branch. Before that, same day: the
**ONBOARDING REDESIGN WAS MERGED AND
SHIPPED** on the founder's explicit approval (eye-pass passed). `main`
fast-forwarded `fd84173` → **`963c9f7`**, fourteen commits, **no merge commit —
one linear history**, and pushed with `main:live`. **`1.malaky.ai` serves it**:
the entry hash moved `index-Cel1CcpM.js` → `index-CDsww8Wq.js`, the wizard's
route chunk does not exist in the deployed bundle, every wizard string is gone
and every ONB-0827 catalogue string is present. An 11/11 scripted smoke walked
the real site — fresh signup → verify → **lands in the app with no wizard** →
generation gated with the checklist naming all four. Before that: **ORDER
ONB-0827-B**: the founder accepted the
static-readiness deviation (**D-ONB-E**), ruled that open-item 38 be fixed
before any merge, and **approved PUSHING the branches** — which is done, five
of them, `main` and `live` untouched. `feat/onb-04-invite-org` stacks on the
ONB-0827 tip and closes 38 (**D-ONB-F**): a session opens in the org it
REMEMBERS rather than blindly `orgs[0]`, accepting an invite lands in the org
that invited you, a lost membership falls back with a sentence rather than a
dead screen, and the rail's workspace footer becomes the switcher screens4.md
§0.4 has always specified. **Still not merged — the merge waits on the
founder's eye-pass.** Before that: **ORDER ONB-0827 — Hasan's onboarding
ruling** was BUILT on a three-branch stack off `main` (`fd84173`):
`feat/onb-01-tones` -> `feat/onb-02-entry` -> `feat/onb-03-gate`. **Branch
only: not merged, not pushed — it waits on founder review.** The wizard is
DELETED, a fresh live org starts with ZERO tones, and nothing generates until
the org's brand setup is complete. A Phase-0 probe settled the gate's shape on
the wire before it was designed (decisions.md, 2026-08-28): an org holding only
the four brand entities generated fine with no country and no schedule
(request `60c06fd5-...`), and an org with no tones was refused with an
unusable 400 (`ae30783f-...`) — so the hard gate is the four, and the country
and the posting rhythm are checklist items rather than blockers. Decisions
D-ONB-A..C, with **D-ONB-D recorded as PENDING**. Before that: 2026-08-24,
after the **M2 design cycle was MERGED to `main`**
on the founder's explicit approval — the visitor world is now Abdullah's
concept-v2 port with the corrected palette, fast-forwarded to `039adfb` and
pushed with `main:live`. Before that, the same day: **D-M2-F-r2** — Abdullah
delegated the call
on the four AA deviations, the founder ruled that accessibility wins with the
design spirit preserved, and the corrected palette shipped: the four fixes
re-applied, the Memory reveal changed to slide without fading, a `Superseded`
badge carrying what `--c-text-4` used to say by colour alone, and **every
allowlist deleted**. The branch is merge-ready and waits only on the founder's
word. Before that: 2026-08-24, when this branch took **`main`** — which now
carries the **live-suite warm-up** (`fix/live-suite-warmup`): a warm-up +
heartbeat in `e2e/global-setup.ts`, the trap-22 mode guard, the three derived
rungs in `e2e/live-clocks.ts` across five spec files, and the two-round
operating rule. That is why the live reds recorded against M2 on 2026-08-23 are
gone: they were `main`'s, not this branch's. Before that: 2026-08-23, **M2**
(`design/m2-concept-v2`) — the visitor world replaced with Abdullah's
concept-v2 prototype, ported. **Branch only: not merged; pushed for review.**
Before that: 2026-08-20, after the **E2E-0820 triage** branch
(`fix/e2e-0820`) — the founder's live in-app E2E on `1.malaky.ai` against org
619; eight frontend fixes plus two root-cause probes, then **B9** — the
stranded schedule draft, and a live org no longer wearing the demo's schedule.
**Merged to `main` as a fast-forward and pushed (with `main:live`) on the
founder's explicit approval, 2026-08-20.** Before that: 2026-08-19, after **INT-12** (`int/12-proposals`) — Today is the
proposals ledger, so the review queue survives a reload and a change of device.
INT-11 put the Studio and Knowledge on the live platform; INT-10 made F1 real; INT-9
put money on screen; INT-6 landed the
contract and the observed shapes; INT-7 put brand rules on the wire; INT-8 made
the org country the single holiday control — all of it merged to `main` and
pushed 2026-08-19._

---

## In one paragraph

`alphabeacon-web` is a static-first React SPA — every screen in
`screens4.md`, rendered from typed data committed under `src/data/` —
integrating with the **live AlphaStudio API** (contract: `Docs/api/api.md`,
refreshed 2026-08-17 to 62 paths; `Docs/api/changelog.md` is the per-change
record and `Docs/api/alphastudio-shapes.md` is the observed proxy truth).
**The product is now branded Malaky** (Arabic wordmark ملاكي, kit under
`Docs/brand/`): new palette, Inter (proposed), calm motion law. **Since M2
(2026-08-23) there are TWO design systems in the repo:** the signed-in product
(design.md Parts 1–6 — light-first, Inter, shadcn tokens) and the VISITOR
WORLD (design.md Part 7 — Abdullah's concept-v2, dark, DM Sans + IBM Plex Sans
Arabic, vendored under `src/features/marketing/concept/`). They are scoped so
neither can reach the other. `package.json`, internal `ab-`
identifiers, and the repo name deliberately keep the old name this phase.
Network code is legal only in `src/api/`, only when `VITE_API_BASE_URL` is set;
without it the app is byte-for-byte the static build and the e2e suite asserts
zero requests. Phases **W0–W6 are built and verified**; **W7 is parked behind
the two manual gates**; the INT phases are wiring covered entities live (table
below).

## Where the code is

|            |                                                        |
| ---------- | ------------------------------------------------------ |
| Remote     | `github.com/alphapromena/alphabeacon-web` (private)    |
| `main`     | Production line, now at **`963c9f7`** — the whole **onboarding redesign** (ONB-0827 → 0827-B → 0827-C, fourteen commits across four stacked branches) fast-forwarded and **pushed 2026-08-30** on the founder's explicit approval, `main:live` with it. Before that push it was `fd84173`. The wizard is deleted, a fresh live org starts with zero tones, nothing generates before brand setup is complete, and a session opens in the org it remembers. Decisions D-ONB-A…F. Previously at **`039adfb`** — the whole **M2 design cycle** (`design/m2-concept-v2`, four commits) fast-forwarded and **pushed 2026-08-24** on the founder's explicit approval, `main:live` with it. Before that push it was `b8becc1`. Previously at **`b8becc1`** — the live-suite warm-up (`df23176` plus its close-out, three commits) fast-forwarded and pushed 2026-08-24, `main:live` with it. Before that push it was `5c01c68`. Previously at **`83ec448`** — the E2E-0820 triage (B1–B9, three commits) fast-forwarded and **pushed 2026-08-20** on the founder's explicit approval, `main:live` with it. Before that push it was `550f54e`. Previously at **`c6e3489`** — everything below PLUS the whole live integration (INT-6…12), merged as a fast-forward and **pushed 2026-08-19** on the founder's explicit approval. Before that push it was `6c598b2`. Open-items 16–18 still hold the human gates |
| `rb/02-v1-brief` | Website V1 per Abdullah's brief + the ambient idle drift + the M1 card-realism passes through 2026-08-12 — tip `6c598b2`, and `origin/main` is at the same commit, so the production line has all of it |
| Local `main` ref | **No longer stale** (checked 2026-08-24): local `main` == `origin/main`, and this merge fast-forwards both. The 2026-08-17 warning stood because the local ref had never been fast-forwarded and `git log main..` over-reported by 22 commits — worth re-checking with `git rev-parse main origin/main` before trusting any local `main` comparison. |
| `fix/e2e-0820` | **The E2E-0820 triage, 2026-08-20 — branched off `main` (`550f54e`), MERGED as a fast-forward and pushed; kept on `origin` as the per-fix record.** F3 Generate reachable from the rail/dashboard/Today, F4 the "credits" vocabulary + `/billing/balance`, F5 the pre-run count, F6 the tone-preview reference, F9 the balance chip's three states, F10 the stale results footer, F11 pluralization, F12 the wizard Finish (failure-tolerant, reported, idempotent), B9 the schedule draft reconciler + a blank schedule for a live org that has none. Gate output in the session entry |
| `design/m2-concept-v2` | **M2 — the visitor world. Branched off `main` (`5c01c68`) 2026-08-23; took `main` again and MERGED as a fast-forward 2026-08-24 on the founder's explicit approval; kept on `origin` as the per-cycle record.** The decision chain is D-M2-A…F, then D-M2-F-r (the AA pass reverted so Abdullah could review his palette verbatim), then **D-M2-F-r2** (he delegated, the founder ruled accessibility wins with the design spirit preserved — the four corrections re-applied, the Memory reveal changed to slide without fading, a `Superseded` badge added, and every allowlist deleted). Abdullah's `malaky-prototype` `components/concept-v2/**` ported into `src/features/marketing/`: five routes under one layout, 58 marketing files, its own token file and contrast guard. M1 retired with it. Decisions D-M2-A…F; open-items 21 |
| `fix/live-suite-warmup` | **The live suite warm-up, 2026-08-23/24 — branched off `main` (`5c01c68`), MERGED as a fast-forward and pushed; kept as the per-fix record.** `global-setup.ts` wakes the API, warms a 12-way fleet and holds a heartbeat for the life of a live run, and refuses a run whose dev server is in the wrong mode (trap 22, guarded not just recorded). `live-clocks.ts` states three rungs derived from `Docs/api/live-red-2026-08-23.md`, and five spec files read them instead of literals — `live-brand`, `live-brand-rules`, `live-scheduling`, then `live-auth` and `live-team`. Locators and matchers byte-identical throughout. The two-round rule below came out of it |
| `feat/onb-01-tones` | **MERGED 2026-08-30. ONB-0827 Phase 1, 2026-08-28 — branched off `main` (`fd84173`); PUSHED 2026-08-28, merged 2026-08-30.** No seeded tones: the `PRESET_TONES` seeding leaves the org-creation path, I3 gains an honest empty state, and the now-impossible `tones` failure step goes with it. `PRESET_TONES` still composes the demo datasets — the demo world is untouched by order. D-ONB-B |
| `feat/onb-02-entry` | **MERGED 2026-08-30. ONB-0827 Phase 2 — stacked on Phase 1; PUSHED 2026-08-28, merged 2026-08-30.** `src/features/onboarding/*` DELETED; `/onboarding` is a redirect into the app; `org.onboarding {completed,resumeStep}` becomes `org.exists`; `finishOnboarding` becomes a lean `createWorkspace` (org only, idempotent) called at verify; N3 is reframed as the workspace-creation retry. `e2e/onboarding.spec.ts` is `e2e/entry-flow.spec.ts`. Closes open-item 27a. D-ONB-C |
| `feat/onb-03-gate` | **MERGED 2026-08-30. ONB-0827 Phase 3 — the tip of the ONB-0827 stack; PUSHED 2026-08-28, merged 2026-08-30.** `src/data/readiness.ts` is the one selector; `ab/setup-checklist.tsx` is the one surface; the gate is enforced at `/generate`, the Studio composer, D4's dialog and Today's affordances, and `verify:w06` has a structural check that keeps it that way. D-ONB-D (PENDING) |
| `feat/onb-04-invite-org` | **MERGED 2026-08-30 — this is the commit `main` now points at (`963c9f7`). ONB-0827-B, 2026-08-28 — stacked on `feat/onb-03-gate`. PUSHED, NOT merged.** Closes open-item 38: `src/data/adapters/org-selection.ts` is the one selector (`selectActiveOrg`, `mostRecentlyJoined`), the active org is persisted beside the session and stamped with the user id, `graftAuthSession` takes the chosen org instead of reaching for `orgs[0]`, accepting an invite switches immediately, a revoked membership falls back with a latched toast, and the rail's footer becomes a switcher at two orgs. D-ONB-F |
| `feat/hsn-01-generate` | **HSN-01, 2026-08-30 — branched off `main` (`289cad5`). PUSHED, NOT merged; later HSN orders stack on it.** The Generate page's "drafts per tone" option deleted (control, state, copy, plumbing), `options.perTone` gone from the generate body and the emptied `options` wrapper with it; `MAX_FANOUT`/`overBudget`/`fanoutTooLarge` deleted as the multiplier's own plumbing. Hasan's target envelope appended to `Docs/api/alphastudio-shapes.md`. Probe: 202 without the field (org 1364, req `ce257b64-…`) |
| `probe/int13` | The PROBE-INT13 media probe (2026-08-26/27), branched off `main` (`fd84173`) — **PUSHED 2026-08-28**, not merged, so its open-items 34/35 do NOT exist on the ONB stack. Phase B is still blocked on Ward |
| `probe/assets-0826` | The assets-endpoint probe (2026-08-26), docs-only — **PUSHED 2026-08-28** so the Ward message's file pointers resolve on GitHub |
| `chore/api-sweep` | The 118-operation contract sweep (`89199d9`), one commit ahead of `main`, untouched by the triage |
| `live`     | **Team-only staging**, always a fast-forward of `main` and never carrying commits of its own. Vercel builds its PREVIEW with a branch-scoped `VITE_API_BASE_URL`, so `live` is where the app runs against the real API; PRODUCTION (`main`) has no such variable and stays byte-for-byte static. **After every merge to `main`: `git push origin main:live`.** |
| Phase branches on `origin` | `int/06-contract` · `int/07-brand-rules` · `int/08-country` · `int/09-wallet` · `int/10-generate` · `int/11-studio-knowledge` · `int/12-proposals` — pushed 2026-08-19 as the per-phase record, exactly as `w/NN` and `int/00…05` are kept. `probe/proposals` was deliberately NOT pushed: it is superseded, and its record lives on in `int/12` as `ee2bc57` |
| Phase tips | `w/00`…`w/06`, `int/00`…`int/05`, `rb/00-malaky`, `rb/01-motion` |
| Tags       | none                                                   |

Every phase branch was cut from the previous one, so they stack linearly and
`main` was fast-forwarded straight through them — no merge commits, one history:

```
main ← rb/01-motion tip (67f99b4 + close-out, fast-forwarded 2026-08-09)
  └─ w/00 … w/06 ─ (M1 cinematic, posting-time fixes on main)
     ─ int/00-client ─ int/01-auth ─ int/02-orgs ─ int/03-brand
     ─ int/04-scheduling ─ int/05-notifications ─ rb/00-malaky (Malaky rebrand)
     ─ rb/01-motion (M1 cinematic layer, film + two-tier laws)
```

**Push status:** `rb/01-motion` and `main` pushed 2026-08-09 (the push
cleared on user approval minutes after the permission gate blocked it).

**Workflow from here (decided 2026-07-29):** the retroactive PRs for W0–W6 were
skipped deliberately — solo developer, no reviewer, no value. From W7 onward,
open a PR only if it is useful. `web-plan.md` §9's "PR per phase" is therefore
aspirational, not a rule this repo follows.

## Phase status

| Phase                                | Screens                      | State                                                        |
| ------------------------------------ | ---------------------------- | ------------------------------------------------------------ |
| W0 Foundation                        | —                            | Done · `verify:w00` green                                    |
| W1 Design layer                      | —                            | Done · `verify:w01` green                                    |
| — Brand pass                         | —                            | Superseded 2026-08-08 by the Malaky rebrand (below)          |
| W2 Marketing/auth/onboarding         | M1, A1–A5, N3                | Done · `verify:w02` green (rewritten for concept-v2 in M2)   |
| W3 Review queue                      | D1–D5                        | Done · `verify:w03` green                                    |
| W4 Calendar + connections            | C1–C4, B1–B3                 | Done · `verify:w04` green                                    |
| W5 Studio + billing                  | E1–E4, H1–H4                 | Done · `verify:w05` green                                    |
| W6 Compose/analytics/settings/system | F1, G1–G2, I1–I7, N1, N2, N4 | Done · `verify:w06` green                                    |
| — **Malaky rebrand** (`rb/00-malaky`) | M1 + every user-facing surface | Done 2026-08-08 — kit palette/typography/motion in `design.md`, name sweep, new M1, deploy fix (`VITE_DEFAULT_DATASET` + `vercel.json`) |
| — **M1 cinematic layer** (`rb/01-motion`) | M1 | Done 2026-08-09, merged — then superseded by the V1 brief (film retired, D1) |
| — **Website V1** (`rb/02-v1-brief`) | M1 | Built + verified 2026-08-10 — **SUPERSEDED by M2, 2026-08-23** |
| — **M2: concept-v2** (`design/m2-concept-v2`) | the whole visitor world | Built 2026-08-23, corrected and **MERGED 2026-08-24** (D-M2-F-r2) — the accessibility gate in open-items 21 is closed; what remains there blocks DNS cutover, not the merge |
| — **ONB-0827: the onboarding ruling** (`feat/onb-01…04`) | A5 (deleted), N3, I3, F1, E2, D4, D1, the rail | **MERGED and SHIPPED 2026-08-30** (`963c9f7`). A5 is RETIRED |
| **W7 Hardening + ship**              | —                            | **Parked behind the two manual gates**                        |

## Integration phases (AlphaStudio API — contract at `docs/api/api.md`)

The static law was AMENDED on 2026-07-30 and narrowed on 2026-08-17
(decisions.md): network code is legal only in `src/api/client.ts` and
`src/api/upload.ts`, only when `VITE_API_BASE_URL` is set (`.env.local`, never
committed). Static mode remains the default and the e2e test bed. Hybrid per
entity: covered entities go live, the rest stay static (list below).

**The proxy law (Ward, 2026-08-17) — read this before touching generation.**
Everything AI-generative goes through OUR API's `/orgs/:orgId/alphastudio/*`
with the normal Bearer session. The frontend never talks to the AlphaProStudio
service, never signs anything, holds no service key. `guard-static` now fails
the build on `cloudfront.net`, `x-aps-`, the upstream `v1` route prefix,
`svc[_-]?key` or `edge[_-]?secret` appearing in code under `src/`. The one
non-API request the app is allowed is presigned STORAGE traffic our API just
signed — a `PUT` of file bytes through `src/api/upload.ts`, and the browser's
own `GET` of an asset it is displaying. The e2e law allows exactly that shape
(an AWS SigV4 signature we minted) and nothing else. `Docs/api/alphaprostudio.postman.json`
documents the upstream and is committed; its **environment file holds a live
HMAC key and must never enter the repo** — it is gitignored by name and by
`*.environment.json`.

**Running the live suites:** one spec at a time (`$env:VITE_API_BASE_URL=…;
pnpm e2e --grep live-<phase>`), the way each phase was verified — the API's
documented rate limits (60 s between code sends, 5/hour per email+purpose)
make a single-shot all-file matrix trip 429s by design. Fresh
`qa+<timestamp>` addresses every run; every dev code is 000000.
**Standing rule (2026-08-20, from trap 18): any merge to `main` runs the FULL
live suite — all twelve files, `LIVE_MEDIA` off — never only the phase's own
spec.** The phase that breaks a live spec is rarely the phase that owns it.
**Amended 2026-08-24 (source `Docs/api/live-red-2026-08-23.md`): against a cold
API the full suite runs TWICE. Round 2 is the merge gate; round 1 stabilises
the deployment.** Both rounds are reported; the gate itself is not optional and
a red in round 2 is a red. This is an operating procedure for an API that is
cold, not licence to re-run until green — and it retires the day the function
is kept warm.

| Phase | Scope                                                    | State       |
| ----- | -------------------------------------------------------- | ----------- |
| INT-0 | API client, env switch, guard amendments, docs           | Done (`int/00`, pushed) |
| INT-1 | Auth end to end against the live API                     | Done (`int/01`) · live e2e 7/7 |
| INT-2 | Me + orgs + members + invites                            | Done (`int/02`) · live e2e 12/12 |
| INT-3 | Brand (voices, tones + adapter, sources, topics)         | Done (`int/03`) · live e2e 5/5 |
| INT-4 | Schedules + event sources (+countries) + slots           | Done (`int/04`) · live e2e 3/3 (+1 gated on ingestion) |
| INT-5 | Notifications (list, unread-count, read-all)             | Done (`int/05`) · live e2e 1/1 |
| INT-6 | **Contract refresh, client hardening, the smoke run**    | **Done (`int/06-contract`)** · smoke run green, no live spec (INT-6 ships no UI) |
| INT-7 | Brand rules live + I4's tone preview                    | **Done (`int/07-brand-rules`)** · live e2e 5/5 (+ live-brand 5/5 re-run) |
| INT-8 | Org country + holidays (wizard, I1, C2–C4)              | **Done (`int/08-country`)** · live e2e 4/4 |
| INT-9 | Wallet + usage (balance chip, the 402 state, H3)        | **Done (`int/09-wallet`)** · live e2e 4/4 |
| INT-10 | On-demand generate F1 (batch runs + local run ledger)  | **Done (`int/10-generate`)** · live e2e 2/2 |
| INT-11 | Studio media E1–E4 + I6 knowledge (RAG)               | **Done (`int/11-studio-knowledge`)** · live e2e 4/4 studio (incl. a real render) + 3/3 knowledge |
| INT-12 | **Today on the proposals ledger** (D1/D2, F1 ledger retired) | **Done (`int/12-proposals`)** · live e2e 4/4 |

**INT-0…5 are MERGED to `main` (`b601622`, fast-forward — the int/NN branches
stay as the per-phase record, like w/NN).** INT-6 is on its own branch and NOT
merged.

**What the 2026-08-17 contract changed (INT-6).** 40 paths → 62. Brand voices
gained a required `name`, and voices AND tones gained `rules[]` (do/don't,
embedded in every read, `PATCH` replaces the whole list) — which lifts the
INT-3 restriction (open-items 7 is now partly closed; only a tone's `example`
and a voice's `examples` remain homeless). Orgs gained `country`, plus
`PUT /orgs/:id/country` (~10 s: it loads the holiday calendar) and a read-only
`GET /orgs/:id/holidays` carrying each day's do/don't rules. Two new error
codes: `402 wallet_insufficient` and `502 bad_gateway`. And a whole new
namespace — `/orgs/:orgId/alphastudio/*`: wallet, usage, capability catalog,
posts runs (sync preview + batch generate), media jobs/assets, RAG knowledge —
a **pure proxy** to the external AlphaProStudio service, which the frontend
never addresses directly (decisions.md D-INT-A).

**Still NOT on the wire, and still static:** drafts / Today (D1–D3), the
publish/schedule dialog (D5), channel connections + OAuth (B1–B3), analytics
(G1–G2), plans / subscription / checkout (H1, H2, H4), any streaming (F1's
token stream — the proxy has no stream endpoint), and proposals +
published-social (they exist upstream but are not proxied). None of it is
invented or faked: where a spec promised something the wire cannot deliver, the
honest subset ships and the deviation is logged. The backend questions live in
open-items 1–13 and 21–27; W7 still waits on the two reopened manual gates.

**Current totals on `feat/hsn-01-generate` (2026-08-30): 470 unit tests**
(43 files — one net test fewer than `main`: the deleted over-budget guard's
test went with the guard), **static e2e 93 passed / 61 live-spec skips**,
guard-static **322 files clean**, `verify:w00`–`w06` all PASS, and the FULL
live suite (15 files, `LIVE_MEDIA` off, one file at a time) under the
two-round law — round results in the session entry.

Before that, on `main` (`963c9f7`, merged and shipped 2026-08-30):
**471 unit tests** (43 files), **static e2e 93 passed / 61 live-spec
skips**, guard-static **322 files clean**, `verify:w00`–`w06` all PASS, and the
FULL live suite — now **15 files**, `live-invite-org` added — under the
two-round law. Round results are in the session entry; the standing shape is
that a red which passes solo on the same tree is the API's latency, and a red
that survives one is ours.

Before that, on `feat/onb-03-gate`: **459 unit tests** (42 files), **static
e2e 92 passed / 51 live-spec skips**,
guard-static **320 files clean**, `verify:w00`–`w06` all PASS, and the FULL
live suite — now **14 files**, `live-onboarding` added — under the two-round
law: **round 1 14/14**, **round 2 13/14**. Round 2's single red was
`live-auth`'s 401-purge test, and it is recorded rather than re-run away:
`src/api/` is **byte-identical to `main`** on this branch (`git diff main --
src/api/` is empty), so the whole 401 path is untouched, and six solo runs of
that file put the test at **5 passed / 1 failed** — the one other failure in
that series was a different test timing out on a cold signup POST. It is API
latency on a file this cycle did not change, in the same family as the
`live-auth` round-1 red recorded on 2026-08-24. **Not claimed as green.**

Before that, on `main`: **457 unit tests** (42 files), **static e2e 87
passed / 51 live-spec skips**, guard-static 321 files clean, verify:w00–w06 all
PASS, and the FULL live suite **13/13** on the merged tree (D-M2-F-r2 round 2,
2026-08-24). M2 touches no live code — `src/api` and `src/data` were
byte-identical to `main` throughout — so green there was the expected answer
rather than a discovery. (The static count moved 88 → 87 when D-M2-F-r2 deleted
the allowlist and the test that existed only to keep it honest.)
(On `main`: 423 unit tests / 41 files / static e2e 72 passed / 255 guarded
files, and the FULL live suite green under the two-round rule — 13/13 twice,
2026-08-24.) (On `main` it is 398 unit tests / 38 files / 248 guarded files — the
"394" this line used to claim was already one turn stale.)
(The unit count dips by one: INT-10's localStorage run-ledger tests went with
the ledger it tested — the proposals ledger replaced it server-side.)
**INT-6 … INT-12 are MERGED to `main` (`c6e3489`, fast-forward — no merge
commit, one history) and PUSHED, 2026-08-19.** The seven phase branches stay on
`origin` as the per-phase record.

**Production is STATIC; `live` is where live mode runs.** Production (`main`)
holds no `VITE_API_BASE_URL`, so the deployed build is the same zero-network
artifact it has always been. Live mode is exposed to the team on the Vercel
PREVIEW of the `live` branch, with the variable scoped to that branch — which
is why the branch had to exist before the variable could be bound to it.

**Open-item 1 (CSP `connect-src`) is MOOT on Vercel:** `vercel.json` ships no
CSP at all, so there is no policy to widen. It would return only if the app
moved back behind the CloudFront stack in `infra/`.

**Still NOT on the wire after INT-12:** a list-runs endpoint, the
published-social proxy, any drafts store (so no editing before approval and no
scheduling), publish/schedule (D5), channel connections (B1–B3), analytics
(G1–G2), plans/checkout (H1/H2/H4), and streaming. Open-items 29–31 carry the
questions; 32 carries a real paging bug the frontend is designed around.
**No route is a stub any more** — `PlaceholderScreen` is deleted, and
`verify:w06` fails if it comes back.

**M1 is Abdullah's concept-v2, ported (M2, 2026-08-23, branch only).** The
visitor world is five routes under one layout route — `/` (Hero → Prompts →
OneEvent → RealBrands → Approval → Memory → Arabic → BrandDemo → ClosingCta),
`/pricing`, `/request-demo`, `/terms`, `/privacy` — with `Header`, `Footer` and
`MediaDefs` mounted once above the `Outlet`. Dark, DM Sans + IBM Plex Sans
Arabic **self-hosted** (two new deps, zero network), tokens on
`html[data-mk-world]` and resets on `.mk-world` so nothing reaches an app
screen. Upstream's source is VENDORED file-for-file under
`src/features/marketing/concept/` (58 files) so it can be diffed against the
prototype again; everything outside `concept/` is ours.

**The CTA law (D-M2-D):** every "Get started" is the REAL `/signup`, Login is
the real `/login`, "Request a private demo" is `/request-demo` — one map in
`concept/site.ts`, unit-tested, and `site.test.ts` reads the source to prove no
component types a route by hand. The prototype's purchase flow is deliberately
NOT ported (D-M2-C): next to a real signup it would be a second, fake journey.
The early-access model is retired and `/request-access` redirects to
`/request-demo` — **the founder can veto that at review**, which is why the
path still exists.

**Pricing is marketing's own data (D-M2-B):** `concept/lib/pricing.ts`,
verbatim from Abdullah. `usePlans()` and everything under `src/data` are
untouched and no longer imported by marketing. The W2 verify line "marketing
pricing and H1 pricing assert equal from one module" is superseded; the check
now asserts the SEPARATION.

**Four AA deviations from the prototype (D-M2-F, design.md 7.7),** all
commented at the site of the change and all one-line reversible: the filled
CTA's ink is dark on the unchanged `#ff4e2d` (white was 3.29:1); `--c-text-4`
aliases `--c-text-3` (the prototype's `#5d5a57` was 2.63–2.93:1 on ~40
elements); the approval preview is absent rather than held at `opacity: 0.3`
(1.43:1); the customer monogram moved up a tier. `styles/marketing-tokens.test.ts`
is the new guard, 26 assertions, mirroring `tokens.test.ts`.

**What M1 took with it (D-M2-A):** `marketing-home.tsx`, the whole
`outputs/` engine, `reveal.tsx`, the `pricing-section.tsx` seam, the
`[data-mk-*]` motion layer in `globals.css`, `public/campaigns/`,
`public/brand/og-malaky.png`, `features/system/legal-screens.tsx`, and the
early-access screen + its analytics module. **The bundle did NOT shrink** —
entry chunk 632 kB → 675 kB, main CSS 160 kB → 216 kB — because concept-v2's
home page is a bigger thing than M1 was. Recorded in D-M2-A rather than
explained away.

**Not done, and logged:** `/request-demo` transmits nothing (the module says
so), `hello@malaky.ai` is the ONE invented value in the port, the six legal
values are still `null` and render as `[To be confirmed: …]`, and `/signup`
still wears the app's design so the visitor crosses a visual seam at "Get
started". All of it is open-items 21.

## What W7 needs (from `web-plan.md` §9)

- **Full-app `@golden` walks** of the three journeys. The pieces exist and are
  individually tagged `@golden`; W7 joins them end to end and runs them twice
  consecutively.
- **The message-catalogue completeness test** — every entry in `lib/messages.ts`
  reachable from some screen, and no screen rendering an unlisted error or empty
  string. `MESSAGES` grew a lot in W6; expect this test to find dead entries.
- **Route-level code-splitting + bundle budgets.** The bundle is currently a
  single ~1.2 MB chunk and vite already warns about it — nothing has been split
  yet, by design.
- **Lighthouse CI** (marketing ≥ 95 perf / 100 a11y; app ≥ 85 / 100), which
  needs the staging deploy, which needs the domain + certificate (still parked).
- **Dead-dataset and unused-record pruning.** The `heavy` id is gone; the seven
  worlds now are visitor, fresh, active, low-credits, needs-reauth, past-due and
  quiet-week.

## Rules that have bitten, and will again

These are learned the hard way; each cost a debugging cycle.

1. **`page.goto` in e2e reloads the SPA**, which rebuilds the DEFAULT dataset.
   After switching worlds, navigate **only through in-app links**. Enforced by
   every `verify:wNN` from W3 onward. Use `activateDataset` from `e2e/datasets.ts`.
2. **The shell's `h1` renders during the loading skeleton**, so it is not a
   readiness signal. Wait for `[aria-busy="true"]` to reach 0 before counting
   anything on a screen.
3. **Never dim real text with `opacity`** — it has broken WCAG AA three times
   (marketing logos, calendar day numerals, and nearly the auth panel). Recede
   via the surface or the `muted-foreground` token instead.
4. **Sheets and dialogs must read live provider state**, not a snapshot taken
   when they opened. Hold an id and look the record up, or the panel renders a
   stale version of what the user just changed.
5. **`vitest` runs without `globals`**, so Testing Library's auto-cleanup never
   registers — `src/test/setup.ts` does it explicitly. Component files may not
   export non-components (fast-refresh rule); put hooks and pure helpers in a
   sibling `.ts`.
6. **Scripts under `scripts/` must not import app source.** `tsconfig.node.json`
   has no `@/` alias, and dragging `src/` into it breaks typecheck repo-wide.
   Assertions about data belong in the unit suite.
7. **`sr-only` hides an element but keeps it focusable.** A visually hidden
   control still takes a tab stop and renders no focus indicator, so focus
   appears to vanish. Pair it with `tabIndex={-1}` whenever a visible control is
   the real affordance.
8. **A route whose sections each render the layout will destroy focus.** React
   swaps one component for another, the shared nav unmounts, and the focused
   element goes with it. Shared chrome belongs in a route layout above an
   `Outlet`.
9. **Playwright's `getByText('…')` is case-insensitive substring matching**, and
   the rail's Today link carries its unread count in its accessible name
   (`"Today 5 drafts need review"`), so `{ exact: true }` finds nothing. Scope
   rail clicks to `[data-sidebar="sidebar"]` and match by prefix.
10. **An open Radix menu is modal**: everything behind it is `aria-hidden`, so a
    role query for the trigger returns nothing while its menu is open. Press
    Escape before asserting on what the trigger now says.
11. **A structural check must not match prose.** A `verify` regex against a
    sentence in JSX breaks the first time Prettier wraps the line, and the fix
    people reach for is deleting the check. Match structure — a call, a guard, a
    catalogue key — not copy. The same trap bit twice more on 2026-07-29: a
    length-capped regex broke when a comment lengthened the tag it matched.
    And twice more on 2026-07-30, from both directions: the new cinematic
    checks matched their own doc comments until comments were stripped, and a
    tokens.css comment naming the dark selector broke `tokens.test.ts`, which
    locates the dark block by that string's first occurrence.
12. **A comment stripper that tracks string state will swallow a file.** INT-6
    needed guard-static to read code without comments, and the obvious
    implementation — a lexer that enters "string mode" on a quote — dies on the
    first apostrophe in JSX prose ("Don't"): the string never closes and every
    following line is blanked, so the guard silently stops guarding. That is
    worse than a guard with a known gap. `codeOf()` is line-scoped instead, and
    its two blind spots can only LOSE a match, never invent one. If you extend
    it, keep that direction of failure.
13. **api.md is not the wire.** Three fields the 2026-08-17 docs describe one
    way behave another: `slot` is required on a generate run, `embeddingModel`
    is required on a RAG collection, and a draft's `toneId`/`rationale` live
    INSIDE `outputs[].content`, not beside it. Types for anything under
    `/alphastudio/*` come from `Docs/api/alphastudio-shapes.md`
    (`pnpm smoke:alphastudio`) — never from an example in prose.
14. **Playwright's `count()` does not auto-wait, so it is never a readiness
    gate.** Two specs flaked only under parallel load for this reason (found
    INT-6, present since the 2026-08-11 code-split): the route's lazy chunk was
    still arriving, `count()` returned 0, and the test either skipped its whole
    loop and failed as "no such slot" or compared against a stale zero. Waiting
    for `[aria-busy="true"]` to reach 0 does NOT cover it either — that
    assertion can pass in the window before the fallback even mounts. Assert
    `expect(locator.first()).toBeVisible()` first; that retries, `count()`
    does not.
16. **`getByRole(..., { name })` matches by SUBSTRING too, not just
    `getByText`.** Trap 9 was recorded for `getByText`; INT-12 proved it costs
    just as much on roles. A click on `{ name: 'Approve' }` silently hit the
    **'Approved' tab** — which renders first — so the confirm never opened and
    the failure read as "no dialog". Use `exact: true` and scope to the row.
18. **A LIVE spec you are not running rots exactly like a `verify` you are not
    running (trap 15, second helping).** `live-generate` asserted a heading
    called "Recent runs"; INT-12 renamed that section to "Waiting for review"
    and the spec had been failing on `main` ever since — unnoticed, because
    closing INT-12 ran `live-proposals`, not `live-generate`. Worse, a
    catalogue string still TOLD the user to "check Recent runs", so the app
    named a section that no longer existed. When a rename lands, grep the
    specs and `lib/messages.ts` for the old name, not just the components.
    Corollary found the same day: two more live specs asserted the PLURAL of a
    count ("passages", "members") and only passed because the plural was
    unconditional — fixing the grammar broke them, which is the right way round.

21. **Scoping a vendored stylesheet with a CLASS silently outranks the
    vendor's own rules.** The concept-v2 port's resets were bare element
    selectors upstream (`button { color: inherit }`), so a component class
    like `.primary { color: #fff }` beat them. Scoping them as
    `.mk-world button` flips that — (0,1,1) over (0,1,0) — and the filled CTA
    lost its label colour on every page, silently, because "inherit" from a
    dark page still renders text. `:where(.mk-world) button` contributes no
    specificity, so each rule lands at exactly the weight it had upstream.
    **When you scope someone else's stylesheet, scope it with `:where()` or
    you are also re-ranking it.** Found by axe reporting the wrong foreground
    colour on the button, not by looking at it.

22. **A dev server left running in LIVE mode makes the whole STATIC suite fail
    in confusing ways.** `playwright.config.ts` sets
    `reuseExistingServer: !CI`, so `pnpm e2e` silently adopts whatever is on
    5199 — including a server started by hand with `.env.local` loaded. In
    live mode there is no seeded session, so `/` is the marketing site and
    `/signup` renders instead of redirecting: **63 specs failed on "waiting
    for heading Dashboard"** (69 on this branch, which has more static specs)
    and every one of them looked like a regression in the branch under test.
    It cost two debugging cycles in one afternoon. **Before reading a
    static-suite failure, check what is listening on 5199.**
    The webServer block pins `VITE_API_BASE_URL: ''` for exactly this reason —
    but only for a server IT starts.

    **This one is now guarded, not just recorded** (`fix/live-suite-warmup`):
    `e2e/global-setup.ts` asks the server which mode it is in before anything
    runs — it reads `src/api/config.ts` as Vite serves it, with the env
    inlined, which is the one file documented as deciding the mode — and
    refuses the run with a named error if the server disagrees. Proven in both
    directions. The guard is SILENT when it cannot get a clear answer (no dev
    server, a preview build, a future Vite that inlines differently): a guard
    may fail a run for a reason it is sure of, never for one it guessed.

    **Second sighting, 2026-08-24 (M2 close-out), and a different shape.**
    `verify:w02` came back FAIL inside a sweep that ran `pnpm e2e` and then
    `pnpm verify:w00…w06` back to back — while its OWN structural laws passed
    and the full static e2e passed beside it, seconds earlier. It then passed
    standalone, and passed again in a clean sequential sweep. Nothing in the
    tree changed between the red and the greens. The cause is the same
    `reuseExistingServer: !CI` seam as trap 22 proper: consecutive Playwright
    runs each start and tear down their own server on 5199, and a run that
    begins while the previous one is still releasing the port adopts or races
    it. **The lesson is not "re-run until green" — it is that back-to-back
    Playwright invocations are not independent.** Give a suspicious gate one
    clean solo run before believing it, and if a sweep matters, do not chain
    it directly behind another `pnpm e2e`. A red that cannot be reproduced
    solo AND is contradicted by a neighbouring run of the same specs is
    environmental; a red that survives a solo run is yours.

    **Third sighting, 2026-08-28 (ONB-0827 Phase 2), same shape again.**
    `verify:w03` came back FAIL on a MARKETING font assertion — "expected DM
    Sans Variable, received Inter Variable" — inside a sweep chained behind
    `pnpm e2e` and `verify:w00…w02`. The branch under test had not touched
    marketing at all. It passed solo immediately after, 87/87, with port 5199
    still showing TIME_WAIT sockets from the previous run. Recorded because
    the failing assertion looked plausible (a font really can fail to load),
    and that is exactly when this trap is most expensive.

    **A FOURTH sighting, and then the FIX (2026-08-28, ONB-0827-B).** The same
    marketing FONT assertion failed a fourth time inside a sweep. Four
    identical, sweep-only failures on branches that never touched marketing is
    not weather, it is a bad test: `marketing.spec.ts` sampled `document.fonts`
    ONCE, immediately, and font loading is asynchronous — a `@font-face` is
    only fetched when something uses it. It awaits `document.fonts.ready` and
    polls now, asserting exactly what it asserted before. `verify:w06` went
    green immediately. **A check that keeps reporting the harness instead of
    the branch has stopped working** — fix it rather than learning to read past
    it.

    **A SECOND SEAM, still open and worth knowing.** `verify:w00` failed on
    four `entry-flow` tests that then passed 6/6 solo, while w01–w05 ran the
    identical suite green in the same sweep. w00 is the one phase that runs
    `pnpm build` immediately before `pnpm e2e`. So the port precondition below
    is necessary but not sufficient: a heavy build right before a Playwright
    run is its own kind of load.

    **AND A SHARPENING, same day, worth more than the sighting.** Later in the
    same cycle `verify:w06` failed twice in a row on TWO DIFFERENT tests — the
    marketing font assertion in a chained sweep, then the keyboard walk in what
    looked like a solo run — while a bare `pnpm e2e` passed 92/92 either side of
    both. The "solo" run was not solo enough: `verify:wNN` runs the whole
    `pnpm e2e` inside itself, and it had started seconds after the previous
    verify released port 5199.
    **Waiting for the port to be FULLY released makes it deterministic:**

    ```bash
    until [ -z "$(netstat -ano | grep -w 5199 | grep -i -e listen -e time_wait)" ]; do sleep 5; done
    pnpm verify:w06
    ```

    That run passed — 459 unit, 92 e2e, RESULT PASS. So the rule is not "give it
    a solo run", it is **"wait for TIME_WAIT to drain, then give it a solo
    run"** — a precondition you can check rather than a re-run you hope about.
    Two different tests failing in the same seam is the tell: when consecutive
    reds do not agree on WHAT broke, suspect the harness, not the branch.

19. **"Has the user edited?" is a fact to RECORD, not to infer from a JSON
    diff against a moving reference.** C1 decided whether to adopt a freshly
    synced schedule by comparing its draft to the last pristine it had seen,
    held in a ref. It looked equivalent to knowing, and was not: the brand and
    scheduling halves of the live sync graft INDEPENDENTLY, so the ref can
    advance to the live schedule on a render where the draft has not adopted
    yet — and the next pass reads a perfectly untouched draft as an edit. The
    first B9 fix inherited that inference and pruned a just-saved selection to
    nothing on reload. The flag is set by `patch()` now, the one funnel every
    field change already went through, and cleared on Cancel and on a good
    save. If a screen needs to know what the user did, have the user's own
    handler say so.

20. **A null answer from the wire must never fall through to demo data.**
    INT-8 wrote this for `eventSources` — "an empty list is the honest answer
    rather than demo data dressed as live data" — and the reducer two lines
    below it did the opposite for schedules: `...(action.scheduling.schedule ?
    { schedule } : {})` left the SEEDED world in place, so a live org with no
    schedule opened C1 wearing the demo's five active days, three posts a day
    and eight tone ids, presented as its own settings. A missing schedule
    grafts a BLANK one now. Whenever a graft is conditional on the wire having
    answered, check what the screen shows when it did not.

17. **A shadcn ConfirmDialog is `role="alertdialog"`, not `role="dialog"`.**
    And it is modal, so while it is open everything behind it is aria-hidden
    (trap 10) — a `getByRole('dialog')` query against it finds nothing at all,
    which reads like "the dialog never opened" rather than "wrong role".

15. **A `verify:wNN` you are not running is a check that has already broken.**
    `keyboard-focus rules hold` (w06) had been failing since 2026-08-11 because
    the code-split moved route elements behind a lazy loader and its regex
    matched the old literal markup — six days unnoticed, because the rb/02 work
    ran `verify:w02`. The law was intact; only the check was stale. When you
    branch, run the gate you are about to be judged by BEFORE writing code, so
    you know which failures are yours.

## Design laws with automated enforcement

Beyond lint and typecheck, each `verify:wNN` runs **structural** checks that
read source, because these failure modes pass behavioural tests:

- Media entry points are rendered from `canTransition`, never a hand-rolled
  status comparison, and are never `disabled` (W3).
- An unreported metric is `undefined`, never `0` — the "Syncing…" rule (W4).
- D4 and E2 must both render the shared `ComposerBody`; neither may grow its
  own params form (W5).
- The params form is generated from each model's JSON Schema; it may not name a
  model or a parameter (W5).
- The credit balance is summed from the ledger; no entity may store one (W5).
- `past_due` gates from the shell, and refuses generation and publishing (W5).
- One tone editor, three entry points: the sheet and the routed page both render
  the shared `ToneEditorForm`, and no caller may grow tone fields of its own (W6).
- Every screen that shows a tone renders `ToneBadge` (W6).
- F1 renders D2's card, D2's actions and D2's dialogs, and the draft it makes
  enters at `pending_review` (W6).
- The compose scripts live in data; the screen may not name one (W6).
- Every dirty-state screen commits through the shared `SaveBar`; a local
  `useBlocker` fails the phase (W6).
- No route resolves to a placeholder (W6).
- Settings is a route layout with a real tablist, the leave-guard restores
  focus, no `sr-only` file input holds a tab stop, and adding a rule focuses it
  (post-W6 remediation).
- Every posting time renders through `PostingTime`, labelled by GMT offset, and
  no screen claims to know the audience's local time (post-W6 remediation).
- **The visitor-world laws (verify:w02, rewritten for M2).** Thirteen checks
  over `src/features/marketing/`: nothing Next-shaped survived the port (no
  `next/` import, no `"use client"`, no `/concept-v2` path in code); the
  purchase flow's nine modules stay absent; nothing imports `@/data` except
  the layout; the CTA map declares `/signup` and `/login`; every screen sets
  its page meta; the homepage's nine sections render in order; the tokens hang
  off `html[data-mk-world]` and never `:root`, and the layout sets AND removes
  that attribute before paint; the FROZEN section rhythm (both tokens and the
  section-head gap) is byte-exact; the five self-hosted font imports are
  present; `<video>` sits behind the reduced-motion return; the raw-color
  exemption is exactly four artwork files; a quiet text tier never sits on a
  light fill; M1's seven artefacts are gone from the tree and its motion layer
  from `globals.css`; and `index.html` and `site.ts` agree on the homepage
  title and the OG card.
- The M1 cinematic laws are RETIRED with M1 (D-M2-A). They were: the scrub
  never touches `currentTime`; the reduced-motion still path exists; Lenis
  sits behind the motion guard; pricing keeps `usePlans()` with no local plan
  data; every marketing `<video>` is muted+`playsInline`; media paths live in
  `media.ts`; tone chips read `useTones()` and render `ToneBadge`.
- The palette is guarded by `src/styles/tokens.test.ts` — 49 contrast
  assertions, including the `bg-X/10 text-X` badge pattern. **The visitor
  world's palette is guarded the same way** by
  `src/styles/marketing-tokens.test.ts` — 26 assertions over the text-tier ×
  surface matrix, the CTA in both states, the focus ring, and the shape of
  both ramps (M2).
- **A production build boots into `visitor`, never signed-in** (verify:w02,
  2026-08-19). Checked on BOTH sides: the source derives the default from
  `import.meta.env.PROD`, and the emitted `dist/` is read back to confirm it
  really falls back to `"visitor"`. The artifact half exists because the
  incident it prevents had correct source and a wrong deployment.
- **Which org a session works in is ONE selector** (ONB-0827-B). Every
  `orgs[0]` is gone: `selectActiveOrg` answers, the choice is persisted beside
  the session and stamped with the user id, and a remembered org that has
  vanished falls back to a real one and SAYS so. Switching re-grafts rather
  than only re-syncing, because the viewer's ROLE is per-org — a member of one
  workspace can own the next, and a stale role would offer owner controls in a
  workspace where they have none.
- **The readiness gate is ONE selector** (verify:w06, ONB-0827). F1's route,
  the Studio composer and D4's media dialog each read `useReadiness()` and
  render the shared `GenerationBlocked`; the ruling itself lives only in
  `src/data/readiness.ts`; and the tone PREVIEW is asserted to stay UNGATED,
  because previewing is part of creating the first tone. A fifth surface with
  its own idea of "ready" would pass every behavioural test in the suite while
  disagreeing with the checklist the user was just shown.
- The proxy law (INT-6, `guard:static`): `fetch` exists in exactly two files,
  and no code under `src/` may name the upstream origin, its signing headers,
  its route prefix, or either service secret. Comments may name all of them —
  the rules read code only.

## Open manual gates

**Two are REOPENED.** All 13 were walked on 2026-07-29 and signed off, but the
focus, tablist and posting-time work that came out of them moved the semantics
two of the sittings exist to check — so the 360px pass and the screen-reader
walk must run again against the FIXED build, not the one they were signed off
against. See `.agent/open-items.md`. What they found became work, not
backlog: six focus fixes, two data-honesty fixes, and one decision-gated
proposal (timezones) that has not been built.

**The lesson worth carrying:** axe was green on every screen the six focus bugs
lived on, and always had been. It reads markup; it does not tab through
anything. Treat `@axe` as a floor, never as the accessibility safety net —
`e2e/settings-a11y.spec.ts` is the pattern for what actually catches these.

## Still parked (needs a human)

1. **CI on the new remote** — the repo exists and everything is pushed, but no
   workflow has ever run there. The W0 verify item "a canary PR is blocked by
   every check" is still unproven: the checks all pass locally and have never
   been enforced by GitHub.
2. **Domain + ACM certificate** — blocks "staging URL serves the shell". The
   CDK stack (`infra/`, `ABW-<stage>-Web`) synthesises but has never deployed.
   This now also blocks a W7 verify item: Lighthouse budgets are measured on the
   staging deploy.
3. **Arabic**: recorded as decided, not pending — UI stays English; Arabic
   _content_ would need only a font fallback and `dir="auto"`, while Arabic
   _chrome_ is the expensive retrofit. Reopen only on a decision to localize.

## Orientation for a new session

Read in this order: `CLAUDE.md` (rules) → this file → `.agent/conventions.md` →
the last entry in `.agent/sessions.md`. Then `screens4.md` for the screen you
are about to build and `design.md` for how it should look.

Useful commands (full list in `.agent/stack.md`):

```bash
pnpm dev                 # http://localhost:5173
pnpm verify:w06          # the last completed W phase; --skip-e2e for a fast pass
pnpm lint && pnpm typecheck && pnpm test
pnpm smoke:alphastudio   # live: re-observe the proxy shapes (needs VITE_API_BASE_URL)
```

`/dev/datasets` switches tenant worlds, `/dev/states` forces loading, error and
N4's connectivity banners, `/dev/kitchen-sink` shows every design-layer
primitive in both themes.

Two states are reachable only by doing something first, which is deliberate —
they are states an org gets into, not worlds it starts in:

- **F1's refusal**: spend the three on-demand runs (`COMPOSE_LIMIT`). The five
  runs themselves are chosen by the prompt — `competitor` flags a claim
  mid-stream, `breaking` drops the stream, `thread` is long enough that stopping
  is a real choice, anything else is the ordinary run.
- **G1's empty state**: disconnect every analytics-enabled channel. The `fresh`
  world has none, but it has not finished onboarding either, so N3 owns it.
