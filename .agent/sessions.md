# Session log

What happened, newest at the bottom. Claude adds one entry after every reply that
changes code or makes a decision (see rule 6 in `CLAUDE.md`).

**Format for each entry:**

```
### YYYY-MM-DD HH:MM — one-line summary
- Did: what changed, in a line or two
- Phase: W<NN> (from web-plan.md)
- Files: `path/one`, `path/two`   (or "none")
- Decisions: none   (or: see decisions.md — <title>)
- Verify: not run | lint+typecheck+test green | verify:wNN green
- Next: what's left, or "nothing"
```

---

### 2026-07-19 00:00 — Project scaffolded from the starter

- Did: web-plan.md + CLAUDE.md + .agent/ docs created; no code yet
- Phase: pre-W0
- Files: `web-plan.md`, `CLAUDE.md`, `.agent/*`
- Decisions: see decisions.md — all founding entries dated 2026-07-19 (own repo, real-API-last, mode-in-two-files, shadcn-via-skill)
- Verify: not run
- Next: W0 — Foundation (Vite+React, shadcn init + `skills add shadcn/ui`, tokens from design.md, MSW mock mode, mode guard, CI)

### 2026-07-23 00:00 — Consistency pass: rename + ticket streaming propagated

- Did: rename propagated; dropped `VITE_FORGE_URL` entirely — the browser holds no platform host and no platform credential beyond the single-use ticket. Mock SSE driver now mocks both hops (register + consume) incl. expired/consumed-ticket scenarios; W8 wiring + Verify rewritten (CORS exact-match, replayed ticket rejected, no token sent to the platform). Fixed a stray code fence at the end of decisions.md
- Phase: pre-W0 (docs only)
- Files: `web-plan.md`, `.agent/{context,architecture,stack,decisions,sessions}.md`
- Decisions: see decisions.md — no platform host/credential in the web; CSP + token storage
- Verify: not run (docs only)
- Next: W0 — Foundation

### 2026-07-23 01:00 — Replanned as a static build (W0–W7); API removed entirely

- Did: rewrote `web-plan.md` around committed data in `src/data/` (types, entity
  modules, datasets, `DataProvider`) with no network layer — dropped MSW, the API
  and SSE clients, `VITE_API_MODE`, the mode guard, TanStack Query, the contracts
  package and its registry token, and the W8 wiring phase. Added `guard-static` +
  a zero-network e2e assert, `/dev/datasets` + `/dev/states` switchers, a local
  `draft-status.ts` and `messages.ts`, and a scripted `compose-player.ts` in
  place of the SSE stream. Rewrote `.agent/architecture.md`; updated CLAUDE.md,
  context, stack, conventions. Recorded what integration will cost (plan §13).
- Phase: pre-W0 (docs only)
- Files: `web-plan.md`, `CLAUDE.md`, `.agent/*`
- Decisions: see decisions.md — the web is a fully static app; strict CSP
- Verify: not run (docs only)
- Next: W0 — Foundation + shadcn + the skill + the data layer

### 2026-07-27 15:00 — W0 foundation built end to end; verify:w00 green

- Did: scaffolded the whole repo on branch `w/00-foundation`. Vite 7, React 19,
  strict TS, Tailwind v4. shadcn init (CLI v4, base **radix**, preset nova) with
  37 `ui/` components and the shadcn/ui skill (`.agents/skills/` plus a
  `.claude` symlink). `tokens.css` with a **provisional** OKLCH palette
  (design.md is missing from this workspace — flagged, see decisions).
  Self-hosted variable fonts via @fontsource (bundled). Data layer: `types.ts`,
  entities, `fresh` and `active` datasets, `DataProvider` hooks,
  `draft-status.ts`, `messages.ts`. Minimal AppShell, seeded D1 dashboard, M1
  placeholder, `/dev/datasets`, `/dev/states`. `guard-static` plus local ESLint
  rules (no-raw-color, no-network, no-entity-imports). Playwright smoke with the
  zero-network fixture, axe, reduced-motion. CI workflow, gitleaks, CDK
  `ABW-<stage>-Web` (synth passes). Renamed the domain type `EventSource` to
  `CalendarSource` after guard-static correctly flagged the Web-API collision.
- Phase: W0
- Files: whole repo (first code commit); doc fixes: `web-plan.md` (§2 skills
  path), `.agent/stack.md` (deploy command shadowed by pnpm built-in; Node
  engines wording)
- Decisions: see decisions.md — provisional palette; fonts via @fontsource;
  next-themes; shadcn CLI v4 layout (all 2026-07-27)
- Verify: verify:w00 green on all automated steps (lint, typecheck, 25 unit
  tests, guard-static + both canaries, build, e2e 5/6 passed 1 skipped-for-W2).
  Manual items open: canary PR blocked (needs GitHub repo), staging URL (needs
  AWS + domain/cert) — web-plan.md §7 manual steps 1–2.
- Next: manual steps 1–2 (GitHub repo, domain + cert); provide `design.md` to
  replace the provisional palette; then W1 — the AB design layer.

### 2026-07-27 15:40 — W1 design layer shipped; verify:w01 green

- Did: built `src/components/ab/` on branch `w/01-design-layer`. Signature
  motion first: `motion.tsx` (BeaconDot, SignalSweep) opting in through a single
  `data-ab-motion` attribute that `globals.css` disables wholesale under
  `prefers-reduced-motion`, so new motion cannot skip the guarantee. Full
  AppShell on the shadcn sidebar: collapsing 72px icon rail, the eight nav items
  in screens4 order, the beacon dot next to Today, org identity footer, top bar
  with title/context, notification bell (N1 quick glance), theme toggle, account
  menu, and the persistent plan/credit chip. Compositions: StatusBadge (+ draft,
  connection, job families), ClaimChip with `use-count-up`, StatCard, PageHeader,
  SlotChip, ToneBadge, EmptyState, ErrorState, five skeleton patterns,
  ConfirmDialog, the toast vocabulary, and the RHF+zod form layer. Rebuilt D1
  onto those primitives. `/dev/kitchen-sink` renders every primitive; added
  `e2e/design-layer.spec.ts` and `scripts/verify-w01.ts`.
- Phase: W1
- Files: `src/components/ab/*` (15 components + tests), `src/features/dev/dev-kitchen-sink.tsx`,
  `src/features/dashboard/dashboard-screen.tsx`, `src/styles/{tokens,globals}.css`,
  `src/lib/format.ts`, `src/app.tsx`, `src/data/provider.tsx` (session actions),
  `src/test/setup.ts`, `eslint.config.js`, `e2e/{design-layer.spec.ts,smoke.spec.ts}`,
  `scripts/verify-w01.ts`, `package.json`
- Decisions: see decisions.md — palette AA corrections; the `data-ab-motion`
  contract; RTL cleanup in setup.ts; `ignoreRestSiblings` (all 2026-07-27)
- Verify: verify:w01 green on all automated steps (lint, typecheck, 66 unit
  tests, guard-static, build, raw-color canary, 8 e2e incl. axe in light+dark,
  the reduced-motion sweep, the named-validation-message check and the keyboard
  walk, 1 skipped-for-W2). Manual items open: visual pass of the kitchen sink
  against design.md (still absent), and a real screen-reader walk.
