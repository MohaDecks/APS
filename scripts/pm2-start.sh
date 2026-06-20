#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! nc -z 127.0.0.1 27017 2>/dev/null; then
  echo ""
  echo "MongoDB ma socdo. Bilow marka hore:"
  echo "  brew services start mongodb-community   (Mac)"
  echo "  sudo systemctl start mongod             (Linux)"
  echo ""
  exit 1
fi

bash scripts/pm2-build.sh

PM2="${PM2_CMD:-pm2}"
if $PM2 describe aps-api >/dev/null 2>&1; then
  echo "Restarting aps-api..."
  $PM2 restart aps-api --update-env
else
  echo "Starting aps-api..."
  $PM2 start ecosystem.config.cjs --update-env
fi
$PM2 save

echo ""
echo "══════════════════════════════════════════"
echo "  APS — deploy complete"
echo "══════════════════════════════════════════"
echo "  Git:      $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
echo "  Built:    $(date '+%Y-%m-%d %H:%M:%S')"
echo "  API:      pm2 list / pm2 logs aps-api"
echo "  Static:   deploy/dist/admin + deploy/dist/operator"
echo ""
echo "  Operator PWA: hard refresh or reinstall if UI looks old"
echo "  (service worker cache clears on each new build)"
echo "══════════════════════════════════════════"
