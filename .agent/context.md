# Context — what this app is

> Product & domain knowledge only. No tech here (that lives in `stack.md` /
> `architecture.md`).

## One-liner

**alphabeacon-web** is the face of AlphaBeacon: the marketing site that sells it
and the React app where marketing teams review AI-drafted posts, generate media
in Creative Studio, schedule and publish across channels, and watch performance.
Built static-first with all data committed in `src/data/`, and since 2026-07-30
wired to the **live AlphaStudio API** for the entities it covers (auth, me,
orgs/members/invites, brand, scheduling, notifications) when
`VITE_API_BASE_URL` is set. Without it the app is fully static — the demo and
the test bed, kept working forever. Everything the API does not yet cover
(drafts/Today, connections, Studio, billing, analytics, compose, knowledge)
stays on the static datasets, awaiting backend phase 2.

## Users & personas

- **Content reviewer** — lives in Today (D2): approve / edit / reject, generate
  media, schedule. The product is judged on this screen; it must be fast,
  honest, and impossible to mis-click into an illegal state.
- **Marketing manager (org admin)** — onboarding, connections, schedule config,
  tones, billing, team. Needs the summary sentence, the caps, and the costs to
  always tell the truth.
- **Prospect** — lands on M1; pricing there is the same live data as H1 and may
  never look broken.

## Core domain concepts (glossary)

| Term             | Meaning in THIS repo                                                                      | Invariants / notes                                                 |
| ---------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Screen ID        | M1, A1–A5, B1–B3, C1–C4, D1–D5, E1–E4, F1, G1–G2, H1–H4, I1–I7, N1–N4                     | `screens4.md` is truth for layout, copy, and states                |
| Four data states | loading / empty / error / populated                                                       | every server-backed screen ships all four                          |
| Draft status     | the state machine in `src/lib/draft-status.ts`                                            | buttons render from `canTransition` — illegal actions cannot exist |
| Dataset          | a whole-tenant static state (visitor, fresh, active, low-credits, needs-reauth, past-due) | switchable at `/dev/datasets`                                      |
| State switcher   | forces loading / error presentation on any screen                                         | `/dev/states`; the dataset supplies empty + populated              |
| Data layer       | `src/data/` — types, entity modules, datasets, `DataProvider`                             | features read via provider hooks only                              |
| Tone             | preset or custom writing style                                                            | custom renders identically to presets everywhere                   |
| ClaimChip        | a source attribution chip (verified / flagged)                                            | grounding is shown, never hidden                                   |
| Message          | a named error/empty string in `src/lib/messages.ts`                                       | one catalogue; no screen invents its own error copy                |

Agents: use these exact terms in code, commits, and UI copy — never synonyms.

## Key user flows (happy paths — all buildable from the datasets)

1. Prospect → M1 → signup → verify → onboarding (brand → connect → calendar →
   **Start pipeline** → ready) → Dashboard.
2. The review loop: Today → approve → D4 media (credits math, 402 upsell) →
   D5 schedule (per-channel warnings, partial results) → published → performance
   on Calendar + Analytics.
3. Compose (F1): prompt + tone → the scripted player renders tokens on a timer →
   flags inline → draft card joins the normal review flow; a scripted mid-run
   failure lands in the designed recovery state with partial text kept.
4. Billing: plans → checkout → return states → credits; `past_due` banners and
   gates product-wide until recovery.

## UI rules that must never break

- The approval gate is visually honest: media entry points are **absent** before
  approval — never disabled-and-teasing.
- Numbers that matter are mono; status is never color-only; destructive actions
  name their consequence; action labels persist through their flow.
- Dashboard stats equal Today/Calendar/Billing exactly; marketing pricing equals
  H1 (one source); custom tones look exactly like presets everywhere.
- Content flagged by guardrails is shown flagged, never hidden; limited
  analytics get the honesty note, never a broken-looking chart.
- Reduced motion removes signal-sweep and beacon-pulse entirely; contrast ≥ AA;
  axe-clean per screen; light + dark for the app, marketing light-only.
- No screen special-cases where its data came from — every read is a provider
  hook, and nothing in `features/` knows the data is static.

## Non-goals / out of scope

Network calls outside `src/api/` · mock servers · SSR framework migration · UI
localization · native apps · hand-rolled component kits (shadcn + `ab/`
compositions only) · inventing fields the API does not have (adapt in the data
layer, log the gap). Business rules are _rendered_ here, not owned: the API is
the authority on transitions, credit math, entitlements, and session expiry.

## External systems & integrations

**One: the AlphaStudio API** (contract in `docs/api/api.md` + `openapi.json` —
the single source of truth; when the frontend's model and the API disagree,
the adapter adapts and the gap is logged, never invented around). Reached only
through `src/api/`, only in live mode. In static mode the old truth still
holds exactly: everything the UI displays lives in `src/data/`, and
`ab/no-network` + `guard-static` + the e2e network assert keep it that way.

## Current stage & priorities

Greenfield per `web-plan.md` (W0–W7, static). When goals conflict:
**state-machine honesty & accessibility > screens4 fidelity > polish > speed**.
The web contributes demos at joint gates G1–G3 and has no G4 deliverable — see
`web-plan.md` §13 for what integration will cost and how to keep that cost low.