- Notes: three bugs surfaced and were fixed at the source, not the call site.
  (1) axe caught `--muted-foreground` at 4.38:1 on muted surfaces, then
  `--success` at 4.47:1 and `--destructive` at 3.98:1 as small text on their own
  10% tints — the status-badge pattern; all darkened in `tokens.css`.
  (2) Testing Library never registers auto-cleanup when vitest runs without
  `globals`, so the DOM leaked between tests in a file — fixed centrally.
  (3) The rail's screen-reader text nearly duplicated D1's stat-card label;
  reworded so two surfaces do not read as the same control. Also made the
  count-up test deterministic (was racing jsdom's rAF clock at 2.8s of a 3s
  timeout) by driving the frames directly.
- Next: W2 — marketing + auth + onboarding (M1, A1–A5, N3).

### 2026-07-28 09:00 — Real brand palette + Barlow from the Alpha MENA kit; design.md written

- Did: read `Alpha MENA Branding Kit.pdf` (palette, Barlow, logo rules) and
  replaced the provisional system with the real brand. Wrote `design.md` as the
  visual system of record. Rebuilt `tokens.css` in OKLCH from the kit, switched
  the type stack to Barlow (Geist Mono kept for figures), rebranded the logo
  mark and favicon, and set the wordmark in Barlow caps per the kit's logo rule.
  Added `src/styles/tokens.test.ts`: it parses the real CSS, resolves OKLCH the
  way a browser does (sRGB gamut clamping, gamma-space alpha compositing) and
  asserts 49 contrast pairs, so the palette is guarded by a test rather than by
  review.
- Phase: W1 (brand pass; W2 not started, awaiting the visual review)
- Files: `design.md` (new), `src/styles/{tokens.css,globals.css,tokens.test.ts}`,
  `src/components/ab/app-shell.tsx`, `src/features/marketing/marketing-home.tsx`,
  `public/favicon.svg`, `e2e/smoke.spec.ts`, `scripts/verify-w01.ts`,
  `screens4.md` (font row), `package.json`
- Decisions: see decisions.md — real brand palette split by role; Barlow replaces
  Space Grotesk + Geist Sans; the palette is guarded by a test (all 2026-07-28)
- Verify: verify:w01 green on every automated step (lint, typecheck, 115 unit
  tests incl. 49 contrast assertions, guard-static, build, raw-color canary,
  8 e2e incl. axe in light + dark). Manual item open: the human visual pass.
