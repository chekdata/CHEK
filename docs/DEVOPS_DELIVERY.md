# CICD / GitOps / OpenAPI 交付规范（按 chekdata 指南）

> 本文只摘取与 Chaoke 新服务落地相关的“最短可执行路径”，完整规范见：
> - `/Users/jasonhong/Desktop/开发项目/ops-bootstrap/skills/chekdata-rd-guide/reference/研发使用指南-前端.md`
> - `/Users/jasonhong/Desktop/开发项目/ops-bootstrap/skills/chekdata-rd-guide/reference/研发使用指南-后端.md`
> - `/Users/jasonhong/Desktop/开发项目/ops-bootstrap/skills/chekdata-rd-guide/reference/研发使用指南-网关与OpenAPI.md`

## 0. P0 服务清单（建议）

- `chaoke-content`：`/api/chaoke-content/**`
- `chaoke-ai`：`/api/chaoke-ai/**`
- `chaoke-media`：`/api/chaoke-media/**`

## 1. 分支与环境映射

- `dev` → Dev 环境
- `staging` → Staging 环境
- `main`（打 `vX.Y.Z` tag）→ Prod 环境

禁止 `latest` 镜像标签。

## 2. 后端服务模板

新微服务建议直接复用 ops-bootstrap 的 GitHub Actions 模板：

- `templates/actions/microservice/ci-gitops-full.yml`

标准链路：

Push/PR → build/test → trivy/gitleaks → push VECR → repository_dispatch → ops-bootstrap 更新 GitOps manifests → ArgoCD 同步部署。

镜像仓库：

- `chek-images-cn-beijing.cr.volces.com/<env>/<service>:<tag>`

## 3. 网关接入

按约定提供：

- `/healthz`
- `/openapi.json`

并在网关中添加路由：

- `/api/<svc>/**` → `http://<svc>.<namespace>.svc.cluster.local:80`
- 需要同时把 `/api/<svc>/openapi.json` 透传到服务 `/openapi.json`

## 4. OpenAPI

每个服务要能稳定导出 OpenAPI 文件（4010 openapi profile，关闭外部依赖），并通过统一 workflow 同步到文档系统。

## 5. 密钥与配置

- 密钥不进仓库（gitleaks 会阻断 CI）
- 以 Secret 注入到 Pod；CI 只引用 `secrets`/`vars`，不在日志输出明文
