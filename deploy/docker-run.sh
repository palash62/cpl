#!/usr/bin/env bash
# Server-side only: pull prebuilt images from GHCR and start containers.
# Does NOT build Next.js or Docker images (safe for ~2GB RAM).
#
# Fallback offline: IMAGE_SOURCE=tar bash deploy/docker-run.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=deploy/docker-registry.sh
source "$ROOT/deploy/docker-registry.sh"

IMAGE_SOURCE="${IMAGE_SOURCE:-registry}"
IMAGE_TAR="${IMAGE_TAR:-$ROOT/deploy/cpl-docker-images.tar}"
COMPOSE=(docker compose -f docker-compose.prod.yml)

if [ ! -f apps/platform/.env ] || [ ! -f apps/tracking/.env ]; then
  echo "Missing .env files for production."
  echo "Run: bash deploy/env-production.sh"
  echo "Then set real production values in apps/platform/.env and apps/tracking/.env"
  exit 1
fi

if [ "$IMAGE_SOURCE" = "tar" ]; then
  if [ ! -f "$IMAGE_TAR" ]; then
    echo "IMAGE_SOURCE=tar but missing $IMAGE_TAR"
    exit 1
  fi
  echo "==> Loading images from $IMAGE_TAR (offline)..."
  docker load -i "$IMAGE_TAR"
else
  echo "==> Pulling from registry (no build)..."
  echo "  $CPL_PLATFORM_IMAGE"
  echo "  $CPL_TRACKING_IMAGE"
  if ! "${COMPOSE[@]}" pull; then
    echo ""
    echo "Pull failed. If packages are private, login once on this server:"
    echo "  echo YOUR_GITHUB_PAT | docker login ghcr.io -u ${GHCR_OWNER} --password-stdin"
    echo "PAT needs read:packages. Or make packages public in GitHub Packages settings."
    echo ""
    echo "Offline fallback after scp of the tar:"
    echo "  IMAGE_SOURCE=tar bash deploy/docker-run.sh"
    exit 1
  fi
fi

echo "==> Starting containers (runtime only, no --build)..."
"${COMPOSE[@]}" up -d --no-build --pull never

echo "==> Running containers:"
"${COMPOSE[@]}" ps

echo ""
echo "Platform:  http://localhost:3000"
echo "Tracking:  http://localhost:3001"
echo ""
echo "Images: $CPL_PLATFORM_IMAGE | $CPL_TRACKING_IMAGE"
echo "Memory caps: platform 900m | tracking 500m"
echo ""
echo "After pulling new images, sync the database schema on this host:"
echo "  cd $ROOT && npm run db:push"
echo "  ${COMPOSE[@]} restart"
