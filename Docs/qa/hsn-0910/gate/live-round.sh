#!/usr/bin/env bash
# One LIVE round of the e2e suite, one file at a time (the standing procedure:
# the global warm-up runs per invocation; round 2 is the gate). Usage:
#   bash live-round.sh <round-number>
# Writes scratchpad/live-round-<n>.log (never test-results/ — trap 24).
# The host is held awake for the round's life (trap 23), the run declares
# E2E_API_ENV=dev (HSN-0910/D), LIVE_MEDIA stays unset (no paid renders —
# the funded proofs ran on the founder's word as the Phase 0 supplement), and
# the funded QA org's owner comes from the QA-creds store so the generating
# text specs route there (skipUnlessFunded).
set -u
ROUND="${1:-1}"
REPO=/c/alphabeacon-web/alphabeacon-web
S="$(cd "$(dirname "$0")" && pwd)"
LOG="$S/live-round-$ROUND.log"
cd "$REPO" || exit 1

export VITE_API_BASE_URL="$(grep -E '^\s*VITE_API_BASE_URL\s*=' .env.local | sed -E 's/^[^=]*=\s*//; s/^["'"'"']|["'"'"']$//g; s#/+$##')"
export E2E_API_ENV=dev
unset LIVE_MEDIA
export QA_FUNDED_EMAIL="$(powershell.exe -NoProfile -Command "[Environment]::GetEnvironmentVariable('QA_FUNDED_EMAIL','User')" | tr -d '\r')"
export QA_FUNDED_PASSWORD="$(powershell.exe -NoProfile -Command "[Environment]::GetEnvironmentVariable('QA_FUNDED_PASSWORD','User')" | tr -d '\r')"

if [ -z "$VITE_API_BASE_URL" ]; then echo "no VITE_API_BASE_URL in .env.local" >&2; exit 1; fi

# Hold the host awake for the round (released when this process ends).
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$S/keep-awake.ps1" >"$S/keep-awake-$ROUND.log" 2>&1 &
AWAKE_PID=$!
trap 'kill $AWAKE_PID 2>/dev/null' EXIT

drain() { until [ -z "$(netstat -ano | grep -w 5199 | grep -i -e listen -e time_wait)" ]; do sleep 5; done; }

{
  echo "=== LIVE ROUND $ROUND · start $(date -u +%FT%TZ) · E2E_API_ENV=$E2E_API_ENV · funded creds: $([ -n "$QA_FUNDED_EMAIL" ] && echo present || echo absent) · keep-awake pid $AWAKE_PID"
  for spec in e2e/live-*.spec.ts; do
    drain
    echo
    echo "--- $spec · $(date -u +%TZ)"
    started=$(date +%s)
    pnpm e2e "$spec" --workers=1 2>&1 | grep -E "^\s+(ok|x|-) |passed|failed|skipped|flaky|Error:|warm-up: (service|fleet|heartbeat st)|Refusing|API cold|Wrong server" | grep -v "^\s*$"
    echo "--- $spec · ${PIPESTATUS[0]} · $(( $(date +%s) - started )) s"
  done
  echo
  echo "=== LIVE ROUND $ROUND · end $(date -u +%FT%TZ)"
} >"$LOG" 2>&1
echo "round $ROUND written to $LOG"
