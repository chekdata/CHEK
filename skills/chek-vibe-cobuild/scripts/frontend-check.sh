#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

if [[ ! -d "$ROOT_DIR/frontend-CHEK/node_modules" ]]; then
  echo "[frontend] npm install..."
  npm -C "$ROOT_DIR/frontend-CHEK" install >/dev/null
fi

echo "[frontend] lint..."
npm -C "$ROOT_DIR/frontend-CHEK" run lint

echo "[frontend] build..."
npm -C "$ROOT_DIR/frontend-CHEK" run build

echo "[frontend] OK"

