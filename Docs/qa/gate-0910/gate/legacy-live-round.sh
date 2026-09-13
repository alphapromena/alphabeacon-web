#!/usr/bin/env bash
# ============================ RETIRED 2026-09-13 ============================
# The old chain is retired: GATE-0910 merged and `pnpm gate` is the gate. This
# script is kept ONLY as the §4 proof's record — it is what the 61.8-minute
# side-by-side actually ran. Do not run it again; there is no fourth re-proof.
# ===========================================================================
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
