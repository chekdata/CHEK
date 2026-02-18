# Auth-saas 与网关接入（Chaoke 侧约定）

## 1. 统一入口与环境

- dev：`https://api-dev.chekkk.com`
- staging：`https://api-staging.chekkk.com`
- prod：`https://api.chekkk.com`

所有前端请求统一为：`{API_BASE_URL}/api/<svc>/...`（禁止直连 K8s Service）。

## 2. 用户体系（backend-auth-saas）

OpenAPI：`https://api-dev.chekkk.com/api/auth/openapi.json`

常用接口（H5 直接调用，走网关前缀 `/api/auth`）：

- `POST /api/auth/v1/wechat/login`（微信 code 登录；返回 `UserLoginDTO`，内含 `accessToken=sid_at`）
- `POST /api/auth/v1/sms/send`（发送验证码）
- `POST /api/auth/v1/smsLogin`（短信登录）
- `POST /api/auth/v1/user/wechat/bindPhone`（微信登录后绑定手机号）
- `GET /api/auth/v1/userInfo`（拉取当前用户信息，含 `permissionCodeList`）
- `GET /api/auth/v1/logout`

前端请求头：

- `Authorization: Bearer <sid_at>`

## 3. 网关鉴权（双通行证）

业务服务不直接依赖 auth-saas 内省接口；由网关统一做：

1) 网关携带“机器身份”（Basic/mTLS）调用 auth 的 `/v1/validToken`  
2) 参数中提交用户的 `sid_at`  
3) 校验通过后，网关将用户身份信息写入下游请求头  

Chaoke 服务端只需要信任“网关注入身份头”，并做业务权限校验即可。

## 4. Chaoke 服务命名与路由（建议）

P0 建议服务与前缀如下：

- `chaoke-content`：`/api/chaoke-content/**`（百科+帖子+审核+志愿者）
- `chaoke-ai`：`/api/chaoke-ai/**`
- `chaoke-media`：`/api/chaoke-media/**`

> 后续如需要再拆分（P1/P2）：可从 `chaoke-content` 拆出 `chaoke-wiki/chaoke-post/chaoke-moderation`，但网关前缀规则不变。

每个服务必须提供：

- `GET /healthz`（网关映射为 `/api/<svc>/healthz`）
- `GET /openapi.json`（网关映射为 `/api/<svc>/openapi.json`）

并确保网关白名单放行：

- `/api/<svc>/healthz`
- `/api/<svc>/openapi.json`

## 5. 权限模型（P0 推荐）

- Auth-saas 的 `permissionCodeList`：用于“平台/内部系统权限点”，可作为后台权限参考
- Chaoke 的“产品角色”（游客/志愿者/审核员/管理员）：
  - 由 Chaoke 自己的 DB 决定（例如 `volunteer_profile.status`）
  - 写接口必须做硬校验（前端仅做引导）