- Notes: the kit's signature pink #FF1E57 fails AA as small text (3.77:1 on
  white, 3.24:1 on its own 10% tint), so the brand is split by role rather than
  diluted — `--brand` keeps the logo/gradient/glow/display type, `--primary`
  (#B1204A, the kit's deep rose darkened 0.017) takes all interactive text.
  Six tokens needed adjustment for AA; `design.md` Part 1.4 lists each with its
  reason. GitHub/domain/cert deliberately deferred at the user's request.
- Next: user's visual pass on /dev/kitchen-sink in both themes, then W2.

### 2026-07-28 12:45 — W2 shipped: marketing, auth, onboarding; verify:w02 green

- Did: built M1, A1–A5 and N3 on branch `w/02-marketing-auth-onboarding`.
  M1 is the full landing page (hero with a rendered product frame, social proof,
  four features, how-it-works, pricing, FAQ, CTA, footer) pricing from the same
  `usePlans()` Billing reads. Auth: a shared `AuthLayout`, a password meter with
  a live checklist, signup with the duplicate-email state, sign-in with a real
  lockout countdown, verify-email with a resend cooldown and expired-link
  recovery, and reset with non-enumerating copy plus the invalid-token path.
  A5 is the five-step wizard ending in "Start pipeline", which activates
  scheduling rather than soft-saving; the custom-tone sheet (I4's component,
  first of its three entry points) returns with the tone selected and the step
  intact. N3 resumes at the step actually reached. Added the `visitor` dataset —
  the only signed-out world — and wired the Authed / SignedOutOnly guards.
- Phase: W2
- Files: `src/features/{marketing,auth,onboarding,settings,system}/*`,
  `src/data/{provider.tsx,types.ts,datasets/visitor.ts}`, `src/lib/messages.ts`,
  `src/routes.tsx`, `e2e/onboarding.spec.ts`, `scripts/verify-w02.ts`,
  `package.json`
- Decisions: see decisions.md — no Arabic UI, and the two costs it does and
  does not defer (2026-07-28)
- Verify: verify:w02 green on every automated step (lint, typecheck, 134 unit
  tests, guard-static, build, the cap-declared-once check, deliverables, and 16
  e2e including the @golden signup → verify → onboard → dashboard walk and axe
  over marketing + both auth screens).
- Notes: two real bugs found by the specs. (1) axe caught the social-proof strip
  dimmed with `opacity-60`, which drops real text below AA — replaced with the
  muted token. (2) `page.goto` reloads the SPA and therefore rebuilds the default
  dataset, so any e2e that deep-links after switching worlds silently tests the
  wrong tenant; the spec now navigates only through in-app links and documents
  why. Also removed the W1-era skipped "marketing pages scan clean" placeholder,
  now that real marketing axe coverage exists.
- Next: W3 — Dashboard, Today queue, draft detail, media panel, schedule dialog
  (D1–D5).

### 2026-07-28 15:50 — W3 shipped: the review queue (D1–D5); verify:w03 green

- Did: built the queue on branch `w/03-today-queue`. Reducer first: draft
  approve/reject/edit, the media job lifecycle with real credit holds, and
  per-channel publish results — all status changes routed through one
  `transitionDraft` helper so the state machine is enforced once. D2 groups
  drafts by slot and computes every action from `canTransition`; D3 adds the
  timestamped timeline and judge score; D4 is Studio's composer draft-scoped,
  with the credit arithmetic on screen and an insufficient-credits refusal that
  preserves the prompt; D5 publishes per channel, showing a needs-reauth channel
  disabled with the fix inline while the others still go out. D1 gained the
  quick-links grid (mirroring the rail) and feed filters. Added the
  `low-credits` dataset, derived from `active` so only the money differs.
- Phase: W3
- Files: `src/features/today/*` (7 files), `src/features/dashboard/dashboard-screen.tsx`,
  `src/data/{provider.tsx,datasets/low-credits.ts,review-queue.test.ts}`,
  `src/routes.tsx`, `e2e/{today-queue.spec.ts,datasets.ts}`,
  `scripts/verify-w03.ts`, `package.json`, `.agent/open-items.md`, `CLAUDE.md`
- Decisions: none new
- Verify: verify:w03 green on every automated step (lint, typecheck, 145 unit
  tests, guard-static, build, the structural approval-gate check, the e2e
  navigation-rule check, deliverables, and 24 e2e including the @golden approve
  walk and axe over the queue and draft detail).
- Notes: the approval gate now has a STRUCTURAL check, not just a behavioural
  one — `verify-w03` reads `draft-card.tsx` and fails if the media control is
  rendered from a hand-rolled status comparison or carries `disabled`, because a
  test cannot tell "absent by the machine" from "absent by coincidence". The W2
  navigation rule is likewise enforced by the verifier now, and the dataset
  switcher moved into a shared `e2e/datasets.ts` (the old copy broke when asked
  to activate the dataset that was already active). Also removed a duplicate
  `h1` on D2 — the shell's top bar already titles the screen.
- Open items: `.agent/open-items.md` now carries the W1 screen-reader walk plus
  the three W2 manual checks, all still unsigned; W3 adds two more.
- Next: W4 — Calendar, schedule config, event sources, connections (C1–C4, B1–B3).

### 2026-07-29 07:50 — W4 shipped: calendar, scheduling, sources, connections; verify:w04 green

- Did: built C1–C4 and B1–B3 on branch `w/04-calendar-connections`. Started with
  `lib/timezone.ts`, which measures a zone's offset through `Intl` rather than
  tabulating rules, so a wall-clock slot resolves to the right instant on both
  sides of a DST change; Amman (fixed UTC+3 since 2022) and New York are tested
  together precisely because one moves and one does not. C1 reuses the W2
  pipeline fields rather than copying them, and holds edits locally so the
  sticky save bar and the router-level dirty guard are honest. C2 keeps a
  Google source's calendar choices when its token dies. C3 renders month and
  week, tints event days, and shows post-publish reach. C4 adds the event card,
  the same-day skip undo, and the performance section. B1 shows all four
  connection statuses with per-permission switches and the Facebook Page picker;
  B2 lists scopes and names what disconnecting costs; B3 handles success,
  denied, failed and already-connected as routed steps. Added the
  `needs-reauth` dataset.
- Phase: W4
- Files: `src/features/calendar/*` (5), `src/features/connections/*` (3),
  `src/lib/timezone.ts` + test, `src/data/{provider.tsx,types.ts,
datasets/needs-reauth.ts,entities/drafts.ts,calendar-connections.test.ts}`,
  `src/routes.tsx`, `e2e/calendar-connections.spec.ts`, `scripts/verify-w04.ts`,
  `package.json`, `.agent/open-items.md`
- Decisions: none new
- Verify: verify:w04 green on every automated step (lint, typecheck, 195 unit
  tests, guard-static, build, the structural Syncing check, the e2e navigation
  rule, deliverables, and 34 e2e).
- Notes: four real bugs, all found by tests rather than by reading.
  (1) The slot sheet held a SNAPSHOT of the slot, so skipping left it rendering
  its pre-skip self — it now derives from live provider state by id.
  (2) No slot in any world was skippable, because every slot already had
  drafts; the active dataset now carries upcoming empty slots, which is what a
  running pipeline actually looks like. A reachability sweep in the unit suite
  now fails if any W4 state becomes unreachable.
  (3) axe caught `opacity-50` on out-of-month day cells dropping date numerals
  to 2.37:1 — the third time dimming real text has broken AA in this codebase,
  so out-of-month days now recede via the surface instead.
  (4) `needs-reauth` only cleared metrics on one channel, so the aggregate still
  had a number and the "Syncing…" state was unreachable.
  Also: the schedule settings screen had no in-app route from a populated
  calendar — reachable only from the empty state, i.e. not reachable by anyone
  who already had a schedule. Added a toolbar link.
- Next: W5 — Studio + billing (E1–E4, H1–H4).

### 2026-07-29 08:10 — W5 shipped: Studio + billing (E1–E4, H1–H4); verify:w05 green

- Did: built Creative Studio and Billing on branch `w/05-studio-billing`.
  Started with `lib/params-schema.ts`, which turns a model's capability JSON
  Schema into form fields, and diversified the catalog so the four models
  publish genuinely different shapes (two enums; bounded int + float; a NUMERIC
  enum plus a boolean; free text plus a titled field). `params-form.tsx` renders
  from that and names no model or parameter anywhere. Extracted the composer
  into `use-composer.ts` + `composer.tsx` and rewrote D4 to render the SAME
  body inside its dialog — media-panel.tsx is now ~70 lines because the tool is
  shared. E1 gallery (kind + plan filters, gated models shown not hidden), E3
  jobs (beacon dot while running, origin tags), E4 asset detail (attach picker
  filtered to approved-or-later, generate-similar, delete confirm). H1–H4 with
  the ledger showing held rows distinctly, and the `past_due` banner in the
  shell gating generation and publishing product-wide. Added the `past-due`
  dataset.
- Phase: W5
- Files: `src/features/studio/*` (4), `src/features/billing/billing-screens.tsx`,
  `src/features/today/media-panel.tsx` (rewritten onto the shared composer),
  `src/lib/params-schema.ts` + test, `src/lib/draft-status.ts`,
  `src/data/{provider.tsx,types.ts,datasets/past-due.ts,studio-billing.test.ts,
entities/studio-models.ts}`, `src/components/ab/app-shell.tsx`,
  `src/routes.tsx`, `e2e/studio-billing.spec.ts`, `scripts/verify-w05.ts`
- Decisions: none new (the state-machine edge below is recorded in
  `draft-status.ts` itself, next to the transition table it changes)
- Verify: verify:w05 green on every automated step (lint, typecheck, 212 unit
  tests, guard-static, build, four structural checks, and 42 e2e).
- Notes: two real findings.
  (1) A MODELING GAP the attach picker exposed: `approved → media_ready` was
  not a legal transition, so attaching an existing asset was impossible. There
  are genuinely two routes to media — generate one (via `media_pending`) or
  attach one that already exists and was already paid for — and the machine
  only had the first. Edge added, with the reasoning beside the table.
  (2) A REGRESSION my own refactor caused, caught by a W3 test: with no model
  pre-selected, the composer started with empty params, so a required field was
  unset and Generate sat disabled for a reason nobody could see. Params are now
  seeded for whichever model is effectively selected, including the implicit
  first one.
  `verify-w05` adds four structural checks, the sharpest being that D4 and E2
  must both render the shared `ComposerBody` and neither may grow its own params
  form — the day someone copies the body to tweak it, the phase fails.
- Next: W6 — compose, analytics, settings, system (F1, G1–G2, I1–I7, N1, N2, N4).

### 2026-07-29 08:25 — Handoff pass: state.md written, stale docs corrected

- Did: added `.agent/state.md` — a single current-state snapshot (phase status,
  which branch holds the code, what W6 needs, the traps that have already cost
  debugging cycles, the structural checks each verify runs, open manual gates,
  and what is still parked). Registered it in `CLAUDE.md`'s structure table and
  in rule 1 as the first thing to read, and extended rule 10 so finishing a
  phase means updating it. Corrected the dataset list in `architecture.md`,
  `context.md` and `web-plan.md`: all three still named a `heavy` world that was
  never built and omitted `visitor`, which W2 added as the only signed-out one.
- Phase: between W5 and W6 (documentation only, no product code)
- Files: `.agent/state.md` (new), `CLAUDE.md`, `.agent/architecture.md`,
  `.agent/context.md`, `web-plan.md`
- Decisions: none
- Verify: lint + typecheck + guard-static green; 213 unit tests, 42 e2e
- Flagged for the reviewer: `main` is still at the docs commit and six commits
  behind `w/05-studio-billing`. The plan's PR-per-phase merge never happened
  because there is no remote yet, so anyone cloning and checking out `main`
  finds no product code. Needs either a fast-forward or the GitHub repo.
- Next: W6 — compose, analytics, settings, system (F1, G1–G2, I1–I7, N1, N2, N4).

### 2026-07-29 09:55 — W6: compose, analytics, settings, system (F1, G1–G2, I1–I7, N1, N2, N4)

- Did: built the last of `screens4.md`. **F1** streams a run word by word from
  `lib/compose-player.ts` replaying `data/compose-scripts.ts` — five outcomes,
  chosen by a word in the prompt so each designed state is reachable by typing
  rather than by a demo control in the product; a finished run becomes an
  ordinary `DraftCard` wired to D2's own actions, which meant extracting
  `use-draft-actions.ts` + `draft-dialogs.tsx` so the queue and compose share one
  action row instead of two. **G1/G2** carry the "Syncing…" rule into analytics:
  unsynced channels are excluded from the totals and the totals say so, a delta
  with no comparable prior period is absent rather than 0%, and LinkedIn's
  follower-only reporting gets the written explanation instead of an empty chart.
  **I1–I7** share one frame, one save bar and one dirty guard (extracted to
  `ab/save-bar.tsx`, C1 moved onto it); the tone editor became `ToneEditorForm`
  behind both the sheet and a routed page, and grew a Preview that shows brand
  voice and tone rules in force together. **N1** moved out of the shell with
  per-type icons and a real unread count; **N2** got the signal gradient and a
  secondary link that goes somewhere; **N4** reads the browser's real offline
  events, with degraded service forced from `/dev/states`.
- Also: deleted `Org.timezone` (nothing read it; `Schedule.timezone` is the
  single source screens4.md I1 asks for), gave LinkedIn a read scope that
  explains its `limited` series, extended the analytics series to 30 days so
  ranges have something to compare against, added `toneId` to published posts
  for G2's best-tone chip, and removed `PlaceholderScreen` — no route is a stub
  any more.
- Three things bit, and are now in `state.md`: Playwright's `getByText` is
  case-insensitive substring matching (a tone named "Roastery floor" matched a
  brand-voice rule about the roastery floor); an open Radix menu is modal, so the
  bell is `aria-hidden` while its own menu is open; and a structural check
  written against a sentence in JSX failed the moment Prettier wrapped the line —
  the check now matches structure, not prose.
- Phase: W6
- Files: `src/features/generate/*`, `src/features/analytics/*`,
  `src/features/settings/*`, `src/lib/compose-player.ts`,
  `src/data/compose-scripts.ts`, `src/data/entities/settings.ts`,
  `src/components/ab/{save-bar,notification-bell,offline-banner,stat-card}.tsx`,
  `src/features/today/{use-draft-actions.ts,draft-dialogs.tsx,today-screen.tsx}`,
  `src/data/{types.ts,provider.tsx}`, `src/routes.tsx`,
  `scripts/verify-w06.ts`, `e2e/compose-analytics-settings.spec.ts`, docs
- Decisions: see decisions.md — script catalogue chosen by the prompt · one
  timezone on the schedule · Preview composes and says so · offline real,
  degraded forced · Retry only where a retry could win · 404 points at your
  admins · the save bar and its guard are one component
- Verify: `verify:w06` green — lint, typecheck, 264 unit tests, guard-static,
  build, seven structural checks, 59 e2e including axe on generate, analytics,
  settings and knowledge
- Next: W7 — hardening and ship. First real work: the message-catalogue
  completeness test (MESSAGES grew a lot here), route-level code-splitting (the
  bundle is one ~1.2 MB chunk and vite already warns), and the full-app `@golden`
  walks. Lighthouse still needs the parked domain + certificate.

### 2026-07-29 10:40 — Repo pushed to GitHub; main fast-forwarded; open items regrouped

- Did: scanned the full history for secrets first (every blob on every branch —
  filenames, high-confidence key patterns, assigned secret literals, AWS ARNs;
  the only filename hits were `tokens.css`/`tokens.test.ts`, which are design
  tokens). Clean. Added `origin`
  (`github.com/alphapromena/alphabeacon-web`, private and empty — nothing to
  force-push over) and pushed all 8 branches; there are no tags. Fast-forwarded
  `main` through `w/00`→`w/06` with `--ff-only` one branch at a time, so a
  diverged branch would have stopped the run rather than merged silently, and
  pushed it. `main` is now `cfe6607`, verified from the server.
- Then: regrouped `.agent/open-items.md` by **sitting** instead of by phase —
  three sittings (viewport and environment · keyboard and screen reader · read
  it as a stranger), ordered so layout findings land before the semantics pass
  that they would otherwise invalidate. Widened the W1 screen-reader item to its
  real current scope: the shell, plus the six W3–W6 surfaces that carry their
  own semantics (F1's polite status line and its guardrail flag, G2's sortable
  table, I6's dropzone, I7's dialogs, the save bar's leave-guard).
- Correction: the outstanding count is **13**, not the fourteen I reported last
  turn. The pre-existing "eleven across W1–W5" was itself one over — the real
  figure was ten.
- Phase: between W6 and W7 (no product code changed)
- Files: `.agent/open-items.md` (rewritten), `.agent/state.md`,
  `.agent/decisions.md`, `web-plan.md`
- Decisions: see decisions.md — no retroactive PRs, `main` fast-forwards ·
  manual gates grouped by sitting
- Verify: not re-run (no source changed); `verify:w06` was green at `cfe6607`
- Next: **W7 does not start yet.** The reviewer is clearing all 13 manual gates
  first, so W7 begins with the debt at zero. When it does start: the
  message-catalogue completeness test, route-level code-splitting (one ~1.2 MB
  chunk today), the full-app `@golden` walks, and CI on the new remote — which
  has never run a workflow.

### 2026-07-29 12:30 — Manual-pass triage: six focus fixes, two honesty fixes, one proposal

- Did: fixed the six keyboard-focus defects the manual pass found, in the order
  given. (1) Settings became a nested ROUTE layout — each section used to render
  its own copy, so changing section unmounted the whole nav and focus fell to
  `document.body`; mounted once above an `Outlet`, the focused tab survives.
  The leave-guard dialog now remembers the last field focused inside the editing
  region and returns focus there. (2) `scroll-margin-bottom` in the base layer
  keeps the fixed save bar off the focused control (WCAG 2.2 §2.4.11). (3) Both
  hidden file inputs take `tabIndex={-1}`. (4) The six sections are a real
  tablist — roving tabindex, arrows, Home/End, manual activation. (5) The nav
  scroller gained the vertical room its focus ring was being clipped by, and
  adding a brand-voice rule now puts the cursor in the new row.
- Also (separate track): H3 states its arithmetic — granted / spent / held /
  balance, all computed by `reconcileLedger`. Writing the test found a real bug:
  the low-credits world charged 452 credits to a job that did not exist, so the
  biggest line on the screen rendered blank; it now names the run that spent it.
  G1's absent deltas now say WHY they are absent, distinguishing "no earlier
  window yet" from "the window was empty". Added a `quiet-week` dataset so a
  genuinely zero-post week can be looked at, and removed the `heavy` dataset id
  that was never built.
- Coverage added, because axe was green through all six focus bugs:
  `e2e/settings-a11y.spec.ts` (7 tests, one per defect, asserting real focus and
  real geometry), a `keyboard-focus rules hold` structural check in
  `verify:w06`, `src/features/billing/ledger.test.ts` (the reconciliation
  identity across every dataset), and quiet-week/comparison-note cases in
  `range.test.ts`.
- Two of my own checks were wrong on the first pass and are worth remembering: a
  length-capped regex in the verify script broke when a comment made the tag
  longer, and a `str.replace` matched inside a function call as well as the list
  it was meant to edit. Both are the same lesson already in `state.md` — match
  structure, not text.
- Phase: post-W6 remediation (W7 NOT started, at the reviewer's instruction)
- Files: `src/features/settings/*`, `src/routes.tsx`,
  `src/components/ab/{save-bar,stat-card}.tsx`, `src/styles/globals.css`,
  `src/features/billing/{ledger.ts,ledger.test.ts,billing-screens.tsx}`,
  `src/features/analytics/{range.ts,range.test.ts,analytics-screens.tsx}`,
  `src/data/datasets/{quiet-week.ts,low-credits.ts,index.ts}`, `src/data/types.ts`,
  `e2e/{settings-a11y.spec.ts,datasets.ts,compose-analytics-settings.spec.ts}`,
  `scripts/verify-w06.ts`
- Decisions: see decisions.md — seven entries dated 2026-07-29, plus the logged
  open question about whether D3 and Studio should show their shared pipeline
- Verify: `verify:w06` green — 296 unit tests, 66 e2e, all structural checks
- Open: the timezone/date proposal is written and awaiting a decision. Nothing
  in the product has been changed for it.
- Next: the reviewer decides on timezones; then W7.

### 2026-07-29 14:10 — Timezones and dates made honest; team roles closed a spec gap

- Did: all four approved timezone decisions. `components/ab/posting-time.tsx` is
  now the one place a posting time renders — the schedule's zone is the fact,
  the viewer's local time appears only when it genuinely differs (with its date
  when the day differs too), and the zone is labelled by OFFSET (`GMT+3`) rather
  than by abbreviation, because "AST" means both Arabia and Atlantic Standard
  Time and this product's operators publish to clients in either. The offset is
  what fits the tightest slot (a queue heading, a calendar cell), so it is used
  everywhere; the IANA name appears where there is room. Applied at the queue,
  draft detail, the timeline, the draft card and the slot sheet.
- Deleted the false claim: C4 said a slot time was "the time your audience
  sees". A connected page has followers in every zone and this product holds no
  data about where they are. Everything now says **posting time**.
- Dates outside the current year carry the year, in both `shortDate` and
  `formatDateInZone` — and the year is decided in the DISPLAY zone, which the
  test pins with a New Year's Eve case.
- Team roles: added the admin-only role select the spec never had. Promotion is
  immediate; demotion is confirmed; demoting the LAST admin is impossible — the
  option is absent, the reducer refuses it, and the row says to promote someone
  else first. Recorded as a spec gap found rather than a feature invented.
- Coverage: a `times are honest about zones` structural check (greps the feature
  tree for the audience claim with comments stripped, so the code that removed
  it may still quote it); e2e for the zone label and the deleted claim; e2e for
  the role change including the last-admin case; unit tests for the offset
  label across DST, the display-zone year rule, and the three role rules.
- Also recorded the lesson from the previous turn: `ledger.test.ts` was written
  for one identity and found an unrelated 452-credit charge pointing at a job
  that did not exist. The rule taken from it is in decisions.md — assert the
  surrounding invariants, not just the property in question.
- Phase: post-W6 remediation (W7 still NOT started)
- Files: `src/components/ab/posting-time.tsx` (new), `src/lib/{timezone,format}.ts`
  - tests, `src/features/today/{today-screen,draft-card,draft-detail-screen}.tsx`,
    `src/features/calendar/{slot-sheet,calendar-screen}.tsx`,
    `src/features/settings/team-screen.tsx`, `src/data/provider.tsx`,
    `scripts/verify-w06.ts`, `e2e/{calendar-connections,compose-analytics-settings}.spec.ts`
- Decisions: see decisions.md — four entries dated 2026-07-29 (the test lesson,
  posting times, the deleted audience claim, the I7 spec gap)
- Verify: `verify:w06` green — 306 unit tests, 68 e2e, all structural checks
- Next: **two manual gates are REOPENED** and must run against this build, not
  the old one — the 360px pass and the screen-reader walk, since the focus,
  tablist and posting-time work moved the semantics the walk exists to check.
  W7 waits for those.

### 2026-07-30 12:20 — M1 rebuilt as the cinematic scroll page (film generated, scrub built, laws extended)

- Did: replaced the basic M1 landing with the cinematic scroll experience,
  end to end in one turn — media generation through verification.
- Film: one hero reference image (charcoal void, grey noise, pink beacon)
  generated first, then six Seedance 2.0 clips (std/1080p/16:9/8s/silent) all
  referencing it: three takes of the assembly clip plus the macro glide, the
  morning desk, and the dawn beacon. **Take C** shipped as the scrub source
  (most monotonic build); all three takes are held for approval. The product
  footage is the REAL `/today` in the active world, recorded headlessly against
  the dev server. Everything compressed to ~8.7 MB of local static assets
  (H.264 CRF 26–30 faststart + a 200-frame 1600×900 WebP sequence).
- Page: hero scrub on canvas frames (coarse-to-fine loader, eased target,
  NEVER video currentTime), ALPHABEACON tracking in letter by letter, the
  Geist Mono HUD clock 06:58→07:00 with "Your drafts are ready." at the lock,
  ink→off-white seam, customer marquee (hover-paused, sr-only list), pinned
  DRAFT/APPROVE/PUBLISH over the macro clip, tone chips from `useTones()`
  morphing one sample (morph-only animation — an entrance fade put transient
  low-contrast text on screen and axe caught it), honesty counters through
  `useCountUp` (hero stat: 0 posts published without approval), the morning
  clip handing over to the real recording in a browser frame (controls always),
  pricing restyled but still `usePlans()`, the four FAQ items, and the dawn
  CTA "Wake up to tomorrow's posts.". Reduced motion removes the film
  wholesale; narrow viewports get the clip as an autoplay loop; 360px is
  overflow-free (wordmark clamp + nowrap fixed after the shot showed a wrap).
- Coverage: 6 e2e in `marketing-cinematic.spec.ts` (scrub+clock+canvas pixels,
  monotonic pillar reveal, real-tone morph with aria-pressed, pricing parity,
  reduced-motion sweep, 360px overflow) + front-door test updated; 10 unit
  tests (hud-clock, frame order/nearest/paths); 7 structural laws in
  `verify:w02` (currentTime ban, canvas+store, RM still path, Lenis guard
  order, usePlans + no local plan data, video props, media.ts inventory,
  ToneBadge+useTones) — comments stripped before matching, which its own first
  run proved necessary. The tokens.css comment trap (naming the dark selector
  inside :root broke the parser) is recorded under state.md rule 11.
- Phase: M1 revision under W2's verify (W7 still NOT started)
- Files: `src/features/marketing/marketing-home.tsx` (rewritten),
  `src/features/marketing/cinematic/*` (12 new), `src/styles/{tokens,globals}.css`,
  `public/marketing/*` (210 assets), `scripts/verify-w02.ts`,
  `e2e/{marketing-cinematic.spec.ts,onboarding.spec.ts}`, `design.md` Part 5,
  `package.json` (+lenis)
- Decisions: see decisions.md — four entries dated 2026-07-30 (the layer, the
  scrub law, lenis, one-reference film + take C)
- Verify: `verify:w02` green (lint, typecheck, 316 unit, guard-static, build,
  cap, cinematic laws, deliverables) + 74 e2e green + eyes-on-page screenshots
  at six scroll depths, reduced motion and 360px against the live dev server
- Next: the human — approve a clip-1 take (then one 4K re-render + re-extract,
  drop-in), and run the two REOPENED sittings, whose scope now includes M1
  (open-items.md). W7 waits for those.

### 2026-07-30 13:50 — INT-0: the API client, the mode switch, and the amended law

- Did: began the AlphaStudio integration. Step zero first: curled the deployed
  health endpoint — 200 `{"ok":true}` with `x-request-id` present. Built
  `src/api/` (config = the one file that reads `VITE_API_BASE_URL`; errors =
  the envelope as a typed `ApiError` switched on `code` with accessors for the
  two `details` shapes; client = Bearer injection, 401-with-token → one
  unauthorized hook fire, 429 → `retryAfterSeconds` surfaced never auto-retried,
  x-request-id sent + logged, 204 → undefined; session = `{token, expiresAt,
  user, orgs}` in localStorage/sessionStorage by `rememberMe`, expired records
  discarded on load). 18 unit tests pin all of it against a mocked fetch.
- The amendment, enforced three ways: `ab/no-network` gained
  `allowNetworkGlobals` scoped to `src/api/**` (http-literals still banned
  there); `guard-static` exempts only `fetch` and only under `src/api/`; the
  e2e fixture allows exactly one extra origin and only when the run exports
  the env var. Playwright's webServer PINS static mode with an explicit empty
  override, because vite would otherwise load `.env.local` under the suite.
- Docs wired: CLAUDE.md rule 2, architecture.md (diagram, network law, live-mode
  section, persistence, cheat sheet), context.md (one-liner, non-goals,
  external systems), stack.md (env table, first run), conventions.md (network
  rules). Two decisions recorded (the amended law; the client/401/429 design).
  Two backend/infra questions logged in open-items (CSP connect-src on deploy;
  postsPerDay 1–24 vs the product cap of 3).
- Phase: INT-0 (branch `int/00`)
- Files: `src/api/*` (7 new), `scripts/guard-static.ts` + test,
  `eslint.config.js`, `e2e/fixtures.ts`, `playwright.config.ts`, `.env.local`
  (gitignored), `docs/api/*` (committed contract), `.agent/*`, `CLAUDE.md`
- Decisions: see decisions.md — two entries dated 2026-07-30 (INT-0)
- Verify: lint + typecheck + 334 unit tests + guard-static (206 files) + build
  green; full static e2e 74/74 green WITH `.env.local` present (the pin works);
  health curl 200
- Next: INT-1 — auth end to end against the live API (branch `int/01`)

### 2026-07-30 14:10 — INT-1: auth end to end against the live API, every path green

- Did: wired the whole auth surface to AlphaStudio through one seam,
  `src/data/auth.ts` (`useAuthActions`) — screens call it, never `src/api/`
  (now ESLint-enforced: `@/api/*` is unimportable from features). Static mode
  reproduces the demo byte-for-byte through the same signatures.
- Provider: three live actions (`live/sessionEstablished` grafts the auth
  session onto the world via `src/data/adapters/auth-adapter.ts`;
  `live/sessionCleared`; `live/pendingVerification`), live boot from the
  persisted record (no session = genuinely signed out, never the demo's fake
  sign-in), dataset switches re-graft the live session, and `configureApi` is
  wired once: a token-carrying 401 purges, clears, toasts
  `errors.sessionExpired`, and lands on /login via history+popstate.
- Screens: signup posts for real (409 → the designed duplicate state;
  validation details land under their fields); the verify screen gained a
  REAL 6-digit code entry (input-otp) in live mode — verifying logs in — with
  the demo's stand-in button intact statically; sign-in gained rememberMe and
  the 403 email_not_verified routing; reset moved to the documented
  `?email&code` deep link (legacy `?token` kept for static walks); NEW
  `/accept-invite` screen per the contract; the account menu signs out
  through the seam and gained "Sign out everywhere" (logout-all).
- Found against the deployed API and logged in open-items: CORS blocks the
  documented client `x-request-id` header (client adapted: sends none, logs
  the server's); the stored session's `orgs` is a login-time snapshot (INT-2
  must boot-refresh /me + /me/orgs); org roles are three-tier vs our two
  (owner→admin collapse in the adapter, INT-2 to fix properly).
- Phase: INT-1 (branch `int/01`)
- Files: `src/data/auth.ts` + `src/data/adapters/auth-adapter.{ts,test.ts}`
  (new), `src/data/provider.tsx`, `src/features/auth/*` (5 screens + shared
  `auth-error.tsx`, `accept-invite-screen.tsx` new), `src/routes.tsx`,
  `src/components/ab/app-shell.tsx`, `src/lib/messages.ts` (+4 keys),
  `src/api/client.ts` (CORS adaptation), `eslint.config.js`,
  `e2e/live-auth.spec.ts` (new, @live-gated)
- Decisions: covered by the two INT-0 entries; gaps in open-items 3–6
- Verify: lint + typecheck + 340 unit green; static e2e 74 passed / 7 live
  skipped (the demo is intact, golden walk included); **live e2e 7/7 green
  against the deployed API** — signup→000000→auto-login, 429 countdown,
  vague 401, unverified-403 routing, deep-link reset revoking every session,
  logout + logout-all, accept-invite deep link, dead-token 401→toast→login
- Next: INT-2 — me + orgs + members + invites (branch `int/02`); its first
  job is the boot refresh of /me + /me/orgs (open-items 6)

### 2026-07-30 15:00 — INT-2: me + orgs + members + invites, live — the sync pattern lands

- Did: built the live-sync pattern the remaining phases ride on. On session
  establishment the provider refreshes `/me` + `/me/orgs` (the stored record
  is a warm start, rewritten in place — resolves open-items 6), then pulls the
  working org's members + invites and grafts them (`live-sync.ts`,
  `org-adapter.ts`); `useScreenPhase` maps to the REAL sync phase in live
  mode, and every error screen's Try again re-runs the sync (wired in the
  reducer, deterministically). Mutations go through two new data-layer seams —
  `team.ts` (invite/resend/cancel/setRole/remove/leave) and `account.ts`
  (profile name, change-password, createOrg, updateOrgName) — and resync on
  success rather than trusting optimistic patches.
- The deliberate reconciliation: `User.role` gained `owner` (types.ts is the
  named reconciliation point; the API's model is three-tier). The team screen
  now derives its powers from DATA: the tier that manages roles is the highest
  present in the world — owner live, admin in the static demo — so static
  behaviour is unchanged without a single mode check. Ownership transfer,
  the last-owner absent-option law, Leave on your own row (absent for the
  last owner, with the row saying why), and remove-precedence (owners remove
  anyone, admins remove members) all render from `ROLE_RANK`.
- Wizard completion now CREATES the org live (the resync flips the world onto
  it); I1's save PATCHes the org name (other org fields await the brand
  phase); I1 gained the live-only "Your account" section (name + change
  password) — logged as a spec gap, open-items 7.
- Three real defects found by the live run and fixed:
  1. StrictMode's mount-cleanup-mount deadlocked the boot sync (the cancelled
     first run held the once-per-key claim); the cleanup now releases it.
  2. I1 seeded its draft at mount, so a sync landing later never reached a
     pristine form — the async sibling of state.md rule 4; pristine drafts now
     adopt fresh truth, edited ones are never clobbered.
  3. Sign-out raced the in-flight sync: the revoked token's 401 echo fired the
     dead-session ceremony. The client now scopes deliberate logouts, ignores
     stale-token 401s, and logout-all with a dead token still signs out
     locally.
