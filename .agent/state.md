# Current state — read this first

A snapshot of where the build actually stands, so a new session can start
without reconstructing it from the session log. **Update this file at the end
of any turn that finishes a phase or changes the plan.** `sessions.md` is the
chronological record; this is the current picture.

_Last updated: 2026-08-10, after Website V1 (`rb/02-v1-brief`) — built and
verified, **awaiting founder sign-off; not merged, not pushed**._

---

## In one paragraph

`alphabeacon-web` is a static-first React SPA — every screen in
`screens4.md`, rendered from typed data committed under `src/data/` —
integrating with the **live AlphaStudio API** (contract: `docs/api/api.md`).
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
| `main`     | Production line — V1 page + orbital hero + full-fidelity posts + the 2026-08-11 production pass (code-split, early-access CTA, legal pages, SEO) + the Phase 2 code pass (request-access flow, analytics seam, brand-continuous demos, content-asset slot); open-items 16–18 hold the human gates |
| `rb/02-v1-brief` | Website V1 per Abdullah's brief + the 2026-08-11 ambient idle drift — merged to `main` 2026-08-11 (founder-instructed production push; open-items 16 checks still to be walked) |
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

The static law was AMENDED on 2026-07-30 (decisions.md): network code is legal
only in `src/api/`, only when `VITE_API_BASE_URL` is set (`.env.local`, never
committed). Static mode remains the default and the e2e test bed. Hybrid per
entity: covered entities go live; drafts/Today, connections, Studio, billing,
analytics, compose and knowledge stay static, awaiting backend phase 2.

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

**All six phases are MERGED to `main` (`b601622`, fast-forward — the int/NN
branches stay as the per-phase record, like w/NN).** The integration's first
pass is complete. Still static, awaiting backend phase 2: drafts/Today,
connections, Studio, billing, analytics, compose, knowledge. The backend/
product questions live in open-items 1–13; W7 still waits on the two
reopened manual gates.

Current totals: **337 unit tests** (31 files), **static e2e 71 passed / 23 live-spec skips**, all green (rb/02).
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
pnpm verify:w06          # the last completed phase; --skip-e2e for a fast pass
pnpm lint && pnpm typecheck && pnpm test
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
