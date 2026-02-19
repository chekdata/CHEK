#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LOG_DIR="$ROOT_DIR/.logs"
mkdir -p "$LOG_DIR"

FRONTEND_PORT="${CHEK_FRONTEND_PORT:-3000}"

if [[ "${CHEK_PRODLIKE:-}" == "1" ]]; then
  bash "$ROOT_DIR/skills/chek-vibe-cobuild/scripts/dev-db-up.sh"
  bash "$ROOT_DIR/skills/chek-vibe-cobuild/scripts/dev-write-env-local.sh"
fi

load_env_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    return 0
  fi

  while IFS= read -r line || [[ -n "$line" ]]; do
    local s="$line"
    s="${s#"${s%%[![:space:]]*}"}"
    s="${s%"${s##*[![:space:]]}"}"
    if [[ -z "$s" || "$s" == \#* ]]; then
      continue
    fi
    if [[ "$s" != *"="* ]]; then
      continue
    fi

    local k="${s%%=*}"
    local v="${s#*=}"
    k="${k#"${k%%[![:space:]]*}"}"
    k="${k%"${k##*[![:space:]]}"}"
    v="${v#"${v%%[![:space:]]*}"}"
    v="${v%"${v##*[![:space:]]}"}"

    if [[ -z "$k" ]]; then
      continue
    fi
    if [[ ! "$k" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      continue
    fi

    if [[ ( "$v" == \"*\" && "$v" == *\" ) || ( "$v" == \'*\' && "$v" == *\' ) ]]; then
      v="${v:1:${#v}-2}"
    fi

    export "$k=$v"
  done <"$file"
}

port_pid() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true
}

start_mvn_service() {
  local name="$1"
  local dir="$2"
  local port="$3"

  local existing
  existing="$(port_pid "$port")"
  if [[ -n "$existing" ]]; then
    echo "[$name] already listening on :$port (pid=$existing)"
    return 0
  fi

  echo "[$name] starting (port=$port)..."
  (
    cd "$ROOT_DIR/$dir"
    if [[ -f ".env.local" ]]; then
      load_env_file ".env.local"
    fi
    nohup mvn -q spring-boot:run >"$LOG_DIR/$name.log" 2>&1 &
    echo $! >"$LOG_DIR/$name.pid"
  )
}

start_node_service() {
  local name="$1"
  local dir="$2"
  local port="$3"
  local cmd=("${@:4}")

  local existing
  existing="$(port_pid "$port")"
  if [[ -n "$existing" ]]; then
    echo "[$name] already listening on :$port (pid=$existing)"
    return 0
  fi

  if [[ ! -d "$ROOT_DIR/$dir/node_modules" ]]; then
    echo "[$name] npm install..."
    npm -C "$ROOT_DIR/$dir" install >/dev/null
  fi

  echo "[$name] starting (port=$port)..."
  (
    cd "$ROOT_DIR/$dir"
    nohup "${cmd[@]}" >"$LOG_DIR/$name.log" 2>&1 &
    echo $! >"$LOG_DIR/$name.pid"
  )
}

start_mvn_service "chek-content" "backend-CHEK-content" 8081
start_mvn_service "chek-ai" "backend-CHEK-ai" 8082
start_mvn_service "chek-media" "backend-CHEK-media" 8083

start_node_service "chek-dev-gateway" "backend-CHEK-dev-gateway" 8787 npm run dev

if [[ ! -f "$ROOT_DIR/frontend-CHEK/.env.local" ]]; then
  cat >"$ROOT_DIR/frontend-CHEK/.env.local" <<EOF
CHEK_API_BASE_URL=http://localhost:8787
CHEK_SITE_URL=http://localhost:$FRONTEND_PORT
EOF
  echo "[frontend] wrote frontend-CHEK/.env.local"
elif [[ "${CHEK_FRONTEND_PORT:-}" != "" ]]; then
  echo "[frontend] NOTE: frontend-CHEK/.env.local exists; update CHEK_SITE_URL if you changed CHEK_FRONTEND_PORT=$FRONTEND_PORT"
fi

if [[ "${CHEK_CLEAN_NEXT_CACHE:-}" == "1" ]]; then
  echo "[frontend] cleaning frontend-CHEK/.next (CHEK_CLEAN_NEXT_CACHE=1)"
  rm -r "$ROOT_DIR/frontend-CHEK/.next" 2>/dev/null || true
fi

start_node_service "frontend-chek" "frontend-CHEK" "$FRONTEND_PORT" ./node_modules/.bin/next dev -p "$FRONTEND_PORT"

echo ""
echo "DEV is up:"
echo "- frontend:    http://localhost:$FRONTEND_PORT"
echo "- dev-gateway: http://localhost:8787"
echo "- content:     http://localhost:8081 (healthz=/healthz)"
echo "- ai:          http://localhost:8082 (healthz=/healthz)"
echo "- media:       http://localhost:8083 (healthz=/healthz)"
echo ""
echo "Logs: $LOG_DIR"
