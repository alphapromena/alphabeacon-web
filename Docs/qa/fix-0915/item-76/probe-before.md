# Item 76 — the Approve toast's entrance, before (built app, 2026-09-15T12:43:39.706Z)

Base: http://localhost:5197 · offsets 40 / 80 / 160 / 400 ms after the click, sampled in page time. "Rendered" is the description over the toast's fill, both composited over the canvas behind the toast at the toast's opacity; "at rest" is the same pair at opacity 1.

## motion

| t (ms) | toast | opacity | rendered | at rest | text | fill | behind | transform | transition-property |
|---|---|---|---|---|---|---|---|---|---|
| 51 | present | 0 | 1 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(8, 13, 17) | matrix(1, 0, 0, 1, 0, 73.6875) | transform, opacity, height, box-shadow |
| 85 | present | 0.136938 | 1.34 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(8, 13, 17) | matrix(1, 0, 0, 1, 0, 63.5968) | transform, opacity, height, box-shadow |
| 168 | present | 0.496939 | 4.27 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(12, 18, 23) | matrix(1, 0, 0, 1, 0, 37.0693) | transform, opacity, height, box-shadow |
| 401 | present | 0.99609 | 13.53 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(8, 13, 17) | matrix(1, 0, 0, 1, 0, 0.288148) | transform, opacity, height, box-shadow |

axe at +80 ms after a second Approve: **0 color-contrast violation(s)**

## reduced motion

| t (ms) | toast | opacity | rendered | at rest | text | fill | behind | transform | transition-property |
|---|---|---|---|---|---|---|---|---|---|
| 46 | present | 1 | 13.62 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(8, 13, 17) | matrix(1, 0, 0, 1, 0, 0) | none |
| 89 | present | 1 | 13.62 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(8, 13, 17) | matrix(1, 0, 0, 1, 0, 0) | none |
| 168 | present | 1 | 13.62 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(8, 13, 17) | matrix(1, 0, 0, 1, 0, 0) | none |
| 408 | present | 1 | 13.62 | 13.62 | rgb(232, 232, 232) | rgb(22, 31, 38) | rgb(8, 13, 17) | matrix(1, 0, 0, 1, 0, 0) | none |

## Checks

| check | result | detail |
|---|---|---|
| motion: the description reads ≥ 4.5:1 as rendered at every offset | FAIL | +51 ms → 1 (opacity 0); +85 ms → 1.34 (opacity 0.136938); +168 ms → 4.27 (opacity 0.496939); +401 ms → 13.53 (opacity 0.99609) |
| motion: opacity is not a transitioned property on the toast | FAIL | transform, opacity, height, box-shadow |
| axe at +80 ms: no color-contrast violation | PASS | clean |
| reduced motion: the description reads ≥ 4.5:1 as rendered at every offset | PASS | +46 ms → 13.62 (opacity 1); +89 ms → 13.62 (opacity 1); +168 ms → 13.62 (opacity 1); +408 ms → 13.62 (opacity 1) |
| reduced motion: opacity is not a transitioned property on the toast | PASS | none |
| reduced motion: the end state at the first sample (opacity 1, transform settled) | PASS | +46 ms → opacity 1, transform matrix(1, 0, 0, 1, 0, 0) |
