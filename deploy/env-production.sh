#!/usr/bin/env bash
# Write production .env files for leadvix.io + leadgenlink.site (HTTP).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

PLATFORM_URL="${PLATFORM_URL:-http://leadvix.io}"
TRACKING_URL="${TRACKING_URL:-http://leadgenlink.site}"
# With docker-compose.prod.yml network_mode: host, localhost is the VPS (MySQL on host).
DATABASE_URL="${DATABASE_URL:-mysql://cpl:cpl_dev_pass@localhost:3306/cpl}"
INTERNAL_SERVICE_TOKEN="${INTERNAL_SERVICE_TOKEN:-change-me-to-a-random-64-char-secret}"
AUTH_SECRET="${AUTH_SECRET:-change-me-auth-secret-min-32-characters}"

mkdir -p "$ROOT/packages/database"
cat > "$ROOT/packages/database/.env" <<EOF
DATABASE_URL="$DATABASE_URL"
EOF

cat > "$ROOT/apps/platform/.env" <<EOF
DATABASE_URL="$DATABASE_URL"
INTERNAL_SERVICE_TOKEN="$INTERNAL_SERVICE_TOKEN"
AUTH_SECRET="$AUTH_SECRET"
AUTH_URL="$PLATFORM_URL"
AUTH_TRUST_HOST="true"
APP_URL="$PLATFORM_URL"
PLATFORM_URL="$PLATFORM_URL"
TRACKING_URL="$TRACKING_URL"
NEXT_PUBLIC_PLATFORM_URL="$PLATFORM_URL"
NEXT_PUBLIC_TRACKING_URL="$TRACKING_URL"
PORT=3000
NODE_ENV=production
EOF

cat > "$ROOT/apps/tracking/.env" <<EOF
DATABASE_URL="$DATABASE_URL"
INTERNAL_SERVICE_TOKEN="$INTERNAL_SERVICE_TOKEN"
TRACKING_URL="$TRACKING_URL"
PLATFORM_URL="$PLATFORM_URL"
NEXT_PUBLIC_TRACKING_URL="$TRACKING_URL"
NEXT_PUBLIC_PLATFORM_URL="$PLATFORM_URL"
PORT=3001
NODE_ENV=production
EOF

echo "Wrote production env:"
echo "  Platform:  $PLATFORM_URL  -> apps/platform/.env"
echo "  Tracking:  $TRACKING_URL  -> apps/tracking/.env"
