# backend-chek-content

CHEK 内容服务（MVP：有知 Wiki + 相辅 Post + 评论 Comment + 标签 + 搜索 + SEO/SSG 公共只读接口）。

## 本地运行

> 不要把真实密码写进仓库；建议用 `.env.local`（已在根 `.gitignore` 忽略）注入环境变量。

必需环境变量（连远端 MySQL/Redis 时）：

- `DB_URL`（例如：`jdbc:mysql://<host>:3306/core_user?useUnicode=true&characterEncoding=utf-8&useSSL=false&allowPublicKeyRetrieval=true`）
- `DB_UID`
- `DB_PWD`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`

启动：

```bash
mvn spring-boot:run
```

健康检查：

- `GET http://localhost:8081/healthz`
- `GET http://localhost:8081/openapi.json`
