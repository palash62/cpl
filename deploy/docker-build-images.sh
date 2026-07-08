#!/usr/bin/env bash
# Run on a machine with enough RAM (laptop / CI). Builds Next apps then packages
# slim Docker images. Do NOT run this on a 2GB production VPS.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v free >/dev/null 2>&1; then
  mem_mb="$(free -m | awk '/^Mem:/{print $2}')"
  if [ "${mem_mb:-0}" -gt 0 ] && [ "$mem_mb" -lt 2800 ]; then
    echo "WARNING: ~${mem_mb}MB RAM detected."
    echo "This script compiles Next.js and needs ~3GB+ free. Aborting."
    echo "Run this on your laptop/CI, then transfer deploy/cpl-docker-images.tar to the VPS."
    exit 1
  fi
fi

echo "==> npm ci..."
npm ci

echo "==> Prisma generate..."
npm run generate --workspace @cpl/database

echo "==> Production Next builds (needs ~3GB+ free RAM)..."
npm run build:production

echo "==> Prepare standalone assets..."
bash "$ROOT/deploy/prepare-standalone.sh"

echo "==> Docker package (copy artifacts only — no Next compile inside Docker)..."
docker build -f Dockerfile.platform -t cpl-platform:latest .
docker build -f Dockerfile.tracking -t cpl-tracking:latest .

OUT="$ROOT/deploy/cpl-docker-images.tar"
echo "==> Saving images to $OUT ..."
docker save cpl-platform:latest cpl-tracking:latest -o "$OUT"

echo ""
echo "Images ready:"
echo "  cpl-platform:latest"
echo "  cpl-tracking:latest"
echo "  archive: $OUT"
echo ""
echo "Copy to the 2GB server, then run (no build on server):"
echo "  scp deploy/cpl-docker-images.tar user@server:/path/to/cpl/deploy/"
echo "  # on server:"
echo "  bash deploy/env-production.sh   # once, then edit secrets"
echo "  bash deploy/docker-run.sh"
