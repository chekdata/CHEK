# backend-chek-crawler

CHEK 外部投诉帖抓取服务（微博 + 小红书）：

- Playwright 登录态抓取（依赖 `storageState`）
- 每 6 小时跑一次（可用 `CRON` 覆盖）
- 通过 `backend-CHEK-content` 的 `/v1/ingest/externalPosts:upsert` 幂等写入相辅，带 `sourceUrl` 方便跳转

## 环境变量

- `CHEK_CONTENT_BASE_URL`：`chek-content` 服务基址，例如 `http://localhost:8081` 或网关下的 `https://api-dev.../api/chek-content`
- `CHEK_INGEST_TOKEN`：与 `chek-content` 的 `CHEK_INGEST_TOKEN` 保持一致
- `CRON`：默认 `0 */6 * * *`
- `MAX_ITEMS_PER_RUN`：默认 `40`
- `RUN_ONCE`：`true` 时仅跑一轮就退出（推荐用于 K8s CronJob）
- `HEADLESS`：默认 `true`
- `WEIBO_STORAGE_STATE_PATH`：微博登录态 storageState JSON 文件路径
- `XHS_STORAGE_STATE_PATH`：小红书登录态 storageState JSON 文件路径
- `KEYWORDS`：逗号分隔关键词，默认已包含潮汕相关投诉关键词

## 导出登录态（本地一次性操作）

微博：

```bash
node src/export_storage_state.mjs https://weibo.com ./weibo.storage.json
```

小红书：

```bash
node src/export_storage_state.mjs https://www.xiaohongshu.com ./xhs.storage.json
```

> 登录完成后回到终端按回车，会写出 storageState 文件。线上部署建议把该文件放到 Secret / 挂载只读文件。

