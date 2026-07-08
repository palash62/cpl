#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Pull latest code..."
git pull --ff-only

if [ ! -f apps/platform/.env ] || [ ! -f apps/tracking/.env ]; then
  echo "Missing .env files for production."
  echo "Run: bash deploy/env-production.sh"
  echo "Then set real production values in apps/platform/.env and apps/tracking/.env"
  exit 1
fi

echo "==> Build and start Docker services..."
docker compose -f docker-compose.prod.yml up -d --build

echo "==> Running containers:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "Platform:  http://localhost:3000"
echo "Tracking:  http://localhost:3001"
