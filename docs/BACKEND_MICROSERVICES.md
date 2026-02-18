# 后端微服务拆分与方案（简化为“百科 + 图文帖子”）

## 1. 总原则（延续现有 CICD/架构）

- 统一入口：`https://api-<env>.chekkk.com` → `backend-gateway-saas`
- 路由约定：`/api/<svc>/...`；健康：`/api/<svc>/healthz`；文档：`/api/<svc>/openapi.json`
- 鉴权：网关调用 `backend-auth-saas` 的 `/v1/validToken`（双通行证）校验用户 `sid_at`，通过后向下游注入身份头
- 服务仅信任网关注入的身份头（禁止浏览器直连服务）
- 每个微服务独立仓库、独立 CI、独立 DB（MVP 可同实例不同 schema）

用户体系：

- OpenAPI：`https://api-dev.chekkk.com/api/auth/openapi.json`
- 代码：`/Users/jasonhong/Desktop/CICD/backend-auth-saas`【已有的微服务，轻易不要变动】

CICD/规范：

- `/Users/jasonhong/Desktop/开发项目/ops-bootstrap/skills/chekdata-rd-guide/reference/研发使用指南-后端.md`
- `/Users/jasonhong/Desktop/开发项目/ops-bootstrap/skills/chekdata-rd-guide/reference/研发使用指南-网关与OpenAPI.md`

## 2. 服务拆分（P0，最小可跑通）

P0 先上 3 个服务（不包含既有 auth/gateway）：

1) `chaoke-content`：**百科（Wiki）+ 图文帖子（Post）** + 标签体系 + 审核流 + 志愿者认证 + 供需对接动作  
2) `chaoke-ai`：AI 向导/AI 查价（只引用可追溯事实：已发布百科 + 已核实举报帖）  
3) `chaoke-media`：证据上传/存储/鉴权下载（默认私有）  

> 后续扩展（P1/P2）如增长到需要拆分，再把 `chaoke-content` 按边界拆成：
> - `chaoke-wiki`（百科/版本/审核）
> - `chaoke-post`（帖子/供需动作/举报流）
> - `chaoke-moderation`（审核后台/处置）
> 但 P0 不建议过早拆分。

## 3. chaoke-content（百科 + 图文帖子）

### 3.1 职责边界

- **Wiki（百科）**
  - 词条创建/编辑/提交审核/发布（P0 重点是“价格基准/避坑、服务点/集合点”）
  - 标签（多标签）与关联（词条 ↔ 词条）
  - 时间线/地图不作为独立业务：只是“对带时间字段/坐标字段的词条做聚合查询”的视图
- **Post（图文帖子）**
  - 发帖/删帖/下架/举报
  - 目标：**像小红书一样“统一发帖”**——前后端尽量只依赖一套字段与一套渲染组件；差异主要用 `tags + cards(信息卡片) + availableActions(后端下发动作)` 表达。
  - 帖子模板 `type`（P0 最小集合；用于权限/状态机/运营统计，不鼓励前端按 type 写大量分支）：
    - `RIDE_OFFER`：接送供给帖（志愿者）
    - `RIDE_REQUEST`：接送需求帖（游客）
    - `PRICE_REPORT`：价格举报帖（物价/房价/车价）
    - `PRICE_QUESTION`：价格求证帖（AI 兜底入口/社区求证）
    - （可选）`GENERAL`：经验分享/避坑贴（不带动作也可发）
  - 供需动作：match/claim/cancel/complete/no_show（动作带审计；**由后端返回 `availableActions`，前端只渲染按钮**）
  - 审核流：`PRICE_REPORT` 必走；其它帖子可按需抽查
- **志愿者体系（P0）**
  - 志愿者申请/审核/状态（PENDING/APPROVED/REJECTED/SUSPENDED）
  - 认证后才能发 `RIDE_OFFER`、认领 `RIDE_REQUEST`
- **风控与审计（P0）**
  - 爽约规则：游客爽约 2 次→7 天禁用；志愿者爽约 2 次→14 天禁用 + 人工复核
  - 频控：发帖/动作/查询按 userOneId+IP
  - 审计：所有关键动作落 `action_log`（可追溯）

### 3.2 核心数据表（建议）

