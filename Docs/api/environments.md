# Environments — which deployment points at which API (ORDER HSN-0910/D)

Hasan's point 1 (2026-09-09): dev and production must be separate — no testing
companies on production, and production starts with two or three tenants. This
is the map of what exists TODAY, measured on 2026-09-10 (the Phase 0 record,
`Docs/qa/hsn-0910/phase0/environment/`), and of what is pending on Ward. The
production column carries no invented value: where Ward has not named a thing
it says "pending Ward".

## The map

| Facet                             | Dev (today's only API)                                                                               | Production                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| API base                          | the Lambda URL in `.env.local` (`VITE_API_BASE_URL`; never committed)                                | **pending Ward** — a second deployment of the main API                                                        |
| AlphaStudio tenant (Hasan's side) | the dev tenant: 1000+ orgs, largely our QA orgs                                                      | **pending Ward/Hasan** — a fresh tenant with the real customers only                                          |
| Environment name on the wire      | **none** — `/health` is `{"ok":true}`, `/openapi` has no `servers`, the org root carries no such key | **asked of Ward** (item 53): a name on `/health` or the org root, so a harness can refuse the wrong one       |
| Web deployment                    | `1.malaky.ai` = the `live` branch preview on Vercel, built WITH `VITE_API_BASE_URL` → LIVE mode      | the apex `malaky.ai` on `main` — today it still serves a GoDaddy site-builder page (DNS not cut over)         |
| `VITE_API_BASE_URL` on Vercel     | set for the `live` branch's Preview scope (the `1.malaky.ai` bundle inlines the dev host)            | **the founder's hand step**: set the production API base in the Production scope once Ward names it           |
| Stripe                            | TEST mode keys; card `4242 4242 4242 4242`; every paid invoice credits the org's real dev wallet     | **LIVE keys only here** (asked of Ward, item 53); test mode stays on dev                                      |
| `DASHBOARD_URL` (Ward's constant) | `https://1.malaky.ai` — the three Stripe return routes come back here                                | must be the apex — `/billing/success?orgId&session_id`, `/billing?orgId&checkout=cancelled`, `/billing?orgId` |
| QA orgs                           | minted by every live e2e run and probe (`qa+<stamp>…@alphapromena.com`)                              | **never** — the harness guard below refuses to run against it                                                 |
| The funded QA org                 | org 1813 (`QA_FUNDED_EMAIL` / `QA_FUNDED_PASSWORD` in the QA-creds store)                            | none                                                                                                          |

## The harness guard (our side, built)

`e2e/global-setup.ts` runs before any live test budget starts. Since HSN-0910/D
it refuses a LIVE run unless the run says which environment it means and the
base URL is not production:

| Variable            | Where set               | Rule                                                                                                                                                   |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `E2E_API_ENV`       | the shell, per live run | REQUIRED for a live run (`VITE_API_BASE_URL` set); the only accepted value is `dev`. Absent or anything else → the run is refused with a named reason. |
| `PROD_API_BASE_URL` | the shell, optional     | When set, a live run whose `VITE_API_BASE_URL` equals it is refused — whatever `E2E_API_ENV` says. No URL literal lives in source; both come from env. |

`signUpAndEnter` in `e2e/live-setup.ts` — the one place a live spec mints a QA
org — sits behind the same rule, so a spec run outside the harness (a one-off
runner, a local `playwright test --config`) cannot create a company on
production either.

A run, then, is:

```powershell
$env:VITE_API_BASE_URL="<the dev Lambda URL>"; $env:E2E_API_ENV="dev"; pnpm e2e --grep live-
```

Static runs are untouched: without `VITE_API_BASE_URL` the guard makes no
request and asks for nothing.

## The switch (the founder's hand step, not a code change)

When Ward names the production API base:

1. Vercel → the project → Environment Variables → `VITE_API_BASE_URL` in the
   **Production** scope = the production base. The `live` branch's Preview
   scope keeps the dev base.
2. Ward sets `DASHBOARD_URL` per environment (the apex on production,
   `1.malaky.ai` on dev) and moves Stripe to LIVE keys on production only.
3. The apex DNS cutover (the 2026-08-11 open item) so `malaky.ai` serves the
   `main` deployment.
4. Set `PROD_API_BASE_URL` in the QA-creds store on the dev machine, so the
   harness refuses it by value as well as by name.

## The message for Ward (drafted, not sent — the founder sends it)

> We need a separate production environment for the main API and Hasan's
> AlphaStudio tenant: two or three real tenants, no QA orgs, and its base URL
> for us. Per environment, `DASHBOARD_URL` so the three Stripe return routes
> come back to the apex on production and to 1.malaky.ai on dev; Stripe LIVE
> keys only on production, test mode stays on dev. And one measurable
> environment name — on `/health` or the org root — so the test harness can
> refuse to create a company anywhere but dev. The proposals-row embed and the
> keyset tie-break stay on their own thread.
