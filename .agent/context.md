# Context — what this app is

> Product & domain knowledge only. No tech here (that lives in `stack.md` /
> `architecture.md`).

## One-liner

**alphabeacon-web** is the face of AlphaBeacon: the marketing site that sells it
and the React app where marketing teams review AI-drafted posts, generate media
in Creative Studio, schedule and publish across channels, and watch performance —
built as a **fully static app** with all data committed in `src/data/`. It makes
no network calls at all. Backend integration is a separate, later plan.

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

| Term             | Meaning in THIS repo                                                                     | Invariants / notes                                                 |
| ---------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Screen ID        | M1, A1–A5, B1–B3, C1–C4, D1–D5, E1–E4, F1, G1–G2, H1–H4, I1–I7, N1–N4                    | `screens4.md` is truth for layout, copy, and states                |
| Four data states | loading / empty / error / populated                                                      | every server-backed screen ships all four                          |
| Draft status     | the state machine in `src/lib/draft-status.ts`                                           | buttons render from `canTransition` — illegal actions cannot exist |
| Dataset          | a whole-tenant static state (fresh, active, past_due, needs re-auth, low credits, heavy) | switchable at `/dev/datasets`                                      |
| State switcher   | forces loading / error presentation on any screen                                        | `/dev/states`; the dataset supplies empty + populated              |
| Data layer       | `src/data/` — types, entity modules, datasets, `DataProvider`                            | features read via provider hooks only                              |
| Tone             | preset or custom writing style                                                           | custom renders identically to presets everywhere                   |
| ClaimChip        | a source attribution chip (verified / flagged)                                           | grounding is shown, never hidden                                   |
| Message          | a named error/empty string in `src/lib/messages.ts`                                      | one catalogue; no screen invents its own error copy                |

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

Any network call whatsoever · a real backend, API client, or mock server ·
authentication against a real identity · persistence across a refresh · SSR
framework migration · UI localization · native apps · hand-rolled component kits
(shadcn + `ab/` compositions only). Business rules are _rendered_ here, not
owned: the eventual API stays the authority on transitions, credit math, and
entitlements.

## External systems & integrations

**None.** That is the defining property of this repo right now. There is no
API, no AlphaProStudio contact, no contracts package, no identity provider, and
no vendor SDK. Everything the UI displays lives in `src/data/`, and `guard-static`
plus the e2e network assert exist to keep it that way.

## Current stage & priorities

Greenfield per `web-plan.md` (W0–W7, static). When goals conflict:
**state-machine honesty & accessibility > screens4 fidelity > polish > speed**.
The web contributes demos at joint gates G1–G3 and has no G4 deliverable — see
`web-plan.md` §13 for what integration will cost and how to keep that cost low.
