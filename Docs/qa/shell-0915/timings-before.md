# Item 77 — route arrivals, before (2026-09-15T17:11:43.366Z)

Base: http://localhost:5199 · from `/` (Dashboard), click a rail link, until `main` carries the screen's text — proof E's clock; 3 runs per route per mode. TEST-0915's range: 53–90 ms.

## motion

| rail | runs (ms) | min | median | max | same indicator node |
|---|---|---|---|---|---|
| Today | 335, 73, 65 | 65 | 73 | 335 | NO NO NO |
| Billing | 354, 65, 62 | 62 | 65 | 354 | NO NO NO |
| Settings | 670, 95, 94 | 94 | 95 | 670 | NO NO NO |
| Studio | 360, 58, 55 | 55 | 58 | 360 | NO NO NO |
| Calendar | 330, 56, 52 | 52 | 56 | 330 | NO NO NO |

All hops: min 52 · median 73 · max 670 ms (n=15)

## reduced motion

| rail | runs (ms) | min | median | max | same indicator node |
|---|---|---|---|---|---|
| Today | 335, 77, 71 | 71 | 77 | 335 | NO NO NO |
| Billing | 357, 68, 64 | 64 | 68 | 357 | NO NO NO |
| Settings | 683, 86, 82 | 82 | 86 | 683 | NO NO NO |
| Studio | 347, 57, 55 | 55 | 57 | 347 | NO NO NO |
| Calendar | 327, 53, 56 | 53 | 56 | 327 | NO NO NO |

All hops: min 53 · median 77 · max 683 ms (n=15)

## Checks

| check | result | detail |
|---|---|---|
| motion: every hop arrived (no timeout) | PASS | 0 timed out |
| motion: the median arrival stays inside TEST-0915's 53–90 ms (the hard stop is a regression ABOVE it) | PASS | median 73 ms, max 670 ms |
| motion: the indicator is the same node after every hop | FAIL | 15 of 15 hops re-created it |
| reduced motion: every hop arrived (no timeout) | PASS | 0 timed out |
| reduced motion: the median arrival stays inside TEST-0915's 53–90 ms (the hard stop is a regression ABOVE it) | PASS | median 77 ms, max 683 ms |
| reduced motion: the indicator is the same node after every hop | FAIL | 15 of 15 hops re-created it |
