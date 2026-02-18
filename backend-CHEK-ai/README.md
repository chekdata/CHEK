# backend-chek-ai

CHEK AI 服务（P1：AI来；引用有知与公开相辅；可选返回 `ui`=A2UI tree）。

## 本地运行

```bash
mvn spring-boot:run
```

健康检查：

- `GET http://localhost:8082/healthz`
- `GET http://localhost:8082/openapi.json`

依赖：

- `CHEK_CONTENT_BASE_URL`：内容服务地址（默认 `http://localhost:8081`）
