# 本地 DEV 联调（前后端 + Auth）

## 1) 一键启动（推荐）

```bash
bash /Users/jasonhong/Desktop/CHEK/scripts/dev-up.sh
```

启动后访问：

- H5：`http://localhost:3000`
- Dev Gateway：`http://localhost:8787`

> Dev Gateway 的作用：在本地模拟网关最关键能力，把 `/api/<svc>/...` 路由到本地微服务端口，并用 `Authorization: Bearer <sid_at>` 去 auth-saas 拉 `userInfo`，把 `userOneId` 注入成 `X-User-One-Id`，这样本地也能跑通“发相辅/评论”等写接口。

关闭：

```bash
bash /Users/jasonhong/Desktop/CHEK/scripts/dev-down.sh
```

日志：

- `/Users/jasonhong/Desktop/CHEK/.logs`

## 2) 联调验收清单（MVP）

- 游客可浏览：相辅列表 / 相辅详情 / 有知列表 / 有知详情 / 标签页 / 搜索
- 登录后可用：发相辅、评论（无私信/无匹配）
- 首页存在：
  - Banner → 跳转「致旅客的一封信」
  - 首次登录后弹窗 → 跳转「致旅客的一封信」

## 3) 云端 MySQL/Redis（准备方式）

后端默认用 H2（本地即可跑通）。如果要改成云端 MySQL/Redis：

1. 在每个服务目录复制 `.env.example` 为 `.env.local`（不要提交，已被 `.gitignore` 忽略）
2. 填入 `DB_URL/DB_UID/DB_PWD`（以及 Redis 相关变量）
3. 重新执行 `scripts/dev-up.sh`（会自动 `source` 各服务目录下的 `.env.local`）

`flyway` 会在启动时自动建表/升级表（表名已做 `chek_*` 前缀隔离）。
