#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[db] starting mysql+redis via docker compose..."
docker compose -f "$ROOT_DIR/docker-compose.dev.yml" up -d

echo "[db] waiting for mysql healthcheck..."
for _ in {1..60}; do
  if docker inspect --format='{{json .State.Health.Status}}' chek-mysql 2>/dev/null | grep -q '"healthy"'; then
    echo "[db] mysql healthy"
    break
  fi
  sleep 1
done

echo "[db] waiting for redis healthcheck..."
for _ in {1..60}; do
  if docker inspect --format='{{json .State.Health.Status}}' chek-redis 2>/dev/null | grep -q '"healthy"'; then
    echo "[db] redis healthy"
    break
  fi
  sleep 1
done

echo "[db] done."

