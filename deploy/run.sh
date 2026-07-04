#!/usr/bin/env bash
# Start both CPL services locally or on EC2.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f apps/platform/.env ] || [ ! -f apps/tracking/.env ]; then
  echo "Missing .env files. Copy .env.example to apps/platform/.env and apps/tracking/.env"
  exit 1
fi

if [ ! -f apps/tracking/.next/BUILD_ID ]; then
  echo "Building tracking..."
  NODE_OPTIONS="--max-old-space-size=768" npm run build --workspace @cpl/tracking
fi

if [ ! -f apps/platform/.next/BUILD_ID ]; then
  echo "Building platform (requires ~2GB RAM + swap)..."
  bash deploy/build-low-memory.sh
fi

if command -v pm2 >/dev/null 2>&1; then
  pm2 start ecosystem.config.js
  pm2 status
else
  echo "PM2 not found. Starting in background..."
  npm run start --workspace @cpl/tracking &
  npm run start --workspace @cpl/platform &
  echo "Tracking: http://localhost:3001"
  echo "Platform: http://localhost:3000"
fi

echo "Run smoke tests: npm run test:smoke"
