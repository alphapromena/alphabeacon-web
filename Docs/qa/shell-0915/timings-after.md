# Item 77 — route arrivals, after (2026-09-15T17:24:12.070Z)

Base: http://localhost:5199 · from `/` (Dashboard), click a rail link, until `main` carries the screen's text — proof E's clock; 3 runs per route per mode. TEST-0915's range: 53–90 ms.

## motion

| rail | runs (ms) | min | median | max | same indicator node |
|---|---|---|---|---|---|
| Today | 338, 52, 48 | 48 | 52 | 338 | yes yes yes |
| Billing | 322, 25, 23 | 23 | 25 | 322 | yes yes yes |
| Settings | 658, 67, 65 | 65 | 67 | 658 | yes yes yes |
| Studio | 338, 32, 30 | 30 | 32 | 338 | yes yes yes |
| Calendar | 322, 35, 35 | 35 | 35 | 322 | yes yes yes |

All hops: min 23 · median 52 · max 658 ms (n=15)

## reduced motion

| rail | runs (ms) | min | median | max | same indicator node |
|---|---|---|---|---|---|
| Today | 337, 49, 49 | 49 | 49 | 337 | yes yes yes |
| Billing | 334, 24, 22 | 22 | 24 | 334 | yes yes yes |
| Settings | 650, 67, 67 | 67 | 67 | 650 | yes yes yes |
| Studio | 339, 31, 30 | 30 | 31 | 339 | yes yes yes |
| Calendar | 318, 34, 32 | 32 | 34 | 318 | yes yes yes |

All hops: min 22 · median 49 · max 650 ms (n=15)

## Checks

| check | result | detail |
|---|---|---|
| motion: every hop arrived (no timeout) | PASS | 0 timed out |
| motion: the median arrival stays inside TEST-0915's 53–90 ms (the hard stop is a regression ABOVE it) | PASS | median 52 ms, max 658 ms |
| motion: the indicator is the same node after every hop | PASS | 0 of 15 hops re-created it |
| reduced motion: every hop arrived (no timeout) | PASS | 0 timed out |
| reduced motion: the median arrival stays inside TEST-0915's 53–90 ms (the hard stop is a regression ABOVE it) | PASS | median 49 ms, max 650 ms |
| reduced motion: the indicator is the same node after every hop | PASS | 0 of 15 hops re-created it |
