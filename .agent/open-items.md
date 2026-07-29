# Open items — manual gates not yet signed off

Checks a machine cannot make, carried forward until a human signs them off.
Nothing here blocks the next phase; everything here blocks **launch**.

Each `verify:wNN` prints its own MANUAL section — this file is the running
total, so an item cannot be lost simply because its phase is finished. Move an
item to "Signed off" (with the date) only when a human has actually done it.

**Grouped by sitting, not by phase.** A phase is how an item was created; a
sitting is how it gets cleared. Do the sittings in the order below: sitting 1
changes layout, sitting 2 reads semantics on top of that layout, and sitting 3
judges copy and feel — running them the other way round means redoing work.

**13 items outstanding, in 3 sittings, roughly 2–2½ hours total.**

Start `pnpm dev` (http://localhost:5173) for all three.

---

## Sitting 1 — Viewport and environment · 4 items · ~35 min

**Have open:** the app at 360px wide (browser devtools device toolbar, or a real
phone on the LAN), plus your OS appearance setting.

Do this one first: anything it finds is a layout change, and layout changes move
focus order — which would invalidate sitting 2 if you did that first.

### 1.1 — Onboarding wizard at 360px _(from W2)_

Walk A5 end to end at 360px. The day pills, the posts-per-day stepper and the
tone sheet are where touch targets and overlay behaviour are hardest to get
right.

### 1.2 — Today's queue at 360px _(from W3)_

Read Today at 360px, three slot groups deep. Is it still obvious which draft
belongs to which time?

### 1.3 — The month grid at 360px _(from W4)_

Read the calendar at 360px. Three slot chips in one day cell is the density this
design is betting on — does it hold, or does a busy week become unreadable?

### 1.4 — Marketing in a dark OS _(from W2)_

Marketing is light-only by design (decisions.md, 2026-07-19). Set the operating
system to dark and confirm M1 still reads correctly — this is a different check
from the app's dark theme, which is supported.

---

## Sitting 2 — Keyboard and screen reader · 2 items · ~50 min

**Have open:** NVDA (Windows) or VoiceOver (macOS), headphones, and the keyboard
only — put the mouse out of reach.

This is the oldest debt in the file and the reviewer flagged it by name: not to
be discovered at launch. axe already proves every screen has accessible names
and passes WCAG A/AA structurally; **it cannot hear what is announced**, which
is the entire point of this sitting.

### 2.1 — The shell, and the surfaces that do not inherit it _(from W1, widened)_

The original item covered the app shell alone, because in W1 that was all that
existed. The shell is still the thing every authenticated screen inherits, so it
is still where to start — but W3–W6 added surfaces whose semantics the shell
does not cover, and those are exactly where an announcement can be wrong while
axe stays green.

**The shell** — rail (including Today's live dot and its unread count, which
rides in the link's accessible name), org identity, notification bell (per-type
icons, count in the accessible name, mark-all-as-read), theme toggle, account
menu, the past-due banner and the offline banner. Confirm every stop announces a
name and keeps a visible focus ring.

**Then the six surfaces that carry their own semantics:**

| Surface               | What to listen for                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1 streaming run      | The text is deliberately **not** a live region; a separate polite status line announces the transitions. Is that readable, or does it go silent? |
| F1 guardrail flag     | The flagged claim announces "Flagged source" and the text is never hidden.                                                                       |
| G2 recent-posts table | Sorting toggles `aria-sort`; a metric that has not reported says "Syncing…", not a number.                                                       |
| I6 knowledge dropzone | The zone is a drop target, not a control — the Browse button is the keyboard path. Per-file status and progress announce.                        |
| I7 invite + remove    | The dialog traps focus, and the remove confirm names its consequence.                                                                            |
| The save bar's guard  | Navigating away with unsaved edits interrupts. Does the refusal announce, and does focus land inside it?                                         |

### 2.2 — Settings by keyboard alone _(from W6)_

Tab through all six Settings sections: the tag inputs (Enter adds a tag rather
than submitting the form), the rule lists, the dropzone, the invite dialog, and
the sticky save bar. The bar overlays the bottom of the column — confirm the
last field is still reachable and visible while it is showing.

---

## Sitting 3 — Read it as a stranger · 7 items · ~45 min

**Have open:** the app at desktop width, `/dev/datasets` to switch worlds, and
no tooling at all. Everything here is judgment: does it read right, does it feel
like one tool, does a number mean what it looks like. Nothing here is checkable
by a machine, which is why it is last — and why it is the sitting worth doing
slowly.

### 3.1 — Marketing copy _(from W2)_

Read M1 as a prospect: does the hero say what the product does, and does the
pricing section answer the question the hero raises?

### 3.2 — The queue as one continuous tool _(from W3)_

Approve a draft, generate its media, and schedule it end to end. Judge whether it
reads as one tool: the plan asks for D4 to feel like "Studio, in context", not a
second product bolted onto the queue.

### 3.3 — D4 and E2 as one tool _(from W5)_

Open the media panel from a draft, then the composer from the gallery, back to
back. `verify:w05` proves they share the component; what it cannot judge is
whether they _feel_ like one tool, which is what the checklist actually asks.

### 3.4 — The compose run at full length _(from W6)_

Watch a generate run from the first word to the last. Does the token pace read as
writing, or as a progress bar wearing words? The rate is one constant
(`COMPOSE_TOKEN_MS`); nothing but a human can say whether it is the right one.

### 3.5 — The ledger as someone querying a charge _(from W5)_

Read `/billing/credits` as a customer asking why their balance is lower than
their spend. Do the held rows explain it without needing the concept explained?

### 3.6 — Analytics after a quiet week _(from W6)_

Read G1 with the 30-day range on. Do the deltas, the "not reported" line and the
per-channel cards tell one consistent story, or do they invite the reader to
average three different ones?

### 3.7 — Timezone as the audience sees it _(from W4)_

Switch the timezone in Schedule settings and confirm the slot times shown match
what an audience in that zone would actually see. The arithmetic is tested
(`src/lib/timezone.test.ts`, including both 2026 DST boundaries); what a machine
cannot judge is whether the screen makes the zone obvious enough to trust.

---

## Signed off

- **2026-07-28 — W1 visual pass.** `/dev/kitchen-sink` in both themes, the
  dashboard, and the empty states via `/dev/datasets`, reviewed against the
  Alpha MENA kit after the brand landed. Approved by the reviewer, including the
  `--brand` / `--primary` split.
