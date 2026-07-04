#!/usr/bin/env bash
# Sequential low-memory production build for 4GB servers.
# Requires swap (run deploy/setup-swap.sh first) or build on a machine with >=8GB RAM.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Generating Prisma client..."
npm run generate --workspace @cpl/database

echo "==> Building tracking service (lighter, first)..."
NODE_OPTIONS="--max-old-space-size=768" npm run build --workspace @cpl/tracking

echo "==> Building platform service..."
NODE_OPTIONS="--max-old-space-size=1536" npm run build --workspace @cpl/platform

echo "==> Build complete."
