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

# The drain is CAPPED (2026-09-13): an uncapped drain looped for eleven hours on a
# listener that never left, until the host slept (trap 23). After 120 s the
# listener is stopped by pid — the runner refuses a busy port; the old chain
# must not wait on one forever.
drain() {
  for _ in $(seq 1 24); do
    [ -z "$(netstat -ano | grep -w 5199 | grep -i -e listen -e time_wait)" ] && return
    sleep 5
  done
  for pid in $(netstat -ano | grep -w 5199 | grep -i listen | awk '{print $NF}' | sort -u); do
    taskkill //F //T //PID "$pid" >/dev/null 2>&1 && echo "drain: stopped listener $pid on 5199"
  done
  sleep 5
}

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
    env -u VITE_API_BASE_URL -u LIVE_MEDIA timeout 900 pnpm verify:w$n --rerun >"$S/verify-w$n.log" 2>&1
    echo "exit $? (124 = the 900 s cap)"
    grep -E "^RESULT|step failed|  FAIL" "$S/verify-w$n.log" | tail -3
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
