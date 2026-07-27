# AlphaBeacon Web — Build Plan (static)

The frontend of AlphaBeacon: React SPA + marketing site, in its **own repo**. This plan builds **every screen in `screens4.md`, statically** — all data comes from typed modules committed in the repo, and the app makes **no network calls of any kind**. There is no API client, no mock server, no mode switch, and no backend phase. Backend integration is a **separate plan, written later**; nothing here anticipates its shape.

UI is built with **shadcn/ui**, driven by the **shadcn skill** (`https://ui.shadcn.com/docs/skills`) so the agent composes components with the correct project-aware APIs. `screens4.md` is screen truth; `design.md` is the visual system. Work phase by phase (§9); a phase is done only when its **Verify** passes (`pnpm verify:wNN`). `CLAUDE.md` + `.agent/` are the working rules.

---

## 1. The static operating model (the law)

- **No network, enforced.** `scripts/guard-static.ts` fails the build if `fetch`, `axios`, `XMLHttpRequest`, `EventSource`, `WebSocket`, or any `http(s)://` literal appears anywhere under `src/` (allowlist: fonts and og-image URLs in `public/`). Playwright asserts **zero network requests** on every e2e run. If a screen seems to need a request, the design is wrong — add data instead.
- **Data lives in the repo.** `src/data/` holds plain typed TypeScript modules — orgs, connections, schedules, slots, drafts, tones, events, assets, jobs, plans, ledger entries, analytics series, notifications. No parsing of "responses", no generated anything: these are just values with hand-written types in `src/data/types.ts`.
- **Datasets replace scenarios.** `src/data/datasets/` composes whole-tenant states — _fresh org_, _active org_, _past due_, _needs re-auth_, _low credits_, _heavy history_. One tap at `/dev/datasets` swaps the dataset the whole app reads. Datasets are the only way a screen reaches a different world.
- **The four states are presentation states, not network outcomes.** Every data-backed screen still ships **loading / empty / error / populated** — but they are selected, not awaited: the dataset supplies empty and populated; `/dev/states` forces the loading skeleton and the designed error state on any screen. Skeletons render on a short artificial delay on first mount so the loading design is real, not theoretical.
- **Interactions mutate in memory.** A small `DataProvider` (React context + reducer over the active dataset) makes flows genuinely walkable inside a session: approve a draft and it moves, generate media and a job appears then completes on a timer, buy credits and the balance changes. **A refresh resets to the dataset.** The dev routes say so plainly, so nobody mistakes it for persistence.
- **The draft state machine is local and authoritative for the UI.** `src/lib/draft-status.ts` defines `DraftStatus` + `canTransition`; buttons render from it, so illegal actions cannot exist. When the backend arrives, this file is the reconciliation point (§13).
- **Compose is a scripted player, not a stream.** `src/lib/compose-player.ts` replays canned responses token-by-token on a timer with the designed cadence, emitting the same UI events the screen needs (token · flag · done · error). No SSE, no transport.
- **Auth is a local session.** A fake session object in the `DataProvider` drives guards, the signed-out redirect, the locked-out countdown, and plan-based UI gating — so every auth screen and guard is exercised without a token or a request.

## 2. Repository structure

