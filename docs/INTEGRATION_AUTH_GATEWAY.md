# Auth-saas 与网关接入（CHEK 侧约定）

## 1. 统一入口与环境

- dev：`https://api-dev.chekkk.com`
- staging：`https://api-staging.chekkk.com`
- prod：`https://api.chekkk.com`

所有前端请求统一为：`{API_BASE_URL}/api/<svc>/...`（禁止直连 K8s Service）。

本地联调（推荐）：

- 用仓库内的 `backend-CHEK-dev-gateway` 在本地模拟网关：把 `/api/<svc>/...` 转发到本地微服务端口，并从 auth-saas 拉 `userInfo` 注入 `X-User-One-Id`。
- 一键启动见：`/Users/jasonhong/Desktop/CHEK/docs/LOCAL_DEV.md`

## 2. 用户体系（backend-auth-saas）

OpenAPI：`https://api-dev.chekkk.com/api/auth/openapi.json`

常用接口（H5 直接调用，走网关前缀 `/api/auth`）：

- `POST /api/auth/v1/wechat/login`（微信 code 登录；返回 `UserLoginDTO`，内含 `accessToken=sid_at`）
- `POST /api/auth/v1/sms/send`（发送验证码）
- `POST /api/auth/v1/accounts/smsLogin`（短信登录）
- `POST /api/auth/v1/user/wechat/bindPhone`（微信登录后绑定手机号）
- `GET /api/auth/v1/userInfo`（拉取当前用户信息，含 `permissionCodeList`）
- `GET /api/auth/v1/logout`

前端请求头：

- `Authorization: Bearer <sid_at>`

## 2.1 微信 H5 网页授权登录（推荐）

目标：前端只负责“拉起微信授权拿 code + 把 code 交给 auth-saas 换 token”，**AppSecret 始终只放在后端**。

流程（简化版）：

1) 前端在登录页引导用户跳转微信 OAuth（带 `appid/redirect_uri/scope/state`）  
2) 微信回调到你的 H5（例如 `https://chaoshan.chekkk.com/auth/wechat/callback`），带 `code/state`  
3) 前端调用 auth-saas：`POST /api/auth/v1/wechat/login`，body 传 `clientId + code`  
4) auth-saas 返回 `accessToken`（sid_at）。前端保存后即可调用业务服务

注意：

- `redirect_uri` 必须 URL 编码，且域名需在微信后台配置为“网页授权回调域名”。
- 若返回里 `mobilePhone` 为空：跳转绑定手机号页，调用 `POST /api/auth/v1/user/wechat/bindPhone` 补全。

前端配置（Next.js H5）：

- 推荐（运行时配置，无需重新打前端镜像）：
  - `CHEK_WECHAT_APP_ID`：微信 AppID（公开可见）
  - `CHEK_WECHAT_SCOPE`：微信内常用 `snsapi_base/snsapi_userinfo`（默认 `snsapi_userinfo`）
  - `CHEK_AUTH_CLIENT_ID`：auth-saas clientId（默认 `app`）
- 备选（构建期内联到前端 JS；修改需重建/重发版）：
  - `NEXT_PUBLIC_WECHAT_APP_ID`
  - `NEXT_PUBLIC_WECHAT_SCOPE`
  - `NEXT_PUBLIC_AUTH_CLIENT_ID`

## 3. 网关鉴权（双通行证）

业务服务不直接依赖 auth-saas 内省接口；由网关统一做：

1) 网关携带“机器身份”（Basic/mTLS）调用 auth 的 `/v1/validToken`  
2) 参数中提交用户的 `sid_at`  
3) 校验通过后，网关将用户身份信息写入下游请求头  

CHEK 服务端只需要信任“网关注入身份头”，并做业务权限校验即可。

## 4. CHEK 服务命名与路由（建议）

P0 建议服务与前缀如下：

- `chek-content`：`/api/chek-content/**`（有知+相辅）
- `chek-media`：`/api/chek-media/**`（可选：上传/下载鉴权）
- `chek-ai`：`/api/chek-ai/**`（可选：AI来）

> 后续如需要再拆分（P1/P2）：可从 `chek-content` 拆出 `chek-wiki/chek-forum` 等，但网关前缀规则不变。

每个服务必须提供：

- `GET /healthz`（网关映射为 `/api/<svc>/healthz`）
- `GET /openapi.json`（网关映射为 `/api/<svc>/openapi.json`）

并确保网关白名单放行：

- `/api/<svc>/healthz`
- `/api/<svc>/openapi.json`

## 5. 权限模型（P0 推荐）

- Auth-saas 的 `permissionCodeList`：用于“平台/内部系统权限点”，可作为后台权限参考
- CHEK 的最小权限：
  - 游客（未登录）：只读（有知/相辅）
  - 登录用户：可发相辅/评论/删除自己的内容
  - 管理员：可下架内容；Wiki 写入（MVP 可先只给管理员/白名单）