- Phase: INT-2 (branch `int/02`)
- Files: `src/data/{live-sync,team,account}.ts` (new),
  `src/data/adapters/org-adapter.ts` (new), `src/data/provider.tsx`,
  `src/data/types.ts` (role union — deliberate), `src/api/{types,session,client}.ts`,
  `src/features/settings/{team-screen,organization-screen,account-section}.tsx`,
  `src/features/onboarding/onboarding-screen.tsx`, `src/lib/messages.ts`,
  `e2e/live-team.spec.ts` (new), `e2e/{live-auth,compose-analytics-settings}.spec.ts`
- Decisions: the sync pattern is covered by the INT-0 entries' architecture;
  gaps and resolutions tracked in open-items 6–7
- Verify: lint + typecheck + 340 unit + guard-static (216 files) green; static
  e2e 74 passed / 12 live skipped; **live e2e 12/12 against the deployed API**
  (both journeys interleaved) — wizard-created org, PATCH rename surviving
  reload, change-password revoking others, new-user invite + 429 resend +
  cancel, existing-user immediate add, the full role ladder incl. ownership
  transfer and the last-owner laws, remove, and the dead-token ceremony
- Next: INT-3 — brand resources with the tone adapter (branch `int/03`)

### 2026-07-30 15:40 — INT-3: the brand kit live, with the honest tone adapter

