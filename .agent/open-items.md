# Open items — manual gates not yet signed off

Checks a machine cannot make, carried forward until a human signs them off.
Nothing here blocks the next phase; everything here blocks **launch**.

Each `verify:wNN` prints its own MANUAL section — this file is the running
total, so an item cannot be lost simply because its phase is finished. Move an
item to "Signed off" (with the date) only when a human has actually done it.

---

## Outstanding

### W1 — screen-reader walk of the app shell

Drive the rail, org identity, notification bell, theme toggle and account menu
with the keyboard alone under NVDA or VoiceOver. Confirm every stop announces a
name and keeps a visible focus ring.
**Why it stays open:** axe checks names exist; it cannot hear what is announced,
and the shell is the one surface every authenticated screen inherits. Explicitly
flagged by the reviewer as "not to be discovered at launch."

### W2 — marketing copy read

Read M1 as a prospect: does the hero say what the product does, and does the
pricing section answer the question the hero raises?

### W2 — wizard at phone width

Walk A5 on a 360px viewport. The day pills, the posts-per-day stepper and the
tone sheet are where touch targets and overlay behaviour are hardest to get
right.

### W2 — marketing in a dark OS

Marketing is light-only by design (decisions.md, 2026-07-19). Confirm it still
reads correctly when the operating system is set to dark.

### W3 — the queue as one continuous tool

Approve a draft, generate its media, and schedule it end to end. Judge whether
it reads as one tool: the plan asks for D4 to feel like "Studio, in context",
not a second product bolted onto the queue.

### W3 — the queue on a phone

Read Today at 360px, three slot groups deep. Is it still obvious which draft
belongs to which time?

---

## Signed off

- **2026-07-28 — W1 visual pass.** `/dev/kitchen-sink` in both themes, the
  dashboard, and the empty states via `/dev/datasets`, reviewed against the
  Alpha MENA kit after the brand landed. Approved by the reviewer, including the
  `--brand` / `--primary` split.