- Wiki
  - `wiki_entry`（含 `entry_type`、`content_struct_json`、`lng/lat`、`start_at/end_at`、`status`）
  - `wiki_entry_version`（从一开始就建议有）
  - `tag`、`wiki_entry_tag`
- Post
  - `post`（建议一张表承载全部帖子；差异字段放结构化 JSON）
    - 推荐核心列：`type/title/body/summary/tags_json/cards_json/location_json/occurred_at/linked_wiki_entry_ids_json`
    - 状态拆分更利于统一渲染：`visibility_status + moderation_status + fulfillment_status`
    - SEO/GEO 相关：`is_public/is_indexable/seo_json/published_at/updated_at`
  - `post_tag`
  - `post_media`（关联 `media_object_id`）
  - `post_action_log`（match/claim/cancel/complete/no_show…）
  - `moderation_task`、`moderation_action`
- Volunteer & Risk
  - `volunteer_profile`（敏感字段加密，仅审核员可见）
  - `no_show_counter`（按窗口累计）
- 可引用事实（给 AI 用，P0 推荐做成读模型）
  - `price_ref`（来源=已发布百科价格基准/已核实价格举报帖）

### 3.3 API（建议）

Wiki（公开读取，写入需鉴权）：

- `GET /v1/wiki/entries?query&tags&entryType`
- `GET /v1/wiki/entries/{id}`
  - （为 SEO/静态站建议补充）`GET /v1/wiki/entries/bySlug/{slug}`

Post（公开读取可选；写入/动作需鉴权）：

- `GET /v1/posts?type&tags&status&nearby`
- `GET /v1/posts/{id}`
- `POST /v1/posts`（发帖：RIDE_REQUEST/PRICE_REPORT/PRICE_QUESTION；RIDE_OFFER 需要志愿者）
- `GET /v1/me/posts`

供需动作（后端硬校验爽约/权限）：

- `POST /v1/posts/{id}:match`（游客对供给帖发起匹配）
- `POST /v1/posts/{id}:claim`（志愿者认领需求帖）
- `POST /v1/posts/{id}:cancel`
- `POST /v1/posts/{id}:complete`
- `POST /v1/posts/{id}:noShow`（仅审核员/系统判定触发；避免用户互相乱点）

志愿者：

- `POST /v1/volunteer/apply`
- `GET /v1/volunteer/me`

审核员/管理员（P0 最小后台接口）：

- `GET /v1/mod/posts?type=PRICE_REPORT&status=PENDING`
- `POST /v1/mod/posts/{id}:verify`
- `POST /v1/mod/posts/{id}:requestMoreEvidence`
- `POST /v1/mod/posts/{id}:reject`
- `POST /v1/mod/volunteers/{userOneId}:approve|reject|suspend`

派生视图（为时间线/地图预留，P0 可先返回空/仅服务点）：

- `GET /v1/views/timeline?tags&dateRange`
- `GET /v1/views/map?tags&bbox`

给 AI 的读接口（强建议只返回“可引用事实”）：

- `GET /v1/priceRefs/search?query&location&timeRange`

面向 SEO/GEO 静态站（P0 推荐做成“公开只读 + 强缓存 + 可增量拉取”）：

- `GET /v1/public/ssg/wiki?updatedAfter&cursor`（只返回 `PUBLISHED` + 必要字段：`slug/updatedAt/seo/title/summary/contentStruct`）
- `GET /v1/public/ssg/posts?updatedAfter&cursor`（只返回 `isPublic && isIndexable` 的帖子）
- `GET /v1/public/ssg/tags?updatedAfter&cursor`（返回 `tagSlug/updatedAt`，用于标签聚合与 sitemap）

> 也可以不单独做 `/public/ssg/*`，直接在 `GET /v1/wiki/entries` / `GET /v1/posts` 支持 `status/isIndexable/updatedAfter/cursor` 这些参数；关键是保证“静态生成可增量”。

### 3.4 统一数据契约（API JSON v1，供前端/静态站使用）

约定：

- API JSON 字段使用 `camelCase`；DB 字段使用 `snake_case`
- 前端尽量只依赖“统一字段 + cards + availableActions”，减少按类型分支

`Post`（核心字段，示意）：

