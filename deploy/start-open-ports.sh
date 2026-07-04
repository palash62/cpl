#!/usr/bin/env bash
# Start CPL bound to 0.0.0.0 for direct access on ports 3000 (platform) and 3001 (tracking).
# MySQL stays on 127.0.0.1:3306 — open the SG port only if you need remote DB access.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fuser -k 3000/tcp 3001/tcp 2>/dev/null || true
sleep 1

echo "==> Starting tracking on 0.0.0.0:3001..."
(
  cd apps/tracking
  set -a && source .env && set +a
  HOSTNAME=0.0.0.0 nohup npx next start --port 3001 --hostname 0.0.0.0 > /tmp/cpl-tracking.log 2>&1 &
  echo $! > /tmp/cpl-tracking.pid
)

echo "==> Starting platform lite API on 0.0.0.0:3000..."
(
  cd apps/platform
  set -a && source .env && set +a
  INTERNAL_API_HOST=0.0.0.0 INTERNAL_API_PORT=3000 nohup npx tsx scripts/internal-api-server.ts > /tmp/cpl-platform.log 2>&1 &
  echo $! > /tmp/cpl-platform.pid
)

sleep 2
echo ""
echo "==> Port status:"
ss -tlnp | grep -E '3000|3001|3306' || true
echo ""
echo "Platform:  http://<your-ip>:3000/  (lite mode — API + status page)"
echo "Tracking:  http://<your-ip>:3001/t/demo-link"
echo "MySQL:     127.0.0.1:3306 only (local apps; not exposed to network)"
echo ""
curl -s -o /dev/null -w "3000 health: %{http_code}\n" http://127.0.0.1:3000/health || true
curl -s -o /dev/null -w "3001 demo:   %{http_code}\n" http://127.0.0.1:3001/t/demo-link || true
