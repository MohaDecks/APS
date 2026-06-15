#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Warning: .env not found — create one with JWT_SECRET and HTTP_PORT before production."
fi

echo "Building and starting containers..."
docker compose up -d --build

echo "Waiting for MongoDB..."
sleep 8

echo "Seeding default users (admin + operator)..."
docker compose --profile seed run --rm seed

echo ""
echo "══════════════════════════════════════════"
echo "  Airport Parking is running!"
echo "══════════════════════════════════════════"
echo "  Admin:  http://YOUR_SERVER_IP/"
echo "  Mobile: http://YOUR_SERVER_IP/m/"
echo "  API:    http://YOUR_SERVER_IP/api/health"
echo ""
echo "  Admin:    admin@parking.com / admin123"
echo "  Operator: operator@parking.com / operator123"
echo "══════════════════════════════════════════"
