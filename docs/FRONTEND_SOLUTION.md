# 前端方案（P0：百科 + 统一图文帖子）

## 0. 重新规划的目标（对齐你的诉求）

1) **帖子一致性**：不同类别帖子尽可能“同一套壳”，像小红书发帖一样（同一套列表卡/详情页/发帖表单）。  
2) **字段一致性**：前后端只依赖一套 `Post` schema；差异用 `tags + cards(信息卡片) + availableActions(后端下发动作)` 表达，尽量避免“按类型写一堆 if”。  
3) **SEO + GEO**：Wiki / 标签聚合页 / 已核实内容可生成**静态 HTML**（语义化结构 + 结构化数据），方便搜索引擎与生成式搜索抓取与引用。

> `Post/Wiki` 的后端契约建议以 `/Users/jasonhong/Desktop/CHEK/docs/BACKEND_MICROSERVICES.md` 中的“统一数据契约”章节为准；本文只讲前端落地方式与页面结构。

## 1. 前端形态：App（交互）+ SEO 站（静态）

### 1.1 App（给真实用户操作：发帖/互动/认证/审核）

优先沿用你现有可复用资产：`/Users/jasonhong/Desktop/开发项目/website/frontend-app-main`。

- 框架：Taro（H5 优先；后续可扩小程序）
- 语言：TypeScript + React
- UI：NutUI（移动端）
- 请求层：复用 `src/utils/request.ts`（统一 `Authorization: Bearer <sid_at>` 与错误处理）
- 登录体系：直接对接 `backend-auth-saas`（见 auth OpenAPI）

### 1.2 SEO/GEO Web（给爬虫/外链：只读、可静态化）

原因：Taro H5 典型是 SPA，天然不利于 SEO；而 P0 的“百科/核实信息/标签聚合”非常适合静态化。

P0 只做三件事（越小越好）：

- **只读内容站**：Wiki 详情、标签聚合页、服务点/地点落地页、（可选）已核实价格举报帖详情
- **静态输出**：build 时拉取增量内容 → 生成静态 HTML → 部署到 CDN（附带 `sitemap.xml` / `robots.txt`）
- **统一 URL**：与 App 的内容 ID 一致，避免两套数据：`/wiki/:slug`、`/tag/:tagSlug`、`/p/:postId`

技术建议（二选一）：

- Next.js：React 生态成熟，支持 SSG/ISR、SEO meta 处理方便
- Astro：更轻更偏内容站，适合“纯静态 + 少量交互”

> SEO 站尽量不承载登录/发帖/复杂交互；所有“写操作”继续留在 App 里，降低复杂度与风控面。

## 2. 信息架构（P0）

整体只保留两套内容体系：

- **图文帖子（Post）**：统一发帖（标题/正文/媒体/标签/地点/时间/信息卡片）+ 供需对接/核实进度（通过后端动作与状态呈现）
- **百科（Wiki）**：结构化、可审核、可引用的事实库（价格基准/避坑、服务点等）

P0 导航建议（最简单可用）：

- Tab：`帖子` / `百科` / `AI` / `我的`
- 全局按钮：`+ 发帖`（统一入口；用“标签 + 信息卡片”区分场景，而不是拆多套表单）

时间线/地图在 P0 作为二级视图入口：

- 时间线：从“百科标签页/分类页”进入（聚合 `startAt/endAt`）
- 地图：从“服务点/地点类百科”进入（聚合 `lng/lat`）

## 3. 统一发帖（小红书式，P0 核心）

关键策略：**同一套表单 + 同一套详情布局**，差异只体现在：

1) `tags`（场景/话题）
2) `cards`（信息卡片：可选的结构化字段）
3) `availableActions`（后端下发“你当前能做什么”的动作列表，前端只渲染按钮）

### 3.1 统一字段（所有帖子通用）

- 标题（可选）
- 正文（建议必填）
- 媒体（图/视频/音频）
- 标签（多选）
- 地点（可选）
- 发生时间（可选）
- 信息卡片 `cards`（可选）：同一个组件展示结构化字段（如“起点→终点/人数/金额/日期/证据说明”等）

### 3.2 用标签表达场景（推荐组合，P0）

- 免费接送：`#免费接送` + `#我能接` / `#我需要`
- 价格反馈：`#价格反馈` + `#物价` / `#房价` / `#车价` + `#举报` / `#求证`
- 旅游保障：`#避坑` / `#卫生` / `#服务点` / `#风险提示`

发布成功后的引导统一：同标签流 +（可选）“去百科引用/补充”。

### 3.3 前端渲染原则（减少分支）

- 列表卡：固定布局（作者/时间/地点/正文摘要/媒体缩略图/标签 chips/状态 badge）
- 详情页：固定三段
  1) 正文 + 媒体
  2) 信息卡片 `cards`（有就展示，无则不占位）
  3) 动作区（按钮只读 `availableActions`，例如 `MATCH/CLAIM/ADD_EVIDENCE`）

> 这样“接送/举报/求证/经验分享”在前端都是同一条渲染链路，最大化一致性。

