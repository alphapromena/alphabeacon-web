# MOTION-0914/B — the four moments, measured

Raw runs: `moments-before.md`, `moments-after.md`. Same probe, same seeded
DEMO-0914 world, same dev server.

## Each moment, and what it costs

| #   | Moment               | Where                                       | Duration                           | Token             |
| --- | -------------------- | ------------------------------------------- | ---------------------------------- | ----------------- |
| 1   | Tone sample rewrites | `/calendar/settings`, the tone picker       | **220 ms**                         | `--motion-medium` |
| 2   | First light          | over the app, once per account              | **1800 ms** total; rings 900 ms    | `--motion-slow`   |
| 3   | Approve              | the draft card, anywhere it is approved     | **220 ms** settle + sweep          | `--motion-medium` |
| 4   | Generating           | `/generate`, the Studio composer, Knowledge | continuous while work is in flight | —                 |

Moment 2's 1800 ms is under the order's two-second ceiling, and
`first-light.test.tsx` asserts that rather than trusting it.

## Moment 3 — Approve must not cost the click

|        | n   | median    | min | max |
| ------ | --- | --------- | --- | --- |
| before | 3   | **40 ms** | 40  | 41  |
| after  | 3   | **44 ms** | 43  | 44  |

Click to the card's own answer — the Approve button gone, the approved action
row in its place — timed inside the page. **+4 ms**, which is a fifth of a
frame at 60 Hz and below anything a person can perceive. Nothing gates the
click: `draft/approve` dispatches and the queue re-renders exactly as before;
the animation reads the result and draws over it.

n is 3 because the seeded world has exactly three drafts awaiting review, which
is the whole population of the action.

## axe — scanned DURING each moment, not after

Phase A shipped a 58-violation contrast hazard inside an opacity fade that the
suite could not see, because it had ended by the time the scans ran. So every
scan here is taken deliberately mid-animation.

| Where                                 | Before                            | After |
| ------------------------------------- | --------------------------------- | ----- |
| moment 2 — first light, mid-animation | _did not exist_                   | **0** |
| moment 1 — tone sample at rest        | **0**                             | **0** |
| moment 1 — mid-rewrite                | **0**                             | **0** |
| moment 4 — generating, mid-stage      | **0**                             | **0** |
| moment 3 — approve, mid-animation     | **1** — `color-contrast`, 2 nodes | **0** |

**The one violation was real, pre-existing, and on the daily action.** The
Approve toast's description — "Create the art, or schedule it as it is." —
measured **1.46:1** (`#373839` on `#141c23`). Cause: `ui/sonner.tsx` passes
next-themes' value straight through, which resolves to `system`, so on a
machine set to light sonner picked its LIGHT internal palette and painted dark
grey text on our graphite popover. There is only one theme (D-THEME-0913-B), so
the call site now says `theme="dark"`; the description measures 14:1 and the
scan is clean. Fixed at the call site because `components/ui/` is never
hand-edited (rule 3).

## Moment 4 — the stages are real, and they move

Observed across one run, in order:

1. `Reading your brand voice, tones and sources…` — the run is accepted and
   not one word has arrived.
2. `Writing your draft…` — words are arriving.
3. `Checking the claims it made against your sources…` — a cited claim has
   surfaced beside them.

No timer, no easing, no percentage: each line names something that has already
happened, and `generate-stage.test.ts` asserts none of them can ever claim
progress the product does not know.

The beacon was already the figure for work in flight on Generate and in the
Studio composer. The one remaining spinner — Knowledge file ingestion — is now
the beacon too, so the product has one vocabulary for "work is happening".

## Two clauses not implemented as written, and why

1. **"then it resolves into Today".** First light resolves into whatever the
   app has routed to, which after verifying is the **Dashboard**. Changing the
   post-verify destination would break `signUpAndEnter` in `e2e/live-setup.ts`
   — the helper ~15 live specs share — and live specs cannot be run in a build
   order (the standing rule). Editing them blind is exactly open item 71. The
   overlay never navigates, which is what makes "skipping lands in the same
   place" structural; where that place is remains a routing decision for a
   founder, not a motion order.
2. **"it leaves the stack".** In LIVE Today an approved item does leave the
   pending tab. In STATIC Today a slot deliberately shows its whole day
   (screens4 D2 — "Across 3 slots"), so the card stays in place and re-renders
   with its Approved badge and its next action. The settle and the sweep are
   built; the grouping was not changed, because removing an approved draft from
   its slot is a D2 design decision rather than a motion one. The review
   counter does count down — `awaiting` counts `pending_review` only — on the
   `MonoNumber` tween phase A built.
