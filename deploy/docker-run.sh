#!/usr/bin/env bash
# Server-side only: load prebuilt images and start containers.
# Does NOT build Next.js or Docker images (safe for ~2GB RAM).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

IMAGE_TAR="${IMAGE_TAR:-$ROOT/deploy/cpl-docker-images.tar}"

if [ ! -f apps/platform/.env ] || [ ! -f apps/tracking/.env ]; then
  echo "Missing .env files for production."
  echo "Run: bash deploy/env-production.sh"
  echo "Then set real production values in apps/platform/.env and apps/tracking/.env"
  exit 1
fi

# Prefer loading a transferred archive; skip if images already exist locally.
need_load=0
if ! docker image inspect cpl-platform:latest >/dev/null 2>&1; then
  need_load=1
fi
if ! docker image inspect cpl-tracking:latest >/dev/null 2>&1; then
  need_load=1
fi

if [ "$need_load" -eq 1 ]; then
  if [ ! -f "$IMAGE_TAR" ]; then
    echo "Docker images not found on this server."
    echo "Build on a machine with enough RAM, then copy the archive here:"
    echo "  bash deploy/docker-build-images.sh"
    echo "  scp deploy/cpl-docker-images.tar user@server:$ROOT/deploy/"
    exit 1
  fi
  echo "==> Loading images from $IMAGE_TAR (no build)..."
  docker load -i "$IMAGE_TAR"
else
  echo "==> Images already present (cpl-platform, cpl-tracking)"
  if [ -f "$IMAGE_TAR" ]; then
    echo "==> Reloading $IMAGE_TAR to pick up latest transfer..."
    docker load -i "$IMAGE_TAR"
  fi
fi

echo "==> Starting containers (runtime only, no --build)..."
docker compose -f docker-compose.prod.yml up -d --no-build --pull never

echo "==> Running containers:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "Platform:  http://localhost:3000"
echo "Tracking:  http://localhost:3001"
echo ""
echo "Memory caps: platform 900m | tracking 500m"
