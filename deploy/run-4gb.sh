#!/usr/bin/env bash
# Run CPL on 4GB RAM: swap + sequential build + memory-capped PM2 (or nohup fallback).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Memory:"
free -h | head -2

# Enable swap if missing (needs ~1GB free disk)
if ! swapon --show 2>/dev/null | grep -q swap; then
  if [ -f /swapfile ]; then
    sudo swapon /swapfile 2>/dev/null || true
  fi
  if ! swapon --show 2>/dev/null | grep -q swap; then
    if [ "$(id -u)" -eq 0 ]; then
      bash "$ROOT/deploy/setup-swap.sh"
    elif [ -f /swapfile ] && ! swapon --show | grep -q /swapfile; then
      echo "Swap file exists but inactive. Run: sudo swapon /swapfile"
    else
      echo "Tip: sudo SWAP_SIZE=2G bash deploy/setup-swap.sh (helps builds on 4GB)"
    fi
  fi
fi

for f in apps/platform/.env apps/tracking/.env; do
  if [ ! -f "$f" ]; then
    cp .env.example "$f"
    echo "Created $f from .env.example"
  fi
done

export DATABASE_URL="${DATABASE_URL:-mysql://cpl:cpl_dev_pass@localhost:3306/cpl}"

echo "==> Prisma generate..."
DATABASE_URL="$DATABASE_URL" npm run generate --workspace @cpl/database >/dev/null

echo "==> Building tracking (light)..."
if [ ! -f apps/tracking/.next/BUILD_ID ]; then
  NODE_OPTIONS="--max-old-space-size=640" npm run build --workspace @cpl/tracking
fi

echo "==> Building platform (needs swap on 4GB)..."
PLATFORM_FULL=0
if [ ! -f apps/platform/.next/BUILD_ID ]; then
  if NODE_OPTIONS="--max-old-space-size=1280" npm run build --workspace @cpl/platform 2>/dev/null; then
    PLATFORM_FULL=1
  else
    echo "Platform build failed — using lite mode (internal API only, no admin UI)."
    PLATFORM_FULL=0
  fi
else
  PLATFORM_FULL=1
fi

# Stop anything on 3000/3001
fuser -k 3000/tcp 3001/tcp 2>/dev/null || true
sleep 1

if command -v pm2 >/dev/null 2>&1; then
  pm2 delete cpl-tracking cpl-platform cpl-platform-api 2>/dev/null || true
  if [ "$PLATFORM_FULL" -eq 1 ]; then
    pm2 start ecosystem.config.js
  else
    pm2 start ecosystem.config.4gb-lite.js
  fi
  pm2 save 2>/dev/null || true
  pm2 status
else
  echo "PM2 not installed — starting with npm (background)..."
  npm run start --workspace @cpl/tracking &
  if [ "$PLATFORM_FULL" -eq 1 ]; then
    npm run start --workspace @cpl/platform &
  else
    (cd apps/platform && set -a && source .env && set +a && npx tsx scripts/internal-api-server.ts) &
  fi
fi

sleep 2
echo ""
echo "Tracking: http://localhost:3001"
echo "Platform: http://localhost:3000"
if [ "$PLATFORM_FULL" -eq 0 ]; then
  echo "(Lite mode: lead API only — build platform on a machine with more RAM for admin UI)"
fi
echo ""
echo "Smoke test: npm run test:smoke"
