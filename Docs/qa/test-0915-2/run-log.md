# TEST-0915-2 — run-log (written as the session runs)

Branch `feat/shell-0915`, every fix its own commit prefixed `TEST-0915-2:`. Deployment ids live here only; `.agent/` carries commit SHAs.

## Phase 0 — pre-flight

| Step | Result |
|---|---|
| 0.1 tips (from origin) | main = live = `f3d5a83`; fix/followups-0915 = `be0535c` (on main); feat/shell-0915 = `2274244` (on be0535c); linear (`merge-base --is-ancestor` both ways). feat/motion-0914 = `f3d5a83`, untouched. |
| 0.1 port 5199 | nothing listening |
| 0.1 API base | `.env.local` holds one key, `VITE_API_BASE_URL`, a Lambda function URL on eu-west-2 — the dev base `Docs/api/environments.md` names as "today's only API"; `E2E_API_ENV=dev` will front every live step. |
| 0.2 branch | working on `feat/shell-0915`, tree clean |
| 0.3 cheap checks on `2274244` | see below |

### 0.3 — cheap checks on `2274244` (`Docs/qa/test-0915-2/preflight/`)

| check | result |
|---|---|
| lint · typecheck · guard-static | clean |
| unit | 829 / 829 in 74 files (matches) |
| static e2e, one worker | 118 passed / 1 failed / 90 skipped in 393 s — the one red `entry-flow.spec.ts:129` "sign-in locks out after repeated failures and counts down", a 30 s click timeout on the Sign in button; alone at one worker the file is 6/6 with that case in 2.1 s (`entry-flow-alone.log`). Item 70's shape and one of its four named cases: bucket d. With it, 119 of 119 — the numbers reproduce. |

## Phase 1 — the vercel.json regression

**Reading.** `ae2d741`'s `ignoreCommand` diffed `HEAD^..HEAD`. Vercel builds only the pushed HEAD, so a push whose last commit is docs-only is read as docs-only and canceled while the code commits under it never deploy; every merge here ends on a close-out docs commit, so the fast-forward of `main` would have left `2.malaky.ai` on `f3d5a83`'s bundle. The Part A/B proofs never saw it because each push carried one commit.

**Fix.** One line in `vercel.json`, the exclusion list untouched:
`base="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"; git rev-parse --verify --quiet "$base^{commit}" >/dev/null || exit 1; git diff --quiet "$base" HEAD -- . <the six exclusions> && exit 0 || exit 1`
Vercel's docs (project-configuration/vercel-json; system-environment-variables): exit 0 ignores the build, 1 continues it; `VERCEL_GIT_PREVIOUS_SHA` is the SHA of the last successful deployment and is exposed only when an ignored build step is configured. `^{commit}` is deliberate: `rev-parse --verify` on a bare 40-hex SHA answers 0 whether or not the object is in the clone, so without it a shallow clone that lacks the base would have skipped instead of built.

**Local exit matrix** (HEAD = `2274244`, the docs tip, before the fix commit): unset → HEAD^ fallback → 0; base `5f01310` → 0 (docs only between them, correct); base `be0535c` → 1; base `f3d5a83` → 1; base = HEAD → 0; a 40-hex SHA not in the clone → 1; `nonsense` → 1. After the fix commit, base `5f01310` flips to 1 because `vercel.json` is in the diff.

**Proof (a) plan.** This run-log update is the docs-only commit on top of the fix; both go up in one push. The deployment for the docs HEAD must be READY (built), because its base is the branch's last successful deployment `5f01310` and the diff carries `vercel.json`. Its bundle: `5f01310` serves `index-BWF0pF0M.js` / `index-Crfna5rg.css` (read from its preview); no source changed in this push, so an identical hash is the expected outcome and the READY state, not the hash, is the proof — recorded as such.

## Phase 2 — known items before the gate

| item | result |
|---|---|
| 66b | Probe on fresh org 2275 (`phase2/probe-66b.log`): `POST /orgs/2275/brand/voices` named "Brand voice" twice → 201 and 201 (requests `411f9532…`, `16e7d6ce…`); the wire lists two rows. Uniqueness has NOT landed; the two-row proof stands, nothing changes. |
| 63 | known red, waiting on Hasan; not chased |
| 58 | noted at gate time |
| 79 / 70 | bucket d by shape, isolated re-run on sight (70 already seen once above) |

**Proof (a), attempt 1.** `8dfc022` (docs on top of `d827693`) went **ERROR** on Vercel before any build step: "`vercel.json` schema validation failed: `ignoreCommand` should NOT be longer than 256 characters" (no build log). The command moved into `scripts/vercel-ignore.sh`, exclusion list verbatim; `vercel.json` calls `bash scripts/vercel-ignore.sh`. Local matrix through the script: unset → HEAD^; base `5f01310` → 1 (the script and vercel.json are in the diff); `be0535c`, `f3d5a83` → 1; a SHA absent from the clone → 1. Attempt 2 is the next push: this line as the docs-only commit on top.
