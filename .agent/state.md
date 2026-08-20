# Current state — read this first

A snapshot of where the build actually stands, so a new session can start
without reconstructing it from the session log. **Update this file at the end
of any turn that finishes a phase or changes the plan.** `sessions.md` is the
chronological record; this is the current picture.

_Last updated: 2026-08-20, after the **E2E-0820 triage** branch
(`fix/e2e-0820`) — the founder's live in-app E2E on `1.malaky.ai` against org
619; eight frontend fixes plus two root-cause probes, **not merged, awaiting
founder approval**. Before that: 2026-08-19, after **INT-12** (`int/12-proposals`) — Today is the
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
`Docs/brand/`): new palette, Inter (proposed), calm motion law, and a
rebuilt kit-flow marketing page (2026-08-08). `package.json`, internal `ab-`
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
| `main`     | Production line, now at **`c6e3489`** — everything below PLUS the whole live integration (INT-6…12), merged as a fast-forward and **pushed 2026-08-19** on the founder's explicit approval. Before that push it was `6c598b2`. Open-items 16–18 still hold the human gates |
| `rb/02-v1-brief` | Website V1 per Abdullah's brief + the ambient idle drift + the M1 card-realism passes through 2026-08-12 — tip `6c598b2`, and `origin/main` is at the same commit, so the production line has all of it |
| Local `main` ref | **STALE at `3f9f3b4`** (noticed 2026-08-17). `origin/main` == `rb/02-v1-brief` == `6c598b2`; the local ref simply was never fast-forwarded, so `git log main..` locally over-reports by 22 commits. Harmless, but `git fetch && git checkout main && git merge --ff-only origin/main` before trusting a local `main` comparison. |
| `fix/e2e-0820` | **The E2E-0820 triage, 2026-08-20 — branched off `main` (`550f54e`), NOT merged and NOT pushed.** F3 Generate reachable from the rail/dashboard/Today, F4 the "credits" vocabulary + `/billing/balance`, F5 the pre-run count, F6 the tone-preview reference, F9 the balance chip's three states, F10 the stale results footer, F11 pluralization, F12 the wizard Finish (failure-tolerant, reported, idempotent). Gate output in the session entry |
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
| W2 Marketing/auth/onboarding         | M1, A1–A5, N3                | Done · `verify:w02` green                                    |
| W3 Review queue                      | D1–D5                        | Done · `verify:w03` green                                    |
| W4 Calendar + connections            | C1–C4, B1–B3                 | Done · `verify:w04` green                                    |
| W5 Studio + billing                  | E1–E4, H1–H4                 | Done · `verify:w05` green                                    |
| W6 Compose/analytics/settings/system | F1, G1–G2, I1–I7, N1, N2, N4 | Done · `verify:w06` green                                    |
| — **Malaky rebrand** (`rb/00-malaky`) | M1 + every user-facing surface | Done 2026-08-08 — kit palette/typography/motion in `design.md`, name sweep, new M1, deploy fix (`VITE_DEFAULT_DATASET` + `vercel.json`) |
| — **M1 cinematic layer** (`rb/01-motion`) | M1 | Done 2026-08-09, merged — then superseded by the V1 brief (film retired, D1) |
| — **Website V1** (`rb/02-v1-brief`) | M1 | Built + verified 2026-08-10 — **branch only, awaiting founder sign-off (open-items 16)** |
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

Current totals on `fix/e2e-0820`: **416 unit tests** (40 files), **static e2e
72 passed / 49 live-spec skips**, guard-static 253 files clean, verify:w02–w06
all PASS. (On `main` it is 398 unit tests / 38 files / 248 guarded files — the
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

**M1 is Abdullah's Website V1 on `rb/02-v1-brief` (2026-08-10, branch
only):** the hero is the marketing Malaky produces — a scroll-choreographed
3D story of publication-ready posts for four persistent demo brands
(`features/marketing/outputs/`), with the S5 Approve·Edit·Decline control
loop, the §5 workspace showcase, the §20–§27 proof sections (5-step
workflow, channel adaptation, two voices, Built here + EN/AR split screen,
proactive calendar, sources), the §29 eleven-question FAQ, and the dark CTA.
Hero H1: "Your marketing, already done." Pricing is OUT per D3 (seam in
`pricing-section.tsx`, unlinked). The rb/01 dashboard-as-glass-object film
is retired (D1) and `public/film/` deleted — masters archived; the earlier
2026-07 ink concept remains deleted too. The engine mounts only when
no-preference is AFFIRMED and the viewport is wide; the static layout is the
complete fallback and the mobile swipe story. M1 stays light-canonical.
Claims discipline lives in `Docs/brief/claims-map.md`; founder items in
open-items 16. Payload ~0.62 MB transferred vs the 3.0 MB D4 budget.
(History: the 2026-08-08 kit-flow rebuild and the 2026-08-09 film layer —
both superseded by the V1 brief; decisions.md D1–D8.)

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
- The M1 cinematic laws (verify:w02): the scrub never touches `currentTime`;
  the reduced-motion still path exists; Lenis sits behind the motion guard;
  pricing keeps `usePlans()` with no local plan data; every marketing `<video>`
  is muted+`playsInline` and either `aria-hidden` ambience or a `controls`
  player; media paths live in `media.ts`; tone chips read `useTones()` and
  render `ToneBadge`.
- The palette is guarded by `src/styles/tokens.test.ts` — 49 contrast
  assertions, including the `bg-X/10 text-X` badge pattern.
- **A production build boots into `visitor`, never signed-in** (verify:w02,
  2026-08-19). Checked on BOTH sides: the source derives the default from
  `import.meta.env.PROD`, and the emitted `dist/` is read back to confirm it
  really falls back to `"visitor"`. The artifact half exists because the
  incident it prevents had correct source and a wrong deployment.
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
