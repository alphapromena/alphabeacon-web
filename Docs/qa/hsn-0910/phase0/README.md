# HSN-0910 Phase 0 — the raw record (2026-09-10)

ORDER HSN-0910 §3, measured against the deployed SANDBOX API at ZERO spend by
`pnpm probe:hsn-0910` (`scripts/probe-hsn-0910.ts`). This folder is the durable
copy: `Docs/api/alphastudio-shapes.md` carries the same run as a dated section
("HSN-0910 Phase 0"), but `pnpm smoke:alphastudio` overwrites that file
wholesale and `test-results/` is cleaned by every Playwright run (state.md
trap 24), so the JSON here is the record. The narrative with the readings is
`.agent/sessions.md`, entry "2026-09-10 — ORDER HSN-0910 Phase 0".

Three walks, two QA orgs, org 619 untouched, the funded QA org 1813 read only:

| Walk                   | Org                                                   | Run stamp                  | What                                                                                                                                                                                                                                                                               |
| ---------------------- | ----------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run 1 (superseded)     | **1823** (`qa+1789026408226hsn0910@alphapromena.com`) | `2026-09-10T07:46:48.226Z` | The first full walk. Kept as `run1-org1823-findings.md` only (its request-ids): the motion example was sent with a 1×1 still and a 3.0 s clip, and the ladder that explains its 400 did not exist yet. Every other reading agrees with run 2.                                      |
| **Run 2 — THE RECORD** | **1824** (`qa+1789026912812hsn0910@alphapromena.com`) | `2026-09-10T07:55:12.812Z` | The full walk: §3.1 catalogs (13 plain reads + 24 `?plan=` reads), §3.5 approve, §3.2 valid bodies (13 examples + 3 variants), §3.3 traps (19), §3.7 State under Country, §3.4 the funded org's job list, §3.8 environment, cleanup. Everything below except `supplement-motion/`. |
| Motion supplement      | **1824** again (no new org)                           | `2026-09-10T08:03:42.407Z` | `--motion-supplement`: the `motion.generate` ladder ONE variable per rung, because run 2's rungs all carried `lang: "ar"` and that key alone is what the door refuses. `supplement-motion/`.                                                                                       |

## Files

| Path                                    | What it is                                                                                                                                                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `findings.md`                           | Run 2: the capability × catalog × 402 × 400-trap table and every established line, generated.                                                                                                                                   |
| `summary.json`                          | Run 2: the per-capability rows (catalog summary, per-plan rows and prices, every body's status / code / request-id / "names the field?"), the voice lists per plan, the findings.                                               |
| `captures.json`                         | Run 2: every exchange in order — method, path (`/orgs/:id/…`), status, ms, request-id, request and response bodies. The auth calls are not in it (they carry a password or a token).                                            |
| `catalog/<capability>.json`             | The 13 plain catalog reads, verbatim (the full `capabilitySchema` per model row).                                                                                                                                               |
| `catalog/<capability>.plan-<plan>.json` | The `?plan=` reads for the 8 selectable capabilities × 3 plans: the row(s) each grade resolves to, with the price. `voice.speak.plan-*.json` carries the approved voice enum.                                                   |
| `jobs/valid-<capability>--<name>.json`  | §3.2: the document's example per capability (+ `with-origin`, `with-references-and-character`, `four-referenceImages`, the motion ladder) — each 402 at the wallet, or the one 400.                                             |
| `jobs/trap-<capability>--<name>.json`   | §3.3: the document's refusals — 400 before the wallet, and the two 502s of the five-reference photoshoot.                                                                                                                       |
| `approve/no-body.json`                  | §3.5: `POST …/media/assets/:id/approve` → 404 (not proxied).                                                                                                                                                                    |
| `state/*.json`                          | §3.7: the countries list (249 rows), `PUT /orgs/:id/country {country:"US", state:"CA"}`, the org read-back, the holiday rows, the event-source with `state` (created, then deleted), the read-only sweep is in `captures.json`. |
| `environment/*.json`                    | §3.8: `/health` with its headers, `/openapi` (info, keys), the org root, and the three deployment sniffs.                                                                                                                       |
| `multi-asset/*.json`                    | §3.4: the funded owner's orgs and org 1813's job list (empty — unmeasured).                                                                                                                                                     |
| `setup/*.json` · `after/*.json`         | The org, the wallet before / as the shield / after, the presigns and read-presigns, the job list and the asset list after cleanup.                                                                                              |
| `supplement-motion/`                    | The motion ladder on org 1824: `captures.json` (with its findings), `findings.md`, `jobs/ladder-*.json`, `setup/`, `after/`.                                                                                                    |
| `run1-org1823-findings.md`              | Run 1's findings and request-ids, for the history. Its raw files were not kept (run 2 re-measured every one of them).                                                                                                           |

## What is redacted, and why

Every `http(s)://` string in a body is replaced by `<redacted url: N chars>`:
presigned storage urls carry signatures, and the API base is never committed
(the repo is PUBLIC — state.md 2026-09-03). Tokens and passwords are never
recorded (the auth exchanges are not captured). What remains is QA identities
(`qa+…@alphapromena.com`), org ids, asset and job ids, and request-ids — the
precedent of `Docs/qa/m-bil-1/` and `Docs/api/billing-shapes.md`.

## Re-rendering

`pnpm probe:hsn-0910 -- --render` rebuilds `findings.md`, the supplement's
`findings.md` and the shapes-doc section from `captures.json` + `summary.json`
without touching the wire. A new full run (a NEW QA org) or a new supplement
(`-- --motion-supplement --owner <email>`, an EXISTING zero-wallet org) appends
its own section; strip the old one first with `--render` if it should not
double up.
