# Item 63 — `social-posts.media`: the type is checked before the wallet, the maximum is not

Measured 2026-09-13 07:52Z at zero spend on one fresh QA org, through
`pnpm probe:item-63`. The API host is redacted; the request-ids are the
server's own `x-request-id`, kept verbatim so Hasan can find each call. The
raw exchanges, request and response bodies included, are in `probe.json`.

## What was sent

The video body `buildPostVisualRequest` builds, byte-identical to the one
`e2e/live-video-duration.spec.ts` posts, with `params.durationS` replaced:
first the string `"abc"` (the wrong TYPE), then `999` (the right type, over
the MAXIMUM). Both are invalid by the capabilities document, which says a bad
field is refused before the wallet.

## What answered

| Call                              | Status | `x-request-id`                         |    Time |
| --------------------------------- | ------ | -------------------------------------- | ------: |
| signup (owner)                    | `201`  | `a1e62c91-51cf-493e-bae1-e5fb1cee357f` | 3574 ms |
| verify-email (owner)              | `200`  | `34d95590-418b-44df-a276-c86b9edd3e04` | 1207 ms |
| create org                        | `201`  | `e9873352-07bc-42d8-a771-639900b2a869` |  772 ms |
| wallet before                     | `200`  | `fe383d5c-7df8-4f8b-90d9-177aca038007` | 3192 ms |
| POST media/jobs · durationS "abc" | `400`  | `a3cb0dca-5f6a-4646-9ae8-3abe2c9a5315` | 1445 ms |
| POST media/jobs · durationS 999   | `402`  | `25c4c86c-6b07-40ab-bfe5-93efba1b4b86` |  786 ms |
| wallet after                      | `200`  | `e19e9307-9833-421e-a85e-107c572000c2` |  780 ms |
| job list after                    | `200`  | `41adb2f0-531f-4150-84e6-b32979206d7f` |  790 ms |

Verbatim, the two answers that matter:

```json
{ "error": { "code": "bad_request",
  "message": "The media service rejected the request — check the body against the capability's schema",
  "requestId": "a3cb0dca-5f6a-4646-9ae8-3abe2c9a5315" } }

{ "error": { "code": "wallet_insufficient",
  "message": "The org's wallet cannot cover this request — not enough credits",
  "requestId": "25c4c86c-6b07-40ab-bfe5-93efba1b4b86" } }
```

## The reading

**The two halves of the same field are no longer enforced in the same place.**
A wrong TYPE is still refused `400 bad_request` before the wallet, exactly as
the document says. A value over the MAXIMUM passes validation and reaches the
wallet, which refuses it `402 wallet_insufficient`.

On an unfunded org that is invisible — the wallet stops everything. **On a
FUNDED org it is not:** `durationS: 999` would be paid for before anything
checks the clip's length. Whether the cap is then enforced upstream, and what
happens to the money if it is, this probe cannot see from a zero wallet, and
deliberately did not spend to find out.

On **2026-09-10** the same two bodies both answered `400`: the spec was green
in both of ORDER HSN-0910's gate rounds, and Phase 0 measured the sibling
capability's duration trap at `400` the same day. On **2026-09-13** the spec
is red in six rounds out of six, across the old chain and the new runner,
always on the second assertion — the over-maximum body — never the first.

## Asked of Hasan

1. Is the `durationS` maximum still enforced, and where — before the wallet as
   the document says, after it, or only upstream at render time?
2. If it is enforced after the wallet: is a funded org charged for a body that
   is then rejected for its length?
3. If the order is deliberate, the capabilities document should say so, and
   the client should hold the maximum itself before spending.

The spec stays as the document says until he answers. The gate records the red
with its values every run, and `pnpm probe:item-63` reproduces this table at
zero spend whenever it is needed.

_Zero spend: the org was never funded, both bodies were refused, and the wallet
and job list were re-read afterwards — `0 → 0` cents, `0` jobs._
