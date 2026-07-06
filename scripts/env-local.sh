#!/usr/bin/env bash
# Restore localhost .env files for local development.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

DATABASE_URL="${DATABASE_URL:-mysql://root:password@localhost:3306/cpl}"
INTERNAL_SERVICE_TOKEN="${INTERNAL_SERVICE_TOKEN:-dev-internal-token-change-in-production-64chars-minimum!!}"
AUTH_SECRET="${AUTH_SECRET:-dev-secret-change-in-production-min-32-chars}"

mkdir -p "$ROOT/packages/database"
cat > "$ROOT/packages/database/.env" <<EOF
DATABASE_URL="$DATABASE_URL"
EOF

cat > "$ROOT/apps/platform/.env" <<EOF
DATABASE_URL="$DATABASE_URL"
INTERNAL_SERVICE_TOKEN="$INTERNAL_SERVICE_TOKEN"
AUTH_SECRET="$AUTH_SECRET"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
APP_URL="http://localhost:3000"
NEXT_PUBLIC_PLATFORM_URL="http://localhost:3000"
NEXT_PUBLIC_TRACKING_URL="http://localhost:3001"
PORT=3000
EOF

cat > "$ROOT/apps/tracking/.env" <<EOF
DATABASE_URL="$DATABASE_URL"
INTERNAL_SERVICE_TOKEN="$INTERNAL_SERVICE_TOKEN"
TRACKING_URL="http://localhost:3001"
PLATFORM_URL="http://localhost:3000"
NEXT_PUBLIC_TRACKING_URL="http://localhost:3001"
NEXT_PUBLIC_PLATFORM_URL="http://localhost:3000"
PORT=3001
EOF

echo "Wrote local dev env:"
echo "  Platform:  http://localhost:3000"
echo "  Tracking:  http://localhost:3001"
