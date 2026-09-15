# MOTION-0914/A2 — click to content, measured

Time from the rail link being clicked to the destination's own content being in
the DOM, on the DEMO-0914 seeded world. Both timestamps are taken **inside the
page** — `performance.now()` on the line before `element.click()`, and a
MutationObserver stamping the arrival — so no CDP round trip or Playwright
polling interval is folded into the number.

Five runs per route per condition, twice, on the same machine and the same dev
server. The raw runs are the five files beside this one.

## The result

| Route    | Path        | before (r1 / r2) | after (r1 / r2)  | change             |
| -------- | ----------- | ---------------- | ---------------- | ------------------ |
| Today    | `/today`    | 496 / 486 ms     | **75 / 76 ms**   | **−415 ms**        |
| Studio   | `/studio`   | 47 / 44 ms       | 69 / 66 ms       | +22 ms (see below) |
| Billing  | `/billing`  | 473 / 463 ms     | **76 / 74 ms**   | **−393 ms**        |
| Calendar | `/calendar` | 479 / 476 ms     | **60 / 65 ms**   | **−415 ms**        |
| Settings | `/settings` | 514 / 515 ms     | **108 / 109 ms** | **−406 ms**        |

Medians. The two runs agree to within a few milliseconds everywhere, so none of
this is noise.

The `after` pair above is the SHIPPED build. An earlier `after` pair measured
58–98 ms, before the content entrance lost its opacity fade — two @axe specs
caught that fade putting every tight colour pair on the screen under AA while it
ran, so the entrance became a 4px rise and nothing else. The numbers were taken
again rather than left describing a build that no longer exists.

**Skeleton visible during the navigation: was 5/5 on four of the five routes,
is now 0/5 on all of them.** That is the "nothing may flash a skeleton for work
that is already complete" clause, measured as rendered opacity rather than as
the presence of a node — because it is a claim about what a person sees.

## Studio is the control, and it went the other way

Studio never paid the artificial delay: `StudioGalleryScreen` renders the
capability grid directly instead of gating on `useScreenPhase`, which is why it
measured **47 ms** while its four neighbours measured 463–515 ms. It is the
proof that the product was never slow — it was waiting on itself.

It is also the one route that got slower, reproducibly — by ~14 ms against the
fading entrance and ~22 ms against the shipped one. That was
measured rather than explained away: a third condition, with the content
entrance disabled and nothing else changed
(`click-to-content-control-no-entrance.md`), puts Studio back at **47 ms** —
its exact before figure.

So the entrance costs, in time-to-content, between ~5 and ~22 ms depending on
the route — the price of the 220 ms entrance the ruling kept, and single- to
low-double-digit milliseconds. Before A2 it was invisible in this measurement
only because it fired _after_ the 400 ms wait had already ended.

The control was measured against the earlier fading entrance; the shipped
rise-only one measures a few milliseconds slower again on some routes. Both are
far below anything a person can perceive, and neither is worth another round of
tuning — what mattered was the 400 ms, and the 400 ms is gone.
