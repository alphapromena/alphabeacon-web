# MOTION-0914/A §1 — the motion baseline, measured

What every interactive surface actually does today, read from a real browser
before anything changed. `baseline.md` beside this file is the raw run.

## How it was measured, and why not by grepping

A Tailwind `transition-all` in a primitive says a transition is **declared**,
not that anything **changes** — a surface can carry `transition-all` and be
visually identical under the cursor, which is exactly the defect this order
names. And an unset `duration-*` computes to Tailwind's 150 ms default, a
number no file in this repo says out loud.

So every row is `getComputedStyle` at rest, again under the cursor, and again
with the mouse genuinely **held down** (`mouse.down()` between reads), because
`:active` cannot be inferred from source at all.

The probe runs against the **dev server**: `/dev/states` and `/dev/datasets`
are stripped from a PROD bundle (`routes.tsx`) and the skeleton is only
reachable through the state switcher. The cascade is identical — Tailwind emits
the same utilities and production only minifies them. The world is the
DEMO-0914 seeded one; the probe switches to `visitor`, signs up, and walks the
workspace that creates, because an empty queue has nothing to animate.

## The table

| Surface                                           | transition-property / duration        | Hover changes   | Press changes (vs hover)   | Verdict                                                                                                                     |
| ------------------------------------------------- | ------------------------------------- | --------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Button — primary                                  | `all` / **0.15 s**                    | backgroundColor | **nothing**                | hover only; press invisible                                                                                                 |
| Button — outline                                  | `all` / **0.15 s**                    | backgroundColor | **nothing**                | hover only; press invisible                                                                                                 |
| Nav row (rail)                                    | **`width, height, padding`** / 0.15 s | backgroundColor | **nothing**                | **fill is NOT in the transition list — it snaps**; press invisible                                                          |
| Nav row — ACTIVE gold rule (`::before`)           | `all` / **0 s**                       | nothing         | nothing                    | **no transition**; a per-row pseudo-element, so it can only appear and disappear                                            |
| Settings sub-nav tab                              | colors / 0.15 s                       | nothing¹        | **nothing**                | press invisible                                                                                                             |
| Settings sub-nav — SELECTED gold rule (`::after`) | `all` / **0 s**                       | nothing         | nothing                    | **no transition**; same per-row pseudo-element fault                                                                        |
| Sidebar (the rail)                                | `all` / **0 s**                       | nothing         | nothing                    | collapse/expand is unanimated at the container                                                                              |
| Card                                              | `all` / **0 s**                       | **nothing**     | **nothing**                | **no response of any kind**                                                                                                 |
| Draft card (Today)                                | `all` / **0 s**                       | **nothing**     | **nothing**                | **no response** — the product's most-handled surface                                                                        |
| Badge                                             | `all` / 0.15 s                        | nothing         | nothing                    | transition declared, nothing to transition                                                                                  |
| Input                                             | colors / 0.15 s                       | nothing         | borderColor, **boxShadow** | **`box-shadow` is not in the property list — the focus ring snaps on**                                                      |
| Textarea                                          | colors / 0.15 s                       | nothing         | borderColor, **boxShadow** | same                                                                                                                        |
| Switch                                            | `all` / 0.15 s                        | nothing         | **nothing**                | press invisible                                                                                                             |
| Menu item (account menu)                          | `all` / **0 s**                       | backgroundColor | **nothing**                | **hover fill snaps**; press invisible                                                                                       |
| Skeleton                                          | `all` / 0 s, `animation: pulse 2s`    | opacity         | opacity                    | pulses, but see below                                                                                                       |
| Table row                                         | **not rendered anywhere**             | —               | —                          | `ui/table.tsx` is imported by no feature; THEME-0913's zebra/sticky/tabular rules style a primitive the product never shows |
| Checkbox                                          | not rendered on the probed screen     | —               | —                          | —                                                                                                                           |
| Numbers (`MonoNumber`)                            | **none** (read from source)           | —               | —                          | every figure in the product replaces its text node outright                                                                 |

¹ `[role="tab"]` `.first()` is the **selected** tab, which by design has no
hover style. Unselected tabs do carry `hover:bg-accent`. Recorded as measured
rather than quietly swapped for a friendlier element.

## What the table says

1. **Press does not exist.** Every surface a person can push — buttons, nav
   rows, menu items, switches, tabs — computes **identically under the cursor
   and while held down**. This is the order's premise, and it measures true on
   every single row.
2. **There is no scale.** Three different durations are in play — 0.15 s
   (Tailwind's default, chosen by nobody), 0 s (no transition), and
   `duration-100` / `duration-200` in the overlay primitives — and not one of
   them is written down as a decision.
3. **Two surfaces declare a transition that cannot fire.** The rail's nav row
   transitions `width, height, padding` while the thing that actually changes
   on hover is `background-color`; inputs transition colours while the focus
   ring arrives as a `box-shadow`. Both snap.
4. **Cards do not respond at all** — including the draft cards on Today, the
   surface this product is judged on.
5. **Both gold active indicators are per-row pseudo-elements at 0 s.** Nothing
   about their construction can slide; they can only blink off one row and on
   at another.
6. **Skeleton to content is not a transition and cannot be one.** The skeleton
   subtree unmounts and the content subtree mounts; there is no element whose
   style changes, so no CSS transition exists to carry it.
7. **No number in the product animates.** `MonoNumber` is the single component
   every figure renders through, and it writes a new text node.