- Did: wired all four brand resources through a new `src/data/brand.ts` seam
  and extended the live sync (`fetchBrand` joins `fetchTeam` under one
  `live/orgSynced` graft). Tones follow the adapter the user specified:
  `preset → kind`, description rendered, and the rules/example editors are
  ABSENT in live mode with `notices.brandFieldsPending` stating why — never
  smuggled into `description`. Voices carry the app's brand-voice rules as
  one flat list (each rule = one row); the don't/example editors are disabled
  with the same note. Sources round-trip with the scheme restored on write
  (assembled, not written — the house pattern from source-url) and stripped
  on read per the scheme-less law; topics keep replace semantics, diffed into
  row CRUD with an optimistic tag list. `source-url.ts` moved to `src/lib/`
  (the data layer needed it; features keep importing it).
- Tone deletion mirrors the documented cascade: the server drops the id from
  every schedule, the seam dispatches the local delete too, and the live e2e
  proves it against a harness-created schedule referencing the tone.
- All three ToneEditor entry points (tones screen, schedule config,
  onboarding) now save through the seam; the editor's zod relaxes to
  name+description in live mode since the rule requirement would demand
  fields with nowhere to go.
- Phase: INT-3 (branch `int/03`)
- Files: `src/data/brand.ts` + `src/data/adapters/brand-adapter.ts` (new),
  `src/data/live-sync.ts`, `src/data/provider.tsx`, `src/api/types.ts`,
  `src/lib/source-url.ts` (moved) + test, `src/features/settings/{brand-voice,
  tones,sources}-screen.tsx`, `src/features/settings/tone-editor.tsx`,
  `src/features/calendar/schedule-config-screen.tsx`,
  `src/features/onboarding/onboarding-screen.tsx`, `src/lib/messages.ts`,
  `e2e/live-brand.spec.ts` (new)
