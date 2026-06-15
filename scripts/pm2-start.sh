#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! nc -z 127.0.0.1 27017 2>/dev/null; then
  echo "Starting MongoDB container..."
  docker compose up -d mongo
  sleep 5
fi

bash scripts/pm2-build.sh

# Docker backend/web ha isku dhicin PM2 — jooji haddii ay socdaan
docker compose stop backend web 2>/dev/null || true

PM2="${PM2_CMD:-pm2}"
$PM2 start ecosystem.config.cjs --update-env
$PM2 save

echo ""
echo "══════════════════════════════════════════"
echo "  APS API — PM2 started (aps-api)"
echo "══════════════════════════════════════════"
echo "  pm2 list          → arag aps-api"
echo "  pm2 logs aps-api  → logs"
echo ""
echo "  Static files: deploy/dist/"
echo "  Nginx config:  deploy/nginx-host.conf"
echo "══════════════════════════════════════════"
