#!/usr/bin/env bash
# On the server: git pull + install + restart. Does NOT build (expects CI or prior build).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Git pull..."
git pull --ff-only

if [ ! -f apps/platform/.env ] || [ ! -f apps/tracking/.env ]; then
  echo "Missing .env — run: bash deploy/env-production.sh"
  echo "Then set DATABASE_URL, AUTH_SECRET, INTERNAL_SERVICE_TOKEN for production."
  exit 1
fi

if [ ! -f deploy/.build-ready ]; then
  echo "ERROR: No production build on this server."
  echo "Run GitHub Actions deploy, or on a build machine:"
  echo "  bash deploy/build-production.sh"
  echo "Then rsync apps/*/\.next to the server, or use the Deploy workflow."
  exit 1
fi

echo "==> npm ci..."
npm ci --omit=dev

echo "==> Prisma generate..."
npm run generate --workspace @cpl/database

if [ "${RUN_DB_PUSH:-0}" = "1" ]; then
  echo "==> db push..."
  npm run db:push
fi

echo "==> Nginx (HTTP domains)..."
if command -v nginx >/dev/null 2>&1; then
  sudo cp "$ROOT/deploy/nginx/platform.dev.conf" /etc/nginx/sites-available/leadvix.io
  sudo cp "$ROOT/deploy/nginx/tracking.dev.conf" /etc/nginx/sites-available/leadgenlink.site
  sudo ln -sf /etc/nginx/sites-available/leadvix.io /etc/nginx/sites-enabled/
  sudo ln -sf /etc/nginx/sites-available/leadgenlink.site /etc/nginx/sites-enabled/
  sudo nginx -t && sudo systemctl reload nginx
fi

echo "==> PM2 restart..."
if ! command -v pm2 >/dev/null 2>&1; then
  echo "Install PM2: npm i -g pm2"
  exit 1
fi

pm2 delete cpl-tracking cpl-platform 2>/dev/null || true
pm2 start "$ROOT/ecosystem.config.production.js"
pm2 save

pm2 status
echo ""
echo "Platform:  http://leadvix.io"
echo "Tracking:  http://leadgenlink.site"
