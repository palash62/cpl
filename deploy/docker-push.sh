#!/usr/bin/env bash
# Push package-only images to GitHub Container Registry (GHCR).
# Requires: docker login ghcr.io (PAT with write:packages) OR CI GITHUB_TOKEN.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=deploy/docker-registry.sh
source "$ROOT/deploy/docker-registry.sh"

need_images=0
if ! docker image inspect "$CPL_PLATFORM_IMAGE" >/dev/null 2>&1; then
  need_images=1
fi
if ! docker image inspect "$CPL_TRACKING_IMAGE" >/dev/null 2>&1; then
  need_images=1
fi

if [ "$need_images" -eq 1 ]; then
  echo "Tagged images not found. Build first:"
  echo "  bash deploy/docker-build-images.sh"
  exit 1
fi

echo "==> Pushing $CPL_PLATFORM_IMAGE"
docker push "$CPL_PLATFORM_IMAGE"

echo "==> Pushing $CPL_TRACKING_IMAGE"
docker push "$CPL_TRACKING_IMAGE"

echo ""
echo "Pushed. On the 2GB server (after docker login ghcr.io if packages are private):"
echo "  bash deploy/docker-run.sh"
