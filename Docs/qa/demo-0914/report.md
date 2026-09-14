# ORDER DEMO-0914 — a new account lands in a product that is alive

Branch `feat/demo-0914`, off `feat/theme-0913` = `6fb7bcd`. Not merged.

## 1 — the probe

The table, the two verbatim transcripts and the measurement that decides which
preview matters live in `probe/`:

- `probe/table.md` — the screen-by-screen table and its three findings
- `probe/static-preview/transcript.md` — a fresh account, static, zero network
- `probe/live-preview/transcript.md` — a fresh account, `1.malaky.ai`, dev API

The single most consequential fact in it: **the preview a branch gets is
static.** `VITE_API_BASE_URL` exists in the Vercel project in `production` and
in `preview` pinned to the **`live` branch only**, so the preview of
`feat/demo-0914` boots the fully static app. That is what made client-side
seeding the right lever and not a shortcut.

## 2 — what is seeded

One file, `src/data/first-run-seed.ts`, applied from one reducer case
(`workspace/created` — the single moment a workspace goes from not existing to
existing since the wizard was deleted). Static mode only; live mode dispatches
`live/resync` and never reaches it.

| Area     | Seeded                                                                                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Queue    | **6 drafts** across 4 slots — 3 `pending_review`, 1 `approved`, 1 `media_ready`, 1 `scheduled` for tomorrow — in 5 of the workspace's tones, with rationales, judge scores and cited claims (one flagged, so D3's flag state is reachable) |
| Calendar | 3 slots today, 1 tomorrow, 10 `pending` slots ahead; a Jordan public-holidays source and two holidays                                                                                                                                      |
| Schedule | running — Sun–Thu, 2 a day, generate at 06:00, all five tones, events attached; the world's own timezone kept                                                                                                                              |
| Studio   | 2 jobs (one succeeded → its asset, attached to the `media_ready` draft; one failed with its released-credits reason) and 1 asset                                                                                                           |
| Brand    | voice do/don't rules, 3 followed sources, 5 topics, country                                                                                                                                                                                |

**Nothing publishes, bills or touches a paid path, and that is asserted rather
than intended** (`src/data/first-run-seed.test.ts`, 9 tests): no `published` or
`publish_failed` draft and no `publishResults`; every connection stays
`not_connected`; `billing`, `ledger` and `plans` are byte-identical to the
unseeded world. In static mode there is no paid path to hit in the first place —
checkout resolves to an in-app demo route and the probe recorded **zero
off-origin requests**.

What the seed refuses to invent, and why, is D-DEMO-0914-B.

## 3 — screens that stay honestly empty

| Screen          | What it says now                                                                                                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Analytics**   | "Analytics arrive with publishing" — reach and engagement arrive with channel publishing; neither is wired up yet. **No action button**: the old one sent people to a screen that cannot finish the job either. |
| **Connections** | One line at the top: connecting walks the flow, but no channel is linked to a platform yet — nothing here posts on your behalf.                                                                                 |

Both are backend-absent, not seed-absent: there is no analytics endpoint and no
connections endpoint anywhere in `src/api`.

Left alone deliberately: Billing's empty invoice history (a real wire, no
invoices yet), Studio's capability grid (populated in both modes — the first
probe pass recorded it empty and was wrong), and the Settings sections whose
emptiness is simply a new workspace's own.

## 4 — the two Finish setup routes

**Kept: the empty state's.** It is the primary action, it sits under the
sentence that explains why it is there, and live Today has only ever had that
one — so removing the header's makes the two halves of Today agree rather than
diverge. The header's control is suppressed only where it duplicates
(`todaySlots.length === 0 && emptyState.href === '/generate'`); with a queue on
screen, and in the branch that routes to the calendar instead, it still renders
because it is then a real second route. Full reasoning: D-DEMO-0914-C.

## Proof, after

`after/static-preview/transcript.md` — the same probe, same build pipeline,
against the seeded world. Today reads **"3 drafts ready for review · Across 3
slots"** with every action row reachable; the rail carries a 3-draft badge; the
dashboard says "3 drafts are ready for review" and its setup card is replaced
by "Setup is complete"; the calendar shows the week; Studio's renders list has
a success and a failure. Zero off-origin requests.
