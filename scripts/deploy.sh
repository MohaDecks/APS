#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Warning: .env not found — create JWT_SECRET, MONGODB_URI, PORT on the server."
fi

PM2_CMD="${PM2_CMD:-pm2}" bash scripts/pm2-start.sh

echo ""
echo "  Configure Nginx from deploy/nginx/ on the server"
echo "  App:   http://app.bildhaan.dirshay.com:8082"
echo "  Admin: https://bildhaan.admin.dirshay.com"
