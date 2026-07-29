# Open items — manual gates not yet signed off

Checks a machine cannot make, carried forward until a human signs them off.
Nothing here blocks the next phase; everything here blocks **launch**.

Each `verify:wNN` prints its own MANUAL section — this file is the running
total, so an item cannot be lost simply because its phase is finished. Move an
item to "Signed off" (with the date) only when a human has actually done it.

---

## Outstanding

**None.** All thirteen gates from W1–W6 were walked on 2026-07-29 and signed
off below. What they found is tracked as work, not as debt — see the session
entry for that date and the `2026-07-29` block in `decisions.md`.

One product question is open and **decision-gated, not buildable yet**:

### Timezones and dates on slot times _(from the W4/W6 sittings)_

Times carry no zone anywhere except the calendar header, and list dates drop the
year. A proposal is written and waiting on a decision — see the session entry
for 2026-07-29. Nothing has been changed in the product yet.

---

## Signed off

- **2026-07-29 — all three sittings, thirteen gates.** Sitting 1 (viewport and
  environment), sitting 2 (keyboard and screen reader) and sitting 3 (read it as
  a stranger) were walked in order and triaged. Two reported findings were
  retired as session artifacts, not defects: `/` does render the marketing home
  for a signed-out visitor (`RootGate` handles it), and a 404 at `/pricing` is
  correct because pricing lives at `/billing/plans`. Six focus defects, two
  data-honesty defects and one product question came out of it; the six focus
  defects are fixed and covered by `e2e/settings-a11y.spec.ts` plus the
  `keyboard-focus rules hold` structural check.

  The headline lesson, recorded because it changes how this repo is reviewed:
  **axe was green on every one of those screens and always had been.** It reads
  markup; it does not tab through anything. Six real focus bugs sat underneath a
  passing accessibility suite.

- **2026-07-28 — W1 visual pass.** `/dev/kitchen-sink` in both themes, the
  dashboard, and the empty states via `/dev/datasets`, reviewed against the
  Alpha MENA kit after the brand landed. Approved by the reviewer, including the
  `--brand` / `--primary` split.
