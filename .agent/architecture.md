# Architecture — structure, state, data flow, routing

> How the app is shaped and why it holds together. Reasons live in
> `.agent/decisions.md`. Keep ≤ ~150 lines.

## Bird's-eye view

```
                    ┌────────────────────────────────────────────┐
 [user's browser] ─▶│  alphabeacon-web SPA  (S3 + CloudFront)    │
                    │                                            │
                    │  routes.tsx ─▶ features/<area>/            │
                    │        │            │                      │
                    │        ▼            ▼                      │
                    │  components/ab  ◀─ components/ui (shadcn)  │
                    │        │                                   │
                    │        ▼  provider hooks (useDrafts, …)    │
                    │  data/provider.tsx                         │
                    │        │  active dataset + in-memory reducer│
                    │        ▼                                   │
                    │  data/datasets/  ◀─ data/entities/         │
                    │  visitor · fresh · active · low-credits   │
                    │  · needs-reauth · past-due · quiet-week    │
                    │        │                                   │
                    │        ▼  live mode only (INT phases)      │
                    │  src/api/  ──▶  AlphaStudio API            │
                    └────────────────────────────────────────────┘
              static mode: no network boundary exists — nothing leaves
              live mode: exactly one boundary — src/api/ → the API origin
```

## Folder map (top level)

| Path                        | Responsibility                                                               | Notes                                                               |
| --------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `src/features/<area>/`      | vertical slice: routes, screens, hooks, tests for one area                   | preferred home for new code; mirror `today/` as the reference slice |
| `src/components/ui/`        | shadcn-managed primitives                                                    | enter via `shadcn add` only; **never hand-edited**                  |
| `src/components/ab/`        | our compositions (AppShell, ClaimChip, StatusBadge, MonoNumber, EmptyState…) | the only place primitives get product opinions                      |
| `src/data/types.ts`         | hand-written entity types + the zod schemas forms use                        | one of three integration reconciliation points                      |
| `src/data/entities/`        | the records themselves, per entity                                           | composed into datasets; **never imported by `features/`**           |
| `src/data/datasets/`        | whole-tenant states                                                          | the only way a screen reaches a different world                     |
| `src/data/provider.tsx`     | `DataProvider` — active dataset, session, in-memory reducer, hooks           | THE seam: in live mode, covered entities resolve through `src/api/` |
| `src/api/`                  | the one HTTP client + wire types + session storage (AlphaStudio API)         | the only directory where network code is legal (decisions.md)       |
| `src/lib/draft-status.ts`   | `DraftStatus` + `canTransition`                                              | buttons render from it                                              |
| `src/lib/compose-player.ts` | timer-driven token player for F1                                             | replays `data/compose-scripts.ts`; no transport                     |
| `src/lib/messages.ts`       | every designed error/empty string                                            | features never inline error copy                                    |
| `src/styles/`               | `tokens.css` (design.md → shadcn CSS vars, OKLCH, light+dark)                | never hardcode values in features                                   |
| `e2e/`                      | Playwright: per-screen state specs, `@golden`, `@axe`                        | dataset/state driven; asserts zero network                          |
| `infra/`                    | CDK `ABW-<stage>-Web` (S3 + CloudFront + ACM)                                | stage-parameterized                                                 |

## State management

- **All shared state is the `DataProvider`**: the active dataset, the fake
  session, and a reducer applying session-scoped mutations. Features read it
  through hooks, never by importing entity modules.
- Client state: URL first (filters, ranges, selected slot), then component
  state; a small theme store. No global store beyond the provider.
- The draft state machine is imported from `lib/draft-status.ts`, never
  re-implemented; button visibility = `canTransition(current, target)`.
- Static mode persists nothing: a refresh returns to the active dataset's
  initial state, and the dev routes say so. Live mode persists exactly one
  extra thing — the auth session record (`src/api/session.ts`), in
  localStorage with `rememberMe`, sessionStorage without.

## Data flow — one interaction, end to end

Approve on D2 → `features/today/use-approve.ts` → `DataProvider` dispatch
(`draft/approve`) → the reducer checks `canTransition('pending_review',
'approved')` and returns the next state → subscribed screens re-render → the
card's actions recompute from `canTransition('approved', …)` → the media button
appears (it did not exist before) → D1's counts, derived from the same state,
change in step. Failures are _designed_ rather than thrown: a screen renders an
error state selected at `/dev/states` or implied by its dataset, with copy from
`lib/messages.ts`. In static mode, no request is made at any point.

## The network law (the static law, amended 2026-07-30 and 2026-08-17)

Network code is legal in exactly one place: `src/api/`, and since 2026-08-17 in
exactly **two files** inside it — `client.ts` (every API call) and `upload.ts`
(the one non-API request the app makes: bytes to a presigned url our API just
minted, because the platform never proxies bytes; decisions.md D-INT-A).
Enforced three times — `ab/no-network` (ESLint), `scripts/guard-static.ts`
(build), and the e2e network assert (runtime). Everywhere else under `src/`
there is still no `fetch`, `axios`, `XMLHttpRequest`, `EventSource`, or
`WebSocket`; and NOWHERE, `src/api/` included, an `http(s)://` literal — the
API base URL comes from `VITE_API_BASE_URL` (.env.local), never from source.

