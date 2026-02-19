# 潮客（CHEK）

一个由本地与游客共同参与的潮汕内容平台（开源共创），MVP 先把 **有知（百科）+ 相辅（帖子/评论）** 做到真正可用。

> 本项目为首届“北回归线极客节”支持项目。

## 文档

- 产品需求：`/Users/jasonhong/Desktop/CHEK/docs/PRD.md`
- 方案与架构：
  - `/Users/jasonhong/Desktop/CHEK/docs/README.md`
  - `/Users/jasonhong/Desktop/CHEK/docs/MVP_P0_PRICE_RIDE_AI.md`
  - `/Users/jasonhong/Desktop/CHEK/docs/FRONTEND_SOLUTION.md`
  - `/Users/jasonhong/Desktop/CHEK/docs/FRONTEND_DESIGN_PROMPTS.md`
  - `/Users/jasonhong/Desktop/CHEK/docs/BACKEND_MICROSERVICES.md`
  - `/Users/jasonhong/Desktop/CHEK/docs/INTEGRATION_AUTH_GATEWAY.md`
  - `/Users/jasonhong/Desktop/CHEK/docs/DEVOPS_DELIVERY.md`

## 快速开始（本地）

推荐用一键脚本（含 dev-gateway，用于在本地注入 `X-User-One-Id`，让发相辅/评论的写接口能联调跑通）：

```bash
bash /Users/jasonhong/Desktop/CHEK/scripts/dev-up.sh
```

关闭：

```bash
bash /Users/jasonhong/Desktop/CHEK/scripts/dev-down.sh
```

## 协作模式（Collaborative Workflow）

默认走 `dev -> staging -> main`，推荐如下流程：

1. 从 `dev`（或团队约定的 `develop`）切出 `feature/*` 分支。
2. 功能改动必须配套测试（单元测试 + 集成测试），并说明覆盖率结果。
3. 通过 Linter 与构建检查后再提交。
4. Commit message 遵循 Conventional Commits（如 `feat: ...` / `fix: ...`）。
5. 推送分支并发起 PR，PR 描述写清楚“做了什么 + 为什么这么做 + 如何验证”。
6. 完成所有 review thread，等待 CI 全绿后再合并。
7. 建议使用 squash merge 保持历史清晰。
