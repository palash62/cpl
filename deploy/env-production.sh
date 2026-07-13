#!/usr/bin/env bash
# Write production .env files for leadvix.io + leadgenlink.site (HTTP).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

PLATFORM_URL="${PLATFORM_URL:-https://leadvix.io}"
TRACKING_URL="${TRACKING_URL:-https://leadgenlink.site}"
# With docker-compose.prod.yml network_mode: host, localhost is the VPS (MySQL on host).
DATABASE_URL="${DATABASE_URL:-mysql://cpl:cpl_dev_pass@localhost:3306/cpl}"
INTERNAL_SERVICE_TOKEN="${INTERNAL_SERVICE_TOKEN:-change-me-to-a-random-64-char-secret}"
AUTH_SECRET="${AUTH_SECRET:-change-me-auth-secret-min-32-characters}"

# Transactional email (verification, welcome, password reset) — pick Mailgun OR SMTP.
MAILGUN_API_KEY="${MAILGUN_API_KEY:-}"
MAILGUN_DOMAIN="${MAILGUN_DOMAIN:-}"
MAILGUN_FROM="${MAILGUN_FROM:-}"
SMTP_HOST="${SMTP_HOST:-}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-}"
SMTP_PASS="${SMTP_PASS:-}"
SMTP_FROM="${SMTP_FROM:-}"
ADMIN_ALERT_EMAIL="${ADMIN_ALERT_EMAIL:-}"
SUPPORT_EMAIL="${SUPPORT_EMAIL:-}"

# Append Prisma pool limits if not already present.
if [[ "$DATABASE_URL" != *"connection_limit="* ]]; then
  if [[ "$DATABASE_URL" == *"?"* ]]; then
    DATABASE_URL="${DATABASE_URL}&connection_limit=10&pool_timeout=20"
  else
    DATABASE_URL="${DATABASE_URL}?connection_limit=10&pool_timeout=20"
  fi
fi

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
FRAUD_EMAIL_API_KEY="${FRAUD_EMAIL_API_KEY:-}"
MAILGUN_API_KEY="$MAILGUN_API_KEY"
MAILGUN_DOMAIN="$MAILGUN_DOMAIN"
MAILGUN_FROM="$MAILGUN_FROM"
SMTP_HOST="$SMTP_HOST"
SMTP_PORT="$SMTP_PORT"
SMTP_USER="$SMTP_USER"
SMTP_PASS="$SMTP_PASS"
SMTP_FROM="$SMTP_FROM"
ADMIN_ALERT_EMAIL="$ADMIN_ALERT_EMAIL"
SUPPORT_EMAIL="$SUPPORT_EMAIL"
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
