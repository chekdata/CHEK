# CHEK Dev Gateway（本地联调用）

> 目的：在本地模拟 `backend-gateway-saas` 的最关键能力：
>
> 1) 把 `/api/<svc>/...` 路由到本地微服务端口（并做前缀剥离）  
> 2) 用 `Authorization: Bearer <sid_at>` 去 auth-saas 拉 `userInfo`，将 `userOneId` 注入下游请求头 `X-User-One-Id`（让内容/媒体服务的写接口在本地也能跑通）

## 启动

```bash
cd /Users/jasonhong/Desktop/CHEK/backend-CHEK-dev-gateway
npm i
npm run dev
```

默认监听：`http://localhost:8787`

## 环境变量（可选）

可放在 `.env.local`（已被根目录 `.gitignore` 忽略）：

```bash
PORT=8787

AUTH_BASE_URL=https://api-dev.chekkk.com
CONTENT_BASE_URL=http://localhost:8081
MEDIA_BASE_URL=http://localhost:8083
AI_BASE_URL=http://localhost:8082

# 仅用于本地自测：没有登录 token 时也能注入身份头（不建议用于真实联调）
CHEK_DEV_USER_ONE_ID=dev_user_1
CHEK_DEV_IS_ADMIN=0
```

