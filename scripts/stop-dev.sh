#!/usr/bin/env bash
# Stop APS local dev servers on dedicated ports only.
set -euo pipefail

PORTS=(3001 5180 8082)

for port in "${PORTS[@]}"; do
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Stopping port $port ..."
    kill $pids 2>/dev/null || true
  fi
done

echo "APS dev servers stopped."
