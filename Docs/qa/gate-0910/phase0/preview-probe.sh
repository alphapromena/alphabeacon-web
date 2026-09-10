#!/usr/bin/env bash
# GATE-0910 Phase 0 §2.3 — does `vite preview` of a production build with
# VITE_API_BASE_URL inlined behave like the dev server for a live spec?
# One probe file (default live-auth: 7 tests, fresh QA orgs, zero spend).
# Usage, after `pnpm build` with VITE_API_BASE_URL exported:
#   bash Docs/qa/gate-0910/phase0/preview-probe.sh [e2e/live-xxx.spec.ts]
# The record is this folder's preview-probe.log with the FULL Playwright
# output (never test-results/ — trap 24). The host is held awake for the
# probe (trap 23); E2E_API_ENV=dev is declared (HSN-0910/D); LIVE_MEDIA stays
# unset. The preview server is owned by pid — started and stopped here, no
# port scan (trap 22's class); a busy port is refused, not adopted.
set -u
REPO=/c/alphabeacon-web/alphabeacon-web
S="$(cd "$(dirname "$0")" && pwd)"
LOG="$S/preview-probe.log"
SPEC="${1:-e2e/live-auth.spec.ts}"
cd "$REPO" || exit 1

export VITE_API_BASE_URL="$(grep -E '^\s*VITE_API_BASE_URL\s*=' .env.local | sed -E 's/^[^=]*=\s*//; s/^["'"'"']|["'"'"']$//g; s#/+$##')"
export E2E_API_ENV=dev
unset LIVE_MEDIA
export QA_FUNDED_EMAIL="$(powershell.exe -NoProfile -Command "[Environment]::GetEnvironmentVariable('QA_FUNDED_EMAIL','User')" | tr -d '\r')"
export QA_FUNDED_PASSWORD="$(powershell.exe -NoProfile -Command "[Environment]::GetEnvironmentVariable('QA_FUNDED_PASSWORD','User')" | tr -d '\r')"
HOST="$(printf '%s' "$VITE_API_BASE_URL" | sed -E 's#^https?://##')"

[ -n "$VITE_API_BASE_URL" ] || { echo "no VITE_API_BASE_URL in .env.local" >&2; exit 1; }
[ -f dist/index.html ] || { echo "no dist/index.html — run the build first" >&2; exit 1; }
if [ -n "$(netstat -ano | grep -w 5199 | grep -i -e listen -e time_wait)" ]; then
  echo "port 5199 is busy — refusing to adopt a stray server (trap 22)" >&2
  exit 1
fi

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$REPO/Docs/qa/hsn-0910/gate/keep-awake.ps1" >"$S/keep-awake-probe.log" 2>&1 &
AWAKE_PID=$!
pnpm preview --port 5199 --strictPort >"$S/preview-server.log" 2>&1 &
PREVIEW_PID=$!
trap 'taskkill //F //T //PID $PREVIEW_PID >/dev/null 2>&1; kill $PREVIEW_PID $AWAKE_PID 2>/dev/null' EXIT

for _ in $(seq 1 30); do
  curl -s -o /dev/null --max-time 2 http://localhost:5199/ && break
  sleep 1
done

ENTRY="$(curl -s http://localhost:5199/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js' | head -1)"
{
  echo "=== PREVIEW PROBE · start $(date -u +%FT%TZ) · spec $SPEC · E2E_API_ENV=$E2E_API_ENV · funded creds: $([ -n "$QA_FUNDED_EMAIL" ] && echo present || echo absent) · preview pid $PREVIEW_PID · keep-awake pid $AWAKE_PID"
  echo "served entry: $ENTRY"
  echo "api host inlined in the served entry: $(curl -s "http://localhost:5199/$ENTRY" | grep -o -F "$HOST" | wc -l) time(s)"
  echo "/src/api/config.ts from the preview (the trap-22 tripwire's probe): http $(curl -s -o /dev/null -w '%{http_code} %{content_type}' http://localhost:5199/src/api/config.ts)"
  echo "a deep route from the preview (SPA fallback): http $(curl -s -o /dev/null -w '%{http_code} %{content_type}' http://localhost:5199/settings/organization)"
  started=$(date +%s)
  pnpm e2e "$SPEC" --workers=1 2>&1
  rc=$?
  echo "--- $SPEC · exit $rc · $(( $(date +%s) - started )) s"
  echo "=== PREVIEW PROBE · end $(date -u +%FT%TZ)"
} >"$LOG" 2>&1

sed -i "s#$HOST#<api-host>#g" "$LOG"
sed -i -E 's#https?://[^ "]*amazonaws[^ "]*#<redacted url>#g' "$LOG"
echo "probe written to $LOG"
