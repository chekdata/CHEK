# Command Matrix

## Repository root

`<repo_root>`

## Service start/stop

- Start all local services:
  - `bash ./skills/chek-vibe-cobuild/scripts/dev-up.sh`
  - Override frontend port: `CHEK_FRONTEND_PORT=4000 bash ./skills/chek-vibe-cobuild/scripts/dev-up.sh`
- Stop all local services:
  - `bash ./skills/chek-vibe-cobuild/scripts/dev-down.sh`
  - Stop with custom frontend port: `CHEK_FRONTEND_PORT=4000 bash ./skills/chek-vibe-cobuild/scripts/dev-down.sh`
- Start local MySQL + Redis:
  - `bash ./skills/chek-vibe-cobuild/scripts/dev-db-up.sh`
- Stop local MySQL + Redis:
  - `bash ./skills/chek-vibe-cobuild/scripts/dev-db-down.sh`
- Write missing service `.env.local` files:
  - `bash ./skills/chek-vibe-cobuild/scripts/dev-write-env-local.sh`

## Seed data

- Generate wiki/posts seed files:
  - `python ./skills/chek-vibe-cobuild/scripts/seed_scrape_chek.py --wiki-count 120 --post-count 120 --out-dir ./.logs/seed/<batch>`
- Import seed files to content service:
  - `python ./skills/chek-vibe-cobuild/scripts/import_seed_chek.py --content-base-url http://localhost:8081 --wiki-jsonl <wiki.jsonl> --posts-jsonl <posts.jsonl>`
  - Multi-author posts (for follow testing): `--user-one-ids seed-a,seed-b,seed-c`
- Import through gateway:
  - `python ./skills/chek-vibe-cobuild/scripts/import_seed_chek.py --via-gateway --content-base-url https://api-dev.chekkk.com --authorization-file <sid_at_file> --wiki-jsonl <wiki.jsonl> --posts-jsonl <posts.jsonl>`

## Smoke tests

- Post-deploy smoke test (prod):
  - `CHEK_SID_AT='<sid_at>' python ./skills/chek-vibe-cobuild/scripts/smoke_chek_content_social.py --api-base https://api.chekkk.com`

## Frontend checks

- Local automated checks:
  - `bash ./skills/chek-vibe-cobuild/scripts/frontend-check.sh`

## Skill distribution

- Sync this skill to global Codex skills (for other windows/workspaces):
  - `bash ./skills/chek-vibe-cobuild/scripts/sync-to-codex.sh`
- Backward-compatible wrapper:
  - `bash ./scripts/sync-codex-skill.sh`

## Backward-compatible wrappers

Legacy paths in `./scripts/*` now delegate to this skill's scripts to avoid breaking existing docs and habits.
