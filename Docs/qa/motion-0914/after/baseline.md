# MOTION-0914/A §1 — measured motion baseline

- base: `http://localhost:5199` (the dev server — it is the only build carrying /dev/states; seeded workspace)
- at: 2026-09-14T12:31:35.507Z

Every row is a browser read, not a source grep. **Hover changes** and
**Press changes** list the computed properties that actually differ —
an empty cell means the surface does not respond at all.

| Surface | transition-property / duration / timing | animation | Hover changes | Press changes (vs hover) |
| --- | --- | --- | --- | --- |
| Button — primary | `all` / `0.12s` / `cubic-bezier(0.16, 1, 0.3, 1)` | — | backgroundColor | backgroundColor, translate | |
| Button — outline | `all` / `0.12s` / `cubic-bezier(0.16, 1, 0.3, 1)` | — | backgroundColor | translate | |
| Nav row (rail) | `width, height, padding, background-color, color` / `0.22s, 0.22s, 0.22s, 0.12s, 0.12s` / `cubic-bezier(0.16, 1, 0.3, 1)` | — | backgroundColor | backgroundColor | |
| Nav indicator (rail) | `transform, height, width, opacity` / `0.22s, 0.22s, 0.22s, 0.12s` / `cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1)` | — | **nothing** | **nothing** | |
| Sidebar (the rail itself) | `all` / `0s` / `ease` | — | **nothing** | **nothing** | |
| Card | `all` / `0s` / `ease` | — | **nothing** | **nothing** | |
| Badge | `all` / `0.12s` / `cubic-bezier(0.16, 1, 0.3, 1)` | — | **nothing** | **nothing** | |
| Input | `border-color, box-shadow, background-color` / `0.12s, 0.12s, 0.12s` / `cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1)` | — | **nothing** | borderColor, boxShadow | |
| Textarea | `border-color, box-shadow, background-color` / `0.12s, 0.12s, 0.12s` / `cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1)` | — | **nothing** | borderColor, boxShadow | |
| Settings sub-nav tab | `color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to` / `0.12s` / `cubic-bezier(0.16, 1, 0.3, 1)` | — | **nothing** | backgroundColor | |
| Table row | NOT FOUND (`[data-slot="table-body"] tr`) | — | — | — |
| Nav indicator (settings sub-nav) | `transform, height, width, opacity` / `0.22s, 0.22s, 0.22s, 0.12s` / `cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1)` | — | **nothing** | **nothing** | |
| Card that IS a link (Studio capability) | `background-color, border-color` / `0.12s, 0.12s` / `cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1)` | — | backgroundColor, borderColor | backgroundColor | |
| Checkbox | NOT FOUND (`[data-slot="checkbox"]`) | — | — | — |
| Switch | `all` / `0.12s` / `cubic-bezier(0.16, 1, 0.3, 1)` | — | **nothing** | backgroundColor | |
| Draft card (Today) | `all` / `0s` / `ease` | — | **nothing** | **nothing** | |
| Skeleton | `all` / `0s` / `ease` | `pulse 2s` | opacity | opacity | |
| Menu item (account menu) | `background-color, color` / `0.12s, 0.12s` / `cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1)` | — | backgroundColor | backgroundColor | |