- Decisions: the adapter rules were set by the task owner (no smuggling;
  disable honestly; log the gap) — recorded in open-items 7
- Verify: lint + typecheck + 340 unit green; static e2e 74 passed / 17 live
  skipped; **live e2e 5/5 against the deployed API** — tone under the
  adapter surviving reload, flat voice rules persisting, sources scheme-less
  on screen and valid on the wire, topics diff-synced, and the
  tone-deletion → schedule cascade
- Next: INT-4 — schedules + event sources (+countries) + slots (`int/04`)

### 2026-07-30 16:10 — INT-4: schedules, event sources and slots live

- Did: the scheduling seam (`src/data/scheduling.ts`) + adapter with THE model
  table (`MODEL_ALIAS_BY_ID`: gm_balanced↔balanced, gm_creative↔fast,
  gm_precise↔quality — one table, used everywhere, pairing logged for the
  backend). The sync now grafts schedules/event-sources/slots alongside team
  and brand; C1 saves through POST/PATCH with toneIds replace semantics and
  per-field refusals surfaced; the countries endpoint feeds the add-source
  picker in live mode (Google absent — no API home); one-source-per-country
  409 told honestly; slot skip/un-skip PATCHes `{skip}` — the entire wire
  surface, so `approved` stays unreachable by construction.
