#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Warning: .env not found — create JWT_SECRET, MONGODB_URI, PORT on the server."
fi

PM2_CMD="${PM2_CMD:-pm2}" bash scripts/pm2-start.sh

echo ""
echo "  Configure Nginx manually on the server (/etc/nginx/sites-available/)"
echo "  Admin:    https://parking.dirshay.com/login"
echo "  Operator: http://parking.dirshay.com:8082/login"
