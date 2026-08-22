#!/usr/bin/env bash
# Write production .env files for leadvix.io + leadgenlink.site (HTTP).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLATFORM_ENV="$ROOT/apps/platform/.env"

read_existing_env() {
  local key="$1"
  if [ ! -f "$PLATFORM_ENV" ]; then
    return 0
  fi
  grep -E "^${key}=" "$PLATFORM_ENV" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' || true
}

preserve_env() {
  local key="$1"
  local current="${!key:-}"
  if [ -n "$current" ] && [[ "$current" != change-me* ]]; then
    return 0
  fi
  local existing
  existing="$(read_existing_env "$key")"
  if [ -n "$existing" ] && [[ "$existing" != change-me* ]]; then
    printf -v "$key" '%s' "$existing"
  fi
}

PLATFORM_URL="${PLATFORM_URL:-https://leadvix.io}"
TRACKING_URL="${TRACKING_URL:-https://leadgenlink.site}"
# With docker-compose.prod.yml network_mode: host, localhost is the VPS (MySQL on host).
DATABASE_URL="${DATABASE_URL:-mysql://cpl:cpl_dev_pass@localhost:3306/cpl}"
INTERNAL_SERVICE_TOKEN="${INTERNAL_SERVICE_TOKEN:-change-me-to-a-random-64-char-secret}"
AUTH_SECRET="${AUTH_SECRET:-change-me-auth-secret-min-32-characters}"
# Public A-record IP shown on /advertiser/domains (host DNS often maps leadvix.io → 127.0.0.1).
PLATFORM_PUBLIC_IP="${PLATFORM_PUBLIC_IP:-13.235.217.121}"

preserve_env AUTH_SECRET
preserve_env INTERNAL_SERVICE_TOKEN
preserve_env MAILGUN_API_KEY
preserve_env MAILGUN_DOMAIN
preserve_env MAILGUN_FROM
preserve_env MAILGUN_WEBHOOK_SIGNING_KEY
preserve_env MAILGUN_API_BASE
preserve_env SMTP_HOST
preserve_env SMTP_USER
preserve_env SMTP_PASS
preserve_env SMTP_FROM
preserve_env SMTP_SECURE
preserve_env ADMIN_ALERT_EMAIL
preserve_env SUPPORT_EMAIL
preserve_env SUPPORT_FROM_EMAIL
preserve_env FRAUD_EMAIL_API_KEY
preserve_env FRAUD_IP_API_KEY
preserve_env PLATFORM_PUBLIC_IP
preserve_env REDIS_URL
preserve_env INTEGRATION_ENCRYPTION_KEY
preserve_env AWEBER_CLIENT_ID
preserve_env AWEBER_CLIENT_SECRET
preserve_env AWEBER_REDIRECT_URI
preserve_env STRIPE_SECRET_KEY
preserve_env STRIPE_PUBLISHABLE_KEY
preserve_env SENTRY_DSN
preserve_env CPA_OFFERS_ADVERTISER_ALLOWLIST
preserve_env AUTORESPONDER_ADVERTISER_ALLOWLIST

# Transactional email (verification, welcome, password reset) — pick Mailgun OR SMTP.
MAILGUN_API_KEY="${MAILGUN_API_KEY:-}"
MAILGUN_DOMAIN="${MAILGUN_DOMAIN:-}"
MAILGUN_FROM="${MAILGUN_FROM:-}"
MAILGUN_WEBHOOK_SIGNING_KEY="${MAILGUN_WEBHOOK_SIGNING_KEY:-}"
MAILGUN_API_BASE="${MAILGUN_API_BASE:-https://api.mailgun.net}"
SMTP_HOST="${SMTP_HOST:-}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-}"
SMTP_PASS="${SMTP_PASS:-}"
SMTP_FROM="${SMTP_FROM:-}"
SMTP_SECURE="${SMTP_SECURE:-false}"
ADMIN_ALERT_EMAIL="${ADMIN_ALERT_EMAIL:-}"
SUPPORT_EMAIL="${SUPPORT_EMAIL:-}"
SUPPORT_FROM_EMAIL="${SUPPORT_FROM_EMAIL:-}"
FRAUD_EMAIL_API_KEY="${FRAUD_EMAIL_API_KEY:-}"
FRAUD_IP_API_KEY="${FRAUD_IP_API_KEY:-}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
SENTRY_DSN="${SENTRY_DSN:-}"
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}"
STRIPE_PUBLISHABLE_KEY="${STRIPE_PUBLISHABLE_KEY:-}"
INTEGRATION_ENCRYPTION_KEY="${INTEGRATION_ENCRYPTION_KEY:-}"
AWEBER_CLIENT_ID="${AWEBER_CLIENT_ID:-}"
AWEBER_CLIENT_SECRET="${AWEBER_CLIENT_SECRET:-}"
AWEBER_REDIRECT_URI="${AWEBER_REDIRECT_URI:-${PLATFORM_URL}/api/v1/advertiser/integrations/aweber/callback}"
CPA_OFFERS_ADVERTISER_ALLOWLIST="${CPA_OFFERS_ADVERTISER_ALLOWLIST:-*}"
AUTORESPONDER_ADVERTISER_ALLOWLIST="${AUTORESPONDER_ADVERTISER_ALLOWLIST:-*}"

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
PLATFORM_PUBLIC_IP="$PLATFORM_PUBLIC_IP"
PORT=3000
NODE_ENV=production
REDIS_URL="$REDIS_URL"
SENTRY_DSN="$SENTRY_DSN"
STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY"
FRAUD_IP_API_KEY="$FRAUD_IP_API_KEY"
FRAUD_EMAIL_API_KEY="$FRAUD_EMAIL_API_KEY"
MAILGUN_API_KEY="$MAILGUN_API_KEY"
MAILGUN_DOMAIN="$MAILGUN_DOMAIN"
MAILGUN_FROM="$MAILGUN_FROM"
MAILGUN_API_BASE="$MAILGUN_API_BASE"
MAILGUN_WEBHOOK_SIGNING_KEY="$MAILGUN_WEBHOOK_SIGNING_KEY"
SMTP_HOST="$SMTP_HOST"
SMTP_PORT="$SMTP_PORT"
SMTP_SECURE="$SMTP_SECURE"
SMTP_USER="$SMTP_USER"
SMTP_PASS="$SMTP_PASS"
SMTP_FROM="$SMTP_FROM"
ADMIN_ALERT_EMAIL="$ADMIN_ALERT_EMAIL"
SUPPORT_EMAIL="$SUPPORT_EMAIL"
SUPPORT_FROM_EMAIL="$SUPPORT_FROM_EMAIL"
AWEBER_CLIENT_ID="$AWEBER_CLIENT_ID"
AWEBER_CLIENT_SECRET="$AWEBER_CLIENT_SECRET"
AWEBER_REDIRECT_URI="$AWEBER_REDIRECT_URI"
CPA_OFFERS_ADVERTISER_ALLOWLIST="$CPA_OFFERS_ADVERTISER_ALLOWLIST"
AUTORESPONDER_ADVERTISER_ALLOWLIST="$AUTORESPONDER_ADVERTISER_ALLOWLIST"
EOF

# Optional — omit when empty so the app falls back to AUTH_SECRET for integration crypto.
if [ -n "$INTEGRATION_ENCRYPTION_KEY" ]; then
  echo "INTEGRATION_ENCRYPTION_KEY=\"$INTEGRATION_ENCRYPTION_KEY\"" >> "$ROOT/apps/platform/.env"
fi

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
