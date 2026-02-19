#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SKILL_NAME="${1:-chek-vibe-cobuild}"
SRC_DIR="$ROOT_DIR/skills/$SKILL_NAME"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
DEST_DIR="$CODEX_HOME/skills/$SKILL_NAME"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Missing skill directory: $SRC_DIR" >&2
  exit 1
fi

if [[ ! -f "$SRC_DIR/SKILL.md" ]]; then
  echo "Missing SKILL.md in: $SRC_DIR" >&2
  exit 1
fi

mkdir -p "$CODEX_HOME/skills"

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "$SRC_DIR/" "$DEST_DIR/"
else
  rm -rf "$DEST_DIR"
  cp -R "$SRC_DIR" "$DEST_DIR"
fi

echo "Synced: $SRC_DIR -> $DEST_DIR"
echo "Restart Codex to pick up updated skills."