**The proxy law (Ward, 2026-08-17).** Everything AI-generative reaches the
external AlphaProStudio service through OUR API's
`/orgs/:orgId/alphastudio/*` namespace, with the normal Bearer session. The
frontend never addresses that service, never signs a request and holds no
service credential, so `guard-static` also bans the marks of doing so in code
under `src/`: `cloudfront.net`, `x-aps-`, the upstream `v1` route prefix,
`svc[_-]?key`, `edge[_-]?secret`. Those rules read code with comments stripped,
so documentation may still name what code may not do.

**Static mode is the default and permanent.** Without the env var the app is
exactly what it always was: datasets, `/dev/datasets`, zero requests, and the
e2e suite asserts zero requests forever. With it, the covered entities go live
behind the provider; e2e then allows exactly one extra origin — the API's.

## Live mode (AlphaStudio integration, INT phases)

- **Hybrid per entity.** Entities the API covers (auth/session, me, orgs +
  members + invites + country/holidays, brand incl. rules, schedules,
  event-sources, slots, notifications) resolve through `src/api/` in live mode.
  The 2026-08-17 contract adds the `/alphastudio/*` proxies — wallet, usage,
  capability catalog, posts runs, media jobs/assets, RAG knowledge — wired in
  INT-7…11. Everything else — drafts/Today, connections, publish/schedule,
  billing/plans/checkout, analytics, streaming, proposals — stays on the static
  datasets, marked in code as awaiting a later backend phase.
- **Two type populations, two levels of trust.** `src/api/types.ts` above the
  proxy divider is our API's own shape: versioned with it, a missing field is a
  bug. Below it, every type is an upstream shape our API forwards unchanged,
  transcribed from JSON actually observed in `Docs/api/alphastudio-shapes.md`
  (`pnpm smoke:alphastudio`) rather than from prose — the contract states new
  fields may appear without notice (decisions.md D-INT-H).
- **No screen knows which side its data came from.** Features keep reading
  provider hooks; the provider decides. That law survived integration on
  purpose — it is what made integration a swap and not a rewrite.
- **Adapters live in the data layer.** The API's wire shapes (`src/api/types.ts`)
  are translated to the app's model (`src/data/types.ts`) at the seam; where
  they disagree the adapter adapts and the gap is logged in open-items — the
  frontend never invents fields the API does not have.
- **Auth strategy is 401.** Tokens are opaque, there is no refresh endpoint;
  any token-carrying 401 purges the session and lands on login with a toast.

## Routing

- Route table: `src/routes.tsx`. Public marketing layout (`/`, light-only,
  pre-rendered) vs authed `AppShell` layout (Dashboard, Today, Calendar,
  Studio, Analytics, Connections, Billing, Settings).
- Guards read the provider's session (dataset-faked in static mode, real and
  persisted in live mode): signed-out (redirect to A2),
  onboarding-incomplete (N3 resume), plan-based UI gating. Deep links: slot
  (`/calendar?slot=`), draft (`/today/:id`), checkout returns
  (`/billing/return?state=`), connect returns (`/connections?connect=`) — all
  reachable as in-app routed steps.
- `/settings` is a redirect, not a screen: every entry point into Settings lands
  on the org profile (`/settings/organization`), and the six sections share one
  frame (`features/settings/settings-layout.tsx`).
- Dev routes (`/dev/datasets`, `/dev/states`, `/dev/kitchen-sink`) are excluded
  from production builds. `/dev/states` forces loading and error **and** N4's
  connectivity banner, which has no honest signal in a static app.

## Error handling & logging

Route-level error boundaries render the designed ErrorState; transient feedback
toasts with copy from `lib/messages.ts`; the completeness test enumerates that
catalogue so no screen renders an unlisted error or empty string. Console stays
clean in CI (a failing assert); no analytics or telemetry vendors.

## Persistence

Two things, both named: the theme preference (`localStorage`, always) and the
live-mode auth session (`src/api/session.ts` — localStorage with `rememberMe`,
sessionStorage without; discarded on load if expired). Everything else is
provider state and resets on refresh, in both modes.

## Cross-cutting

Theming: class-based dark mode on the app shell; marketing forced light.
Motion: `ab/` motion utilities honor `prefers-reduced-motion` (removed, not
reduced). A11y: focus management in dialogs/sheets via shadcn primitives; axe
per screen. i18n: n/a (English UI).

## "Where do I add…?" — agent cheat sheet

| Task                  | Do this                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| new screen / state    | read its `screens4.md` spec → add records/datasets → `shadcn search`/`docs` for parts → build in the feature slice → all four states → Playwright + axe spec |
| new shadcn primitive  | `pnpm dlx shadcn@latest add <c>` → wrap opinions in `ab/` if needed                                                                                          |
| customize a primitive | tokens or variant or `ab/` wrapper; if `ui/` must diverge, `shadcn diff` + decisions.md entry                                                                |
| new data need         | type in `data/types.ts` → records in `data/entities/` → wire into the datasets → expose a provider hook → consume the hook                                   |
| new interaction       | a reducer case in `data/provider.tsx` + a hook; a call ONLY via `src/api/` for a live-covered entity, decided in the provider — never in a feature            |
| new chart             | shadcn `chart` + tokens; mono axis numbers                                                                                                                   |
| new dataset           | `src/data/datasets/<n>.ts` + register in the switcher                                                                                                        |
| new route             | `routes.tsx` + guard + code-split boundary                                                                                                                   |
