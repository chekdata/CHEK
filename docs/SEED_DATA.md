# 种子数据（有知 + 相辅）生成与导入

本仓库提供两类种子数据：

- **有知（WikiEntry）**：用于 `/wiki/:slug`
- **相辅（Post）**：用于 `/p/:postId`

> 字段严格对齐 `backend-CHEK-content` 的 `CreateWikiEntryRequest` / `CreatePostRequest`。

## 1) 生成 JSONL

```bash
python /Users/jasonhong/Desktop/CHEK/scripts/seed_scrape_chek.py \
  --wiki-count 120 \
  --post-count 120 \
  --out-dir /Users/jasonhong/Desktop/CHEK/.logs/seed/2026-02-19-v2
```

输出文件（示例）：

- `/Users/jasonhong/Desktop/CHEK/.logs/seed/2026-02-19-v2/wiki_entries.jsonl`
- `/Users/jasonhong/Desktop/CHEK/.logs/seed/2026-02-19-v2/posts.jsonl`
- 带 `_meta` 溯源版：`*.with_meta.jsonl`

## 2) 本地“上线同款存储”（MySQL/Redis）启动

```bash
bash /Users/jasonhong/Desktop/CHEK/scripts/dev-db-up.sh
bash /Users/jasonhong/Desktop/CHEK/scripts/dev-write-env-local.sh
```

然后启动服务（会读取各服务目录下的 `.env.local`）：

```bash
CHEK_PRODLIKE=1 bash /Users/jasonhong/Desktop/CHEK/scripts/dev-up.sh
```

> MySQL 默认映射到宿主机 `127.0.0.1:3307`（见 `docker-compose.dev.yml`）。

## 3) 导入到 content 服务（直连）

```bash
python /Users/jasonhong/Desktop/CHEK/scripts/import_seed_chek.py \
  --content-base-url http://localhost:8081 \
  --wiki-jsonl /Users/jasonhong/Desktop/CHEK/.logs/seed/2026-02-19-v2/wiki_entries.jsonl \
  --posts-jsonl /Users/jasonhong/Desktop/CHEK/.logs/seed/2026-02-19-v2/posts.jsonl \
  --user-one-id seed-bot \
  --rpm 120
```

## 4) 导入（走网关，贴近线上）

当你在 **dev/staging/prod** 环境，希望走网关前缀 `/api/chek-content/...` 时：

```bash
python /Users/jasonhong/Desktop/CHEK/scripts/import_seed_chek.py \
  --via-gateway \
  --content-base-url https://api-dev.chekkk.com \
  --authorization-file /path/to/sid_at_token \
  --wiki-jsonl /Users/jasonhong/Desktop/CHEK/.logs/seed/2026-02-19-v2/wiki_entries.jsonl \
  --posts-jsonl /Users/jasonhong/Desktop/CHEK/.logs/seed/2026-02-19-v2/posts.jsonl \
  --rpm 120
```

注意：

- **Wiki 写入是 admin-only**：需要你的 `<sid_at>` 对应管理员权限，否则会 `FORBIDDEN`。
- Post 写入需要登录用户（网关会注入 `X-User-One-Id`）。
  - 如果你的网关没有注入身份头（导致 `missing X-User-One-Id` / `admin only`），可以临时加：
    - `--gateway-pass-through-identity --user-one-id <userOneId>`
    - 但这意味着客户端可伪造身份头；**更推荐修复网关：剥离外部请求里的 `X-User-One-Id` / `X-Is-Admin`，只允许网关注入**。

小贴士：

- 只导入其中一类：
  - `--skip-wiki` 或 `--skip-posts`
