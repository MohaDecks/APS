#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Building admin portal..."
cd admin
npm run build
mkdir -p ../deploy/dist/admin
rm -rf ../deploy/dist/admin/*
cp -r dist/* ../deploy/dist/admin/

echo "Building mobile PWA..."
cd ../mobile
EXPO_PUBLIC_BASE_PATH=/m npm run web:build
mkdir -p ../deploy/dist/m
rm -rf ../deploy/dist/m/*
cp -r dist/* ../deploy/dist/m/

echo "Static build complete → deploy/dist/"
