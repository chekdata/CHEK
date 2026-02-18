# backend-chek-media

CHEK 媒体服务（P0：图片/视频上传/存储/鉴权下载；同一桶内使用独立前缀与原有数据隔离）。

## 本地运行

```bash
mvn spring-boot:run
```

健康检查：

- `GET http://localhost:8083/healthz`
- `GET http://localhost:8083/openapi.json`

## TOS/S3 说明

默认 `MEDIA_PRESIGN_MODE=mock`（不依赖真实凭证，便于先联调）。

要启用真实 presign：

- `MEDIA_PRESIGN_MODE=s3`
- 配置 `TOS_BUCKET`、`TOS_REGION`
- （可选）`TOS_ENDPOINT`（TOS 兼容 S3 的 endpoint）
- 配置凭证（按你们现有方式：STS/AKSK/IRSA 等；不要写进仓库）

并确保同一个桶里使用独立前缀（例如 `TOS_PREFIX=chek/media/`）与原有数据隔离。