```
alphabeacon-web/
├─ CLAUDE.md · web-plan.md · .agent/
├─ components.json                  # shadcn config (committed) — the skill reads this
├─ .agents/skills/                  # installed AI skills (shadcn/ui) — committed (+ .claude/skills symlink)
├─ public/                          # fonts (self-hosted), favicons, og images
├─ src/
│  ├─ main.tsx · app.tsx            # providers: router, theme, DataProvider
│  ├─ routes.tsx                    # route table + session/plan guards
│  ├─ features/                     # vertical slices, one per area:
│  │   marketing/ auth/ onboarding/ dashboard/ today/ drafts/ calendar/
│  │   connections/ studio/ compose/ analytics/ billing/ settings/ system/
│  ├─ components/
│  │   ├─ ui/                       # shadcn-managed (via `shadcn add` — never hand-edited)
│  │   └─ ab/                       # our compositions: ClaimChip, StatusBadge, SlotChip,
│  │                                #   MonoNumber, EmptyState, PageHeader, AppShell, …
│  ├─ data/
│  │   ├─ types.ts                  # hand-written types for every entity
│  │   ├─ entities/                 # drafts.ts, connections.ts, plans.ts, analytics.ts, …
│  │   ├─ datasets/                 # fresh.ts, active.ts, past-due.ts, needs-reauth.ts, …
│  │   ├─ provider.tsx              # DataProvider: active dataset + in-memory reducer
│  │   └─ compose-scripts.ts        # canned compose responses (happy, flagged, failed)
│  ├─ lib/
│  │   ├─ draft-status.ts           # DraftStatus + canTransition (UI law)
│  │   ├─ compose-player.ts         # timer-driven token player
│  │   └─ messages.ts               # every designed error/empty message, one catalogue
│  └─ styles/                       # tokens.css (design.md → CSS vars), globals
├─ e2e/                             # Playwright: per-screen state specs + @golden walks + axe
├─ infra/                           # tiny CDK: ABW-<stage>-Web (S3 + CloudFront + ACM)
└─ scripts/                         # lighthouse.ts, guard-static.ts
```

## 3. Stack

React 19 + Vite + strict TS. **Tailwind v4** with CSS-variable theming. **shadcn/ui** (base library: **radix**; icons: **lucide-react**) managed by the CLI. **react-router** (SPA; marketing routes pre-rendered at build for SEO). **react-hook-form + zod resolvers** with schemas defined locally in `src/data/types.ts` — form rules like `posts_per_day ≤ 3` are enforced and named here. **Playwright + vitest + @axe-core/playwright + Lighthouse CI**. Deploy: `ABW-<stage>-Web` (S3 + CloudFront + ACM), stages `dev | staging | prod`.

**Deliberately absent:** no data-fetching library, no server-cache library, no mock-service worker, no API client, no published contracts package, no `VITE_API_MODE`, no runtime environment variables at all. The only build input is the stage name.

## 4. shadcn/ui + the skill — how we work

- **Install once, commit**: `pnpm dlx shadcn@latest init` (creates `components.json`) and `pnpm dlx skills add shadcn/ui` (installs the skill). Both are committed; the skill activates on `components.json` and runs `shadcn info --json` for project context on every interaction.
- **Discovery before writing**: the agent uses `shadcn search` / `shadcn docs <component>` (or the MCP tools) to find and read a component **before** generating code — never invents component APIs from memory.
- **Add via CLI**: components enter the repo only through `pnpm dlx shadcn@latest add <component>` into `src/components/ui/`. Files there are **never hand-edited**; customization happens by (a) theme tokens, (b) variants, or (c) wrapper compositions in `src/components/ab/`. Upgrades go through `shadcn diff` and get a `decisions.md` entry if a divergence is kept.
- **Composition rules enforced by the skill**: forms use `Field`/`FieldGroup` (+ RHF), option sets use `ToggleGroup`, empty states use `Empty`, **semantic color tokens only** — a feature file containing a raw hex or a Tailwind palette color (`bg-blue-500`) fails lint.
- The expected base set (added in W0, extended per phase via the CLI): button, input, field, form patterns, select, combobox, dialog, sheet, drawer, dropdown-menu, tabs, table, data-table, card, badge, avatar, calendar, date-picker, chart, skeleton, sonner (toasts), tooltip, progress, switch, checkbox, radio-group, toggle-group, scroll-area, separator, sidebar, empty, spinner, input-otp, kbd.

## 5. Theming — design.md mapped onto shadcn CSS variables

- Fonts self-hosted in `public/fonts`: **Space Grotesk** (display) · **Geist** (UI) · **Geist Mono** (every number that matters — `MonoNumber` wraps this; raw digits in features are a lint smell).
- `src/styles/tokens.css` defines the shadcn variable set (`--background`, `--foreground`, `--primary`, `--destructive`, `--muted`, `--border`, `--radius`, chart colors…) in **OKLCH**, light + dark, valued from `design.md`'s palette; the app is light+dark, **marketing is light-only**.
- Signature motion — signal sweep (working/generating) and beacon pulse (live status) — implemented once in `ab/` and **fully removed under `prefers-reduced-motion`** (a Playwright check, not a promise).
- Status is never color-only (icon + text via `StatusBadge`); destructive dialogs name their consequence; action labels persist through their flow (Approve → Approved…).

