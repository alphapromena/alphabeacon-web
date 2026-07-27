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
                    │  fresh · active · past-due · needs-reauth  │
                    │  · low-credits · heavy                     │
                    └────────────────────────────────────────────┘
                       no network boundary exists — nothing leaves
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
| `src/data/provider.tsx`     | `DataProvider` — active dataset, session, in-memory reducer, hooks           | the single seam a future API would resolve behind                   |
| `src/lib/draft-status.ts`   | `DraftStatus` + `canTransition`                                              | buttons render from it                                              |
| `src/lib/compose-player.ts` | timer-driven token player for F1                                             | replaces a stream; no transport                                     |
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
- Nothing persists. A refresh returns to the active dataset's initial state,
  and the dev routes say so.

## Data flow — one interaction, end to end

Approve on D2 → `features/today/use-approve.ts` → `DataProvider` dispatch
(`draft/approve`) → the reducer checks `canTransition('pending_review',
'approved')` and returns the next state → subscribed screens re-render → the
card's actions recompute from `canTransition('approved', …)` → the media button
appears (it did not exist before) → D1's counts, derived from the same state,
change in step. Failures are _designed_ rather than thrown: a screen renders an
error state selected at `/dev/states` or implied by its dataset, with copy from
`lib/messages.ts`. No request is made at any point.

## The static law

The app has no network layer, and that is enforced twice:
`scripts/guard-static.ts` fails the build if `fetch`, `axios`,
`XMLHttpRequest`, `EventSource`, `WebSocket`, or an `http(s)://` literal appears
under `src/`; and every Playwright run asserts zero network requests. Adding a
screen means adding data, never a call.

## Routing

- Route table: `src/routes.tsx`. Public marketing layout (`/`, light-only,
  pre-rendered) vs authed `AppShell` layout (Dashboard, Today, Calendar,
  Studio, Analytics, Connections, Billing, Settings).
- Guards read the provider's fake session: signed-out (redirect to A2),
  onboarding-incomplete (N3 resume), plan-based UI gating. Deep links: slot
  (`/calendar?slot=`), draft (`/today/:id`), checkout returns
  (`/billing/return?state=`), connect returns (`/connections?connect=`) — all
  reachable as in-app routed steps.
- Dev routes (`/dev/datasets`, `/dev/states`, `/dev/kitchen-sink`) are excluded
  from production builds.

## Error handling & logging

Route-level error boundaries render the designed ErrorState; transient feedback
toasts with copy from `lib/messages.ts`; the completeness test enumerates that
catalogue so no screen renders an unlisted error or empty string. Console stays
clean in CI (a failing assert); no analytics or telemetry vendors.

## Persistence

None, by design. Theme preference in `localStorage`; everything else is
provider state and resets on refresh.

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
| new interaction       | a reducer case in `data/provider.tsx` + a hook; never a call                                                                                                 |
| new chart             | shadcn `chart` + tokens; mono axis numbers                                                                                                                   |
| new dataset           | `src/data/datasets/<n>.ts` + register in the switcher                                                                                                        |
| new route             | `routes.tsx` + guard + code-split boundary                                                                                                                   |
