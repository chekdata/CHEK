---
name: chek-vibe-cobuild
description: Run CHEK local co-build workflows for frontend/backend联调、prod-like MySQL/Redis 启停、环境文件写入、种子数据生成与导入。Use when contributors ask to boot/stop local services, prepare `.env.local`, seed wiki/forum data, or reproduce end-to-end API flows in this repository.
---

# CHEK Vibe Co-build

## Overview

Run deterministic scripts from this skill instead of rewriting startup/import commands repeatedly. Keep contributor workflows consistent across local environments.

## Workflow

### 1) Bootstrap local DEV

Run:

```bash
bash ./skills/chek-vibe-cobuild/scripts/dev-up.sh
```

Default ports:

- Frontend: `http://localhost:3000`
- Dev Gateway: `http://localhost:8787`

Override frontend port (example):

```bash
CHEK_FRONTEND_PORT=4000 bash ./skills/chek-vibe-cobuild/scripts/dev-up.sh
```

Use `CHEK_PRODLIKE=1` to auto-start local MySQL/Redis and write missing `.env.local`.

### 2) Bootstrap prod-like storage only

Run:

```bash
bash ./skills/chek-vibe-cobuild/scripts/dev-db-up.sh
bash ./skills/chek-vibe-cobuild/scripts/dev-write-env-local.sh
```

### 3) Generate and import seed data

Generate:

```bash
python ./skills/chek-vibe-cobuild/scripts/seed_scrape_chek.py --wiki-count 120 --post-count 120
```

Import:

```bash
python ./skills/chek-vibe-cobuild/scripts/import_seed_chek.py \
  --content-base-url http://localhost:8081 \
  --wiki-jsonl ./.logs/seed/<batch>/wiki_entries.jsonl \
  --posts-jsonl ./.logs/seed/<batch>/posts.jsonl
```

### 4) Shutdown

Run:

```bash
bash ./skills/chek-vibe-cobuild/scripts/dev-down.sh
bash ./skills/chek-vibe-cobuild/scripts/dev-db-down.sh
```

### 5) Sync skill to global Codex

Run:

```bash
bash ./skills/chek-vibe-cobuild/scripts/sync-to-codex.sh
```

## Guardrails

- Use gateway injection for identity in normal flows; do not rely on manual `X-User-One-Id` / `X-Is-Admin` in production traffic.
- Keep secrets in `.env.local` or secure files; avoid hardcoding tokens in commands.
- Prefer local wrappers in `./scripts/*` only for backward compatibility; treat skill scripts as canonical.

## References

- Detailed command matrix: `references/command-matrix.md`
