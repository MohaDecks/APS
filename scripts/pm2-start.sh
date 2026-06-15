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
$PM2 start ecosystem.config.cjs --update-env
$PM2 save

echo ""
echo "══════════════════════════════════════════"
echo "  APS — PM2 started (aps-api)"
echo "══════════════════════════════════════════"
echo "  pm2 list / pm2 logs aps-api"
echo "  Static: deploy/dist/admin + deploy/dist/m"
echo "  Nginx:  configure on server (/etc/nginx/)"
echo "══════════════════════════════════════════"
