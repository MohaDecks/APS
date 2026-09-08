#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Building admin portal → deploy/dist/admin"
cd admin
npm run build
mkdir -p ../deploy/dist/admin
rm -rf ../deploy/dist/admin/*
cp -r dist/* ../deploy/dist/admin/

echo "Building operator app → deploy/dist/operator (app.bildhaan.dirshay.com)"
cd ../mobile
EXPO_PUBLIC_BASE_PATH= npm run web:build
# Expo sometimes skips extra public files — copy them again
cp -f public/sw.js public/manifest.json public/offline.html public/favicon.png public/install.html dist/ 2>/dev/null || true
mkdir -p dist/icons
cp -f public/icons/* dist/icons/ 2>/dev/null || true
mkdir -p ../deploy/dist/operator
rm -rf ../deploy/dist/operator/*
cp -r dist/* ../deploy/dist/operator/

echo "Static build complete:"
echo "  Admin:    deploy/dist/admin     → :80 / :443"
echo "  Operator: deploy/dist/operator  → :8082"
echo "  Admin files:    $(find ../deploy/dist/admin -type f 2>/dev/null | wc -l | tr -d ' ')"
echo "  Operator files: $(find ../deploy/dist/operator -type f 2>/dev/null | wc -l | tr -d ' ')"