## 6. Runtime backends

**None.** The app talks to nothing. Marketing pricing, plan entitlements, analytics series, publish results, connection returns, and compose output are all values in `src/data/`. "Connect" flows are simulated in-app as routed steps, not redirects to a provider. This is the property `guard-static.ts` and the e2e network assert exist to protect.

## 7. Manual steps — the complete list

| #   | Step                                                                             | When    |
| --- | -------------------------------------------------------------------------------- | ------- |
| 1   | GitHub repo                                                                      | day 1   |
| 2   | Web domain + ACM cert (e.g. `alphabeacon.com` / `www`) per the agent's checklist | day 1   |
| 3   | One-word gate approvals + PR reviews                                             | ongoing |

Everything else — shadcn init, skill install, tokens, data, deploys, verifies — is agent + CI. No package-registry token, no CORS ask, no backend coordination of any kind.

## 8. Screen coverage map (screens4.md is truth; every ID lands in exactly one phase)

| Phase | Screens                         |
| ----- | ------------------------------- |
| W2    | M1 · A1–A5 · N3                 |
| W3    | D1–D5                           |
| W4    | C1–C4 · B1–B3                   |
| W5    | E1–E4 · H1–H4                   |
| W6    | F1 · G1–G2 · I1–I7 · N1, N2, N4 |

Every data-backed screen ships loading / empty / error / populated, keyboard navigation, reduced-motion behavior, and an axe-clean check — enforced per phase, not deferred.

## 9. Phases — build in this order

Branch `w/NN-slug` → PR with `pnpm verify:wNN` output pasted → merge on green.

### W0 — Foundation + shadcn + the skill + the data layer

Vite + React + strict TS scaffold; Tailwind v4; `shadcn init` (base **radix**, `components.json` committed) + `pnpm dlx skills add shadcn/ui` (skill committed); `src/styles/tokens.css` from design.md (fonts self-hosted, OKLCH light+dark, radius); base component set via `shadcn add` (§4 list); router + providers shell; **`src/data/types.ts` + the first two datasets (`fresh`, `active`) + `DataProvider`**; `/dev/datasets` and `/dev/states` switchers; `src/lib/draft-status.ts`; `scripts/guard-static.ts`; ESLint (incl. the no-raw-color rule) + Prettier + commitlint; CI (lint, typecheck, unit, build, static guard, Playwright + axe scaffolding); `infra/` CDK deploying dev + staging.
**Verify:** `shadcn info --json` reflects the committed config and the skill loads · app boots with a seeded route in both themes (fonts + tokens visibly correct) · a planted raw-hex in a feature fails lint · **a planted `fetch(` anywhere in `src/` fails `guard-static`** · a Playwright smoke run records zero network requests · a canary PR is blocked by every check · staging URL serves the shell.

### W1 — The AB design layer (compositions over shadcn)

`src/components/ab/`: AppShell (collapsing left rail — Dashboard, Today with the beacon live dot, Calendar, Studio, Analytics, Connections, Billing, Settings; org switcher — top bar with title+context, bell, theme toggle, account menu, plan + credit chip), PageHeader, MonoNumber, StatusBadge (icon+text), SlotChip, ClaimChip (verified/flagged), EmptyState/ErrorState + skeleton patterns, confirm dialogs that name consequences, form field wrappers on `Field`/`FieldGroup` + RHF + local zod, toast host (sonner), signal-sweep + beacon-pulse (reduced-motion removes both); `/dev/kitchen-sink` rendering every primitive in both themes.
**Verify:** kitchen-sink axe-clean in light + dark · reduced-motion run shows zero signature animation (Playwright asserts) · form wrapper surfaces a named validation message from a schema violation · keyboard-only walk of the shell.

### W2 — Marketing + auth + onboarding (M1, A1–A5, N3)

