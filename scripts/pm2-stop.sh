#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PM2="${PM2_CMD:-pm2}"
$PM2 stop aps-api 2>/dev/null || true
$PM2 delete aps-api 2>/dev/null || true
$PM2 save 2>/dev/null || true

echo "aps-api stopped."
