# frontend-chek

前端工程（Next.js H5：SSR/SSG/ISR，满足 SEO/GEO）。

文档：

- 方案：`/Users/jasonhong/Desktop/CHEK/docs/FRONTEND_SOLUTION.md`
- 设计 Prompts：`/Users/jasonhong/Desktop/CHEK/docs/FRONTEND_DESIGN_PROMPTS.md`

## 本地开发

安装依赖：

```bash
npm i
```

启动：

```bash
npm run dev
```

环境变量：

- `CHEK_API_BASE_URL`：API 网关 origin（例如 `https://api-dev.chekkk.com`；本地推荐 `http://localhost:8787` 即 `chek-dev-gateway`）。前端对浏览器侧的 `/api/*` 使用 Next.js Route Handler（`src/app/api/[...path]/route.ts`）做运行时代理。
- `CHEK_SITE_URL`（或 `NEXT_PUBLIC_SITE_URL`）：站点公开 URL（例如 `https://chaoshan.chekkk.com`），用于 canonical/OG/Twitter 与 sitemap 生成。
- `CHEK_BASE_PATH`（或 `NEXT_PUBLIC_CHEK_BASE_PATH`）：可选，站点挂载到子路径时使用（例如 `/chek`）。
