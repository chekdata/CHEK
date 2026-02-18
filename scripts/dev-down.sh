#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.logs"

port_pid() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true
}

kill_port() {
  local name="$1"
  local port="$2"
  local pid
  pid="$(port_pid "$port")"
  if [[ -z "$pid" ]]; then
    echo "[$name] not listening on :$port"
    return 0
  fi
  echo "[$name] stopping :$port pid=$pid"
  kill "$pid" 2>/dev/null || true

  for _ in {1..40}; do
    if [[ -z "$(port_pid "$port")" ]]; then
      return 0
    fi
    sleep 0.25
  done

  echo "[$name] still listening on :$port, force killing pid=$pid"
  kill -9 "$pid" 2>/dev/null || true
}

rm_pidfile() {
  local name="$1"
  rm -f "$LOG_DIR/$name.pid" 2>/dev/null || true
}

kill_port "frontend-chek" 3000
kill_port "chek-dev-gateway" 8787
kill_port "chek-media" 8083
kill_port "chek-ai" 8082
kill_port "chek-content" 8081

rm_pidfile "frontend-chek"
rm_pidfile "chek-dev-gateway"
rm_pidfile "chek-media"
rm_pidfile "chek-ai"
rm_pidfile "chek-content"

echo "Done."
