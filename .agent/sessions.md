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
- Next: founder confirms typography; vector wordmark (open-items 14).
  (The outage cleared minutes later — both branches pushed, main `72c2001`.)

### 2026-08-08 17:30 — rb/01-motion: amendment encoded; generation BLOCKED (tools absent)

- Did: cut `rb/01-motion` off main for the M1 cinematic layer (Apple-style
  product-as-glass-object). Encoded the motion-law AMENDMENT before building,
  per the brief: design.md Part 5 now carries two tiers (strict calm
  everywhere; "cinematic-calm" scoped to M1 with the forbidden list and the
  light-canonical rule), Part 6 rule 8 amended; conventions.md design-law
  summary trued up; open-items 15 bundles the founder confirmations (Inter,
  gold split, the amendment, the 3D-object direction). Captured the two
  Seedance UI references from the running app in the Malaky theme (dashboard
  + Today queue, Atlas Roasters world, static-mode server on :5174 — live
  mode's signed-out boot hides the app at '/'; scratchpad `m1-refs/`).
- **BLOCKED at the generation gate:** the `fable5-higgsfield` skill exists
  nowhere on this machine and the `claude_ai_Higgsfield` MCP connector (used
  for the 2026-07 footage) is not connected this session — verified via
  skills dirs, plugins, ToolSearch, and the session transcript. No credits
  spent; no engineering or verify-law changes attempted without footage
  (see decisions.md). Resume path recorded there.
- Phase: rb/01-motion, docs prefix only
- Files: `design.md`, `.agent/{conventions,decisions,open-items,sessions}.md`
- Decisions: see decisions.md — the motion-law amendment; the blocker record
- Verify: docs-only change — lint/typecheck/test unaffected (base page laws
  still the enforced tier; verify:w02 untouched by design)
- Next: user reconnects the Higgsfield connector + provides the
  fable5-higgsfield skill → hero image → clips 1–3 → engineering per brief

### 2026-08-09 08:00 — rb/01-motion resume attempt: gate still blocked (skill found, connector absent)

- Did: re-ran the generation gate. The `fable5-higgsfield` skill now exists
  (`~/.claude/skills/fable5-higgsfield-skill/fable5-higgsfield/` — nested one
  level too deep to register as an invocable skill, but SKILL.md and
  references/site-archetypes.md were read directly). The claude.ai Higgsfield
  connector is still absent: three ToolSearch registry sweeps found zero
  `mcp__claude_ai_Higgsfield__*` tools; the removed direct `higgsfield`
  server remains an unauthenticatable stub (OAuth incompatible with Claude
  Code by design). No generation attempted, no credits spent. Copied the two
  Seedance UI refs into the current session scratchpad `m1-refs/` as a
  backup, and killed the leftover :5174 static Vite server (PID 11384; port
  confirmed free).
- Phase: rb/01-motion, docs prefix only
- Files: `.agent/{decisions,sessions}.md`
- Decisions: see decisions.md 2026-08-09 — gate half-cleared, resume
  precondition sharpened
- Verify: docs-only change — lint/typecheck/test unaffected
- Next: user connects the **claude.ai Higgsfield connector** so its tools
  appear in the session registry (and ideally moves the skill folder up one
  level) → sweep → `models_explore` → balance → hero image with both refs →
  clips 1–3 → engineering → verify → merge

### 2026-08-09 08:45 — rb/01-motion: the gate cleared; film generated; cinematic layer SHIPPED

- Did: the whole generation-and-engineering arc in one sitting. Gate: the
  claude.ai Higgsfield connector surfaced (85 tools) and the
  `fable5-higgsfield` skill registered at its correct path — both halves of
  the 2026-08-08 blocker cleared. Generation exactly per the brief:
  `models_explore` confirmed `seedance_2_0` + `nano_banana_pro` (never
  guessed), balance checked (2513.5 cr), hero image generated first with
  BOTH UI refs, then 3 takes of the assembly clip + detail macro + calm
  pull-back, every clip referencing the hero + both refs. **Take B** chosen
  (monotonic build spread across the full duration; A dies at half-way, C's
  droplets read as particles). Spend 362 credits, preflighted.
- Engineering: `features/marketing/film/` (media.ts manifest, use-cinematic
  gate, scrub-hero canvas sequence, ambient-clip), 193-frame WebP scrub
  (4.8 MB) + two CRF-28 ambient clips, pinned workspace band, calm CTA
  film, light-canonical effect, stage-fade CSS under no-preference.
  `verify:w02` laws rewritten two-tier (cinematic primitives only in
  `film/`, gate affirmed positively, film paths only in media.ts, frame
  count asserted against disk, Lenis banned, currentTime banned); a
  `@reduced-motion` e2e proves the layer never mounts.
- Phase: rb/01-motion
- Files: `src/features/marketing/{marketing-home.tsx,film/*}`,
  `src/styles/globals.css`, `public/film/**`, `scripts/verify-w02.ts`,
  `e2e/onboarding.spec.ts`, `design.md`, `.agent/*`
- Decisions: two new — the footage record (take B, spend, jobs) and
  no-Lenis (frame easing over smooth-scroll dependency)
- Verify: `verify:w02` full run green (summary recorded in this entry's turn)
- Next: founder sign-off on open-items 15 (now including the footage);
  optional 4K re-render of take B for final frame re-extraction

### 2026-08-10 — rb/02-v1-brief: Abdullah's Website V1 implemented end to end (NOT pushed)

- Did: the full operating order for the V1 brief
  (`Docs/brief/malaky-website-v1-brief-abdullah.md`, committed verbatim).
  STEP 0: D1–D8 in decisions.md, motion law v2 + D5 palette exemption +
  §11 copy system in design.md Part 5, `Docs/brief/claims-map.md` (17
  claims, verdicts seeded from INT reality), open-items 16 (founder
  bundle: claims sign-off, Arabic copy review, pricing, push) and 17
  (§32 pillars recorded, app-side untouched).
- The build: `features/marketing/outputs/` — 4 demo brands (bilingual,
  fictional, own palettes scoped by the D5 eslint exemption), 7
  publication-ready mock post components with workflow chips (no fake
  engagement anywhere), the scroll-choreographed card engine
  (transform/opacity only, native scroll, rAF-eased, data-driven
  keyframes in story-layout.ts with its own unit suite), the S5
  Approve·Edit·Decline demo with the "Memory updated from your approval"
  touch, the §5 workspace showcase (pick a row, see the output), and the
  §20–§27 story sections including the EN/AR split screen. marketing-home
  rebuilt to the §33 flow; hero is "Your marketing, already done."; the
  film layer and `public/film/` are DELETED (D1 — masters archived);
  Pricing is out per D3 with the seam preserved in pricing-section.tsx
  (unlinked); FAQ is the §29 eleven, answered from the claims map; the
  dark CTA carries the wordmark prominently with the approval visual, no
  product-dashboard imagery.
- Gates: verify:w02 laws rewritten (see the gates-amendment decision);
  e2e updated + extended (front door, engine-never-mounts, native RTL,
  S5 approval); live-spec h1 assertions updated. Conscious deviation:
  §2c content-visibility rejected (breaks e2e visibility semantics;
  payload makes it moot) — logged in decisions.
- Counts: units 332 → 337 (+5 story-layout); static e2e 69 → 71 passed
  (+RTL, +S5) / 23 live skips. Payload: ~0.62 MB transferred (gz) vs the
  3.0 MB D4 budget; film's 6.3 MB reclaimed.
- Phase: rb/02-v1-brief, branch only — **deliberately NOT merged, NOT
  pushed**; both wait on the founder (open-items 16).
- Files: `src/features/marketing/**` (rebuilt), `scripts/verify-w02.ts`,
  `e2e/{onboarding,live-auth,live-team}.spec.ts`, `design.md`,
  `Docs/brief/*`, `.agent/*`
- Decisions: D1–D8, the gates amendment, the D5 mechanism
- Verify: full `verify:w02` green (71 e2e); summary in the run report
- Next: Abdullah walks the page; closes open-items 16; push on approval

### 2026-08-11 12:15 — Hero cards never freeze: ambient idle drift shipped (motion only)

- Did: added the continuous ambient layer to the hero card story on
  `claude/malaky-hero-cards-motion-om8r2t` (cut from `rb/02-v1-brief`'s
  tip). Scroll choreography untouched; each card gained a nested inner
  wrapper animated by `mk-ambient-drift` with its own duration, phase,
  distance and rotation (motion-tokens.ts). Hover pauses the hovered
  card; S5's approval moment pauses the company card; the mobile strip
  drifts at half amplitude; reduced motion removes the drift entirely.
  A founder message mid-session cut all other work (no new images, no
  Higgsfield assets, no design changes) — the five generated stills were
  dropped unused (decisions.md records the 10-credit spend), and early
  edits beyond motion (opacity hierarchy, workspace rework, pointer
  parallax) were reverted before commit.
- Phase: rb/02 follow-up (M1 only)
- Files: `src/features/marketing/outputs/motion-tokens.ts` (new),
  `src/features/marketing/outputs/scroll-story.tsx`,
  `src/styles/globals.css`, `design.md`, `.agent/{decisions,sessions}.md`
- Decisions: see decisions.md — Ambient idle drift: CSS keyframes on a
  nested wrapper, not more rAF
- Verify: lint+typecheck+test green (337); `verify:w02 --skip-e2e` PASS;
  marketing e2e (front door, both @reduced-motion, @axe marketing) 4/4;
  scripted browser protocol 11/11 (15 s idle drift with outer transform
  frozen, slow+fast scroll, hover pause, mobile strip drift, reduced
  motion: engine absent + animation-name none)
- Next: founder eyeballs the drift feel (amplitudes tune in one place,
  motion-tokens.ts); open-items 16 unchanged

### 2026-08-11 12:25 — Ambient drift to production (user-instructed)

- Did: on the founder's instruction, fast-forwarded `rb/02-v1-brief` to the
  ambient-drift commit (PR #2 merges by fast-forward — no merge commit,
  matching the repo's one-history rule) and promoted the resulting Vercel
  build to production. Production had been the 2a9b538 rb/02 build, which
  is why the cards only moved on scroll there.
- Phase: rb/02 follow-up (M1 only)
- Files: `.agent/sessions.md`
- Decisions: none
- Verify: covered by the previous entry (unchanged code, docs-only commit)
- Next: nothing — open-items 16 still governs the rb/02 → main merge

### 2026-08-11 12:30 — main fast-forwarded for the production deploy

- Did: the Vercel project's production branch is `main` (branch builds are
  previews; the earlier rb/02 production was a manual dashboard promote),
  so on the founder's "push it to production" the whole line —
  V1 page + ambient drift — was fast-forwarded onto `main`. One history,
  no merge commit; `rb/02-v1-brief` and the work branch point at the same
  sha. Production content is unchanged from what the founder already
  promoted, plus the drift. The open-items 16 sittings remain to be
  walked; state.md now says so against main rather than against a branch.
- Phase: rb/02 follow-up
- Files: `.agent/state.md`, `.agent/sessions.md`
- Decisions: none
- Verify: docs-only commit; code verified in the 12:15 entry
- Next: walk open-items 16 against production

### 2026-08-11 12:40 — Scroll no longer moves the cards (founder-directed)

- Did: second founder amendment of the day — "I don't want them to move on
  scroll." The engine's rAF pose interpolation is gone: every card now
  holds the RESTING fan (story-layout exports it; the scene layouts stay
  as the tested sampler vocabulary), styled once in JSX, with the ambient
  drift as the cards' only motion. The scroll listener survives solely to
  advance the copy beats — headline cross-fades, memory chips, the S5
  approval moment, the channel row all still ride the scene state.
  design.md tier-2 amended to match.
- Phase: rb/02 follow-up (M1 only)
- Files: `src/features/marketing/outputs/{scroll-story.tsx,story-layout.ts}`,
  `design.md`, `.agent/sessions.md`
- Decisions: none (founder instruction, recorded here and in design.md)
- Verify: lint+typecheck+test green (337); verify:w02 --skip-e2e PASS;
  e2e front door + both @reduced-motion + S5 approval + @axe marketing +
  @golden approve 6/6; browser check: card slot transforms byte-identical
  across a full scroll, copy beats advance, drift keeps running
- Next: founder eyeballs the resting fan on production

### 2026-08-11 13:00 — Ambient motion strengthened to full 3D (founder-directed)

- Did: third motion amendment of the day — "stronger ambient 3D motion,
  motion only." The engine's inner wrapper is now posed every frame by a
  rAF loop: per-axis sine waves at incommensurate frequencies give each
  card its own rotateX/Y/Z, drift, depth breathing and static depth layer
  under per-card perspective(1400px) (motion-tokens.ts holds profiles +
  the pure ambientTransform). Company card stays the calm anchor; hover
  eases damp↓/lift↑ (calmer, forward, +1.5%, soft shadow via CSS) and
  eases back; the S5 approval moment calms the company card the same way.
  Strip keeps the light CSS drift at 0.45 amplitude. Perspective sits
  inside each card's transform because the X slot's opacity (0.9) is a
  grouping property that would flatten preserve-3d for that card.
- Phase: rb/02 follow-up (M1 only)
- Files: `src/features/marketing/outputs/{motion-tokens.ts,scroll-story.tsx}`,
  `src/styles/globals.css`, `design.md`, `.agent/sessions.md`
- Decisions: none (founder instruction; mechanics recorded here + design.md)
- Verify: lint+typecheck+test green (337); verify:w02 --skip-e2e PASS;
  e2e 6/6 (front door, both @reduced-motion, S5 approval, @axe marketing,
  @golden approve); 30 s no-scroll observation: 11/11 distinct poses per
  card, full 3D transforms, never two cards in the same pose; hover scale
  eased to exactly 1.015 with rotations damped to ≤0.45°, eased back to 1;
  mobile strip alive; reduced motion mounts nothing
- Next: founder eyeballs the gallery feel on production; amplitudes tune
  in motion-tokens.ts

### 2026-08-11 13:30 — The hero becomes an orbital carousel (founder-directed)

- Did: fourth and definitive motion amendment — "the cards rotate around
  a central point." Independent floating is gone; the engine now runs ONE
  autonomous elliptical 3D orbit (motion-tokens ORBIT + pure orbitPose):
  six cards 60° apart, 28 s per revolution, horizontal radius resolved
  from the viewport (280–430 px) so the orbit lives in the hero's right
  side, vertical 70 px, depth 250 px. Depth drives scale/opacity/z-index
  per frame — cards pass in front of and behind each other; orientation
  stays viewer-facing (≤10°/3°/2°). Hover or the approval beat eases the
  orbit to ~0.45× (never stops) and lifts the hovered card. The angle
  integrates dt × eased speed, so slowdowns never jump. RESTING removed
  from story-layout (the fan is no longer a resting pose); strip and
  reduced-motion tiers unchanged.
- Phase: rb/02 follow-up (M1 only)
- Files: `src/features/marketing/outputs/{motion-tokens.ts,scroll-story.tsx,story-layout.ts}`,
  `design.md`, `.agent/sessions.md`
- Decisions: none (founder instruction; mechanics here + design.md)
- Verify: lint+typecheck+test green (337); verify:w02 --skip-e2e PASS;
  e2e 6/6; 20 s no-scroll observation: every card sweeps ~570–685 px
  horizontally and ~480 px in depth, the front-most card cycles through
  all six, opacity and z-index track depth, hover slows without stopping,
  reduced motion mounts nothing
- Next: founder eyeballs the showroom feel on production; period/radii
  tune in ORBIT (motion-tokens.ts). Mobile deliberately keeps the swipe
  strip so cards never cover the headline — a reduced mobile orbit is a
  follow-up if wanted

### 2026-08-11 14:00 — Cards become platform-native inside the Malaky wrapper

- Did: realism pass on post-cards.tsx (founder-directed; orbit untouched).
  Instagram: avatar header, artwork, like/comment/share/save glyph row,
  handle-led caption. LinkedIn company: square avatar, "Logistics
  company", 2h·globe, …see more, route graphic, action row. LinkedIn
  executive: round avatar, person/role header, text-first, action row.
  Arabic: fully RTL header/creative/actions/caption/CTA with native
  sectorAr. Newsletter: From/Subject chrome, hero band, body, CTA — reads
  as email. X: avatar, @handle·2h, short copy, glyph row, Coming soon
  kept. All states stay on the wrapper edge; no logos, no fabricated
  numbers (decisions.md).
- Phase: rb/02 follow-up (M1 only)
- Files: `src/features/marketing/outputs/{post-cards.tsx,demo-brands.ts}`,
  `.agent/{decisions,sessions}.md`
- Decisions: see decisions.md — Card realism: platform anatomy yes, logos
  and counts still no
- Verify: lint+typecheck+test green (337); verify:w02 --skip-e2e PASS
  (dir/lang law holds); e2e subset 7/7 twice (one flaky parallel axe run
  passed solo and in both reruns); hero screenshots at two orbit moments
  confirm each channel is recognizable without reading labels
- Next: founder eyeballs realism on production; Arabic strings (incl.
  sectorAr) join the open-items 16 native review

### 2026-08-11 14:40 — Full-fidelity platform posts (founder-directed)

- Did: the realism pass the founder asked for, no generated images.
  brand-logos.tsx: four inline-SVG fictional marks (Falak orbit, Zaytoun
  olive sprig, Nura arch, Meezan scales) filled from brand palettes.
  demo-brands.ts: followers lines + PLATFORM interface hues (scoped to
  the exempt module). post-cards.tsx: Instagram gains 4:5 designed
  creative, red-heart action row, "1,248 likes", caption, "View all 32
  comments", timestamp; LinkedIn company gains followers/globe header,
  SAME-DAY. BOTH WAYS. navy+orange creative with truck, reaction cluster
  "142" + "18 comments · 7 reposts", action row; executive post gains
  gradient person avatar + "98"/"12 comments"; Arabic post is fully RTL
  with Eastern-Arabic engagement (١٦٦ إعجابًا / التعليقات الـ٢٤) and a
  Ramadan creative; newsletter gains From/To/Subject chrome + branded
  email; X gains handle + reply/repost/like/views counts. Orbit, hero
  copy, Malaky chrome untouched.
- Phase: rb/02 follow-up (M1 only)
- Files: `src/features/marketing/outputs/{post-cards.tsx,demo-brands.ts,brand-logos.tsx}`,
  `.agent/{decisions,sessions}.md`
- Decisions: see decisions.md — Full-fidelity posts
- Verify: lint+typecheck+test green (337); verify:w02 --skip-e2e PASS
  (raw-color exemption still demo-brands-only, RTL law holds); e2e 7/7;
  hero screenshots confirm platform recognition without reading labels
- Next: founder eyeballs production; Arabic engagement strings join the
  open-items 16 native review

### 2026-08-11 15:30 — Production-readiness pass shipped (P0–P3)

- Did: the founder's 15-item production sprint. P0: route table lazy-loads
  everything but marketing (visitor JS 391→189 kB gzip measured on the
  built bundle; analytics/recharts split out), hero story 620→420 vh,
  orbit loop freed of per-frame viewport reads. P1: Today's Workspace is
  an interactive approval demo (Ready for review → Approved → Scheduled ·
  18:00 → Memory updated ✓, aria-live, local state only); How Malaky
  works is a connected journey (numbered stations, drawn progress line,
  one commanding step, auto-walk until the visitor picks); Memory plays
  the approval→learned ✓→Memory updated ✓ event; the calendar draws its
  timeline, activates Saudi National Day (12 days away) and SHOWS the
  prepared Nura teaser with "Prepared 12 days early ✓ / Ready for
  review". P2: CTA switched to the early-access launch model (decisions),
  /privacy + /terms shipped and linked (signup consent now links the real
  documents), production metadata + OG card + robots + sitemap on
  malaky.ai. P3: QA on the built bundle — LCP 316 ms local, CLS 0.003,
  6 requests, keyboard focus visible, engine at 1024+/strip below,
  /privacy loads directly.
- Phase: rb/02 follow-up (production pass)
- Files: `src/routes.tsx`, `src/features/system/legal-screens.tsx` (new),
  `src/features/marketing/**`, `src/features/auth/signup-screen.tsx`,
  `src/components/ab/form.tsx`, `index.html`, `public/{robots.txt,
  sitemap.xml,brand/og-malaky.png}`, `scripts/verify-w02.ts`,
  `e2e/onboarding.spec.ts`, `design.md`, `.agent/*`
- Decisions: see decisions.md — Production pass: code-split, early-access
  CTA, legal pages
- Verify: lint+typecheck+test green (337); full `pnpm e2e` 71 passed /
  23 live skips; verify:w02 e2e-inclusive PASS after the S5 spec learned
  the second approval loop
- Next: open-items 17 (counsel, mailbox, OG eyeball, CTA flip-back
  condition); Lighthouse on the deployed domain when convenient

### 2026-08-11 18:50 — Phase 2 code pass: brand-continuous demos, events, request-access

- Did: Phase 2 brief executed code-first, nothing generated (manifest
  gate honored — Docs/brief/asset-manifest-phase2.md awaits approval).
  How-works steps carry Falak visuals end to end (BrandLogo, chips, the
  Riyadh ⇄ Jeddah preview); Memory learns from an EDIT too ("Make this
  less promotional." → "Preference learned ✓", Content preferences row
  lights); the calendar adds Falak's own launch date (diamond "your
  date" marker) with its campaign already prepared; the facts panel is
  interactive (select a claim → its source highlights); two-voices got
  contrast labels + founder-story copy; the workspace preview animates
  between rows, the checkmark zooms in, and the header counts down
  "5 prepared · N to review · about N+1 min" to "Today's marketing:
  done ✓". New: `analytics.ts` (vendor-free track() seam, funnel events
  wired across hero/sections/FAQ/CTAs), `/request-access` (real fields,
  designed messages, "You're on the list." confirmation, buffered
  locally — open-items 18), `content-asset.tsx` (§26 css|image|carousel|
  video slot; the ONE legal <video> seam, constraints machine-checked in
  verify-w02 1f), dark final CTA gained a whisper brand-gold radial.
  Microcopy sweep: signup aside lost "co-pilot"; "no credit card" →
  "no card details" (§28 scanner). Golden e2e reaches signup via
  Sign in → Create an account; new request-access spec.
- Phase: rb/02 follow-up (Phase 2)
- Files: `src/features/marketing/{analytics.ts,request-access-screen.tsx,
  marketing-home.tsx}` (2 new), `src/features/marketing/outputs/
  {story-sections.tsx,workspace-section.tsx,content-asset.tsx}` (1 new),
  `src/routes.tsx`, `src/lib/messages.ts`, `src/features/auth/
  signup-screen.tsx`, `scripts/verify-w02.ts`, `e2e/onboarding.spec.ts`,
  `Docs/brief/asset-manifest-phase2.md` (new), `.agent/*`
- Decisions: see decisions.md — Phase 2: request-access flow, event
  seam, one legal video slot
- Verify: verify:w02 full PASS (lint, typecheck, 337 unit, guard-static,
  build, marketing laws, e2e incl. golden + axe); settings-a11y:197
  flaked once, green in isolation and on the full rerun
- Next: push + PR, fast-forward rb/02-v1-brief and main, verify
  production; Higgsfield generation only after manifest approval

### 2026-08-11 19:05 — Phase 2 shipped to production; malaky.ai DNS gap found

- Did: pushed ac49f67 to the work branch, fast-forwarded rb/02-v1-brief
  and main; draft PR #3 opened (PR #2 was already merged and cannot be
  reused). Vercel production READY on ac49f67 and verified serving the
  Phase 2 bundle (index-Bl6hwrHI.js, byte-identical hash to the local
  build) on alphabeacon-web.vercel.app and 1.malaky.ai. FOUND: the
  malaky.ai apex + www still resolve to GoDaddy Website Builder, not
  Vercel — the alias exists on Vercel's side but the registrar DNS was
  never cut over. Added to open-items 18; only someone with GoDaddy
  access can fix it.
