# Item 76 — the Approve toast's entrance, after (built app, 2026-09-15T12:44:28.226Z)

Base: http://localhost:5197 · offsets 40 / 80 / 160 / 400 ms after the click, sampled in page time. "Rendered" is the description over the toast's fill, both composited over the canvas behind the toast at the toast's opacity; "at rest" is the same pair at opacity 1.

## motion

| t (ms) | toast | opacity | rendered | at rest | text | fill | behind | transform | transition-property |
|---|---|---|---|---|---|---|---|---|---|
| 53 | present | 1 | 13.62 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(8, 13, 17) | matrix(1, 0, 0, 1, 0, 68.4797) | transform, visibility, height, box-shadow |
| 87 | present | 1 | 13.62 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(12, 18, 23) | matrix(1, 0, 0, 1, 0, 57.4556) | transform, visibility, height, box-shadow |
| 169 | present | 1 | 13.62 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(12, 18, 23) | matrix(1, 0, 0, 1, 0, 26.1371) | transform, visibility, height, box-shadow |
| 402 | present | 1 | 13.62 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(8, 13, 17) | matrix(1, 0, 0, 1, 0, 0.0694989) | transform, visibility, height, box-shadow |

axe at +80 ms after a second Approve: **0 color-contrast violation(s)**

## reduced motion

| t (ms) | toast | opacity | rendered | at rest | text | fill | behind | transform | transition-property |
|---|---|---|---|---|---|---|---|---|---|
| 45 | present | 1 | 13.62 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(8, 13, 17) | matrix(1, 0, 0, 1, 0, 0) | none |
| 90 | present | 1 | 13.62 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(8, 13, 17) | matrix(1, 0, 0, 1, 0, 0) | none |
| 167 | present | 1 | 13.62 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(8, 13, 17) | matrix(1, 0, 0, 1, 0, 0) | none |
| 403 | present | 1 | 13.62 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(8, 13, 17) | matrix(1, 0, 0, 1, 0, 0) | none |

## Checks

| check | result | detail |
|---|---|---|
| motion: the description reads ≥ 4.5:1 as rendered at every offset | PASS | +53 ms → 13.62 (opacity 1); +87 ms → 13.62 (opacity 1); +169 ms → 13.62 (opacity 1); +402 ms → 13.62 (opacity 1) |
| motion: opacity is not a transitioned property on the toast | PASS | transform, visibility, height, box-shadow |
| axe at +80 ms: no color-contrast violation | PASS | clean |
| reduced motion: the description reads ≥ 4.5:1 as rendered at every offset | PASS | +45 ms → 13.62 (opacity 1); +90 ms → 13.62 (opacity 1); +167 ms → 13.62 (opacity 1); +403 ms → 13.62 (opacity 1) |
| reduced motion: opacity is not a transitioned property on the toast | PASS | none |
| reduced motion: the end state at the first sample (opacity 1, transform settled) | PASS | +45 ms → opacity 1, transform matrix(1, 0, 0, 1, 0, 0) |
