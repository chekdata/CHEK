#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

echo "[db] stopping mysql+redis via docker compose..."
docker compose -f "$ROOT_DIR/docker-compose.dev.yml" down
echo "[db] done."