- Phase: rb/02 follow-up (Phase 2)
- Files: `.agent/open-items.md`, `.agent/sessions.md`
- Decisions: none
- Verify: production HTML fetched and hash-compared; DNS resolved for
  malaky.ai / www / 1.malaky.ai
- Next: founder — approve the Higgsfield manifest, wire the
  request-access destination, cut malaky.ai DNS over to Vercel

### 2026-08-11 19:45 — Campaign photography lands in the cards

- Did: founder approved real campaign photography via platform mockups.
  Four WebP stills into `public/campaigns/` (85 kB total) rendering
  through the §26 ContentAsset slot; `campaign-photos.ts` maps brand →
  still via `photoFor(brand)` so Instagram, LinkedIn company, Arabic
  social, Facebook, newsletter and X each pick the right photograph from
  the brand they were handed. Type lockups stay live HTML over a palette
  scrim — crisp, translatable, RTL-correct. Meezan stays text-first.
  REJECTED from the same upload: the SpaceX/X post (real company, real
  person's account) — shipping it would claim Malaky produced SpaceX's
  marketing; Baker Tilly Saudi parked in open-items 19 pending the
  written permission the founder says exists. A generated rocket still
  was made for the X reference and dropped (no aerospace demo brand; a
  fifth brand would break the frozen set).
- Phase: rb/02 follow-up (photography pass)
- Files: `public/campaigns/*.webp` (4 new), `src/features/marketing/
  outputs/{campaign-photos.ts (new),post-cards.tsx,content-asset.tsx}`,
  `.agent/*`
- Decisions: see decisions.md — Campaign photography enters through the
  asset slot
- Verify: lint + typecheck + 337 unit + guard-static + build + M1
  marketing laws + W2 deliverables ALL PASS. e2e: the marketing specs
  pass; the suite as a whole is FLAKY ON THIS CONTAINER under full-suite
  parallel load (4 cores, load avg 2.6) — calendar-connections,
  design-layer:167 and settings-a11y:197 fail in varying combinations.
  PROVEN PRE-EXISTING: stashing this change and running the full suite on
  the previous commit fails the SAME three app-shell specs. A standalone
  full run earlier passed 72/72, and each spec passes in isolation. None
  touches the marketing route.
- Next: deploy; founder to supply the Baker Tilly permission document

### 2026-08-11 20:05 — The X post gets its brand: Orbital Reach

- Did: fixed the gap from the photography pass — `orbital-launch.webp`
  shipped but nothing referenced it, and the hero's X card still ran
  Falak's logistics copy. Added Orbital Reach as the FIFTH demo brand
  (satellite connectivity; deep-space navy + sky blue, its own SVG mark:
  planet limb, ascending trajectory, satellite at the tip — deliberately
  unlike Falak's flat orbit ring). XCard's post text became a `copy` prop
  (one card, any brand) and the hero now renders the Aurora-1 launch
  announcement over the rocket still. Founder's uploaded X mockup is now
  represented by a fictional brand end to end — no real company.
- Phase: rb/02 follow-up (campaign photography)
- Files: `src/features/marketing/outputs/{demo-brands.ts,brand-logos.tsx,
  campaign-photos.ts,post-cards.tsx,scroll-story.tsx}`, `.agent/sessions.md`
- Decisions: none new — extends the 2026-08-11 photography entry
- Verify: verify:w02 full PASS (lint, typecheck, 337 unit, guard-static,
  build, marketing laws, e2e incl. golden + axe); hero screenshot checked
  at 1440, zero non-200 responses under /campaigns/
- Next: nothing on this thread; founder gates unchanged (manifest,
  request-access destination, malaky.ai DNS, Baker Tilly permission doc)

### 2026-08-12 06:20 — Posts moved onto the platforms' own surfaces

- Did: founder review said the cards still read as generic SaaS mockups.
  Root cause was structural — every post sat on Malaky's ivory `bg-card`
  and inherited Malaky's ink. New `platform-chrome.tsx` + `PLATFORM_UI`
  publish each network's surface/ink/muted/border/accent as `--pf-*`
  vars through `PlatformFrame`; all chrome (headers, LinkedIn + Facebook
  reaction clusters, action rows, Instagram action bar, X counts row)
  reads from the platform. X is black, IG/LI/FB white, newsletter gets
  mail-client chrome with a brand masthead. Malaky's label + badge stay
  outside the frame. Executive card gets a drawn `PersonAvatar` portrait
  (not initials) and stays text-first with no banner. Brand logos now
  also sign each creative. Engagement became a structured prop on every
  card; brands gained `brandVoice`; `*Post` aliases added per §9.
  Fixed two content bugs found in QA: the Instagram CTA chip and the
  newsletter sender address were hardcoded to one brand, now derived.
- Phase: rb/02 follow-up (card realism)
- Files: `src/features/marketing/outputs/{platform-chrome.tsx (new),
  post-cards.tsx,demo-brands.ts,brand-logos.tsx,story-sections.tsx}`,
  `.agent/*`
- Decisions: see decisions.md — Posts render on the PLATFORM's surface
- Verify: verify:w02 full PASS (lint, typecheck, 337 unit, guard-static,
  build, marketing laws, e2e 72 passed incl. golden + axe + RTL law);
  hero, cross-channel and workspace screenshots reviewed at 1440
- Next: open-items 20 (platform logo trademark call) if the founder wants
  the real marks; hero orbit and motion untouched as instructed

### 2026-08-12 06:45 — Channel glyphs carry each platform's brand color

- Did: founder follow-up ("add the colors to each one logo"). PLATFORM_UI
  gained a `glyph` color per network and ChannelLabel now tints its icon
  with it — Instagram magenta #E1306C, LinkedIn #0A66C2, Facebook
  #1877F2, X near-black #0F1419, Arabic social on the Instagram hue
  (it renders in an Instagram frame), Newsletter a neutral #5E5E5E so it
  impersonates no single mail vendor. Colors only: the glyph artwork is
  still ours, so D6 holds and open-items 20 (real marks, trademark call)
  is unchanged.
- Phase: rb/02 follow-up (card realism)
- Files: `src/features/marketing/outputs/{demo-brands.ts,post-cards.tsx}`,
  `.agent/sessions.md`
- Decisions: none new — extends the 2026-08-12 platform-surface entry
- Verify: verify:w02 full PASS; labels checked at 2x on both card rows
- Next: nothing on this thread

### 2026-08-17 14:30 — INT-6: the new contract landed, the proxy law enforced, the shapes observed

- Did: the backend dev's 2026-08-17 contract replaced the old one whole
  (`api.md` + `openapi.json` 0.1.0 / 62 paths, new `changelog.md`, and the
  upstream `alphaprostudio.postman.json` as reference only). The Postman
  ENVIRONMENT is gitignored by name and by `*.environment.json` — it carries a
  live HMAC key; it was not in the tree, and now it cannot be.
- The client learned every shape the new surface uses: `PUT`; one
  `readSuccessBody()` rule for 204, the `202` receipts the async proxies answer,
  and the RAG delete's 200-with-a-body; an EMPTY success body resolving to
  `undefined` instead of throwing a raw SyntaxError past every catch site.
  `wallet_insufficient` (402) and `bad_gateway` (502) joined the codes, with
  `codeForStatus()` for the two places no envelope arrives — a gateway page and
  a presigned S3 PUT. A non-JSON 502 now reads as `bad_gateway`, which is the
  difference between "nothing changed" and "something went wrong on our side".
- `src/api/upload.ts` is the ONE non-API request the app makes (D-INT-A): no
  Bearer, exactly the signed `Content-Type`, url never composed locally.
- Ward's rule 1 became a build failure rather than an intention: guard-static
  bans `cloudfront.net`, `x-aps-`, the upstream v1 route prefix, `svc[_-]?key`
  and `edge[_-]?secret` in code under `src/`, and the `fetch` licence narrowed
  from all of `src/api/` to exactly `client.ts` + `upload.ts`. The new rules read
  CODE with comments removed, so docs may still name what code may not do.
  The first implementation was a string-aware lexer and it was wrong: one
  apostrophe in JSX prose opened a string it never closed and blanked the rest of
  the file — a guard that silently stops guarding. Replaced with a line-scoped
  scanner whose two blind spots can only lose a match, never invent one.
- `pnpm smoke:alphastudio` drove one fresh QA org through every proxy surface
  against the deployed API and wrote `Docs/api/alphastudio-shapes.md` verbatim.
  It earned its keep: `slot` is REQUIRED on a generate run, `embeddingModel` is
  REQUIRED on a RAG collection (api.md says optional for both), a draft's
  `toneId`/`rationale` live INSIDE `outputs[].content`, a media job's lifecycle
  is `queued → submitted → succeeded` (not a run's `completed`), a job response
  echoes the `modelAlias` a request is refused for sending, and the catalog rows
  carry `displayHint`, `cost`, `capabilitySchema`, `capabilities` and
  `appMetadata.min_plan` — none of it documented. All ten probed capabilities are
  granted, all four RAG media types extract, and CORS allows `PUT` and the new
  paths (but still not `x-request-id`, and it exposes no headers at all).
- **Two pre-existing failures found and fixed, not caused by this phase.**
  `keyboard-focus rules hold` (verify:w06) had been red since the 2026-08-11
  code-split, whose lazy loaders broke its regex — the law was intact, the check
  was stale; repaired to match structure. And two e2e specs flaked under
  parallel load because `count()` does not auto-wait and was serving as a
  readiness gate; both assert visibility first now. Confirmed both failures
  reproduce on the base commit before any of my code.
- Phase: INT-6 (branch `int/06-contract`, cut from `rb/02-v1-brief` `6c598b2`)
- Files: `Docs/api/{api.md,openapi.json,changelog.md,alphaprostudio.postman.json,
  alphastudio-shapes.md}`, `.gitignore`, `src/api/{errors,client,types}.ts`,
  `src/api/upload.ts` + `upload.test.ts` (new), `src/api/client.test.ts`,
  `src/lib/messages.ts`, `scripts/{guard-static.ts,guard-static.test.ts,
  smoke-alphastudio.ts (new),verify-w06.ts}`, `e2e/{settings-a11y,
  calendar-connections}.spec.ts`, `package.json`, `.agent/*`
- Decisions: see decisions.md — D-INT-A (proxy law + the one presigned-PUT
  exemption), D-INT-H (types from observed JSON), D-INT-D (plan vs schedule
  alias vocabularies), D-INT-E (money not credits), D-INT-B/C/F/G (the
  interpretations INT-7…10 build on), D-INT-I (what a live suite may spend)
- Verify: lint + typecheck + **355 unit** (33 files, +18) + guard-static (227
  files) + build green; **verify:w06 PASS**, **verify:w02 PASS**; static e2e
  **72 passed / 23 live skips**, four consecutive clean full runs after the flake
  fix. Smoke run green twice — wallet 5000 → 5000 text-only, 5000 → 4997 with one
  3-cent render under `LIVE_MEDIA=1` (exactly the catalog's advertised price).
  No live e2e spec: INT-6 ships no UI.
- Also noticed: the LOCAL `main` ref is stale at `3f9f3b4` while `origin/main`
  is at `6c598b2` (== `rb/02-v1-brief`), so a local `main..` comparison
  over-reports by 22 commits. Production has everything; only the local ref
  lags. Recorded in state.md.
- Next: INT-7 — brand rules live + I4's tone preview (`int/07-brand-rules`).
  For the founder first: the seven backend questions now in open-items 21–27.

### 2026-08-18 09:20 — INT-7: tone and voice rules go live; I4 previews for real

- Did: the adapter, the seam and both editors moved onto the rules the
  2026-08-17 contract added. Tones carry `{do, dont}` both ways (D-INT-C) and
  `PATCH { rules }` replaces the whole list, which is exactly what an editor's
  Save means — so the single-rule endpoints stay unused. The brand voice became
  ONE canonical row named `Brand voice` (D-INT-B), created lazily and PATCHed
  in place; reads flatten EVERY voice's rules in creation order, because that
  is the order the backend builds the context bundle in, so what I2 shows is
  what the next run is grounded on.
- The live-only tone schema is gone. It existed because requiring "at least one
  do or don't" would have demanded fields with nowhere to go; rules have a home
  now, so one schema serves both modes.
- `brandFieldsPending` → `brandExamplesPending`, naming only what is actually
  missing. A stale "everything is pending" note beside working editors trains
  people to ignore the notice that still matters. I2 also gained the I5 line,
  "Saved changes reach the next generation automatically" — true because every
  committed voice mutation re-pushes the context bundle server-side.
- I4's Preview is real in live mode: `posts/tones-preview` with `brandVoice`
  DELIBERATELY omitted, so the platform grounds on the org's pushed bundle —
  the same thing generation uses. The card says which it is showing ("A real
  sample, written in this tone just now" vs "Composed from what you have
  typed"), and the rule list stays beside it in both modes. A 502 becomes
  "save your brand voice first"; 429 gets its own line.
- The wizard's preset seeding now sends each preset's rules, so a seeded
  preset is a whole tone rather than a name and a sentence.
- `composePreview` moved to `src/lib/tone-preview.ts` as `composeTonePreview`:
  the data layer calls it now, and a feature is the wrong home for that.
- Phase: INT-7 (branch `int/07-brand-rules`, cut from `int/06-contract`)
- Files: `src/data/adapters/brand-adapter.ts` (rewritten) + its new test,
  `src/data/{brand,provider,account}.ts(x)`, `src/lib/{messages,tone-preview}.ts`,
  `src/features/settings/{brand-voice-screen,tone-editor}.tsx`,
  `e2e/live-brand-rules.spec.ts` (new), `e2e/live-brand.spec.ts`, `.agent/*`
- Decisions: see decisions.md — D-INT-C in practice (one tone schema, where
  `example` went, the preview's omitted brandVoice)
- Verify: lint + typecheck + **365 unit** (+10) + guard-static (228 files) +
  build green; **verify:w06 PASS**; static e2e **72 passed / 28 skips**;
  **live e2e `live-brand-rules` 5/5**, and `live-brand` re-run **5/5** after
  updating the two assertions that pinned the INT-3 restriction.
- Also recorded: Ward's answer that event-sources/slots ARE superseded by
  country + holidays, against open-item 21(a), to be applied in INT-8.
- Next: INT-8 — org country + holidays, with the addendum's amendments
  (`int/08-country`).

### 2026-08-18 10:05 — INT-8: the country becomes the only holiday control

- Did: applied the founder's addendum (Ward confirmed 2026-08-17 that
  event-sources and slots ARE superseded, and that the backend feeds holidays
  into scheduling itself). Live mode now reads the schedule and the holiday
  calendar and NOTHING else — `fetchScheduling` makes no event-source and no
  slot call at all, because two round trips whose answers the product no longer
  acts on are worse than none. The INT-4 adapters for both stay in the
  codebase for the static demo, annotated as retired on the live path.
- `PUT /orgs/:orgId/country` behind a shared `CountryPicker` used in three
  places (wizard step 3, I1, C2). It holds the ~10 s lookup with a calm busy
  label, refuses a double press, disables Save when nothing would change, tells
  a `reloaded: false` no-op apart from a real load, turns a 502 into "nothing
  changed" and a 400 into a field error. Members see it read-only.
- `fetchHolidays` paginates to `total` — a year of holidays can run past one
  page, and a calendar that stopped in March would look like the rest of the
  year had no occasions. C3 renders each holiday as an occasion; one with
  guidance is a button that opens the new read-only `OccasionSheet` ("How
  Malaky will treat this day"), with do, don't, and unknown kinds rendered as
  generic guidance rather than dropped or guessed into the wrong half.
- The wizard's order is now org → preset tones (with rules) → schedule with
  the REAL tone ids the seeding minted → country. That closes the `toneIds`
  half of open-items 10: verified on the wire as `["186","187","188","189","190"]`.
- **The live run found a real bug the static suite structurally cannot:** C3's
  empty state was keyed on slots alone, so with slots gone from the live wire a
  calendar full of real holidays rendered "Nothing scheduled yet" and hid them.
  Empty now means empty — the grid shows if EITHER slots or occasions exist.
- Phase: INT-8 (branch `int/08-country`, cut from `int/07-brand-rules`)
- Files: `src/data/adapters/scheduling-adapter.ts` (+ `holidays.test.ts`),
  `src/data/{live-sync,scheduling,account,provider,types}.ts(x)`,
  `src/components/ab/country-picker.tsx` (new),
  `src/features/calendar/{occasion-sheet.tsx (new),calendar-screen,event-sources-screen}.tsx`,
  `src/features/settings/organization-screen.tsx`,
  `src/features/onboarding/onboarding-screen.tsx`, `src/lib/messages.ts`,
  `e2e/live-country.spec.ts` (new), `.agent/*`
- Decisions: see decisions.md — D-INT-F marked CONFIRMED, plus the INT-8 entry
  (country set last, the control outside the save bar, the empty-state bug)
- Verify: lint + typecheck + **370 unit** (+5) + guard-static (231 files) +
  build green; **verify:w06 PASS**, **verify:w04 PASS**; static e2e **72 passed
  / 32 skips**; **live e2e `live-country` 4/4**.
- Next: INT-9 — wallet + usage (`int/09-wallet`).

### 2026-08-18 10:55 — INT-9: live mode shows money, and the arithmetic is exact

- Did: the wallet joined the org sync (`fetchWallet`, non-fatal on failure) and
  got a provider slice plus a `useWalletActions` seam with `refresh()` and a
  `usage()` whose grain type makes `tenant` a COMPILE ERROR rather than a
  review note — it reports across every org of this app, so it can never back
  an end-user chart.
- `src/lib/money.ts` is new and is the reason no screen calls `parseFloat` on
  money: integer cents for the wallet, exact BigInt addition for the
  twelve-decimal `costUsdEstimate` strings, and `< $0.0001` instead of
  `$0.0000` for a real charge too small to show — a charge displayed as zero is
  the one output nobody can act on. Ten unit tests, including the smoke run's
  own five captured values summing to `$0.0055`.
- The balance chip and dashboard tile show `availableCents` (the number the
  next request is checked against), add a "reserved" clause when `heldCents`
  is non-zero, and read "funding pending" on an all-zero wallet rather than
  claiming an empty one. H3 in live mode became balance + a real metering
  read-back with a capability/model toggle; H1/H2 carry an honest note that
  plans and checkout are not connected.
- `InsufficientBalance` (the 402 state) is built and unit-covered but NOT yet
  mounted: no live surface can produce a 402 until F1 generates (INT-10) and E2
  renders (INT-11). Wiring it into static screens that never make a request
  would be dead code, so it lands with the surfaces that can raise it.
- **The live run found the credits vocabulary leaking:** the dashboard tile
  still said "Credits balance" over a wallet holding $50.00, and the rail said
  "Plan and credits". Both split by mode now, and the spec asserts no credits
  wording survives into live mode at all.
- Also observed: `holidays.lookup` IS metered (three units in the usage table)
  though it does not draw the wallet down — so a fresh org has usage rows
  before it has generated anything. Recorded in decisions.md.
- Phase: INT-9 (branch `int/09-wallet`, cut from `int/08-country`)
- Files: `src/lib/money.ts` + test (new), `src/data/wallet.ts` (new),
  `src/data/{provider,live-sync}.ts(x)`, `src/components/ab/{app-shell,
  insufficient-balance (new)}.tsx`, `src/features/billing/{billing-screens,
  usage-view (new)}.tsx`, `src/features/dashboard/dashboard-screen.tsx`,
  `src/lib/messages.ts`, `e2e/live-wallet.spec.ts` (new), `.agent/*`
- Decisions: see decisions.md — INT-9 (two currencies, exact arithmetic,
  tenant unreachable by type, unit displayed as it arrives)
- Verify: lint + typecheck + **380 unit** (+10) + guard-static (236 files) +
  build green; **verify:w05 PASS**, **verify:w06 PASS**; static e2e **72 passed
  / 36 skips**; **live e2e `live-wallet` 4/4**. Wallet unchanged at 5000 cents
  across the suite — it reads and meters, it does not spend.
- Next: INT-10 — on-demand generate F1 (`int/10-generate`).

### 2026-08-18 11:35 — INT-10: F1 runs for real, and its results are read-only

- Did: `src/data/generate.ts` (the seam + the localStorage run ledger) and
  `live-generate.tsx` (the live F1). A run is queued, polled 1.5s → 3s → 5s and
  then steady, and stops at 90 s with "still working — see Recent runs" rather
  than an error, because the run really is still going. Drafts come from the
  OBSERVED shape: `toneId` and `rationale` read from inside
  `outputs[].content`, which is the single detail that would have failed
  silently had the types come from prose.
- The action row is Copy + Create visual. Approve/decline/schedule are absent,
  not disabled — there is no drafts wire to record them in. Flags,
  attributions and rationale render whenever present.
- `slot` is required and built from now in the schedule's timezone; the
  over-budget fan-out is refused client-side so a 400 becomes a sentence.
- **A bug the static suite structurally could not find:** the poll's unmount
  guard shared an effect with an `orgId` dependency, so the first orgId change
  latched `cancelled` to true and every later poll returned at its first check.
  The screen sat on "Writing your drafts…" with nothing to show. Nothing in
  static mode polls. Fixed by giving the guard its own dependency-free effect,
  and recorded in decisions.md as a shape that recurs.
- Phase: INT-10 (branch `int/10-generate`, cut from `int/09-wallet`)
- Files: `src/data/generate.ts` + test (new),
  `src/features/generate/{live-generate.tsx (new),generate-screen.tsx}`,
  `src/lib/messages.ts`, `e2e/live-generate.spec.ts` (new), `.agent/*`
- Decisions: see decisions.md — INT-10 (two interactions behind one route, the
  screens4 F1 deviation, the latched-guard bug)
- Verify: lint + typecheck + **391 unit** (+11) + guard-static (239 files) +
  build green; **verify:w06 PASS**; static e2e **72 passed / 38 skips**;
  **live e2e `live-generate` 2/2** — one balanced run, one tone, perTone 1,
  re-pulled from the ledger after a reload in the same context.
- Next: INT-11 — Studio media + knowledge (`int/11-studio-knowledge`).

### 2026-08-18 12:40 — INT-11: the Studio and Knowledge go live; the second pass closes

- Did: `src/data/studio.ts` (media + knowledge seams) and four live surfaces —
  E1 gallery, E2 composer, E3/E4 jobs and assets, I6 knowledge. E1 renders
  nothing that was not read from the catalog: `displayHint` is the card name,
  `cost` is the price, `appMetadata.min_plan` is the plan badge, and E2's
  params form is generated from each model's `capabilitySchema`. None of those
  four fields is in api.md; all four came from the smoke run.
- A composer ships only for `media.generate`, `social-posts.media` and
  `images.edit` (amendment 6). The other five granted capabilities are listed
  as coming soon rather than given a guessed body; they are now open-item 28
  with their observed schemas already captured.
- I6 creates the org's one `knowledge` collection lazily (duplicate → 400 →
  list → reuse, exactly as the smoke run proved), takes a file, a URL or
  pasted text, and polls each source through Uploading → Processing → Ready,
  showing `deduped` and `failureReason` as they arrive.
- **open-item 24 is ANSWERED: S3 CORS allows the browser PUT.** Proven in
  Chromium against the live buckets, not argued from the Node result. Both the
  file upload and the reference-image door are real surfaces.
- **The network law's exemption widened, narrowly and on purpose.** Showing a
  render needs a presigned GET as well as the presigned PUT, because the
  platform hands finished jobs presigned urls precisely so the client loads
  them. The e2e predicate is now "a url carrying the AWS SigV4 signature OUR
  API issued", live mode only; an unsigned request to any host still fails.
- Found while proving E4: arriving from the composer named a job in the query
  string, so it was already "open", its Open button never rendered, nothing
  minted its asset url, and a finished render sat there invisible. It now
  opens itself the moment it settles.
- Phase: INT-11 (branch `int/11-studio-knowledge`, cut from `int/10-generate`)
- Files: `src/data/studio.ts` + test (new),
  `src/features/studio/{live-gallery,live-composer,live-jobs}.tsx` (new) +
  `studio-screens.tsx`, `src/features/settings/{live-knowledge.tsx (new),
  knowledge-screen.tsx}`, `src/lib/messages.ts`, `e2e/fixtures.ts`,
  `e2e/{live-studio,live-knowledge}.spec.ts` (new), `.agent/*`
- Decisions: see decisions.md — INT-11 (the catalog is the gallery, the
  widened exemption, the composer split)
- Verify: lint + typecheck + **395 unit** (+4) + guard-static (245 files) +
  build green; **verify:w05 PASS**, **verify:w06 PASS**; static e2e **72 passed
  / 45 skips**; **live e2e `live-studio` 4/4** (including one real render under
  LIVE_MEDIA=1, E2 → E3 → E4) and **`live-knowledge` 3/3**.
- Next: nothing — INT-6…INT-11 are complete. Close-out report to the founder;
  nothing merged, nothing pushed.

### 2026-08-19 09:20 — INT-12: Today becomes the proposals ledger

- Did: landed the 65-path contract, then built Today as a JOIN — ledger →
  unique runIds → run reads → outputs matched by the `proposalId` stamped on
  them (D-INT-J). Tabs for pending/approved/declined, the header count from
  the ledger, decisions through approve/decline, and the whole thing derived
  from the platform rather than from anything this browser remembers.
- **INT-10's localStorage run ledger is retired** (D-INT-G amended). It only
  ever existed because nothing server-side indexed an org's runs; the
  proposals ledger does, so F1's "Recent runs" is now proposals grouped by run
  — shared, cross-device, and including runs this frontend never started.
- Approve = "approve and record as posted" (D-INT-K), with a deterministic
  `publishedId` of `mlk_<proposalId>` so a double click or a reload converges
  on the documented safe retry instead of racing into a 409. A confirm
  precedes it because the record is permanent. Decline asks why (≤500) and is
  reversible. Edit is absent with a reason (D-INT-L) — there is no drafts
  store to persist one into.
- **STEP 0 found a real backend bug.** Walking the cursor showed keyset paging
  compares on the TIMESTAMP alone, though the cursor itself carries the
  tie-breaking id. Rows sharing a creation instant are skipped — and proposals
  from one run are created together, so a boundary inside a run's cluster
  drops drafts from the review queue with no error to notice. Measured:
  `?limit=1` walked 2 of 3 rows; `?state=pending&limit=1` walked 1 of 2 and
  returned an empty second page. INT-12 is designed around it — the walk only
  DISCOVERS runIds, and `?runId=` (boundary-free at these sizes) is the
  authoritative read — so the queue is correct today and gets simpler the
  moment the tie-break is fixed. Open-items 32.
- Two Playwright traps recorded in state.md: `getByRole(name)` is substring
  matching too (a click on 'Approve' hit the 'Approved' tab), and a shadcn
  ConfirmDialog is `alertdialog`, not `dialog`.
- Phase: INT-12 (branch `int/12-proposals`, cut from `int/11-studio-knowledge`,
  with the `probe/proposals` record cherry-picked in and marked superseded)
- Files: `Docs/api/{api.md,openapi.json,changelog.md,alphastudio-shapes.md}`,
  `src/api/types.ts`, `src/data/proposals.ts` + test (new),
  `src/data/generate.ts` (+ test) with the ledger removed,
  `src/features/today/{live-today.tsx (new),today-screen.tsx}`,
  `src/features/generate/live-generate.tsx`, `src/lib/messages.ts`,
  `e2e/live-proposals.spec.ts` (new), `.agent/*`
- Decisions: see decisions.md — D-INT-J, D-INT-K, D-INT-L (and D-INT-G amended)
- Verify: lint + typecheck + **394 unit** (38 files) + guard-static (248 files)
  + build green; **verify:w02/w03/w04/w05/w06 PASS**; static e2e **72 passed /
  49 skips**; **live e2e `live-proposals` 4/4** — including the reload that is
  the whole point of the phase. Two text runs (the second so a decline had
  something pending to act on).
- Next: nothing queued. Founder decisions: the "Approve" label (D-INT-K), and
  the backend questions 29–32.

### 2026-08-19 10:05 — INT-6…12 merged to main and pushed (founder-approved)

- Did: on the founder's explicit approval for exactly the named refs,
  fast-forwarded `main` from `6c598b2` to `c6e3489` — the whole live
  integration, 14 commits, no merge commit, one history — and pushed it, then
  pushed the seven phase branches as the per-phase record. `probe/proposals`
  was deliberately not pushed: it is superseded and its content already lives
  in `int/12` as the cherry-picked `ee2bc57`.
- Premise verified before touching anything: `origin/main` was still
  `6c598b2`, and `origin/main` is an ancestor of `int/12-proposals`, so the
  fast-forward was legitimate rather than assumed.
- Pre-push audit, all clean: the secrets grep over the whole stack diff found
  nothing; no `environment.json` or `.env*` file is tracked; the tip's
  `.gitignore` carries `alphaprostudio.environment.json`, `*.environment.json`
  and `.env.*`; the proxy-law grep over the `src` diff (`cloudfront.net`,
  `x-aps-`, `svcKey`, `edgeSecret`, the upstream v1 prefix) found nothing.
- The gate was run on the MERGED tip with `.env.local` renamed away, so the
  build was the exact static artifact production gets: lint, typecheck, 394
  unit, guard-static (248 files), static e2e 72 passed / 49 skips with the
  zero-network assert, build, and verify:w02/w03/w04/w05/w06 all PASS.
  `dist/` is 2.3 MB across 111 files and contains no API base url — the sole
  mention of `VITE_API_BASE_URL` is the client's own "called in static mode"
  error string, which is a diagnostic, not a value. `.env.local` restored after.
- **Production remains static on purpose.** Vercel holds no
  `VITE_API_BASE_URL`, so this push ships the same zero-network app; live mode
  for the team is a separate order (env var + CSP `connect-src`, open-items 1).
- Phase: close-out of INT-6…12 (no code change)
- Files: `.agent/state.md`, `.agent/sessions.md`
- Decisions: none new
- Verify: the full gate above, on the merged tip, before the push
- Next: founder decisions — the "Approve" label (D-INT-K) — and backend
  questions 29–32. Nothing else queued.

### 2026-08-19 11:55 — live staging branch, and the production front door hardened

- Did: three things, in the order they had to happen.
  1. **CORS probed from every deploy origin** before writing any code: the API
     echoes ANY `Origin` back (`allow-methods: *`,
     `allow-headers: content-type,authorization`), verified from the `live`
     preview host, a per-deployment preview host, `alphabeacon-web.vercel.app`
     and `malaky.ai`. No red flag — nothing is needed from Ward for the live
     preview to work.
  2. **The production front door hardened.** `DEFAULT_DATASET_ID` is now
     `import.meta.env.PROD ? 'visitor' : 'active'`. Production had shipped with
     zero environment variables, so the never-set `VITE_DEFAULT_DATASET` left
     the bundle resolving to `active` — a signed-in demo tenant — and `/`
     served the DASHBOARD to every visitor for ten days. The real fault was
     that the safe value lived only in configuration; it lives in the build
     now, and the variable is an override rather than a dependency.
  3. **`live` created and pushed** — always a fast-forward of `main`, no
     commits of its own — so Vercel can bind `VITE_API_BASE_URL` to its
     preview. The branch had to exist first; Vercel refuses to scope a
     variable to a branch that is not in the repo.
- The `verify:w02` gate for this is two-sided, and the second half is the one
  that matters: the SOURCE must derive the default from the build, and the
  emitted `dist/` must be read back and shown to fall back to `"visitor"`
  (captured by backreference — minified names change per build). Only the
  artifact half could have caught the incident, because the source was fine and
  the DEPLOYMENT defaulted wrong. Canary-tested both ways: reverting the
  constant fails the unit tests, and a stale bad `dist/` with correct source
  fails the artifact half.
- Open-item 1 (CSP `connect-src`) is MOOT on Vercel — `vercel.json` ships no
  CSP — and would return only if the app moved back behind the CloudFront
  stack. A standing rule was added to open-items: after every merge to `main`,
  also `git push origin main:live`.
- Phase: post-INT-12 hardening (branch `fix/visitor-default`, merged to `main`)
- Files: `src/data/datasets/index.ts`, `src/data/datasets/resolve-initial.test.ts`,
  `scripts/verify-w02.ts`, `.agent/*`
- Decisions: see decisions.md — production defaults to the visitor world
- Verify: lint + typecheck + **398 unit** (+4) + guard-static (248 files) +
  build + static e2e **72 passed / 49 skips** + verify:w02/w04/w05/w06 PASS
- Next: the founder sets `VITE_DEFAULT_DATASET` (now belt-and-braces rather
  than load-bearing) and scopes `VITE_API_BASE_URL` to the `live` preview.

### 2026-08-20 14:05 — E2E-0820 triage: eight fixes, two probes, and a wizard that stops lying

- **A1 — the seeding probe answered "no".** An org created by DIRECT API calls
  (signup → verify → `POST /orgs`, the wizard never involved) comes back with
  **0 tones**, 0 voices, no schedule, `country: null`. Probe org **622**, left
  in place. So Ward has NOT shipped server-side seeding, the wizard is still
  the only seeder, its client-side seeding is NOT redundant and was not
  removed, and open-items 26 stays open with the new measurement.
- **A2 — the Finish audit, which A1 turned into work.** `finishOnboarding`
  swallowed everything after `POST /orgs`: tones through `Promise.allSettled`
  with the rejections discarded, schedule and country through
  `.catch(() => undefined)`, then `return ok` regardless. Only org creation
  could fail visibly, and its toast was `MESSAGES.errors.generic` with a "Try
  again" whose `onClick` was `() => {}`. Not re-runnable either: it always
  created an org first, so a retry minted a SECOND workspace rather than
  repairing the first. That is exactly org 619's shape — tones yes, schedule
  no, country no, and a success screen. **B7 was therefore in scope.**
- **The eight fixes.** F3 Generate is in the rail (next to Today), the
  dashboard's "Go to" row and live Today's empty state — it had no entry point
  at all. F4 "credits" is gone from every live-reachable surface and
  `/billing/credits` is now `/billing/balance` (old path redirects). F5 the
  pre-run count resolves against the tones that exist NOW, and renders nothing
  at zero. F6 the tone-preview error carries the envelope's requestId, or the
  contract code when CORS exposes none. F9 the balance chip separates "loading"
  from "unread" from "API-confirmed all-zero". F10 the results footer points at
  Today instead of promising what INT-12 already shipped. F11 one `pluralize`
  helper, applied at six count sites. F12 as above.
- **Two stale-copy bugs the sweep caught on its own:** a catalogue string told
  users to "check Recent runs", a section INT-12 renamed to "Waiting for
  review"; and `live-generate.spec.ts` asserted that same dead heading and had
  been FAILING ON `main` since INT-12, unnoticed because closing INT-12 ran
  `live-proposals`. Recorded as trap 18.
- Phase: post-INT-12 triage (branch `fix/e2e-0820`, off `main` `550f54e`) —
  **not merged, not pushed, awaiting founder approval**
- Files: `src/features/{generate,onboarding,billing,today,settings,dashboard}/*`,
  `src/components/ab/app-shell.tsx`, `src/data/{account,auth,brand,scheduling,team}.ts`,
  `src/lib/{messages,format,error-reference}.ts`, `src/routes.tsx`,
  5 e2e specs, `screens4.md`, `.agent/*`
- Decisions: see decisions.md — four entries dated 2026-08-20 (credits scoped
  to the static demo; the count resolved against live tones; Finish
  failure-tolerant + reported + idempotent; an unread balance is not an
  unavailable one)
- Verify: lint + typecheck + **416 unit** (+18) + guard-static (253 files) +
  build + static e2e **72 passed / 49 skips** + **verify:w02–w06 all PASS**.
  Live specs on the changed surfaces, one at a time, LIVE_MEDIA off:
  live-country 4/4 (the Finish path), live-wallet 4/4, live-generate 2/2,
  live-knowledge 3/3, live-team 6/6, live-brand 5/5, live-brand-rules 5/5,
  live-proposals 4/4 — **33 live tests green**. Two transient failures
  reproduced clean on re-run (a failed org sync on live-brand-rules; the
  declined-tab lag on live-proposals, consistent with open-items 32).
- Next: founder approval to merge + `git push origin main:live`. Open
  questions for Ward unchanged (26 re-measured, 3 now has somewhere to land).

### 2026-08-20 15:30 — merge gate: the full live suite found two more rotted specs and one open question

- **Approved items landed first.** open-items gains the accepted-debt line
  (27b: the static demo's billing copy keeps "credits", moot once production
  serves live) and the new standing rule from trap 18: **any merge to `main`
  runs the FULL live suite, `LIVE_MEDIA` off, never only the phase's own
  spec.** Logged in both `open-items.md` (Standing rules) and `state.md`.
- **The new rule paid for itself on its first outing.** Of twelve live spec
  files, the triage had run eight. Of the four unrun, `live-scheduling` was
  broken on `main` in two INT-8-era ways: it clicked a button called **'Add'**
  when live mode has read `{live ? 'Choose' : 'Add'}` since the country picker
  replaced the event-source list, and it asserted a holiday **event-source**
  row when the wizard now sets `PUT /orgs/:id/country`. Both fixed; the org's
  country is what the spec reads now.
- **Two tests also outgrew the 30 s default**, partly on this branch's account:
  B7's idempotency reads (`/me/orgs`, the org's tones, its schedules) made
  Finish about three round-trips slower. `live-scheduling` and
  `live-notifications` now set the 150 s headroom `live-country` already used.
- **One thing is NOT fixed and blocks the merge under the new rule.**
  `live-scheduling`'s C1 test leaves the save bar stuck on "You have unsaved
  changes": the tone picker renders the five LIVE presets, while
  `draft.toneIds.length` is **7** — the static demo schedule's ids, frozen at
  mount. It is F5's defect class on a second screen. The screen's
  pristine-adoption effect is deliberate (an edited draft is never clobbered
  by a late sync), so a pre-sync edit strands the form permanently. Two more
  tests in that file remain unrun behind it (serial mode).
- **Probe for the addendum** (no product code): a DIRECT `POST
  /orgs/:id/schedules` **succeeds — 201, reads back intact** — on a fresh QA
  org shaped like 619 (tones present, no schedule). Probe org **653**. So the
  endpoint is not what failed for 619. And the wizard and the editor do NOT
  share a schedule client function: the editor calls
  `useSchedulingActions().saveSchedule` (`PATCH` when a `scheduleId` is known,
  else `POST`), while `finishOnboarding` builds its own body inline and always
  `POST`s. Same eight fields, two independent literals.
- Phase: E2E-0820 merge gate (branch `fix/e2e-0820`) — **still not merged, not
  pushed**; the live suite is one file red and the founder's own rule 2 makes
  that a blocker.
- Files: `.agent/{open-items,state,sessions}.md`, `e2e/live-scheduling.spec.ts`,
  `e2e/live-notifications.spec.ts`
- Decisions: none new (the two logged rules are the founder's, recorded verbatim)
- Verify: lint + typecheck + **416 unit** + guard-static (253 files) + static
  e2e **72 passed / 49 skips** all green. Live suite, one file at a time,
  `LIVE_MEDIA` off: auth 7/7 · brand 5/5 · brand-rules 5/5 · country 4/4 ·
  generate 2/2 · knowledge 3/3 · notifications 1/1 · proposals 4/4 · studio 3/3
  (+1 correctly skipped) · team 6/6 · wallet 4/4 · **scheduling 1/4 — 1 pass,
  1 fail, 2 unrun**.
- Next: founder decides — merge B1–B8 with the scheduling red called out as
  pre-existing, or land the schedule fix first. Either way the A3/B9 addendum
  text has never reached this session and is needed before that branch starts.

### 2026-08-20 17:10 — B9: the stranded schedule draft, and an org that stopped wearing the demo's schedule

- **The approved fix, and the wrong first version of it.** C1's save bar could
  never go clean on a live org — the picker showed the five real tones while
  `draft.toneIds` held seven demo ids. Extending the existing guard (adopt if
  the draft still equals the LAST pristine, else prune ghosts) made it worse:
  after a reload the just-saved selection pruned to nothing. The brand and
  scheduling halves of the sync graft INDEPENDENTLY, so the "last pristine"
  ref can advance on a render where the draft has not adopted, and the next
  pass reads an untouched draft as an edit. `edited` is now RECORDED by
  `patch()` and cleared on Cancel and on a good save. Two guards survive from
  the wrong version because they are about evidence rather than identity:
  never prune against an empty tone list, never prune when the pristine's own
  ids do not resolve.
- **What the new repair spec exposed, and what it cost to see.** An org in the
  619 shape opened C1 showing five active days, three posts a day and eight
  tones — none of them its own. `fetchScheduling` answers `schedule: null`
  when there is none, and the reducer left the seeded DEMO schedule in place.
  A live org now grafts a BLANK schedule instead; timezone and generate-time
  survive as editable defaults, everything that constitutes the schedule
  starts unset. Same law INT-8 applied to `eventSources` two lines above it.
- **619 is self-repairable.** `live-schedule-repair.spec.ts` builds the shape
  by direct API calls (the wizard cannot produce it — it always makes a
  schedule), then drives C1: blank arrival → pick days and two tones → Save →
  `saveSchedule` falls back from `PATCH` to `POST` → the wire holds exactly
  the two ids clicked → reload, still selected, still clean.
- **More INT-8 rot retired.** `live-scheduling`'s "event sources: the
  countries endpoint feeds the picker" asserted the whole surface INT-8
  superseded; it is retired with a tombstone naming its four replacements in
  `live-country.spec.ts`, including the direct stand-in "C2 no longer offers
  an event source it cannot create".
- Save failures now carry the reference (B4's law), and a good save can no
  longer leave the leave-guard armed.
- Phase: E2E-0820 B9 (branch `fix/e2e-0820`) — **not merged, not pushed**
- Files: `src/features/calendar/{schedule-config-screen.tsx,reconcile-draft.ts,
  reconcile-draft.test.ts}`, `src/data/provider.tsx`,
  `e2e/live-schedule-repair.spec.ts` (new), `e2e/live-scheduling.spec.ts`,
  `.agent/*`
- Decisions: see decisions.md — two entries dated 2026-08-20 ("has the user
  edited?" is recorded, not inferred; a live org with no schedule does not
  wear the demo's)
- Verify: lint + typecheck + **423 unit** (+7) + guard-static (255 files) +
  build + static e2e **72 passed / 51 skips** + **verify:w02–w06 all PASS**.
  **FULL live suite, `LIVE_MEDIA` off, one file at a time — 45 passed, 2
  correct skips, 0 failed:** auth 7/7 · brand 5/5 · brand-rules 5/5 ·
  country 4/4 · generate 2/2 · knowledge 3/3 · notifications 1/1 ·
  proposals 4/4 · **schedule-repair 3/3 (new)** · scheduling 2/2 (+1 skip:
  no slot exists, open-items 8) · studio 3/3 (+1 skip: LIVE_MEDIA off) ·
  team 6/6 · wallet 4/4. Two transient failures re-ran clean (live-auth once,
  live-proposals' declined-tab lag again — open-items 32).
- Next: founder approval to merge + `git push origin main:live`.

### 2026-08-20 17:45 — E2E-0820 closed: merged to main, pushed, live rebuilding

- **The order end to end.** The founder's live in-app E2E on `1.malaky.ai`
  (org 619, real API) raised 12 findings; this branch took the frontend items
  and the root-cause probes, in three commits, and is now `main`.
- **A1 — is seeding server-side yet? No.** An org created by DIRECT API calls,
  the wizard never involved, comes back with 0 tones, 0 voices, no schedule,
  `country: null` (probe org **622**, left in place). The wizard is still the
  only seeder; its client-side seeding is not redundant and was not removed.
  open-items 26 stays open with the measurement.
- **A2 — does Finish hide failures? Yes, all of them.** Tones through
  `Promise.allSettled` with the rejections discarded, schedule and country
  through `.catch(() => undefined)`, then `return ok` regardless — and the one
  visible failure toast had a "Try again" whose `onClick` was `() => {}`. Not
  re-runnable either: it always created an org first, so a retry minted a
  second workspace. That is org 619's exact shape.
- **A3 — is the backend at fault for 619? No.** A direct
  `POST /orgs/:id/schedules` returns **201** and reads back intact (probe org
  **653**), as does a `PATCH` of the same body. The failure class was ours.
  The wizard and the editor do NOT share a schedule client function: the
  editor calls `saveSchedule` (`PATCH` when a `scheduleId` is known, else
  `POST`), Finish builds its own literal and always `POST`s — recorded as debt
  (open-items 27a) rather than unified while B7 was still warm.
- **B1–B9.** Generate reachable at all · "credits" gone from every
  live-reachable surface, `/billing/balance` · the pre-run count resolved
  against tones that exist · the tone-preview reference · the balance chip's
  three honest states · the results footer pointing at Today · pluralization ·
  Finish failure-tolerant, reported and idempotent · and the stranded schedule
  draft, plus the blank schedule that makes an org in the 619 shape repairable
  from C1 without anyone touching the database.
- **The two lessons worth keeping** are now traps 19 and 20 in `state.md`:
  **"has the user edited?" is recorded by `patch()`, never inferred from a
  JSON diff against a moving ref** — the inference version pruned a just-saved
  selection to nothing, because the two halves of the sync graft
  independently; and **a null answer from the wire must never fall through to
  demo data**, the law INT-8 wrote for `eventSources` and the reducer two
  lines below it broke for schedules.
- **The standing rule that earned itself twice.** "Any merge to `main` runs
  the FULL live suite" was added from trap 18 and immediately found
  `live-scheduling` broken on `main` in two INT-8-era ways (a button renamed
  `Choose`, an assertion against the retired event-source surface), plus a
  whole test asserting a screen that no longer exists — retired with a
  tombstone naming its four replacements in `live-country`.
- Phase: E2E-0820 — **closed. Merged to `main` (fast-forward, `83ec448`) and
  pushed with `main:live` on the founder's explicit approval.**
- Files: 41 changed, +1538 / −179 across `src/features/*`, `src/data/*`,
  `src/lib/*`, `src/components/ab/app-shell.tsx`, `src/routes.tsx`, 7 e2e
  specs (1 new), `screens4.md`, `.agent/*`
- Decisions: see decisions.md — six entries dated 2026-08-20
- Verify: lint + typecheck + **423 unit** + guard-static (255 files) + build +
  static e2e **72 passed / 51 skips** + **verify:w02–w06 all PASS** + the
  **FULL live suite, `LIVE_MEDIA` off: 45 passed, 2 correct skips, 0 failed**
- Next: Vercel rebuilds both sides — the `live` preview (`1.malaky.ai`, live
  mode) and a fresh STATIC production build off `main`. Open questions for
  Ward: 26 (server-side seeding, re-measured), 9 (is `gm_*` also legal, and
  which vocabulary is canonical), 29–32.

### 2026-08-23 14:00 — M2: the visitor world is Abdullah's concept-v2, ported

- Did: replaced the entire marketing world with a port of
  `aboodbasal/malaky-prototype`'s `components/concept-v2/**`. Five routes —
  `/`, `/pricing`, `/request-demo`, `/terms`, `/privacy` — under ONE layout
  route, so `Header`/`Footer`/`MediaDefs` mount once and survive navigation
  between them (trap 8). Upstream's source is VENDORED file-for-file under
  `src/features/marketing/concept/` (58 files) so it can be diffed against the
  prototype again; the route screens, the layout and the styles are ours.
  Next → Vite: 22 `"use client"` directives stripped, `next/link` and
  `usePathname` → react-router, fragment navigation reimplemented as
  `useHashScroll` (Next did it for free), page titles via a new
  `src/lib/page-meta.ts`, and `next/font` → **self-hosted** DM Sans (opsz +
  italic) and IBM Plex Sans Arabic (400/500/600) — the two new deps, and the
  zero-network law still holds. concept-v2's tokens live in
  `src/styles/marketing.css` scoped to `html[data-mk-world]` with the resets on
  `.mk-world`, written `:where(.mk-world) …` so each rule keeps the exact
  specificity it had upstream (trap 21 — a plain class scoping silently
  outranked the port's own `.primary` and cost the CTA its label colour).
  Every CTA resolves through one map in `concept/site.ts`: "Get started" is the
  REAL `/signup`, Login the real `/login`. The prototype's purchase fiction did
  not come across. M1 retired: `marketing-home.tsx`, `outputs/`, `reveal.tsx`,
  the `pricing-section.tsx` seam, the `[data-mk-*]` motion layer,
  `public/campaigns/`, `og-malaky.png`, `system/legal-screens.tsx`, and the
  now-orphaned early-access screen (its path redirects to `/request-demo`).
  Four AA deviations from the prototype, each commented at the site of the
  change: the CTA's ink, `--c-text-4`, the approval preview, the monogram —
  plus one real a11y bug fixed (`<ul role="group">` orphaned its items).
- Phase: **M2** — a design phase like `rb/NN`, not a W or INT phase.
  **Branch only: one commit `2aedac8` on `design/m2-concept-v2`; not merged, not
  pushed.**
- Files: 58 new under `src/features/marketing/concept/`, 6 new marketing
  screens/layout/tests, `src/styles/marketing.css` + `marketing-tokens.test.ts`,
  `src/lib/page-meta.ts`, `src/routes.tsx`, `src/styles/globals.css`,
  `eslint.config.js`, `index.html`, `public/{og,brand}/**`,
  `public/sitemap.xml`, `scripts/verify-w02.ts` (marketing laws rewritten),
  `e2e/marketing.spec.ts` (new, 19 tests) + `onboarding.spec.ts` +
  `live-auth`/`live-team`, `design.md` (new Part 7), `web-plan.md`, and
  `.agent/{state,decisions,open-items,conventions,stack}.md` + `CLAUDE.md`.
  21 M1 files deleted.
- Decisions: see decisions.md — **D-M2-A** (M1 retired; the bundle grew and
  that is recorded, not explained away), **D-M2-B** (pricing is marketing's
  own data, superseding "plans stay one source" for the marketing route),
  **D-M2-C** (the purchase flow is NOT ported), **D-M2-D** ("Get started" is
  the real signup; early access retired — founder-vetoable), **D-M2-E** (the
  port is vendored and keeps upstream's names), **D-M2-F** (the port meets AA,
  and the four changes are named).
- Verify: lint + typecheck + **457 unit tests / 42 files** + guard-static
  (321 files) + build + **static e2e 85 passed / 51 live skips** +
  **verify:w02–w06 all PASS**. Production build smoke-tested from `dist/`:
  `/` boots the visitor world, `/signup` and `/login` carry no
  `data-mk-world`, zero offsite requests, no console errors.
  axe clean on all five marketing routes at 1440 AND 390 AND under reduced
  motion. LIVE SUITE: **NOT GREEN, and not green on `main` either.** The full 13-file suite ran twice, one file at a time, `LIVE_MEDIA` off. Three files were green both times (`live-country` 4/4, `live-schedule-repair` 3/3, `live-wallet` 4/4) and `live-generate` went green on the second; every other file stopped somewhere in the signup → wizard-finish → Dashboard walk, on a TIMEOUT rather than a wrong assertion, and a different test each run. So the four worst were re-run against a STASHED tree — plain `main`, `5c01c68`, same server, same API — and **all four failed identically**: `live-notifications`, `live-scheduling`, `live-team` and `live-auth`, each on the same locator with the same timeout. The wizard-finish burst is slower than the specs' budgets against this API today; that is a pre-existing problem on `main`, not a regression from this branch, and it is worth a look before the next merge (open-items)
- Next: founder review — the CTA change, the four AA deviations, the auth
  seam, and the replaced gold wordmark are all in open-items 21. Before DNS
  cutover: `/request-demo` needs a real destination, `hello@malaky.ai` is a
  placeholder, and six legal values are still `null`.

### 2026-08-23 19:00 — the live suite stops measuring Lambda temperature

- Did: `fix/live-suite-warmup`, off `main` (`5c01c68`). Carried
  `Docs/api/live-red-2026-08-23.md` onto the branch so the finding ships with
  the fix. Added `e2e/global-setup.ts`, registered as Playwright's
  `globalSetup`: LIVE RUNS ONLY — without `VITE_API_BASE_URL` it returns before
  making any request, so static mode stays the zero-network test bed (proved:
  a full static run logs zero warm-up lines). Three phases, one 90 s cap:
  wake the service (probe `/health` until two consecutive answers under 1 s),
  warm a 12-way fleet (the app fans out fourteen requests at once through
  `live-sync.ts`'s `Promise.all` groups, and concurrent requests do not share a
  container), then hold a heartbeat — 4 probes every 5 s, torn down when the
  run ends — because the containers are recycled DURING a file, not only
  between runs. Never warms → the setup FAILS with "API cold or unreachable"
  rather than letting twelve specs bleed out one timeout at a time.
  Also gave the four capless files (`live-auth`, `live-brand`,
  `live-brand-rules`, `live-team`) `test.setTimeout(150_000)` in a
  `beforeEach`, matching `live-country`'s B7 precedent, one comment each citing
  the finding. **No assertion, wait value or locator changed anywhere** — the
  whole diff is 53 added lines plus the new setup file.
- Phase: a fix branch, like `fix/e2e-0820`. **Branch only: not merged, not
  pushed.**
- Files: `e2e/global-setup.ts` (new), `playwright.config.ts`,
  `e2e/live-{auth,brand,brand-rules,team}.spec.ts`,
  `Docs/api/live-red-2026-08-23.md` (carried), `.agent/{open-items,sessions}.md`
- Decisions: none new — this implements the accepted verdict of
  `probe/live-red`.
- Verify: lint + typecheck + 423 unit + guard-static (255 files) + build +
  static e2e **72 passed / 51 skips / 0 failed**, warm-up silent. LIVE, full
  13-file suite, `LIVE_MEDIA` off, twice: **cold 11/13 green in 875 s**,
  **warm 12/13 green in 883 s**. Not the 13/13 the brief asked for, and the
  residue is honest: three different files failed across the two rounds, each
  on a `toBeVisible`/`toHaveCount` wait of 5 s or 25 s that is shorter than
  what the API actually takes. Those are wait values, which the brief ring-
  fenced. Before the branch the same cold round was 3/13.
- Next: founder call — either raise the ring-fenced waits (the walk measures
  20.3–22.3 s against 20 s and 25 s budgets, and `PUT /orgs/:id/country` alone
  is 12–15 s of it), or wait for Ward. The harness half is done either way.

### 2026-08-23 21:15 — the residue waits re-derived, and trap 22 guarded

- Did: on `fix/live-suite-warmup`, with the wait freeze lifted for the three
  residue files only. `e2e/live-clocks.ts` states three rungs derived from
  `Docs/api/live-red-2026-08-23.md` — `ONE_CALL` 20 s (one round-trip plus one
  measured 14 s cold start), `SCREEN_SYNC` 40 s (a screen's graft: several
  concurrent `Promise.all` groups, each able to be cold), `AFTER_COUNTRY` 45 s
  (the wizard Finish, of which `PUT /orgs/:id/country` alone is 12–15 s).
  Fourteen waits in `live-brand`, `live-scheduling` and `live-brand-rules` now
  read a rung instead of a number, each with a one-line comment citing the
  doc. **Every locator and every matcher argument is byte-identical** — the
  removed lines are timeout values and the same assertions re-emitted with a
  timeout added. No other file changed and the Playwright default is untouched.
  Trap 22 is recorded in state.md AND guarded: `assertServerMode` in
  `global-setup.ts` reads `src/api/config.ts` as Vite serves it, with the env
  inlined, and refuses a run whose server is in the other mode. Proven in both
  directions; silent when it cannot get a clear answer.
- Phase: a fix branch. **Branch only: not merged, not pushed.**
- Files: `e2e/live-clocks.ts` (new), `e2e/global-setup.ts`,
  `e2e/live-{brand,brand-rules,scheduling}.spec.ts`, `.agent/{state,open-items,
  sessions}.md`
- Decisions: none new.
- Verify: lint + typecheck + 423 unit + guard-static (255 files) + build +
  static e2e **72 passed / 51 skips / 0 failed**, warm-up silent. LIVE, all 13
  files, `LIVE_MEDIA` off, twice: **cold 9/13 in 757 s**, then **warm 13/13 in
  833 s**. The target was 13/13 both rounds; the warm round is it, the cold
  round is not. Every cold red was in the first four files, and each one
  correlates with the warm-up's own numbers: `/health` probe 1 at 16.5 s
  (`live-auth`), 7.0 s (`live-brand-rules`), 5.9 s (`live-brand`), and
  `live-team` needing six fleet bursts over 24.1 s. The same four files in the
  warm round warmed in 0.7 s and one burst, and passed. **The exact timing that broke it** (captured from a fresh 26-minute-idle API, full network log, rule 4): from cold `POST /auth/signup` takes **20,281 ms** (rid `f40e630f`), and the Finish burst runs **45.83 s** against the 45 s rung — missed by 830 ms — because `PUT /orgs/:id/country` takes **23,562 ms** (rid `dfd40568`), 57% more than the 12–15 s the rung was derived from, and `GET /orgs/:id/schedules` adds **11,371 ms** (rid `0b3b3d94`) on top. Thirteen calls, sequential sum 52.0 s, every one 2xx: no 429, no Retry-After, no 5xx. Per rule 4 the clocks were NOT raised again — 23.6 s for one external lookup is Ward's number to change, not the suite's.
- Next: founder call. The measured answer is that a deployment idle for hours
  needs minutes of real traffic to stabilise, which a 90 s warm-up cannot buy —
  see the new standing note in open-items about running the suite twice.


### 2026-08-24 00:58 — the two riders: the last two rung files, and the two-round rule made law

- Did: **R1** — the rung treatment extended to `live-auth` and `live-team`, the
  two files the 2026-08-23 pass left at the Playwright default. Their waits were
  the identical class already lifted inside the other three: 41 of them now read
  a rung from `live-clocks.ts` with a one-line citation, picked by the work each
  wait covers — `ONE_CALL` for one round-trip (a login, a toast, a PATCH, a
  DELETE), `SCREEN_SYNC` for a screen's graft (first wait after login, after a
  reload, after a settings tab), `AFTER_COUNTRY` for the wizard Finish.
  **Every locator and every matcher argument is byte-identical, and it is
  machine-proved, not asserted:** stripping the citations and every `timeout:`
  option from both files reproduces their pre-change content exactly, so no
  locator, no expected value and no control flow moved. Three waits that cover
  no request (a heading already on screen, a route rendered from query params,
  a row that follows its own toast) were deliberately left at the default —
  a wait picks the rung that matches its work, and these have none.
  Two pre-existing literals came with them: the `20_000` signup waits are
  `ONE_CALL` at the same value, and `live-team`'s `25_000` Finish wait is now
  `AFTER_COUNTRY`, byte-identical to the assertion already lifted in
  `live-brand` and `live-scheduling` — leaving it at 25 s while its twins sat
  at 45 s was the incoherence the rider names. `live-clocks.ts`'s own scope
  note went from three files to five.
  **R2** — the operating procedure is law now, not a note: against a cold API
  the full live suite runs TWICE, round 2 is the merge gate, round 1 stabilises
  the deployment (`open-items.md` standing rules + `state.md`). Written so it
  cannot be read as licence to re-run until green: both rounds are reported, a
  red in round 2 is a red, and the FULL-suite rule itself stays mandatory —
  the two-round rule says WHICH run is the gate, never that there isn't one.
- Phase: a fix branch (`fix/live-suite-warmup`), the riders on its approval.
- Files: `e2e/live-auth.spec.ts`, `e2e/live-team.spec.ts`, `e2e/live-clocks.ts`,
  `.agent/{state,open-items,sessions}.md`
- Decisions: none new.
- Verify: lint + typecheck + **423 unit / 41 files** + guard-static (255 files)
  + build + static e2e **72 passed / 51 skips / 0 failed** with the warm-up
  silent + **`verify:w00`–`w06` all PASS**. LIVE, all 13 files, `LIVE_MEDIA`
  off, **one file at a time**, twice: **round 1 13/13 in 796 s**, **round 2
  13/13 in 794 s** — 45 passed and the 2 correct skips both rounds.
  **A first live attempt was discarded as an invalid invocation, and it is
  worth recording why:** `pnpm e2e live-` runs all 13 files at once under
  `fullyParallel` with 6 workers — 3.2 min, 10 failed — which is not the
  documented procedure and is trap 14 by construction. One file at a time is
  the rule for a reason; the run that ignores it measures contention, not the
  app. Because that invalid run gave the API three minutes of traffic, round 1
  here was not truly cold — the honest reading is two consecutive warm rounds,
  and the cold-start evidence stays the 2026-08-23 measurement.
- Next: merge to `main`, `git push origin main` and `main:live`; then the M2
  design branch takes `main` and re-runs its own gates under the new rule.

### 2026-08-24 03:05 — M2 takes `main`, and the AA pass is reverted for review (D-M2-F-r)

- Did: two things on `design/m2-concept-v2`.
  **(a) Merged `main`** — which now carries the live-suite warm-up — into the
  branch. Four conflicts, all resolved by hand: `sessions.md` (both sides
  appended; kept both, chronologically), `state.md` (five hunks: the "last
  updated" paragraph, the branch table, the totals line, trap 21 which is this
  branch's own, and trap 22 where `main`'s newer wording plus the guard
  paragraph won and this branch's 69-spec count was folded in), and
  `live-auth` + `live-team`, where M2's signed-out `h1` assertion and the new
  rungs landed on the same three lines. Those two are machine-checked: with
  citations and `timeout:` options normalised away, each file is identical to
  `main`'s except that M2's `toContainText('before you were.')` replaces the
  retired M1 assertion — 0 stale M1 assertions left, and all 41 timeouts still
  name a rung. **The branch touches no live code**: `src/api` and `src/data`
  are byte-identical to `main`.
  **(b) D-M2-F-r, on the founder's instruction:** the four AA fixes are
  REVERTED so the preview Abdullah reviews is his design verbatim. `--c-text-4`
  is `#5d5a57` again, the filled CTA's ink is `#fff`, the approval preview is
  ghosted at `opacity: 0.3`, the monogram is back on `--c-surface-3`. Asked
  first whether a fidelity pass had already landed: **it had not** — the branch
  had only `2aedac8` and `8aa8dcf`, and `D-M2-F-r` appeared nowhere.
  The gates were made to STATE the cost rather than stop looking: no
  `disableRules`, an allowlist of exact colour pairs, `marketing-tokens.test.ts`
  keeping all 26 assertions but PINNING each finding's measured ratio (improve
  a value and it tells you to delist it; worsen one and it fails), a second
  e2e test asserting the allowlisted pairs are still really reported, and
  `verify:w02` naming `BrandMark.module.css` as its one sweep exception and
  reporting it STALE if that file ever stops needing it.
- **Two defects found doing it, neither caused by the revert.**
  1. **The homepage's axe scan had never scanned the homepage.**
     `AxeBuilder.analyze()` does not auto-wait (trap 14), so it read the
     still-mounted dev-datasets page — the APP's ivory palette, ~25 text
     nodes, all passing. M2's "axe clean on all five marketing routes" was
     true for four. Gated on the hero `h1` now, and run under reduced motion,
     because the first gated scan then read a MOVING page and reported
     mid-transition blends as defects (the orbit timeline at 1.02:1 — a frame,
     not a colour).
  2. **Three real pre-existing contrast defects in the Memory section**,
     surfaced by that fix: dimmed text at 1.60 / 2.18 / 3.21:1. The colour
     maths attributes them to `--c-text-2` at ~0.25 and `--c-text-3` at ~0.53
     and ~0.76 — none of the four reverted values — so they are on M2 as
     shipped. Allowlisted in a SEPARATE named group so they cannot be mistaken
     for the four, and carried to open-items as needing Abdullah's decision:
     the dimming is saying "this is the superseded draft", so the fix is a
     different way to say that.
  Also corrected three comments written earlier in this same turn that claimed
  axe cannot compute contrast through opacity. It composites: the ghosted card
  is reported at exactly the 1.43:1 design.md already recorded.
- Phase: **M2** — a design phase. **Branch only: NOT merged. Pushed for
  review**, so Abdullah's preview updates.
- Files: `e2e/{marketing,live-auth,live-team}.spec.ts`, `scripts/verify-w02.ts`,
  `src/styles/{marketing.css,marketing-tokens.test.ts}`,
  `src/features/marketing/concept/{BrandMark.module.css,sections/approval.module.css}`,
  `design.md`, `.agent/{state,decisions,open-items,sessions}.md`, plus
  everything `main` brought in.
- Decisions: see decisions.md — **D-M2-F-r** (the AA pass reverted for review;
  the four failures allowlisted by name and measured ratio, never by disabling
  the rule).
- Verify: lint + typecheck + **457 unit / 42 files** + guard-static (321 files)
  + build + **static e2e 88 passed / 51 live skips / 0 failed** +
  **`verify:w00`–`w06` all PASS**. LIVE, all 13 files, `LIVE_MEDIA` off, one
  file at a time, twice under the new two-round rule: **round 1 13/13 in
  819 s**, **round 2 13/13 in 813 s**. The branch touches no live code, so
  green was the expected answer and any red would have meant scope leaked.
- Next: **Abdullah's review of the four**, and the founder's call on the
  Memory-section dimming. Re-applying D-M2-F is now a **merge gate** in
  open-items 21 — this branch must not reach `main` carrying four live AA
  failures.

### 2026-08-24 04:40 — D-M2-F-r2: the corrected palette ships, and no allowlist survives

- Did: Abdullah delegated the call on the four AA deviations ("do what's
  appropriate") and the founder ruled — accessibility wins, design spirit
  preserved. So D-M2-F-r is superseded and the four corrections are back:
  `--c-text-4` aliases `--c-text-3`, the filled CTA's ink is `--c-on-accent`
  `#1a0a05`, the approval preview is absent rather than ghosted, the customer
  monogram sits one tier up. `--c-accent` `#ff4e2d` and every other token are
  byte-identical to Abdullah's. **Every allowlist is deleted** — the axe scan,
  the tokens test and verify:w02's quiet-tier sweep all run with zero
  exceptions again.
- **The Memory section, and a correction to the previous entry.** Its three
  contrast defects were reported here as "the dimming means superseded draft".
  That was wrong, and the wrong diagnosis would have produced the wrong fix.
  All three traced to ONE rule — `.draft, .learned, .future { opacity: 0.55 }`,
  the scroll-reveal resting state — which multiplied every text tier inside all
  three cards: 1.60:1 on the original draft, 2.18:1 on the rule list, 3.21:1 on
  "what it learned". It applied equally to the learned rule and the future
  draft, which are the two things the section exists to prove, so it was never
  a "superseded" signal. There was also no strikethrough to keep.
  **The reveal slides without fading now.** No dim value would have worked:
  `--c-text-3` is 4.76:1 on `--c-surface-1` and 4.57:1 on `--c-surface-2` at
  FULL strength, so any opacity below ~0.97 puts the quiet tiers under AA. The
  movement and the border transition are kept.
  **"Superseded" moved off colour, and that IS needed — for a different reason
  than assumed.** `--c-text-4` was the only channel carrying it, and the AA fix
  aliases that tier to `--c-text-3`, the colour of the rule list beside it. A
  `Superseded` badge now sits in the label row the section already had. Shipped
  over the alternative (a strikethrough on the draft body) because the label
  row is structure Abdullah already drew, while a line through a 1.375rem
  display paragraph is a heavier visual edit than the AA fix itself. The draft
  stays obviously secondary without it: quieter tier, no accent border, no
  tinted background, against an edited card that has all three.
- **Enforcement, now that nothing is allowlisted:** verify:w02 gained 11d (the
  Memory reveal may move, it may not fade) and 11e (the superseded signal may
  not be colour-only again), and 11c flipped from asserting the ghosting is
  PRESENT to asserting it is ABSENT and out of the accessibility tree. The
  behavioural approval test went back to `toBeHidden()`.
  `settledHomepage` was KEPT through the cleanup: it was never an allowlist,
  it is the fix for a scan that had been reading the wrong page.
- Evidence: before/after screenshots of all seven spots plus the Memory
  treatment, captured at 1440 under reduced motion.
- Phase: **M2**. **Branch only: NOT merged, pushed for review.** The merge to
  `main` and `main:live` wait on the founder's explicit word.
- Files: `src/styles/{marketing.css,marketing-tokens.test.ts}`,
  `src/features/marketing/concept/{BrandMark.module.css,sections/Memory.tsx,
  sections/memory.module.css,sections/approval.module.css}`,
  `e2e/marketing.spec.ts`, `scripts/verify-w02.ts`, `design.md`,
  `.agent/{state,decisions,open-items,sessions}.md`
- Decisions: see decisions.md — **D-M2-F-r2** (the corrected palette ships;
  Abdullah's delegation noted; no allowlist anywhere).
- Verify: lint + typecheck + **457 unit / 42 files** + guard-static (321 files)
  + build + **static e2e 87 passed / 51 live skips / 0 failed** +
  **`verify:w00`–`w06` all PASS**. LIVE, all 13 files, `LIVE_MEDIA` off, one
  file at a time, twice: **round 1 12/13 in 999 s**, **round 2 13/13 in 829 s**.
  **Round 1's single red was `live-auth`, and it is not this change's.** The
  test timed out at its full 150 s budget on `page.goto('/login')` →
  `fill('Work email')` — the login form never rendered, which is a stalled boot
  (`GET /me` + `/me/orgs`), not a wrong assertion. The diff touches only
  marketing CSS/TSX, the marketing spec, verify-w02 and docs: `src/api`,
  `src/data`, auth and routing are untouched, so it cannot reach `/login`. In
  round 2 the same file ran 7/7 in 59 s against 195 s. This is exactly the case
  the two-round law was written for.
  One more transient to record rather than hide: in the first sweep `verify:w02`
  came back FAIL while its own structural laws passed and the full static e2e
  passed alongside it. It passed standalone and passed again in a clean
  sequential sweep — back-to-back Playwright webServers on port 5199, which is
  trap 22's neighbourhood. Reported because a green that needed a second look
  is worth naming.
- Next: **the founder's word on the merge.** open-items 21's accessibility gate
  is closed; what remains there blocks DNS cutover, not the merge —
  `/request-demo` still has no destination, `hello@malaky.ai` is a placeholder,
  and six legal values are `null`.

### 2026-08-24 04:55 — M2 merged: the visitor world is concept-v2, with the corrected palette

- Did: on the founder's explicit approval, fast-forwarded `main` through the
  whole **M2 design cycle** (`design/m2-concept-v2`, four commits) to
  **`039adfb`**, pushed `main` and `main:live`. The branch stays on `origin` as
  the per-cycle record. Nothing else changed — no settings, no other branches.
- **The cycle, end to end.** Abdullah's `malaky-prototype`
  `components/concept-v2/**` ported into `src/features/marketing/`: five routes
  under one layout, 58 marketing files, its own token file and contrast guard,
  M1 retired with it. Decisions **D-M2-A…F** (M1 retired; marketing owns its
  pricing data; the purchase fiction not ported; "Get started" is the real
  signup; the port is vendored under upstream's names; the port meets AA and
  the four changes are named), then **D-M2-F-r** (those four AA fixes REVERTED
  so Abdullah reviewed his palette verbatim, the failures allowlisted by name
  and measured ratio rather than by disabling the rule), then **D-M2-F-r2**
  (he delegated — "do what's appropriate" — the founder ruled accessibility
  wins with the design spirit preserved: the four re-applied and every
  allowlist deleted).
- **The seven AA resolutions.** 1 the filled CTA's ink `#fff` → `--c-on-accent`
  `#1a0a05` (3.29:1 → 5.9:1, and 2.83 → 6.8 on hover); 2 `--c-text-4` `#5d5a57`
  → aliases `--c-text-3` (2.63–2.93:1 → 4.57–5.08:1, ~40 elements); 3 the
  approval preview ghosted at `opacity: 0.3` → absent until approved (1.43:1,
  and out of the accessibility tree); 4 the customer monogram off
  `--c-surface-3` (4.22:1 → clear); 5–7 the Memory section's three defects,
  which all traced to ONE rule — `.draft, .learned, .future { opacity: 0.55 }`,
  the scroll-reveal resting state, multiplying every tier inside all three
  cards (1.60 / 2.18 / 3.21:1). The reveal slides without fading now; no dim
  value could work, since `--c-text-3` is 4.76:1 and 4.57:1 on those surfaces
  at full strength. A `Superseded` badge carries what `--c-text-4` used to say
  by colour alone, because aliasing that tier removed the distinction.
- Phase: **M2**, closed. Not a W or INT phase.
- Files: none beyond the merge — `.agent/{state,sessions}.md` for this entry.
- Decisions: none new; the chain is D-M2-A…F-r2 in decisions.md.
- Verify: nothing re-run for the merge itself — it is a fast-forward to a tree
  whose gates were run in full on the branch minutes earlier: lint, typecheck,
  457 unit / 42 files, guard-static (321 files), build, static e2e 87 passed /
  51 live skips / 0 failed, verify:w00–w06 all PASS, LIVE 13/13 (round 2).
  **Deployments confirmed at the tip:** production
  (`dpl_97frXsaXiyNRxdZgXHFAjJ51PTDE`, target production, ref `main`,
  sha `039adfb`, READY) serving the M2 markup, and the `live` branch preview
  (`dpl_AYVSdWR9kYtTei9n1oqmgBKmvMiu`, ref `live`, same sha, READY).
  `1.malaky.ai` was fetched directly and serves this commit in LIVE mode: the
  API host is in the bundle, `--c-on-accent:#1a0a05` and `--c-text-4:#857f79`
  are in the CSS, and the `Superseded` badge exists only at `039adfb`.
  **One verification could not be completed from this machine and is recorded
  rather than claimed:** production's deployed bundle was not fetched byte-for-
  byte. `*.vercel.app` does not connect from here at all (HTTP 000, with and
  without the sandbox; DNS resolves), and the apex still serves GoDaddy — see
  below. What IS evidenced: a production-equivalent local build, run with
  `.env.local` moved aside so no `VITE_API_BASE_URL` exists at all exactly as
  on Vercel, carries no API host anywhere in `dist/`; and production's entry
  hash (`index-1pT4_4RA.js`) differs from live's (`index-Cel1CcpM.js`) on the
  same commit and builder, which is only explicable by different build env.
  Closing it properly needs a fetch from a network that can reach
  `*.vercel.app`, or the DNS cutover.
- **Trap 22 gained a second sighting** and it is written into state.md: a
  `verify:w02` FAIL inside a sweep chained directly behind `pnpm e2e`, while
  its own structural laws passed and the full static e2e passed seconds
  earlier; green standalone and green again in a clean sequential sweep, with
  no tree change between. Consecutive Playwright invocations are not
  independent — each starts and tears down its own server on 5199. The lesson
  recorded is NOT "re-run until green": a red contradicted by a neighbouring
  run of the same specs and unreproducible solo is environmental, a red that
  survives a solo run is yours.
- Next: **open-item 18, the malaky.ai DNS cutover** — re-confirmed today, the
  apex still resolves to GoDaddy Website Builder and serves its placeholder, so
  production is not publicly reachable there. Also still open before cutover:
  `/request-demo` has no destination, `hello@malaky.ai` is a placeholder, and
  six legal values in `concept/lib/legal.ts` are `null`.

### 2026-08-26 15:30 — PROBE-INT13 Phase A: the post-media fan-out creates the job, bills it, then 502s

- Did: read-only probe of Hasan's sanctioned post-media flow on a fresh QA org (**948**, org 619 untouched), branch `probe/int13` off `main` (`fd84173`). Seeded a voice + one tone with one rule, ran one `posts/generate`, approved the proposal it minted, then sent Hasan's `social-posts.media` body **verbatim** with real values (`ref` = proposal id, joined tone, plan balanced, 1:1, png, count 1) — once, then once more byte-identical. **Both sends answered 502 `bad_gateway` "The media service returned an unexpected response"** (req `b14c4cf6-…`, `0bb130e0-…`), and **both nevertheless created real jobs that reached `succeeded` with a 1024×1024 PNG each, and both were billed.** So intake works and only the receipt is lost: the fan-out receipt shape is **still unobserved**, and `createPostMediaJob` has nothing to be typed on — which is what stops Phase B, not the association question. Re-association IS confirmed: every job echoes `origin.ref` = our `posts[].ref` with `origin.kind: "linked"` (a value we never sent — the platform derives it), on the job read **and** the list, so a reload needs no client-side persistence. No idempotency: two identical sends → two distinct billed jobs, so a naive 502-retry doubles the bill invisibly. Also measured: a render **holds** before it settles (`heldCents: 6` in flight), the catalog grants six **video** models alongside six image ones under the same plan chips, and `params` is `additionalProperties: false` over exactly five keys. Found on the way and NOT acted on: **`GET .../proposals` now returns `content`** (plus `outputIndex`, `key`, `reason`, `createdAt`), contradicting `ApiProposal`'s "no content" note and answering open-item 31 — INT-12's run-join could collapse to one read, but re-architecting Today on the way past a media probe is not this branch's job. Probe scripts stayed in the session scratchpad (PROBE-0826 convention); **no product code was touched, nothing merged, nothing pushed.**
- Phase: INT-13 Phase A (probe) — Phase B NOT started, awaiting founder + Ward
- Files: `Docs/api/probe-int13-social-posts-media-2026-08-26.md` (new), `Docs/api/alphastudio-shapes.md` (appended section + a correction to the proposals note), `.agent/open-items.md` (items 34, 35), `.agent/sessions.md`
- Decisions: none yet — D-INT13-A…D belong to Phase B and were deliberately not logged, since the flow they describe cannot be built until the receipt exists
- Verify: not run (no product code changed); the probe itself warmed the API first (probes `1296ms, 221ms, 92ms`, 12-way fleet slowest 1051 ms) so no latency recorded is a cold start
- Cost: **7 cents** on the QA wallet — 2 renders at 3c (the two sends) + 1c of text for the run that minted the proposal. Within the order's 2-media-call cap
- Next: founder to put (a)–(d) of open-item 34 to Ward — above all **what the fan-out's success body is meant to be**. Phase B stays stopped until it comes back once. One `media.generate` control call on org 948 (3 cents) would confirm the break is specific to the `posts[]` shape rather than the whole route; it was not spent because the cap was two
