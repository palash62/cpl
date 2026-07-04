#!/usr/bin/env bash
# Rsync production build artifacts to server (run after build-production.sh).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

SSH_HOST="${DEPLOY_SSH_HOST:-AWS-CPL}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/home/ubuntu/cpl}"

if [ ! -f "$ROOT/deploy/.build-ready" ]; then
  echo "Run bash deploy/build-production.sh first"
  exit 1
fi

echo "==> Rsync .next builds to $SSH_HOST:$REMOTE_DIR"
rsync -avz --delete \
  "$ROOT/apps/platform/.next/" "$SSH_HOST:$REMOTE_DIR/apps/platform/.next/"
rsync -avz --delete \
  "$ROOT/apps/tracking/.next/" "$SSH_HOST:$REMOTE_DIR/apps/tracking/.next/"
rsync -avz \
  "$ROOT/deploy/.build-ready" "$SSH_HOST:$REMOTE_DIR/deploy/.build-ready"
rsync -avz \
  "$ROOT/ecosystem.config.production.js" "$SSH_HOST:$REMOTE_DIR/ecosystem.config.production.js"

echo "==> Remote pull + restart..."
ssh "$SSH_HOST" "cd $REMOTE_DIR && git pull --ff-only && bash deploy/server-pull-run.sh"

echo "Done."
