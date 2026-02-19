#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

write_env() {
  local dir="$1"
  local db="$2"
  local port="$3"
  local path="$ROOT_DIR/$dir/.env.local"

  if [[ -f "$path" ]]; then
    echo "[$dir] .env.local already exists (skip): $path"
    return 0
  fi

  cat >"$path" <<EOF
SERVER_PORT=$port
DB_URL=jdbc:mysql://127.0.0.1:3307/$db?useUnicode=true&characterEncoding=utf-8&createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&allowMultiQueries=true
DB_UID=chek
DB_PWD=chek
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=15
EOF

  echo "[$dir] wrote $path"
}

write_env "backend-CHEK-content" "chek_content" 8081
write_env "backend-CHEK-ai" "chek_ai" 8082
write_env "backend-CHEK-media" "chek_media" 8083

if [[ ! -f "$ROOT_DIR/backend-CHEK-dev-gateway/.env.local" ]]; then
  cat >"$ROOT_DIR/backend-CHEK-dev-gateway/.env.local" <<'EOF'
PORT=8787
AUTH_BASE_URL=https://api-dev.chekkk.com
CONTENT_BASE_URL=http://localhost:8081
MEDIA_BASE_URL=http://localhost:8083
AI_BASE_URL=http://localhost:8082

# Optional (local smoke test only)
# - If you want to seed wiki entries via dev-gateway, set these temporarily.
CHEK_DEV_USER_ONE_ID=
CHEK_DEV_IS_ADMIN=0
EOF
  echo "[backend-CHEK-dev-gateway] wrote $ROOT_DIR/backend-CHEK-dev-gateway/.env.local"
else
  echo "[backend-CHEK-dev-gateway] .env.local already exists (skip)"
fi
