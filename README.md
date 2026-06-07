# 城市探秘

城市探秘是一个全国性城市实景互动游戏平台。用户购买剧本后，根据 GPS 定位在真实城市中完成任务节点，通过打卡、答题、拍照、扫码等方式推进剧情，最终通关并获得身份卡/证书。

当前策略为 H5 先验证，再扩展到微信小程序和 App。V1 先用重庆 S1《雾都失落档案》验证付费、完赛率、线下体验和分享意愿。

## 当前范围

- 玩家端 H5 MVP
- 后端 NestJS API
- Admin 后台基础 CRUD
- 重庆 S1 单路线闭环
- 开发模式模拟登录、模拟支付、模拟照片/QR/GPS 通过
- 今日城市事件 Lite：限时事件、随机任务、玩家身份、神秘信封占位

## 目录

- `apps/api`: NestJS 后端 API
- `apps/h5`: H5 玩家端
- `apps/miniapp`: Taro 微信小程序预留
- `apps/admin`: React + Ant Design 管理后台
- `packages/shared`: 前后端共享类型预留
- `docs/sql/schema.sql`: MySQL 建表 SQL
- `docs/platform-product-architecture.md`: 平台版产品架构文档
- `docs/mmocg-product-definition.md`: MMOCG 城市行动产品定义
- `docs/mce-creator-engine-v1.md`: MCE 内容创作引擎 V1.0
- `docs/platform-technical-implementation.md`: 平台版技术实施方案
- `docs/s1-fog-lost-archive-mvp.md`: S1《雾都失落档案》MVP 剧情与互动设计
- `docs/city-event-system-mvp.md`: 动态城市事件系统 MVP
- `docs/sql/platform-extension.sql`: 创作者、NPC、分佣结算扩展表草案
- `docs/sql/mce-extension.sql`: MCE 模板库、创作者项目和审核评分扩展表草案

## 本地地址

- H5 玩家端：[http://127.0.0.1:4180/](http://127.0.0.1:4180/)
- API：[http://127.0.0.1:3001/api](http://127.0.0.1:3001/api)
- Swagger：[http://127.0.0.1:3001/api/docs](http://127.0.0.1:3001/api/docs)
- Admin：[http://127.0.0.1:5173/](http://127.0.0.1:5173/)

## 启动

```bash
pnpm install
pnpm --filter @cq-quest/api prisma:generate
pnpm --filter @cq-quest/api seed
pnpm --filter @cq-quest/api build
pnpm --filter @cq-quest/h5 dev
```

## 产品原则

V1 只做能验证商业闭环的功能，不开发创作者完整编辑器、商家中心、社区、AI 剧情生成、AR 等重功能。

但架构上保留平台化方向：

- 创作者可配置实景线路剧本
- 平台审核后上线
- 订单按规则分佣
- NPC/商家任务可发布和结算
- 动态城市事件用于持续运营和复访
