#!/usr/bin/env bash
# Copy static assets into Next.js standalone output (required for next start / node server.js).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

prepare_app() {
  local app_dir="$1"
  local app_name="$2"
  local standalone="$app_dir/.next/standalone"

  if [ ! -f "$app_dir/.next/BUILD_ID" ]; then
    echo "Missing build for $app_name — run deploy/build-production.sh first"
    exit 1
  fi

  if [ ! -d "$standalone" ]; then
    echo "No standalone output for $app_name"
    exit 1
  fi

  mkdir -p "$standalone/apps/$app_name/.next"
  cp -r "$app_dir/.next/static" "$standalone/apps/$app_name/.next/static"
  if [ -d "$app_dir/public" ]; then
    cp -r "$app_dir/public" "$standalone/apps/$app_name/public"
  fi

  echo "Prepared standalone: $app_name"
}

prepare_app "$ROOT/apps/tracking" "tracking"
prepare_app "$ROOT/apps/platform" "platform"

touch "$ROOT/deploy/.build-ready"
echo "Build ready marker: deploy/.build-ready"
