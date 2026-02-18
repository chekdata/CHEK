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

- `CHEK_API_BASE_URL`：API 网关 origin（例如 `https://api-dev.chekkk.com`）。也可留空，前端会把 `/api/*` 通过 Next.js rewrites 代理到 dev 网关。
