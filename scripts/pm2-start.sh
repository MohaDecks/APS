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
PORT="${PORT:-3001}"
if [ -f .env ]; then
  env_port="$(awk -F= '/^PORT=/{print $2; exit}' .env | tr -d '[:space:]')"
  [ -n "$env_port" ] && PORT="$env_port"
fi

echo "Stopping old aps-api (cluster duplicates included)..."
$PM2 stop aps-api >/dev/null 2>&1 || true
$PM2 delete aps-api >/dev/null 2>&1 || true
sleep 1
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" >/dev/null 2>&1 || true
fi
sleep 1

echo "Starting aps-api (fork, 1 instance) on :${PORT}..."
$PM2 start ecosystem.config.cjs --update-env --only aps-api
$PM2 save

echo ""
echo "══════════════════════════════════════════"
echo "  APS — deploy complete"
echo "══════════════════════════════════════════"
echo "  Git:      $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
echo "  Built:    $(date '+%Y-%m-%d %H:%M:%S')"
echo "  App:      http://app.bildhaan.dirshay.com:8082"
echo "  Admin:    https://bildhaan.admin.dirshay.com"
echo "  API:      pm2 list / pm2 logs aps-api"
echo "  Static:   deploy/dist/admin + deploy/dist/operator"
echo ""
echo "  Operator PWA: hard refresh or reinstall if UI looks old"
echo "  (service worker cache clears on each new build)"
echo "══════════════════════════════════════════"
