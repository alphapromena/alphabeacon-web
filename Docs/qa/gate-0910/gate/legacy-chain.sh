#!/usr/bin/env bash
# GATE-0910 §4 — THE OLD CHAIN, run once side by side with `pnpm gate` on the
# same tree, so the proof compares like with like: unit → the static suite →
# verify:w00–w06 with --rerun (each re-running the six suite steps, as they
# did until this order) → live round 1 → live round 2, one file at a time
# with a dev server started per file (the HSN-0910 runner, copied as
# legacy-live-round.sh). Records under this folder's legacy/ — never under
# test-results/ (trap 24). The host is held awake for the rounds (trap 23).
#   bash Docs/qa/gate-0910/gate/legacy-chain.sh
set -u
REPO=/c/alphabeacon-web/alphabeacon-web
HERE="$(cd "$(dirname "$0")" && pwd)"
S="$HERE/legacy"
mkdir -p "$S"
cd "$REPO" || exit 1
LOG="$S/static-chain.log"

drain() { until [ -z "$(netstat -ano | grep -w 5199 | grep -i -e listen -e time_wait)" ]; do sleep 5; done; }

{
  echo "=== LEGACY CHAIN · start $(date -u +%FT%TZ) · tree $(git rev-parse --short HEAD)"
  echo "=== unit $(date -u +%TZ)"
  started=$(date +%s)
  env -u VITE_API_BASE_URL -u LIVE_MEDIA pnpm test 2>&1 | grep -E "Test Files|Tests "
  echo "--- unit · $(( $(date +%s) - started )) s"
  drain
  echo "=== static e2e $(date -u +%TZ)"
  started=$(date +%s)
  env -u VITE_API_BASE_URL -u LIVE_MEDIA pnpm e2e 2>&1 | grep -E "passed|failed|skipped|flaky" | tail -3
  echo "--- static e2e · $(( $(date +%s) - started )) s"
  for n in 00 01 02 03 04 05 06; do
    drain
    echo "=== verify:w$n --rerun $(date -u +%TZ)"
    started=$(date +%s)
    env -u VITE_API_BASE_URL -u LIVE_MEDIA pnpm verify:w$n --rerun 2>&1 | grep -E "^RESULT|step failed|  FAIL" | tail -3
    echo "--- verify:w$n · $(( $(date +%s) - started )) s"
  done
  echo "=== LEGACY CHAIN · static end $(date -u +%FT%TZ)"
} >"$LOG" 2>&1

for r in 1 2; do
  drain
  bash "$HERE/legacy-live-round.sh" "$r"
done
echo "=== LEGACY CHAIN · end $(date -u +%FT%TZ)" >>"$LOG"
echo "legacy chain written under $S"
