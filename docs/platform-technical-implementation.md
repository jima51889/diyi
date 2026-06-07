# 城市探秘平台版技术实施规划

## 1. 目标

本文件把平台版产品架构拆成后端模块、接口边界、后台页面和迭代顺序。

当前原则：

- V1 继续保持玩家端单路线闭环稳定。
- 平台化能力先做数据模型和后台运营能力，再开放给创作者和 NPC 服务者。
- 分佣结算先做账务记录与状态流，不直接接真实打款。

## 2. 后端模块拆分

### 已有模块

- `auth`: 用户登录、管理员登录
- `quests`: 剧本/路线查询
- `orders`: 订单创建、mock 支付
- `game`: 进度、节点验证、通关、证书记录
- `admin`: 管理后台登录、路线 CRUD、节点 CRUD、审核

### V2 新增模块

#### creators

负责创作者入驻与资料管理。

核心接口：

- `POST /api/creators/apply`
- `GET /api/creators/me`
- `PATCH /api/creators/me`
- `GET /api/admin/creators`
- `PATCH /api/admin/creators/:id/review`

核心状态：

- `pending`: 待审核
- `approved`: 已通过
- `rejected`: 已驳回
- `disabled`: 已禁用

#### creator-quests

负责创作者工作台和剧本提交。

核心接口：

- `GET /api/creator/quests`
- `POST /api/creator/quests`
- `PATCH /api/creator/quests/:id`
- `POST /api/creator/quests/:id/submit`
- `GET /api/creator/quests/:id/stats`

规则：

- 创作者只能管理自己的剧本。
- 剧本审核通过前不能上线。
- 已上线剧本的关键字段修改需要重新审核。

#### commissions

负责分佣规则与分佣记录生成。

核心接口：

- `GET /api/admin/commission-rules`
- `POST /api/admin/commission-rules`
- `PATCH /api/admin/commission-rules/:id`
- `GET /api/admin/commission-records`
- `POST /api/admin/commission-records/recalculate`

触发时机：

- 支付成功后生成分佣记录。
- 退款或投诉冻结时更新分佣状态。
- 结算批次生成时锁定可结算金额。

#### settlements

负责创作者和 NPC 的结算记录。

核心接口：

- `GET /api/admin/settlements`
- `POST /api/admin/settlements/batches`
- `PATCH /api/admin/settlements/batches/:id/approve`
- `PATCH /api/admin/settlements/batches/:id/mark-paid`
- `GET /api/creator/settlements`
- `GET /api/npc/settlements`

V2/V3 初期只记录线下打款状态，不直接接支付打款 API。

### V3 新增模块

#### npc

负责 NPC 服务者资料。

核心接口：

- `POST /api/npc/apply`
- `GET /api/npc/me`
- `PATCH /api/npc/me`
- `GET /api/admin/npc-profiles`
- `PATCH /api/admin/npc-profiles/:id/review`

#### npc-jobs

负责 NPC 招募信息发布、报名、接单、派单。

核心接口：

- `GET /api/npc/jobs`
- `GET /api/npc/jobs/:id`
- `POST /api/npc/jobs/:id/apply`
- `GET /api/npc/assignments`
- `POST /api/npc/assignments/:id/checkin`
- `POST /api/npc/assignments/:id/submit`
- `GET /api/admin/npc-jobs`
- `POST /api/admin/npc-jobs`
- `PATCH /api/admin/npc-jobs/:id`
- `PATCH /api/admin/npc-applications/:id/review`
- `PATCH /api/admin/npc-submissions/:id/review`

核心状态：

- 招募任务：`draft`、`recruiting`、`assigned`、`completed`、`cancelled`
- 报名：`pending`、`approved`、`rejected`
- 派单：`assigned`、`checked_in`、`submitted`、`completed`、`rejected`、`settled`

#### risk

负责投诉、冻结、风控记录。

核心接口：

- `POST /api/complaints`
- `GET /api/admin/complaints`
- `PATCH /api/admin/complaints/:id/handle`
- `GET /api/admin/risk-logs`

## 3. 后台页面规划

