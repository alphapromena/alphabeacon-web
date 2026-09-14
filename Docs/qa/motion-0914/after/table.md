# MOTION-0914/A — the same surfaces, re-measured

`baseline.md` in this folder is the raw run against the changed tree; the
before is in `../probe/`. Same probe, same browser, same seeded world.

| Surface                      | Before → after (duration)                                                                         | Hover                             | Press                           | Note                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| Button — primary             | 0.15s ease-in-out → **0.12s ease-out**                                                            | backgroundColor                   | **backgroundColor + translate** | was: 1px nudge only                                                               |
| Button — outline             | 0.15s → **0.12s**                                                                                 | backgroundColor                   | **backgroundColor + translate** | surface step to `--sunken`, hairline to `--input`                                 |
| Nav row (rail)               | fill **snapped** → `background-color` in the list at **0.12s**                                    | backgroundColor                   | **backgroundColor**             | collapse stays at medium, colour takes fast                                       |
| Nav indicator (rail)         | `::before`, 0s, per row → **one element, `transform` at 0.22s**                                   | —                                 | —                               | measured sliding: translateY **4 → 36 → 132 → 228 px** across four routes         |
| Nav indicator (settings)     | `::after`, 0s, per tab → **one element, 0.22s**                                                   | —                                 | —                               | same construction, horizontal                                                     |
| Settings sub-nav tab         | 0.15s → **0.12s**                                                                                 | (selected tab has none by design) | **backgroundColor**             |                                                                                   |
| Input / Textarea             | `box-shadow` **absent from the list** → `border-color, box-shadow, background-color` at **0.12s** | —                                 | borderColor + boxShadow         | the focus ring no longer snaps on ahead of its border                             |
| Menu item                    | **0s — snapped** → `background-color, color` at **0.12s**                                         | backgroundColor                   | **backgroundColor**             |                                                                                   |
| Switch                       | 0.15s → **0.12s**                                                                                 | —                                 | **backgroundColor**             |                                                                                   |
| Card that IS a link (Studio) | **nothing** → `background-color, border-color` at **0.12s**                                       | backgroundColor + borderColor     | **backgroundColor**             | `:has(> a)` — only when the whole card is the target                              |
| Card / draft card (Today)    | nothing → **nothing**                                                                             | —                                 | —                               | **deliberate**: not a click target, and motion without meaning is decoration (§5) |
| Badge                        | nothing → nothing                                                                                 | —                                 | —                               | **deliberate**: not interactive                                                   |
| Skeleton                     | pulse, hard cut to content → pulse, **content arrives**                                           | —                                 | —                               | `data-ab-enter` on `<main>`, 0.22s; see the §5 note below                         |
| Numbers                      | **no figure animated** → `MonoNumber` tweens any number that changes                              | —                                 | —                               | 220ms, matched to `--motion-medium` by a test                                     |
| Table row                    | not rendered anywhere                                                                             | —                                 | —                               | `ui/table.tsx` is imported by no feature                                          |

## Reported under §5, not tuned

1. **The content entrance fires on every navigation.** `useScreenPhase` holds
   every screen on a designed 400ms skeleton at mount, so "loading → ready" is
   not the rare event it sounds like — it is every screen change, measured.
   That is precisely what §3 asked for (skeleton to content is a transition)
   and it sits against §5 (a transition must not make a frequent action feel
   slower). It delays no input — the content is interactive for every frame,
   it is opacity plus 4px — but it adds 220ms of visual settle to the most
   frequent action in the product. **The founder's call, not a tuning knob.**
2. **Cards that are not links got nothing, on purpose** — Today's draft cards
   included, and they were named in the probe as unresponsive. A hover state
   on something nobody can click is decoration.
3. **The two ambient loops keep their own periods** (beacon 2.2s, sweep 1.6s).
   The scale describes how long a change takes; these are continuous loops
   with no start and no end. A heartbeat is a tempo, not a duration.
4. **The sidebar's own collapse still runs on shadcn's `duration-200`**, a
   literal inside `components/ui/sidebar.tsx`. Hand-editing that file is banned
   (CLAUDE.md rule 3) and 200ms is within a rounding error of medium; it is
   named here rather than silently left out of the scale.

## The suite

`pnpm e2e` (static): **110 passed / 5 failed / 85 skipped**, and the five reds
re-run **serially in isolation passed 54/54** — parallel-load flakes, the class
already on record from THEME-0913 and DEMO-0914. Their signatures are the same
ones that file records: 5s waits on a screen that had not finished loading, a
generate-stream test, and "Execution context was destroyed, most likely because
of a navigation". Diagnosed, not adjusted; no spec was touched for them.

Three specs WERE updated, because this order changed what they pinned:
`claim-chip.test.ts` (its frame fake advanced a timestamp argument; the hooks
read one clock now, so the fake advances the clock),
`brand-voice-screen.test.tsx` (a counter that now travels to its new figure, so
the assertion awaits it), and the new `use-number-transition.test.ts`.
