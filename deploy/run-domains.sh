#!/usr/bin/env bash
# Run CPL with two domains: leadvix.io (platform) + leadgenlink.site (tracking)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DOMAINS="127.0.0.1 leadvix.io www.leadvix.io leadgenlink.site www.leadgenlink.site"

echo "==> Checking /etc/hosts..."
if grep -q "leadvix.io" /etc/hosts 2>/dev/null; then
  echo "Hosts entries already present."
else
  echo "Adding domain entries to /etc/hosts (requires sudo)..."
  echo "$DOMAINS" | sudo tee -a /etc/hosts >/dev/null
fi

echo "==> Updating app env for domains..."
cat > apps/platform/.env << 'ENVEOF'
DATABASE_URL="mysql://cpl:cpl_dev_pass@localhost:3306/cpl"
INTERNAL_SERVICE_TOKEN="dev-internal-service-token-change-in-production-64chars-min"
AUTH_SECRET="dev-auth-secret-key-min-32-characters-long"
AUTH_URL="http://leadvix.io"
APP_URL="http://leadvix.io"
NEXT_PUBLIC_PLATFORM_URL="http://leadvix.io"
NEXT_PUBLIC_TRACKING_URL="http://leadgenlink.site"
PORT=3000
NODE_ENV=production
ENVEOF

cat > apps/tracking/.env << 'ENVEOF'
DATABASE_URL="mysql://cpl:cpl_dev_pass@localhost:3306/cpl"
INTERNAL_SERVICE_TOKEN="dev-internal-service-token-change-in-production-64chars-min"
TRACKING_URL="http://leadgenlink.site"
PLATFORM_URL="http://leadvix.io"
NEXT_PUBLIC_TRACKING_URL="http://leadgenlink.site"
NEXT_PUBLIC_PLATFORM_URL="http://leadvix.io"
PORT=3001
NODE_ENV=production
ENVEOF

echo "==> Installing nginx (if needed)..."
if ! command -v nginx >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo apt-get install -y nginx
fi

echo "==> Configuring nginx virtual hosts..."
sudo cp "$ROOT/deploy/nginx/platform.dev.conf" /etc/nginx/sites-available/leadvix.io
sudo cp "$ROOT/deploy/nginx/tracking.dev.conf" /etc/nginx/sites-available/leadgenlink.site
sudo ln -sf /etc/nginx/sites-available/leadvix.io /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/leadgenlink.site /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo "==> Starting CPL services..."
bash "$ROOT/deploy/run-4gb.sh"

echo ""
echo "============================================"
echo "  Platform:  http://leadvix.io"
echo "  Tracking:  http://leadgenlink.site"
echo "  Demo form: http://leadgenlink.site/t/demo-link"
echo "============================================"
