# MOTION-0914/A §1 — measured motion baseline

- base: `http://localhost:5199` (the dev server — it is the only build carrying /dev/states; seeded workspace)
- at: 2026-09-14T12:20:37.091Z

Every row is a browser read, not a source grep. **Hover changes** and
**Press changes** list the computed properties that actually differ —
an empty cell means the surface does not respond at all.

| Surface | transition-property / duration / timing | animation | Hover changes | Press changes (vs hover) |
| --- | --- | --- | --- | --- |
| Button — primary | `all` / `0.15s` / `cubic-bezier(0.4, 0, 0.2, 1)` | — | backgroundColor | **nothing** | |
| Button — outline | `all` / `0.15s` / `cubic-bezier(0.4, 0, 0.2, 1)` | — | backgroundColor | **nothing** | |
| Nav row (rail) | `width, height, padding` / `0.15s` / `cubic-bezier(0.4, 0, 0.2, 1)` | — | backgroundColor | **nothing** | |
| Nav row — ACTIVE gold rule | `all` / `0s` / `ease` | — | **nothing** | **nothing** | |
| Sidebar (the rail itself) | `all` / `0s` / `ease` | — | **nothing** | **nothing** | |
| Card | `all` / `0s` / `ease` | — | **nothing** | **nothing** | |
| Badge | `all` / `0.15s` / `cubic-bezier(0.4, 0, 0.2, 1)` | — | **nothing** | **nothing** | |
| Input | `color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to` / `0.15s` / `cubic-bezier(0.4, 0, 0.2, 1)` | — | **nothing** | borderColor, boxShadow | |
| Textarea | `color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to` / `0.15s` / `cubic-bezier(0.4, 0, 0.2, 1)` | — | **nothing** | borderColor, boxShadow | |
| Settings sub-nav tab | `color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to` / `0.15s` / `cubic-bezier(0.4, 0, 0.2, 1)` | — | **nothing** | **nothing** | |
| Table row | NOT FOUND (`[data-slot="table-body"] tr`) | — | — | — |
| Settings sub-nav — SELECTED gold rule | `all` / `0s` / `ease` | — | **nothing** | **nothing** | |
| Checkbox | NOT FOUND (`[data-slot="checkbox"]`) | — | — | — |
| Switch | `all` / `0.15s` / `cubic-bezier(0.4, 0, 0.2, 1)` | — | **nothing** | **nothing** | |
| Draft card (Today) | `all` / `0s` / `ease` | — | **nothing** | **nothing** | |
| Skeleton | `all` / `0s` / `ease` | `pulse 2s` | opacity | opacity | |
| Menu item (account menu) | `all` / `0s` / `ease` | — | backgroundColor | **nothing** | |