### 当前后台

- 登录
- 路线管理
- 节点管理

### V2 后台页面

- 创作者列表
- 创作者审核详情
- 剧本审核队列
- 分佣规则
- 创作者分佣记录
- 创作者结算批次

### V3 后台页面

- NPC 服务者列表
- NPC 审核详情
- NPC 招募任务
- NPC 报名审核
- NPC 派单详情
- NPC 完成证明验收
- NPC 佣金结算
- 投诉处理
- 风控记录

## 4. 小程序页面规划

### 玩家端

继续保留：

- 首页
- 路线详情
- 游戏页
- 成就页
- 我的

后续新增：

- 成就海报页
- 通关分享页
- 投诉入口

### 创作者入口

可放在“我的”页面中，满足条件后进入 H5/后台。

页面：

- 创作者入驻申请
- 我的剧本
- 剧本收益
- 结算记录

### NPC 入口

可放在“我的”页面中，作为兼职任务入口。

页面：

- NPC 入驻申请
- 可接任务
- 我的任务
- 签到页
- 完成证明上传
- 佣金记录

## 5. 关键业务规则

### 分佣记录生成

支付成功后，如果剧本有关联创作者：

1. 读取剧本分佣规则。
2. 计算支付手续费。
3. 计算平台收入。
4. 计算创作者分佣。
5. 生成 `commission_records`。

如果剧本是平台自营：

- `creator_id` 为空。
- 创作者分佣为 0。
- 全部净收入计入平台收入。

### 结算冻结

以下情况需要冻结：

- 订单退款中
- 玩家投诉未处理
- 创作者内容违规
- NPC 任务验收未通过
- 管理员人工冻结

### NPC 佣金结算

NPC 佣金不从单笔玩家订单直接拆分，而来自平台发布 NPC 任务时设置的任务预算。

任务验收通过后：

1. `npc_assignments.status` 更新为 `completed`。
2. 生成 `npc_settlements`。
3. 进入待结算或可结算状态。
4. 结算批次打款后更新为 `settled`。

## 6. 路线引擎扩展

V1 已支持：

- `gps`
- `qa`
- `photo`
- `qr`

平台版需要预留：

- `npc`: 真人 NPC 互动节点
- `composite`: 多条件节点

NPC 节点建议配置：

```json
{
  "nodeType": "npc",
  "title": "线人交接",
  "content": "找到指定线人并说出接头暗号。",
  "lat": 29.56263,
  "lng": 106.58605,
  "radius": 80,
  "npcJobId": 10001,
  "verifyMode": "player_code",
  "answer": "山城无眠",
  "reward": {
    "badge": "最后的线人",
    "shareTitle": "我找到了山城最后的线人"
  }
}
```

验证方式：

- 玩家输入 NPC 给出的确认码
- NPC 扫描玩家二维码
- NPC 在任务端确认
- 管理员人工补录

## 7. 推荐实施顺序

### Step 1：平台数据模型草案

产物：

- `docs/sql/platform-extension.sql`
- 技术实施规划文档

状态：当前阶段。

### Step 2：后端 Prisma 模型预留

产物：

- 增加创作者、分佣、NPC 相关 Prisma model
- 暂不开放完整业务页面
- 保持 V1 API 不受影响

### Step 3：Admin 后台增加运营入口

产物：

- 创作者列表占位页
- NPC 招募任务占位页
- 分佣结算占位页

目的：

- 先把平台化信息架构放进后台导航。

### Step 4：创作者平台 MVP

产物：

- 创作者入驻
- 创作者剧本列表
- 创建剧本
- 提交审核
- 销售收益查看

### Step 5：NPC 任务 MVP

产物：

- 平台发布 NPC 任务
- NPC 报名
- 平台审核派单
- 到场签到
- 完成证明
- 佣金记录

## 8. 当前不建议立即做的内容

- 真实自动打款
- 多城市代理分账
- 复杂排行榜
- 创作者模板市场
- AI 自动生成完整剧情
- AR 玩法
- 大规模社区功能

这些能力会显著扩大范围，建议等 V1 数据验证后再拆。
