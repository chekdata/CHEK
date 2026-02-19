# 前端方案（P0：Next.js H5，一体化 SEO/GEO）

## 0. 目标（对齐你的诉求）

1) **MVP 极简**：先把一个真正能用的“百科 + 论坛”跑通：**有知（Wiki）+ 相辅（帖子+评论）**。  
2) **帖子交互像小红书**：只做发帖 + 评论（可加点赞/收藏为后续，不做私信、不做匹配/接单等复杂流程）。  
3) **信息卡片不做功能**：后端不另设 `cards` 字段、不做卡片编辑器；仅把“卡片”当作**正文 `body` 里的可选结构化块**（解析与渲染属于前端展示能力）。  
4) **SEO + GEO**：公共内容 URL 直接输出语义化 HTML（SSR/SSG/ISR + JSON-LD），方便搜索引擎与生成式搜索抓取与引用。  
5) **未来兼容 A2UI**：React 前端可加一层 A2UI renderer（allowlist 组件），用于 AI 页/动态模块；不影响 SEO 页面输出。

> 后端契约以 `/Users/jasonhong/Desktop/CHEK/docs/BACKEND_MICROSERVICES.md` 为准；本文关注 H5 架构与前端落地。

## 0.1 线上部署形态（建议）

- H5 主站域名：`https://chaoshan.chekkk.com`（根路径 `/`）
- SEO/GEO 页：直接在 Next.js 输出语义化 HTML（SSR/SSG/ISR + JSON-LD）
- `basePath`：默认不用；如未来需要挂载到子路径，再启用 `CHEK_BASE_PATH`

## 1. H5 技术选型（建议）

- 框架：Next.js（App Router；SSR/SSG/ISR）
- 语言：TypeScript + React
- UI：自研轻量组件（Liquid Glass 全局样式 + 组件化），避免引入过重 UI 框架（MVP 更快落地）
- 内容渲染：Markdown（`body`）+ 自定义 block 解析（把正文里的“信息卡片块”渲染成卡片）
- 请求层：统一 `Authorization: Bearer <sid_at>` 与错误处理（可复用你已有 request 封装思路）
- 登录体系：直接对接 `backend-auth-saas`（见 auth OpenAPI）

> 如果未来要小程序：再做一个 Taro 壳即可；**H5 主站建议一直用 Next.js**，因为 SEO/GEO 需求基本无法用纯 SPA 稳定满足。

## 2. 路由与渲染策略（SSR/SSG/ISR）

### 2.1 公共可索引页（SEO/GEO 重点）

这些页面要“打开即有完整 HTML”，建议 SSG/ISR（内容变更自动再生）：

- `/wiki/[slug]`（百科详情：结构化正文 + 相关引用）
- `/tag/[tagSlug]`（标签聚合：置顶百科 + 精选/可引用内容）
- `/p/[postId]`（帖子内容页：仅 `isPublic && isIndexable` 才输出/索引）
- `/letter`（致旅客的一封信：静态欢迎/道歉页）
- `/sitemap.xml`、`/robots.txt`

数据拉取建议：为 ISR/静态生成准备“公开只读 + 强缓存 + 可增量”的接口（例如 `chek-content` 的 `/v1/public/ssg/*`），避免构建时全量扫库。

### 2.2 强交互页（登录后/写操作）

这些页可以 CSR 为主（但仍跑在 Next.js 同一站点里）：

- `/feed`（相辅：帖子流）
- `/post/new`（相辅：发帖）
- `/wiki/new`、`/wiki/[slug]/edit`（有知众包创建/编辑）
- `/me`（胶己：我的）
- （可选，P1）`/ai`（AI来）
- （可选，P1）`/timeline`（劳热：时间线视图）
- （可选，P1）`/map`（辣辣嗦：地图视图）

首页欢迎（P0 必做）：

- 首次注册/首次登录后：进入 `/feed` 弹出欢迎弹窗（真诚道歉 + “打开看看”跳转 `/letter`）。
- `/feed` 顶部常驻 Banner：点击同样跳转 `/letter`。

## 3. 统一发帖：信息卡片写进正文（后端不另设字段）