- The wizard's Finish became `finishOnboarding`: org + the five preset tones
  (seeded with the wire's own `preset` flag — product law says presets are
  always present, and a fresh live org had none) + the collected schedule +
  holiday sources, in one action, because none of them could exist before
  the org did.
- The API's slots are event keep-or-skip records (date + title, no time);
  the adapter renders each as an event + decision-slot pair (review→pending,
  skipped→skipped, approved→done), time from the schedule's generateAt —
  presentation, not a wire fact.
- C1 gained the pristine-adopt effect (the server re-sorts toneIds, so the
  post-save resync used to re-dirty the form — the third screen fixed by
  that pattern).
- Phase: INT-4 (branch `int/04`)
- Files: `src/data/scheduling.ts` + `src/data/adapters/scheduling-adapter.ts`
  (new), `src/data/{live-sync,account,provider}.ts/tsx`, `src/api/types.ts`,
  `src/features/calendar/{schedule-config-screen,event-sources-screen,
  slot-sheet}.tsx`, `src/features/onboarding/onboarding-screen.tsx`,
  `e2e/live-scheduling.spec.ts` (new)
- Decisions: the model table + preset seeding recorded in open-items 8–10
- Verify: lint + typecheck + 340 unit + guard-static (220 files) green;
  static e2e 74 passed / 21 live skipped; **live e2e 3/3** (wizard creating
  org+schedule+source together; C1 PATCH surviving reload; countries picker +
  409 + add/remove) + the slot test honestly skipping until ingestion runs
- Next: INT-5 — notifications (`int/05`)

### 2026-07-30 16:45 — INT-5: the notification inbox live; the integration's first pass is COMPLETE

- Did: the inbox joined the sync (`fetchInbox`: the list + the unread-count
  endpoint together; the count is the badge's truth — the list is one page,
  the count is the whole inbox). The adapter treats `kind` as free-form per
  the contract: five known kinds keep their icons, anything else renders as
  the new `generic` type (types.ts gained it — the icon lookup also gained a
  fallback, closing the crash the INT-0 mapper flagged). `action` resolves
  defensively: only a rooted path becomes a link; a label or null goes home;
  a deleted subject's dead route lands on the designed 404 (N2's job).
  `read-all` is the one mutation (idempotent), through a seam that dims
  optimistically — including the endpoint-backed badge — then reconciles.
- The combined all-file live matrix trips the API's documented rate limits by
  design (five signups + wizards in a minute); the suites run per-spec, as
  each phase was verified. Noted in state.md.
