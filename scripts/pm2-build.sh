#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Building admin portal → deploy/dist/admin"
cd admin
npm run build
mkdir -p ../deploy/dist/admin
rm -rf ../deploy/dist/admin/*
cp -r dist/* ../deploy/dist/admin/

echo "Building operator app → deploy/dist/operator (port 8082)"
cd ../mobile
EXPO_PUBLIC_BASE_PATH= npm run web:build
mkdir -p ../deploy/dist/operator
rm -rf ../deploy/dist/operator/*
cp -r dist/* ../deploy/dist/operator/

echo ""
echo "Static build complete:"
echo "  Admin:    deploy/dist/admin     → port 80/443"
echo "  Operator: deploy/dist/operator  → port 8082"