核心约束：**后端只存 `body`**（建议 Markdown）；MVP 不开发“信息卡片”独立功能，只在前端做“可选解析渲染”。

### 3.1 Post 字段（建议最小依赖）

- `postId`
- `title?`
- `body`（Markdown；可包含“信息卡片块”）
- `tags[]`
- `location?`（name/lng/lat）
- `occurredAt?`
- `media[]`
- `isPublic/isIndexable`（用于 SEO 输出控制；MVP 可默认 `true`）
- `createdAt/updatedAt`

### 3.2 正文里的“信息卡片块”约定（前端解析渲染）

推荐用 Markdown fenced code（后端当普通正文存储，不解析；**MVP 不做卡片编辑器**，只是可选解析渲染）：

````md
今天在古城这边遇到的情况如下……

```chek-card
{
  "title": "行程信息",
  "items": [
    { "label": "起点", "value": "汕头站" },
    { "label": "终点", "value": "牌坊街" },
    { "label": "时间窗", "value": "10:00–12:00" },
    { "label": "人数", "value": "2" }
  ]
}
```
````

前端发帖页用表单让用户填写，最终把结构化内容“编译进 body”；详情页/静态页渲染时把该 block 转成卡片（`<section><dl>...</dl>`），同时可把关键字段写入 JSON-LD，提升 GEO 可引用性。

### 3.3 评论（MVP 必做）

- 帖子详情页包含评论区（列表 + 输入框）
- 评论支持 @回复 可后置；MVP 先做“纯评论”即可

### 3.4 发帖媒体交互（对齐小红书风格）

- 先本地选择多图/视频并预览（不自动上传）
- 支持上移/下移（封面在首位）、移除、失败重试
- 点击“上传所选”或“发布”时一次性批量上传

## 4. SEO + GEO 输出规范（Next.js 页面对齐）

- 语义化 HTML：`<article><header><h1>...`，分级标题（H2/H3）清晰
- meta：`title/description/canonical/og:*`
- 结构化数据（JSON-LD）：`Article` / `BreadcrumbList`（视内容可补 `FAQPage/HowTo`）
- 固定“可引用块”（建议所有 Wiki/可引用帖子都包含）：
  - **结论/价格区间（若有）**
  - **依据来源**（百科段落/核实信息，带时间与地点）
  - **风险提示/注意事项**
  - **更新时间/核实时间**

## 5. A2UI 兼容策略（现在不强依赖，未来可接）

- **用法边界**：A2UI 更适合 AI 页/动态模块的 UI 描述；SEO 页仍以 Next.js 直接输出 HTML 为准。
- **前端准备**：把 UI 组件做成可枚举的 primitives（Card/List/Badge/Button/Citation…），并实现 A2UI renderer（组件 allowlist + 属性校验 + XSS 防护）。
- **后端/AI 准备**：AI 接口可在现有 JSON 结果上增补 `ui`（A2UI tree），前端优先渲染 `ui`，否则 fallback 到原有结构化渲染。

## 6. API 对接约定（前端）

### 6.1 Auth（复用现有）

- `POST /api/auth/v1/wechat/login`
- `POST /api/auth/v1/sms/send`
- `POST /api/auth/v1/accounts/smsLogin`
- `GET /api/auth/v1/userInfo`
- `GET /api/auth/v1/logout`

请求头：`Authorization: Bearer <sid_at>`

### 6.2 CHEK 业务 API（P0）

建议前端只认网关前缀：

- Content（有知+相辅）：`/api/chek-content/v1/...`
- Media：`/api/chek-media/v1/...`
- （可选，P1）AI：`/api/chek-ai/v1/...`

> 具体接口与字段契约见：`/Users/jasonhong/Desktop/CHEK/docs/BACKEND_MICROSERVICES.md`

## 7. 性能与埋点（P0）

- 最小埋点：
  - 相辅：发帖成功率、评论成功率、阅读完成率
  - 有知：搜索转化（搜索→进入词条）、词条收藏/分享（可后置）
- 性能目标：
  - 首屏 ≤ 2s：`/feed`、`/wiki/*`、`/tag/*`
  - （可选，P1）AI来 首次响应 ≤ 3s：超时提示“稍后再试”
