# 后端微服务拆分与方案（MVP：有知 + 相辅）

## 1. 总原则（延续现有 CICD/架构）

- 统一入口：`https://api-<env>.chekkk.com` → `backend-gateway-saas`
- 路由约定：`/api/<svc>/...`；健康：`/api/<svc>/healthz`；文档：`/api/<svc>/openapi.json`
- 鉴权：网关调用 `backend-auth-saas` 的 `/v1/validToken` 校验用户 `sid_at`，通过后向下游注入身份头
- 服务仅信任网关注入的身份头（禁止浏览器直连服务）

用户体系：

- OpenAPI：`https://api-dev.chekkk.com/api/auth/openapi.json`
- 代码：`/Users/jasonhong/Desktop/CICD/backend-auth-saas`（既有微服务，尽量不动）

## 2. 服务拆分（MVP：不要过度设计）

P0 建议只上 2 个服务（不包含既有 auth/gateway）：

1) `chek-content`：**有知（Wiki）+ 相辅（帖子+评论）+ 标签 + 搜索 + SEO/SSG 公共只读接口**  
2) `chek-media`：图片/视频上传与鉴权下载（可选；如果你想更快，也可以先合到 `chek-content`）  

P1（可选）：

3) `chek-ai`：AI来（问答/总结；强调引用来源；可选返回 `ui`=A2UI tree）

> MVP 只做“wiki + 论坛”即可：相辅交互只保留发帖 + 评论，**不做私信、不做匹配/接单**。

## 3. chek-content（有知 + 相辅）

### 3.1 职责边界

- **有知（Wiki）**
  - 词条读取（公开、可索引）
  - 词条创建/编辑（MVP 先做“登录即共建”，不做复杂工作流）
  - 标签与聚合页（供前端与 SEO/SSG 使用）
- **相辅（Forum）**
  - 发帖/删帖/下架（MVP：发帖 + 评论）
  - 评论（按帖子聚合）
  - 标签与搜索（MVP 可先做简单：按 tags + keyword）
- **SEO/GEO（为 Next.js SSR/ISR 预留）**
  - 按 `slug/postId/tagSlug` 稳定读取
  - 公开只读、强缓存、支持 `updatedAfter` 增量拉取（生成 sitemap/静态页）

### 3.2 核心数据表（建议，MVP 版本）

> 原则：能用优先。不要为了“未来扩展”把表拆得太细。

- Wiki
  - `wiki_entry`
    - `entry_id`
    - `slug`（唯一，给 SEO URL 用）
    - `title`
    - `summary`（可选）
    - `body_md`（Markdown）
    - `tags_json`（或 `wiki_entry_tag` 关联表）
    - `is_public`、`is_indexable`（默认 true）
    - `published_at`、`updated_at`
- Post
  - `post`
    - `post_id`
    - `title`（可选）
    - `body_md`（Markdown；可包含 `chek-card` fenced block；后端不解析）
    - `tags_json`
    - `location_json`（可选：name/lng/lat）
    - `occurred_at`（可选）
    - `is_public`、`is_indexable`（默认 true）
    - `author_user_one_id`
    - `created_at`、`updated_at`
  - `comment`
    - `comment_id`
    - `post_id`
    - `body`（MVP 纯文本即可；也可 Markdown）
    - `author_user_one_id`
    - `parent_comment_id`（可空；MVP 可以先不做回复）
    - `created_at`
  - `post_media`（可选）
    - `post_id`
    - `media_object_id`
    - `kind`（IMAGE/VIDEO）
- Tags（可选）
  - `tag`（用于标准化 tagSlug、热门标签统计）

### 3.3 API（建议）

Wiki（公开读取；写入需鉴权）：

- `GET /v1/wiki/entries?query&tags&cursor`
- `GET /v1/wiki/entries/bySlug/{slug}`
- `POST /v1/wiki/entries`（登录用户可创建）
- `PUT /v1/wiki/entries/{id}`（登录用户可编辑）

Post（公开读取可选；写入需鉴权）：

- `GET /v1/posts?query&tags&cursor`
- `GET /v1/posts/{id}`
- `POST /v1/posts`
- `DELETE /v1/posts/{id}`（作者/管理员）

Comment（写入需鉴权）：

- `GET /v1/posts/{id}/comments?cursor`
- `POST /v1/posts/{id}/comments`
- `DELETE /v1/comments/{id}`（作者/管理员，可后置）

Tags（可选）：

- `GET /v1/tags?query&cursor`

面向 SEO/SSG（公开只读 + 强缓存 + 可增量）：

- `GET /v1/public/ssg/wiki?updatedAfter&cursor`（只返回 `isPublic && isIndexable`）
- `GET /v1/public/ssg/posts?updatedAfter&cursor`
- `GET /v1/public/ssg/tags?updatedAfter&cursor`

### 3.4 统一数据契约（API JSON v1，供前端/静态页使用）

约定：

- API JSON 字段使用 `camelCase`；DB 字段使用 `snake_case`
- 信息卡片不设字段：后端只存 `body`（Markdown），前端可选解析 `chek-card` block

`Post`（示意）：

```ts
type Post = {
  postId: number
  title?: string
  body: string
  tags: string[]
  locationName?: string
  lng?: number
  lat?: number
  occurredAt?: string
  media: Array<{ mediaObjectId: number; kind: 'IMAGE' | 'VIDEO' }>
  authorUserOneId: string
  isPublic: boolean
  isIndexable: boolean
  commentCount: number
  createdAt: string
  updatedAt: string
}
```

正文内信息块（可选；后端不解析）：

````md
```chek-card
{"title":"要点","items":[{"label":"路线","value":"牌坊街→广济桥"}]}
```
````

`Comment`（示意）：

```ts
type Comment = {
  commentId: number
  postId: number
  body: string
  authorUserOneId: string
  createdAt: string
  parentCommentId?: number
}
```

`WikiEntry`（示意）：

```ts
type WikiEntry = {
  entryId: number
  slug: string
  title: string
  summary?: string
  body: string
  tags: string[]
  isPublic: boolean
  isIndexable: boolean
  publishedAt?: string
  updatedAt: string
}
```

## 4. chek-media（上传/存储）

职责边界：

- presign 上传（图片/视频）
- 默认私有对象；按业务引用关系做鉴权下载
- 脱敏提示/审计（MVP 可先做提示 + 基础鉴权）

API（建议）：

- `POST /v1/uploads:presign`（返回 putUrl + mediaObjectId）
- `GET /v1/media/{id}`（鉴权后返回临时访问 URL）

## 5. chek-ai（AI来，P1 可选）

MVP 可以先只做占位页；如果要做：

- 只引用 `chek-content` 的有知词条与公开相辅链接
- 无依据必须明确“不确定”，并引导去搜有知/发相辅
- 可选返回 `ui`（A2UI tree）给前端渲染，但不替代 SEO 页直出 HTML

API（建议，P1）：

- `POST /v1/ai/ask`（输入 `query`，返回 `answer` + `citations`；可选 `ui`=A2UI tree）

## 6. 鉴权与权限（落地要点）

- 前端只持有用户 token（`sid_at`），所有业务请求都走网关
- 网关负责：
  - 校验 `sid_at`
  - 向下游注入 `userOneId/clientId/applicationId/isAdmin/...`
- `chek-content` 负责：
  - 写接口必须登录
  - 删除/下架：作者或管理员
  - Wiki 写入：MVP 先开放登录用户共建（后续再加审核流）
