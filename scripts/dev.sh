#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! nc -z 127.0.0.1 27017 2>/dev/null; then
  echo ""
  echo "MongoDB ma socdo. Bilow marka hore:"
  echo "  brew services start mongodb-community"
  echo "  ama: sudo systemctl start mongod"
  echo ""
  exit 1
fi

bash scripts/stop-dev.sh

echo ""
echo "══════════════════════════════════════════"
echo "  Airport Parking — Starting..."
echo "══════════════════════════════════════════"
echo "  API:    http://localhost:3001"
echo "  Admin:  http://localhost:5180/login"
echo "  Mobile: http://localhost:8082/login"
echo "══════════════════════════════════════════"
echo ""

npx concurrently -k -n backend,admin,mobile -c blue,green,magenta \
  "cd backend && npm run dev" \
  "cd admin && npm run dev" \
  "cd mobile && npm run web"