Marketing site (light-only, prerendered): hero, features, how-it-works, **pricing rendered from `src/data/entities/plans.ts` — the same module H1 reads**, FAQ, CTA band. Auth: signup (strength meter + live checklist, duplicate-email → sign-in link), signin (generic error + the **locked-out countdown**), verify (resend cooldown mono timer, expired-link recovery), reset (no-enumeration copy). Onboarding wizard (resumable): brand basics → connect (condensed hub; X "coming soon") → calendar (condensed sources) → **Start pipeline** (days pills, posts/day stepper capped at 3, model cards with friendly names + plan notes, tones multi-select with the inline custom-tone overlay, live mono summary sentence) → ready (beacon moment). N3 empty-org redirect resumes the right step.
**Verify:** every A/M state renders per screens4 across the dataset + state switchers · Playwright golden: signup → verify → onboard → dashboard · marketing pricing and H1 pricing assert equal from one module · `posts_per_day=4` blocked with the named message · axe + reduced-motion clean.

### W3 — Dashboard + Today + draft detail + media panel + schedule dialog (D1–D5)

D1 stat row (clickable, warning treatments) + quick links + the merged notifications/activity feed + setup-incomplete banner. D2 slot-grouped queue: tone badges (custom = preset treatment), collapsible rationale, ClaimChips, event chips, the full status-driven action rows; a failed slot never blocks siblings. D3 two-column detail with the timestamped timeline + judge score. D4 = the Studio composer draft-scoped in a dialog (model picker with plan locks, credit math line, **insufficient-credits inline upsell preserving the prompt**, generating → succeeded/failed states on a timer, credits-released copy on failure). D5 schedule/publish: channel multi-select from posting-allowed connections, per-channel capability warnings, `needs_reauth` row disabled with inline reconnect, explicit per-channel partial results.
**Verify:** the state-machine walk renders every legal transition and **no** illegal one (`canTransition` drives buttons; Playwright asserts) · the low-credits and not-approved datasets produce the designed states · media entry points are **absent** pre-approval, never disabled-teasing · dashboard stats equal Today/Calendar counts computed from the same dataset (consistency test) · approving in D2 moves the card and updates D1 within the session · axe.

### W4 — Calendar + schedule config + event sources + connections (C1–C4, B1–B3)

C1 config: tz combobox (IANA), day pills, generate-at, capped stepper, model + tones (with "Manage tones →"), event-aware toggle, sticky save bar + dirty guard. C2 sources: country-holiday picker + Google multi-calendar select, needs_reauth states, retry. C3 month/week: ≤3 slot chips/day, status dots, event icon + tinted days, **post-publish performance indicator** with the honest "Syncing…" micro-state, generation-delayed indicator. C4 slot sheet: event card, drafts, skip (+same-day undo), the Performance section. B1 hub: per-platform cards, permission toggles, the **Facebook multi-Page picker**, X permanently "coming soon". B2 permission sheet with scopes (mono) + danger-zone disconnect. B3 the connect-return trio (success / denied / already-connected) reached as in-app routed steps.
**Verify:** DST data (Amman ↔ New-York) renders slots at correct local times · every connection status + return state reachable from the datasets · skip → undo window behavior · "Syncing…" never shows a stale zero · axe.

### W5 — Studio + billing (E1–E4, H1–H4)

E1 gallery (kind + plan-tier filters, credit costs mono, plan badges, balance chip). E2 composer with the **schema-driven params form generated from a capability's JSON Schema held in `src/data/`** (no hardcoded per-model UI) — shared component with D4. E3 jobs (pulsing beacon dot, origin tags "Standalone"/"For draft", queued → running → done progression on a timer). E4 asset detail (player/preview, meta rail, **attach picker filtered to approved-or-later with an honest empty state**, generate-similar, delete confirm). H1 plans from the same module as marketing, with entitlement checklists + up/downgrade confirms; H2 subscription (+ the global `past_due` banner); H3 credits ledger (typed badges, signed mono amounts, reserved-distinct rows, references); H4 checkout return states incl. the pending/lagging state.
**Verify:** the params form renders correctly from ≥3 different capability schemas in `src/data/` · insufficient-credits and plan-gate flows end in designed states with prompts preserved · the `past_due` dataset gates product-wide (banner + disabled actions) · ledger entries sum to the displayed balance (computed, never a stored literal) · axe.

### W6 — Compose + analytics + settings + system (F1, G1–G2, I1–I7, N1, N2, N4)

