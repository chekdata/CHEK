#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.logs"
mkdir -p "$LOG_DIR"

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
      set -a
      # shellcheck disable=SC1091
      source ".env.local"
      set +a
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
  cat >"$ROOT_DIR/frontend-CHEK/.env.local" <<'EOF'
CHEK_API_BASE_URL=http://localhost:8787
CHEK_SITE_URL=http://localhost:3000
EOF
  echo "[frontend] wrote frontend-CHEK/.env.local"
fi

start_node_service "frontend-chek" "frontend-CHEK" 3000 npm run dev

echo ""
echo "DEV is up:"
echo "- frontend:    http://localhost:3000"
echo "- dev-gateway: http://localhost:8787"
echo "- content:     http://localhost:8081 (healthz=/healthz)"
echo "- ai:          http://localhost:8082 (healthz=/healthz)"
echo "- media:       http://localhost:8083 (healthz=/healthz)"
echo ""
echo "Logs: $LOG_DIR"
