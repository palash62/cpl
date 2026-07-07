#!/usr/bin/env bash
# On the server: git pull, install deps, build both apps, restart PM2.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Git pull..."
git pull --ff-only

if [ ! -f apps/platform/.env ] || [ ! -f apps/tracking/.env ]; then
  echo "Missing .env files."
  echo "Run once: bash deploy/env-production.sh"
  echo "Then edit DATABASE_URL, AUTH_SECRET, and INTERNAL_SERVICE_TOKEN."
  exit 1
fi

echo "==> npm ci..."
npm ci

echo "==> Prisma generate..."
npm run generate --workspace @cpl/database

if [ "${RUN_DB_PUSH:-0}" = "1" ]; then
  echo "==> db push..."
  npm run db:push
fi

echo "==> Production build (sequential, low memory)..."
bash "$ROOT/deploy/build-low-memory.sh"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "Install PM2: npm i -g pm2"
  exit 1
fi

echo "==> PM2 restart..."
pm2 delete cpl-tracking cpl-platform 2>/dev/null || true
pm2 start "$ROOT/ecosystem.config.js"
pm2 save

pm2 status
echo ""
echo "Platform:  ${NEXT_PUBLIC_PLATFORM_URL:-http://leadvix.io}"
echo "Tracking:  ${NEXT_PUBLIC_TRACKING_URL:-http://leadgenlink.site}"