- Phase: INT-5 (branch `int/05`)
- Files: `src/data/notifications.ts` +
  `src/data/adapters/notification-adapter.ts` (new), `src/data/live-sync.ts`,
  `src/data/provider.tsx`, `src/data/types.ts` (NotificationType + generic —
  deliberate), `src/api/types.ts`, `src/components/ab/notification-bell.tsx`,
  `e2e/live-notifications.spec.ts` (new)
- Decisions: covered by the contract's own rules (unknown kinds generic,
  defensive actions) — no new entries
- Verify: lint + typecheck + 340 unit + guard-static (222 files) green;
  static e2e 74 passed / 22 live skipped; live e2e 1/1 (list + unread-count +
  idempotent read-all against the deployed API, and the bell agreeing)
- Next: nothing in INT scope. The integration's six phases are done; the
  backend questions live in open-items 1–10, and W7 still waits on the two
  reopened manual gates.

### 2026-07-30 17:20 — Review fixes: viewer permissions from the workspace root

- Did (review item 1): the viewer's power no longer touches the members list.
  The sync fetches `GET /orgs/:orgId` and keeps the caller's OWN
  `membership.role` (`liveViewerRole`); `useTeamPermissions()` (team.ts) is
  the one place gates come from — canManageMembers, canSetRoles (owner-only
  on the wire; the demo's admins keep their demo power as a mode rule, not
  an inference), canGrantOwner, protectedTier, canRemove(target). The team
  screen consumes it; the members list now only ever describes TARGETS
  (which row is the protected tier's last). New live e2e: an ADMIN viewing a
  team with an owner gets no Remove on the owner's row and no role selects
  at all, keeps Invite member, and can Leave — 6/6 live-team green.
- (Review item 2): confirmed separate — `ApiUser.role` (platform, wire-only)
  never enters the app model; app `User.role` is the org membership role,
  per-org; doc comment on the type now says so explicitly.
- (Review item 3): confirmed no parsing — each voices row's `description` is
  one plain sentence read and written verbatim; the no-smuggling law is now
  stated in brand-adapter's doc comment.
- Model pairing: creative↔fast marked UNCONFIRMED in THE table's comment,
  pending open-items 9; balanced↔balanced and precise↔quality stand.
- Files: `src/data/{live-sync,provider,team}.ts/tsx`,
  `src/features/settings/team-screen.tsx`, `src/data/types.ts` (comment),
  `src/data/adapters/{brand,scheduling}-adapter.ts` (comments),
  `e2e/live-team.spec.ts` (+1 test), wizard-finish timeouts in all live specs
- Verify: lint + typecheck + 340 unit green; static e2e 74 passed; live-team
  6/6 against the deployed API

### 2026-07-30 17:50 — Integration closed out: int/00…int/05 merged to main

- Did: fast-forwarded `main` 1717492 → **b601622** through the whole stack
  (INT-0 client/law, INT-1 auth, INT-2 orgs+sync, INT-3 brand, INT-4
  scheduling, INT-5 notifications, + the review fixes). The `int/NN`
  branches stay pushed as the per-phase record, same culture as `w/NN`.
  state.md now shows the post-integration picture; two non-blocking
  close-out notes recorded in open-items (12: voices edit is delete+create,
  so an edited line jumps to the top on refetch — switch to PATCH-by-id if
  order ever matters; 13: the static-vs-live divergence on admin role
  powers is an explicit per-mode rule, logged as a product question for
  backend/product to settle).
- Final greens: lint · typecheck · **340 unit tests** (34 files) ·
  guard-static (222 files) · build · **static e2e 74 passed** (live specs
  self-skip) · live e2e against the deployed API, run per-suite: auth
  **7/7**, team **6/6**, brand **5/5**, scheduling **3/3** (+1 honestly
  gated on slot ingestion), notifications **1/1**.
- Phase: integration complete. Still static by design: drafts/Today,
  connections, Studio, billing, analytics, compose, knowledge (backend
  phase 2).
- Files: `.agent/{state,open-items,sessions}.md`
- Decisions: none new — the close-out notes are open-items 12–13
- Next: the backend answers in open-items 1–13 when they come; W7 remains
  parked behind the two reopened manual gates (360px pass + screen-reader
  walk, scope includes the cinematic M1).

### 2026-08-08 16:20 — The Malaky rebrand: STEP 0–4 on `rb/00-malaky`

- Did: full identity change AlphaBeacon → Malaky in five commits.
  **STEP 0** `01379f0` — `VITE_DEFAULT_DATASET` (validated against the
  registry, falls back to `DEFAULT_DATASET_ID`, unit-tested) + `vercel.json`
  (SPA rewrite, immutable `/assets/*`, 86400 for `/marketing/*` + `/brand/*`).
  Kit placed `e5509de` (recovered from the `.pages` bundle — see decisions).
  **STEP 1** `c663e2f` — full token rewrite (gold split by role; all 49
  contrast assertions green), Inter vendored, radius/shadow scales, favicon
  cropped from the wordmark, kitchen sink verified in both themes.
  **STEP 2** `bdab863` — name sweep (chrome lockups now carry the supplied
  wordmark; messages, comments, e2e assertions moved to Malaky/Inter);
  `package.json` + `ab-` internals stay by design.
  **STEP 3** `dc51825` — M1 rebuilt as the kit's §4 flow, calm motion law,
  real provider content; cinematic layer + 8.4 MB `public/marketing/` +
  `lenis` deleted; `verify:w02` laws rewritten for the calm page.
  **STEP 4** (this commit) — `design.md` rewritten as the Malaky system;
  three decisions entries; open-items: cinematic items retired, item 14
  (vector wordmark requested); state.md, screens4.md brand lines.
- Phase: rebrand (`rb/00-malaky`, same culture as w/NN + int/NN)
- Files: theme layer, marketing, chrome lockups, e2e specs, verify-w02,
  `design.md`, `.agent/{state,decisions,open-items,sessions}.md`,
  `screens4.md`, `Docs/brand/*`, `public/brand/*`, `vercel.json`
- Decisions: see decisions.md — the rebrand; Inter proposed pending founder
  confirmation; the cinematic M1 retired
- Verify: lint · typecheck · **332 unit** (30 files) · guard-static (206
  files) · build · **static e2e 68 passed / 23 live skips** ·
  `verify:w02 --skip-e2e` all PASS (M1 marketing laws hold)
- Next: ff-merge `rb/00-malaky` to `main`; founder confirms typography;
  vector wordmark from the designer (open-items 14)

### 2026-08-08 16:45 — Rebrand merged: main fast-forwarded to 1ef8744

- Did: `main` b601622 → **1ef8744** (ff through `rb/00-malaky`: STEP 0
  `01379f0`, kit `e5509de`, STEP 1 `c663e2f`, STEP 2 `bdab863`, STEP 3
  `dc51825`, STEP 4 `1ef8744`). Push to origin BLOCKED by a total outbound
  network outage (DNS timeouts to github.com and every host tried) — the
  same outage that forced the vendored-Inter workaround earlier. Both
  branches push clean once connectivity returns; state.md records it.
- Phase: rebrand complete on main
- Files: `.agent/{state,sessions}.md`
- Decisions: none new
- Verify: full chain green pre-merge (see previous entry); merge was ff-only
- Next: push `rb/00-malaky` + `main` when the network returns; founder
  confirms typography; vector wordmark (open-items 14)
