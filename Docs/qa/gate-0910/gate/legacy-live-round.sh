#!/usr/bin/env bash
# The HSN-0910 live-round runner, copied verbatim in procedure for GATE-0910
# §4's side-by-side: one file at a time, a dev server started per file, the
# global warm-up per invocation, round 2 the gate. Writes legacy/live-round-<n>.log
# beside this script (never test-results/ — trap 24); holds the host awake
# (trap 23); declares E2E_API_ENV=dev (HSN-0910/D); LIVE_MEDIA stays unset.
#   bash legacy-live-round.sh <round-number>
set -u
ROUND="${1:-1}"
REPO=/c/alphabeacon-web/alphabeacon-web
HERE="$(cd "$(dirname "$0")" && pwd)"
S="$HERE/legacy"
mkdir -p "$S"
LOG="$S/live-round-$ROUND.log"
cd "$REPO" || exit 1

export VITE_API_BASE_URL="$(grep -E '^\s*VITE_API_BASE_URL\s*=' .env.local | sed -E 's/^[^=]*=\s*//; s/^["'"'"']|["'"'"']$//g; s#/+$##')"
export E2E_API_ENV=dev
unset LIVE_MEDIA
export QA_FUNDED_EMAIL="$(powershell.exe -NoProfile -Command "[Environment]::GetEnvironmentVariable('QA_FUNDED_EMAIL','User')" | tr -d '\r')"
export QA_FUNDED_PASSWORD="$(powershell.exe -NoProfile -Command "[Environment]::GetEnvironmentVariable('QA_FUNDED_PASSWORD','User')" | tr -d '\r')"
HOST="$(printf '%s' "$VITE_API_BASE_URL" | sed -E 's#^https?://##')"

if [ -z "$VITE_API_BASE_URL" ]; then echo "no VITE_API_BASE_URL in .env.local" >&2; exit 1; fi

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$REPO/scripts/gate/keep-awake.ps1" >"$S/keep-awake-$ROUND.log" 2>&1 &
AWAKE_PID=$!
trap 'kill $AWAKE_PID 2>/dev/null' EXIT

drain() { until [ -z "$(netstat -ano | grep -w 5199 | grep -i -e listen -e time_wait)" ]; do sleep 5; done; }

{
  echo "=== LEGACY LIVE ROUND $ROUND · start $(date -u +%FT%TZ) · E2E_API_ENV=$E2E_API_ENV · funded creds: $([ -n "$QA_FUNDED_EMAIL" ] && echo present || echo absent) · keep-awake pid $AWAKE_PID"
  for spec in e2e/live-*.spec.ts; do
    drain
    echo
    echo "--- $spec · $(date -u +%TZ)"
    started=$(date +%s)
    pnpm e2e "$spec" --workers=1 2>&1 | grep -E "^\s+(ok|x|-) |passed|failed|skipped|flaky|Error:|warm-up: (service|fleet|heartbeat st)|Refusing|API cold|Wrong server" | grep -v "^\s*$"
    echo "--- $spec · ${PIPESTATUS[0]} · $(( $(date +%s) - started )) s"
  done
  echo
  echo "=== LEGACY LIVE ROUND $ROUND · end $(date -u +%FT%TZ)"
} >"$LOG" 2>&1
sed -i "s#$HOST#<api-host>#g" "$LOG"
echo "round $ROUND written to $LOG"
