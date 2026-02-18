# Chaoke Docs

## 0. 需求

- PRD：`/Users/jasonhong/Desktop/CHEK/docs/PRD.md`

## 1. 产品结构（简化版）

整体只保留两套内容体系：

- **百科（Wiki）**：结构化、可审核、可被引用的“事实库”（习俗/地点/风险提示/价格基准等都可以作为百科的一部分，用标签分类）。
- **图文帖子（Post）**：用于供需对接与即时信息（志愿服务、价格举报、求证、避坑分享等），可绑定百科词条或标签。

在这两套内容之上派生能力：

- **时间线**：一个页面，把“带时间字段/事件属性”的百科按时间组合展示。
- **地图**：一个页面，把“带地理坐标/点位属性”的百科（以及可选的帖子）在地图上展示。
- **AI 向导**：基于“已审核百科 +（可控引用的）帖子”做问答与查价，并强制引用与兜底。

## 2. MVP（P0 先做）

P0 仍然聚焦三件事，但全部落在“百科 + 帖子”模型里：

1) **免费接送供需对接**：用“帖子（供给/需求）+ 认领/预约动作”实现闭环  
2) **价格举报（物价/房价/车价）**：用“价格举报帖子”承载，并可沉淀为“百科价格基准/风险提示”  
3) **AI 查价（物价/房价/车价）**：只引用“百科价格基准 + 已核实举报帖子”，否则必须明确不确定并引导发帖求证/举报  

详见：`/Users/jasonhong/Desktop/CHEK/docs/MVP_P0_PRICE_RIDE_AI.md`

## 3. 前端方案

详见：`/Users/jasonhong/Desktop/CHEK/docs/FRONTEND_SOLUTION.md`
  
页面设计 Prompts：`/Users/jasonhong/Desktop/CHEK/docs/FRONTEND_DESIGN_PROMPTS.md`

## 4. 后端微服务方案

详见：`/Users/jasonhong/Desktop/CHEK/docs/BACKEND_MICROSERVICES.md`

## 5. 接入与交付规范

- Auth/Gateway 接入：`/Users/jasonhong/Desktop/CHEK/docs/INTEGRATION_AUTH_GATEWAY.md`
- CICD/GitOps：`/Users/jasonhong/Desktop/CHEK/docs/DEVOPS_DELIVERY.md`
