#!/usr/bin/env bash
# Re-queue EmailSend rows stuck in QUEUED after their scheduled_at.
# Intended for cron (every 15 min) as a safety net when the worker was down.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f apps/platform/.env ]; then
  echo "Missing apps/platform/.env" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ROOT/apps/platform/.env"
set +a

cd "$ROOT/apps/platform"
exec npx tsx scripts/reconcile-email-sends.ts --minutes=15