## 4. 路由与页面清单

### 4.1 App（Taro pages，建议）

- `/pages/feed/index`（帖子流：按标签筛选/搜索）
- `/pages/post/detail/index`（帖子详情：统一详情布局 + 动作区）
- `/pages/post/create/index`（统一发帖：图文 + 标签 + 信息卡片）
- `/pages/wiki/index`（百科：搜索/标签/分类）
- `/pages/wiki/detail/index`（百科详情：结构化内容 + 相关帖子嵌入）
- `/pages/tag/index`（标签聚合页：百科+帖子混合流）
- `/pages/timeline/index`（时间线视图）
- `/pages/map/index`（地图视图）
- `/pages/ai/index`（AI 向导/查价：结构化回答+引用+兜底）
- `/pages/auth/index`（登录）
- `/pages/profile/index`（资料）
- `/pages/setting/index`（设置/协议/免责声明）

### 4.2 SEO/GEO Web（静态站，建议路由）

- `/`（站点入口：城市/热门标签/精选百科）
- `/wiki/:slug`（百科详情：结构化正文 + 相关引用）
- `/tag/:tagSlug`（标签聚合页：精选百科 + 已核实内容）
- `/p/:postId`（内容页：仅公开且允许静态化的帖子）
- `/sitemap.xml`（自动生成）
- `/robots.txt`

## 5. SEO + GEO：静态 HTML 产出规范（给爬虫友好）

### 5.1 哪些内容进入静态站（P0 推荐）

- Wiki：`PUBLISHED` 才输出
- Post：仅输出“公开 + 可引用”的内容（例如：已核实价格举报、运营精选经验贴）

### 5.2 页面结构（SEO）与“可引用块”（GEO）

- 语义化 HTML：`<article><header><h1>...`，分级标题（H2/H3）清晰
- meta：`title/description/canonical/og:*`（分享图可用首图或默认封面）
- 结构化数据（JSON-LD）：`Article` / `BreadcrumbList`（Wiki 可补 `FAQPage`/`HowTo` 视内容而定）
- “可引用块”建议固定组件：
  - **结论/价格区间（若有）**
  - **依据来源**（百科段落/核实帖，带时间与地点）
  - **风险提示/注意事项**
  - **更新时间/核实时间**

> 这样不仅利于 SEO，也更利于生成式搜索/AI 在回答时“引用得出来、引用得准确”。

## 6. API 对接约定（前端）

### 6.1 Auth（复用现有）

- `POST /api/auth/v1/wechat/login`
- `POST /api/auth/v1/sms/send`
- `POST /api/auth/v1/smsLogin`
- `GET /api/auth/v1/userInfo`
- `GET /api/auth/v1/logout`

请求头：`Authorization: Bearer <sid_at>`

### 6.2 Chaoke 业务 API（P0）

建议前端只认网关前缀：

- Content（百科+帖子）：`/api/chaoke-content/v1/...`
- AI：`/api/chaoke-ai/v1/...`
- Media：`/api/chaoke-media/v1/...`

> 具体接口清单与字段契约见：`/Users/jasonhong/Desktop/CHEK/docs/BACKEND_MICROSERVICES.md`

## 7. 可复用页面/组件盘点（从 frontend-app-main 迁移）

可“直接拿来改品牌/文案/跳转”的页面：

- 登录页：`/Users/jasonhong/Desktop/开发项目/website/frontend-app-main/src/pages/auth/index.tsx`
- 手机号相关：`/Users/jasonhong/Desktop/开发项目/website/frontend-app-main/src/pages/phoneLogin/`、`/Users/jasonhong/Desktop/开发项目/website/frontend-app-main/src/pages/phoneVerify/`
- 个人资料：`/Users/jasonhong/Desktop/开发项目/website/frontend-app-main/src/pages/profile/`
- 我的/设置/协议：`/Users/jasonhong/Desktop/开发项目/website/frontend-app-main/src/pages/my/`、`/Users/jasonhong/Desktop/开发项目/website/frontend-app-main/src/pages/setting/`、`/Users/jasonhong/Desktop/开发项目/website/frontend-app-main/src/pages/userAgreement/`
- 请求封装：`/Users/jasonhong/Desktop/开发项目/website/frontend-app-main/src/utils/request.ts`

需要新写（P0 新业务）：

- 帖子流/帖子详情/统一发帖（含接送供需、价格举报/求证）
- 百科列表/详情（含“相关帖子嵌入”）
- AI 查价聊天页（重点是“引用卡片 + 强兜底”）
- SEO/GEO 静态站（只读页 + sitemap）

## 8. 性能与埋点（P0）

- 最小埋点：
  - 接送：曝光 → 匹配/认领 → 完成/取消；爽约次数
  - 举报：发帖 → 补证 → 核实通过；处理时长
  - AI：提问类型、引用命中率、满意度、兜底率
- 性能目标：
  - 首屏 ≤ 2s：帖子流、百科列表、发帖表单
  - AI 首次响应 ≤ 3s：超时提示“稍后再试/先发求证/举报”