F1 driven by `compose-player.ts`: input collapse, token-by-token render under signal sweep, mid-run `flag` chips (flagged, never hidden), stop, **failure mid-run → the designed recovery state preserving partial text**, rate-limited state, completed card with the full D2 action row. G1 overview (4 mono stat cards + deltas, per-channel grid, "Sync pending" partials); G2 channel detail (toggleable trend chart via shadcn chart, per-post table, the **limited-data honesty note**). Settings I1–I7 incl. the tones library + the shared create/edit tone component (with Preview action), knowledge upload with per-file status progression, team + invites. N1 bell dropdown, N2 404, N4 offline banner.
**Verify:** all five compose scripts render (happy, flagged, failed→recovery, stopped, rate-limited) · knowledge status lifecycle (Uploading→Processing→Ready/Failed+retry) plays through · custom tone appears identically across D2/C1/F1/onboarding (one data record, four screens asserted) · honesty note shows for limited platforms · axe.

### W7 — Hardening + ship the static build

Full-app `@golden` Playwright walks (the three journeys: onboard→approve→media→schedule; billing lifecycle incl. `past_due`; compose incl. the recovery path); **message-catalogue completeness test** (every entry in `lib/messages.ts` is reachable from some screen, and no screen renders an unlisted string for an error or empty state); route-level code-splitting + bundle budgets; Lighthouse CI (marketing ≥ 95 perf / 100 a11y; app ≥ 85 / 100); keyboard + reduced-motion sweep; visual pass against design.md's checklist; dead-dataset and unused-record pruning; prod deploy.
**Verify:** `@golden` green twice consecutively · **zero network requests in every e2e run** (network assert) · Lighthouse budgets met on the staging deploy · the message-catalogue test passes · every `screens4.md` ID renders in all four states from the switchers · prod deployed and smoked.

## 10. Gate mapping

The backend plans define joint gates G1–G4. With no integration phase here, the web's contribution is **demo-only**:

| Gate | Web contribution                                                          |
| ---- | ------------------------------------------------------------------------- |
| G1   | W0–W3 demoed (shell, auth, onboarding, Today with the full state machine) |
| G2   | W4–W6 demoed                                                              |
| G3   | W7 release candidate (goldens + budgets green)                            |
| G4   | **none** — the web has no integration deliverable in this plan; see §13   |

## 11. CI checks (merge-blocking)

lint (incl. no-raw-color) + typecheck + commitlint · unit + component suites · **`guard-static`** (no fetch/axios/EventSource/WebSocket/http-literal under `src/`) · per-screen state specs (Playwright, dataset + state driven) · **zero-network assert on every e2e run** · axe on every routed screen · `@golden` walks · Lighthouse budgets (W7) · bundle budget · `shadcn diff` clean or divergence recorded in decisions.md · gitleaks + audit.

## 12. Done means

All checks green nightly · W0–W7 shipped with every `screens4.md` ID covered in all four states · zero network requests anywhere in the app · Lighthouse + axe budgets met · zero components hand-edited under `components/ui` without a recorded divergence · every error and empty state drawn from the message catalogue · reduced-motion, keyboard, and both themes verified product-wide · prod deployed.

## 13. What this plan defers (read before writing the integration plan)

Building static is cheap now and buys real independence, but it moves three costs to later. They are listed here so the integration plan starts from an honest inventory rather than a surprise:

1. **Types are declared here, not derived.** `src/data/types.ts`, `lib/draft-status.ts`, and `lib/messages.ts` are the web's own definitions. If the backend's shapes, transitions, or error names differ, reconciling them is integration work, and every screen touches it. Keeping these three files small, central, and free of per-screen variants is what keeps that cost bounded.
2. **There is no data-fetching layer to slot into.** Screens read from `DataProvider` synchronously. Integration means introducing fetching and caching _and_ changing every read site — unless `DataProvider` is the seam that later resolves against an API instead. **Prefer that:** all reads go through provider hooks (`useDrafts()`, `usePlans()`, `useSchedule()`), never through direct imports of `src/data/entities/*` inside features. That single discipline is the difference between a swap and a rewrite, and it costs nothing to hold now.
3. **Loading and error states are designed, not proven.** They render correctly, but nothing has yet produced a real slow response, a partial failure, or a mid-flight cancel. Expect the integration plan to re-test all four states per screen against real latency, and budget for it.
