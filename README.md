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
