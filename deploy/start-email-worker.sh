#!/usr/bin/env bash
# Start or restart the BullMQ email worker under PM2 with hardened auto-restart.
# PM2 7 requires .cjs extension to parse ecosystem files (not run them as scripts).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f apps/platform/.env ]; then
  echo "Missing apps/platform/.env — run: bash deploy/env-production.sh" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source apps/platform/.env
set +a

# PM2 7 only auto-parses ecosystem files named ecosystem.config.cjs (not *.production.cjs).
cp -f ecosystem.config.production.js ecosystem.config.cjs

pm2 delete cpl-email-worker 2>/dev/null || true
pm2 delete ecosystem.config.production 2>/dev/null || true
pm2 start ecosystem.config.cjs --only cpl-email-worker --update-env
pm2 save

echo "Email worker started. Check: pm2 logs cpl-email-worker --lines 20"
