# Current state — read this first

A snapshot of where the build actually stands, so a new session can start
without reconstructing it from the session log. **Update this file at the end
of any turn that finishes a phase or changes the plan.** `sessions.md` is the
chronological record; this is the current picture.

_Last updated: 2026-07-29, after W6._

---

## In one paragraph

`alphabeacon-web` is a **fully static** React SPA — every screen in
`screens4.md`, rendered from typed data committed under `src/data/`, with **no
network calls of any kind** (enforced twice: `guard-static` fails the build, and
every Playwright run asserts zero requests). Phases **W0–W6 are built and
verified** — every screen in `screens4.md` now exists — and **W7 (hardening +
ship) is next**. There is no backend and no integration work in this repo by
design — that is a separate plan, written later (`web-plan.md` §13 records what
it will cost).

## Where the code is

|            |                                                        |
| ---------- | ------------------------------------------------------ |
| Remote     | `github.com/alphapromena/alphabeacon-web` (private)    |
| `main`     | `cfe6607` — **holds everything through W6**, pushed    |
| Phase tips | `w/00`…`w/06` all pushed, kept as the per-phase record |
| Tags       | none                                                   |

Every phase branch was cut from the previous one, so they stack linearly and
`main` was fast-forwarded straight through them — no merge commits, one history:

```
main = w/06-compose-analytics-settings ← cfe6607
  └─ w/00-foundation ─ w/01-design-layer ─ w/02-marketing-auth-onboarding
     ─ w/03-today-queue ─ w/04-calendar-connections ─ w/05-studio-billing
     ─ w/06-compose-analytics-settings
```

**Workflow from here (decided 2026-07-29):** the retroactive PRs for W0–W6 were
skipped deliberately — solo developer, no reviewer, no value. From W7 onward,
open a PR only if it is useful. `web-plan.md` §9's "PR per phase" is therefore
aspirational, not a rule this repo follows.

## Phase status

| Phase                                | Screens                      | State                                                        |
| ------------------------------------ | ---------------------------- | ------------------------------------------------------------ |
| W0 Foundation                        | —                            | Done · `verify:w00` green                                    |
| W1 Design layer                      | —                            | Done · `verify:w01` green                                    |
| — Brand pass                         | —                            | Done — real Alpha MENA palette + Barlow, `design.md` written |
| W2 Marketing/auth/onboarding         | M1, A1–A5, N3                | Done · `verify:w02` green                                    |
| W3 Review queue                      | D1–D5                        | Done · `verify:w03` green                                    |
| W4 Calendar + connections            | C1–C4, B1–B3                 | Done · `verify:w04` green                                    |
| W5 Studio + billing                  | E1–E4, H1–H4                 | Done · `verify:w05` green                                    |
| W6 Compose/analytics/settings/system | F1, G1–G2, I1–I7, N1, N2, N4 | Done · `verify:w06` green                                    |
| **W7 Hardening + ship**              | —                            | **Next**                                                     |

Current totals: **264 unit tests** (24 files), **59 e2e**, all green.
**No route is a stub any more** — `PlaceholderScreen` is deleted, and
`verify:w06` fails if it comes back.

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
- **Dead-dataset and unused-record pruning.** Two known items: `DatasetId` still
  admits `'heavy'`, a world that was never built, and `src/data/datasets/index.ts`
  still says "Later phases add: heavy".

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
7. **Playwright's `getByText('…')` is case-insensitive substring matching**, and
   the rail's Today link carries its unread count in its accessible name
   (`"Today 5 drafts need review"`), so `{ exact: true }` finds nothing. Scope
   rail clicks to `[data-sidebar="sidebar"]` and match by prefix.
8. **An open Radix menu is modal**: everything behind it is `aria-hidden`, so a
   role query for the trigger returns nothing while its menu is open. Press
   Escape before asserting on what the trigger now says.
9. **A structural check must not match prose.** A `verify` regex against a
   sentence in JSX breaks the first time Prettier wraps the line, and the fix
   people reach for is deleting the check. Match structure — a call, a guard, a
   catalogue key — not copy.

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
- The palette is guarded by `src/styles/tokens.test.ts` — 49 contrast
  assertions, including the `bg-X/10 text-X` badge pattern.

## Open manual gates

**13 checks remain unsigned** — see `.agent/open-items.md`, now grouped into
**three sittings** (viewport → screen reader → read-as-a-stranger) rather than
by phase, because a phase is how an item was created and a sitting is how it
gets cleared. None block a phase; all block launch.

The reviewer's intent as of 2026-07-29: **clear all 13 before W7 starts**, so
the phase begins with the debt at zero. The oldest and largest is the
screen-reader walk, which now covers the shell plus six W3–W6 surfaces that
carry their own semantics.

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
