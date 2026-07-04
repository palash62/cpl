#!/usr/bin/env bash
# Production build for both domains (run on CI or a build machine — not on small EC2 if avoidable).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bash "$ROOT/deploy/env-production.sh"

PLATFORM_URL="${PLATFORM_URL:-http://leadvix.io}"
TRACKING_URL="${TRACKING_URL:-http://leadgenlink.site}"

echo "==> Installing dependencies..."
npm ci

echo "==> Prisma generate..."
npm run generate --workspace @cpl/database

echo "==> Building tracking ($TRACKING_URL)..."
NODE_OPTIONS="--max-old-space-size=1024" npm run build --workspace @cpl/tracking

echo "==> Building platform ($PLATFORM_URL)..."
NODE_OPTIONS="--max-old-space-size=2048" npm run build --workspace @cpl/platform

bash "$ROOT/deploy/prepare-standalone.sh"

echo ""
echo "Production build complete."
echo "  Platform: $PLATFORM_URL"
echo "  Tracking: $TRACKING_URL"
