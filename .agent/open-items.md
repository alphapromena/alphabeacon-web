# Open items — manual gates not yet signed off

Checks a machine cannot make, carried forward until a human signs them off.
Nothing here blocks the next phase; everything here blocks **launch**.

Each `verify:wNN` prints its own MANUAL section — this file is the running
total, so an item cannot be lost simply because its phase is finished. Move an
item to "Signed off" (with the date) only when a human has actually done it.

---

## Outstanding

### M1 cinematic — two items gated on the human (2026-07-30)

**Clip-1 take approval → 4K re-render.** Three takes of the hero assembly clip
were generated; **take C** shipped (the most monotonic build — see decisions.md
2026-07-30). All three takes are in the session scratchpad and linked in the
session entry. Once a take is approved, re-render it once at 4K (Seedance std
supports it; ~2–4× the 72-credit 1080p cost) and re-extract the 200-frame
sequence + `hero-static.webp` to the same filenames — a drop-in swap, no code
change. If a different take is preferred, the same pipeline command applies to
it.

**The marquee's pause affordance is hover-only.** WCAG 2.2.2 wants a pause
mechanism for the drifting customer strip; hover pauses it and reduced motion
removes it, but there is no keyboard-reachable pause (nothing in the strip is
focusable). Judge in sitting 2 whether that stands or the strip needs a
control.

### Two gates REOPENED — they must run against the fixed build

The focus, tablist and posting-time changes of 2026-07-29 moved the very
semantics two of the sittings exist to check, so their earlier sign-off no
longer covers what is on screen now. **The 2026-07-30 M1 rebuild adds the
cinematic page to both sittings' scope.**

**Sitting 1 — viewport and environment (~45 min).** Unchanged in scope, but the
settings tablist, the role select and the longer posting-time strings are all
new since it ran, and all three are width-sensitive. Re-walk 360px. Now also:
the cinematic M1 at 360px (hero falls back to the loop video — confirmed clean
in automation, judge it by eye), the scrub by hand on a real wheel/trackpad
(cadence and the 07:00 handoff are judged by feel), and the page with OS dark
mode on (marketing is light-only; the ink islands are fixed art direction).

**Sitting 2 — keyboard and screen reader (~60 min).** This one changed the most.
Settings is now a `tablist`/`tab`/`tabpanel` with roving tabindex and manual
activation, the leave-guard hands focus back explicitly, two hidden file inputs
left the tab order, and the team rows gained a role `<select>` whose most
important behaviour is an ABSENT option. None of that existed when the walk was
done. Listen specifically for:

- the tablist announcing position ("tab 3 of 6") and selection state;
- the leave-guard's return: after "Keep editing", is focus announced back in the
  field, or silently moved?
- the role select on the last admin — the missing option is the design, so does
  the row's explanation get announced with it?
- posting times: `9:00 AM GMT+3 · 10:00 AM your time` reads as one string;
  confirm it is not heard as two unrelated numbers.

New for the cinematic M1:

- the hero reads as: heading "AlphaBeacon", the subtitle, then the ready line —
  no letter soup from the tracked-in wordmark (letters are `aria-hidden`);
- the customer strip announces as a plain list, never as moving text;
- the loop section reads its `sr-only` sentence ("draft, approve, publish"),
  not three shouted words;
- the tone chips announce pressed state, and the sample swap (aria-live
  polite) reads once, calmly, per change;
- with reduced motion on: the page is complete and calm — finished hero frame,
  posters, static strip — nothing reads as missing.

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
