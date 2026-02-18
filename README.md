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

后端（本地 H2 即可跑通）：

```bash
cd /Users/jasonhong/Desktop/CHEK/backend-CHEK-content && mvn spring-boot:run
cd /Users/jasonhong/Desktop/CHEK/backend-CHEK-media && mvn spring-boot:run
cd /Users/jasonhong/Desktop/CHEK/backend-CHEK-ai && mvn spring-boot:run
```

前端（Next.js）：

```bash
cd /Users/jasonhong/Desktop/CHEK/frontend-CHEK
npm i
npm run dev
```
