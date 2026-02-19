# 潮客 CHEK

一个由本地人与游客共同参与的潮汕开源共建平台。  
MVP 聚焦两件事：**有知（Wiki）+ 相辅（帖子/评论）**。

> 本项目为首届“北回归线极客节”支持项目。

[![CI](https://img.shields.io/github/actions/workflow/status/chekdata/CHEK/chek-ci-cd.yml?branch=main&style=for-the-badge)](https://github.com/chekdata/CHEK/actions/workflows/chek-ci-cd.yml)
[![Repo](https://img.shields.io/badge/GitHub-chekdata%2FCHEK-111827?style=for-the-badge&logo=github)](https://github.com/chekdata/CHEK)
[![MVP](https://img.shields.io/badge/Scope-Wiki%20%2B%20Forum-3388FF?style=for-the-badge)](https://github.com/chekdata/CHEK/tree/main/docs)

## 产品命名（潮汕话特色）

- 有知 = Wiki / 百科
- 相辅 = 帖子 / 评论
- AI来 = AI 能力入口（P1）
- 胶己 = 我的
- 劳热 = 时间线（P1）
- 辣辣嗦 = 地图（P1）

## MVP 范围

- ✅ 做：Wiki 条目浏览/创建/编辑、帖子发布/浏览/评论、游客可读、登录后写
- ❌ 不做：私信、匹配、复杂社交关系、卡片独立后端字段与独立功能

## Monorepo 结构

```text
CHEK/
├─ frontend-CHEK/               # H5（SEO/GEO 友好，支持静态化）
├─ backend-CHEK-content/        # 内容服务（有知/相辅）
├─ backend-CHEK-media/          # 媒体上传与访问
├─ backend-CHEK-ai/             # AI 服务（AI来）
├─ backend-CHEK-dev-gateway/    # 本地联调网关（鉴权透传/身份注入）
├─ docs/                        # 产品、架构、联调、交付文档
├─ skills/chek-vibe-cobuild/    # 共建 skill（脚本与流程标准化）
└─ scripts/                     # 兼容入口（转发到 skill 脚本）
```

## 文档导航

- 总览：`docs/README.md`
- 产品需求：`docs/PRD.md`
- MVP 定义：`docs/MVP_P0_PRICE_RIDE_AI.md`
- 前端技术方案：`docs/FRONTEND_SOLUTION.md`
- 设计与文案 Prompts：`docs/FRONTEND_DESIGN_PROMPTS.md`
- 后端微服务：`docs/BACKEND_MICROSERVICES.md`
- 鉴权与网关集成：`docs/INTEGRATION_AUTH_GATEWAY.md`
- 本地联调：`docs/LOCAL_DEV.md`
- 种子数据：`docs/SEED_DATA.md`
- DevOps 交付：`docs/DEVOPS_DELIVERY.md`

## Quick Start（本地）

推荐直接使用共建 skill 的脚本（canonical）：

```bash
git clone https://github.com/chekdata/CHEK.git
cd CHEK
bash ./skills/chek-vibe-cobuild/scripts/dev-up.sh
```

关闭：

```bash
bash ./skills/chek-vibe-cobuild/scripts/dev-down.sh
```

可选：prod-like 联调（本地 MySQL/Redis）

```bash
CHEK_PRODLIKE=1 bash ./skills/chek-vibe-cobuild/scripts/dev-up.sh
```

访问：

- Frontend: `http://localhost:3000`
- Dev Gateway: `http://localhost:8787`
- Content: `http://localhost:8081`
- AI: `http://localhost:8082`
- Media: `http://localhost:8083`

## Seed Data（有知 + 相辅）

生成：

```bash
python ./skills/chek-vibe-cobuild/scripts/seed_scrape_chek.py \
  --wiki-count 120 \
  --post-count 120 \
  --out-dir ./.logs/seed/demo
```

导入：

```bash
python ./skills/chek-vibe-cobuild/scripts/import_seed_chek.py \
  --content-base-url http://localhost:8081 \
  --wiki-jsonl ./.logs/seed/demo/wiki_entries.jsonl \
  --posts-jsonl ./.logs/seed/demo/posts.jsonl
```

## 共建 Skill

已内置：`skills/chek-vibe-cobuild`  
用于统一以下协作流程：

- 一键启动/停止前后端本地联调
- 启停本地 MySQL/Redis、写入服务 `.env.local`
- 生成与导入有知/相辅种子数据
- 一键同步 skill 到全局 Codex：`bash ./skills/chek-vibe-cobuild/scripts/sync-to-codex.sh`
- 降低跨成员环境差异，保证联调命令一致

> 说明：`scripts/*` 保留为兼容入口，当前会转发到 `skills/chek-vibe-cobuild/scripts/*`。

## Contributing

欢迎通过 Issue / PR 共建。建议流程：

1. 先在 `docs/` 对齐范围和接口
2. 再按 `docs/LOCAL_DEV.md` 启动本地联调
3. 提交前至少通过目标模块的 lint/build/test
4. PR 描述写清楚：变更范围、回归点、截图或日志

## Thanks to all clawtributors:

[![Contributors](https://contrib.rocks/image?repo=chekdata/CHEK)](https://github.com/chekdata/CHEK/graphs/contributors)