```ts
type Post = {
  postId: string
  type: 'RIDE_OFFER' | 'RIDE_REQUEST' | 'PRICE_REPORT' | 'PRICE_QUESTION' | 'GENERAL'
  title?: string
  body: string
  tags: string[]
  location?: { name?: string; lng?: number; lat?: number }
  occurredAt?: string
  linkedWikiEntryIds?: string[]
  media: Array<{ mediaObjectId: string; kind: 'IMAGE' | 'VIDEO' | 'AUDIO' }>
  cards?: Array<{
    title?: string
    items: Array<{ key: string; label: string; value: string; unit?: string }>
  }>
  state: {
    visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE'
    moderation: { status: 'NONE' | 'PENDING' | 'NEED_MORE_EVIDENCE' | 'VERIFIED' | 'REJECTED' }
    fulfillment: { status: 'NONE' | 'OPEN' | 'MATCHED' | 'CLAIMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' }
  }
  availableActions: Array<'MATCH' | 'CLAIM' | 'CANCEL' | 'COMPLETE' | 'ADD_EVIDENCE' | 'REPORT_ABUSE'>
  createdAt: string
  updatedAt: string
}
```

`WikiEntry`（核心字段，示意）：

```ts
type WikiEntry = {
  entryId: string
  slug: string
  title: string
  summary?: string
  tags: string[]
  entryType: 'PRICE_BASELINE' | 'RISK_TIP' | 'SERVICE_POINT' | 'OTHER'
  contentStruct: unknown // 结构化正文（段落/列表/表格等），利于渲染与引用
  location?: { name?: string; lng?: number; lat?: number }
  startAt?: string
  endAt?: string
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED'
  publishedAt?: string
  updatedAt: string
}
```

> `contentStruct` 结构化的目的：同时满足 App 渲染、SEO 语义化 HTML、以及 GEO（生成式搜索）“可引用块”的稳定抽取。

## 4. chaoke-ai（AI 向导/查价）

### 4.1 职责边界（P0）

- AI 查价/问答：只允许引用 `chaoke-content` 提供的：
  - 已发布百科（价格基准/避坑/服务点等）
  - 已核实价格举报帖（通过 `price_ref` 读模型暴露）
- 强制结构化输出 + 强兜底（无引用必须明确不确定，并引导发“求证/举报帖”）
- 会话记录（用于质检、满意度、兜底率统计）

### 4.2 核心数据表（建议）

- `ai_session`
- `ai_message`
- `ai_rating`
- （可选）`ai_retrieval_log`（记录命中来源与引用链路）

### 4.3 API（建议）

- `POST /v1/priceQuery`（结构化输出：price_range + citations + tips + fallback_action）
- `POST /v1/chat`（可扩成通用向导）
- `POST /v1/chat/{sessionId}:rate`

内部依赖（只读）：

- `GET /api/chaoke-content/v1/wiki/entries?...`
- `GET /api/chaoke-content/v1/priceRefs/search?...`

### 4.4 安全边界

- 不允许“模型自由发挥给价格”：无引用则必须返回 `uncertain=true`
- 频控：按 userOneId + IP
- 可观测：记录引用命中率、兜底率、Top 问题

## 5. chaoke-media（证据上传）

### 5.1 职责边界

- 统一的 presign 上传（图片/视频/音频）
- 默认私有对象；按业务引用关系做鉴权下载
- 统一做“脱敏提示/水印（后置）/审计”

### 5.2 API（建议）

- `POST /v1/uploads:presign`（返回 putUrl + mediaObjectId）
- `GET /v1/media/{id}`（带鉴权的下载/临时访问 URL）

## 6. 服务间契约（P0）

P0 尽量避免引入 MQ，先用同步调用或“写入同库读模型”：

- `chaoke-ai` ← `chaoke-content`: wiki + price_ref 检索（只读）
- `chaoke-content` ← `chaoke-media`: 证据引用（只存 `media_object_id`）

## 7. 鉴权与权限（落地要点）

- 前端只持有用户 token（`sid_at`），所有业务请求都走网关
- 网关负责：
  - 校验 `sid_at`
  - 向下游注入 `userOneId/clientId/applicationId/isAdmin/...`
- 业务服务负责：
  - 在自身 DB 里维护“产品角色状态”（志愿者是否认证、审核员名单、封禁等）
  - 做硬校验（例如志愿者发 `RIDE_OFFER`、认领 `RIDE_REQUEST` 必须 APPROVED）
