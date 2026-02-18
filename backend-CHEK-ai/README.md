# backend-chek-ai

CHEK AI 服务（P0：价格问答/AI 向导；只引用可追溯事实：已发布百科 + 已核实举报帖）。

## 本地运行

```bash
mvn spring-boot:run
```

健康检查：

- `GET http://localhost:8082/healthz`
- `GET http://localhost:8082/openapi.json`

依赖：

- `CHEK_CONTENT_BASE_URL`：内容服务地址（默认 `http://localhost:8081`）

