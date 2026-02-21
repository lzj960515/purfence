# Slack 推送功能实现总结

## 概述

本次实现为 Purfence 平台添加了 Slack 消息推送功能，支持在以下场景自动发送通知：
- 定时任务执行完成
- Issue 执行完成
- 评估任务完成

## 架构设计

### 事件驱动架构
```
[触发点] → emit(event) → [SlackRuntimeService] → [Slack API] → [Channel]
```

### 事件类型
| 事件名 | 触发时机 | 携带数据 |
|--------|----------|----------|
| `purfence.scheduled-task.stream-ended` | 定时任务完成 | taskId, slackAppConfigId, slackChannelId |
| `purfence.issue-completed.stream-ended` | Issue 完成 | issueId, projectId, slackAppConfigId, slackChannelId |
| `purfence.evaluation.stream-ended` | 评估完成 | executionId, projectId, slackAppConfigId, slackChannelId |

## 数据库变更

### PurfenceProject 表新增字段
```sql
ALTER TABLE purfence_project ADD COLUMN slackAppConfigId VARCHAR(64) NULL;
ALTER TABLE purfence_project ADD COLUMN slackChannelId VARCHAR(128) NULL;
```

### 迁移文件
- `backend/src/migrations/add-slack-fields-to-project-1740100000000.ts`

## 后端修改

### 1. Entity
**文件**: `backend/src/purfence/purfence-project.entity.ts`
```typescript
@Column({ type: 'varchar', length: 64, nullable: true })
slackAppConfigId?: string;

@Column({ type: 'varchar', length: 128, nullable: true })
slackChannelId?: string;
```

### 2. DTO
**文件**: `backend/src/purfence/purfence-project.dto.ts`
```typescript
@FilterableField({ nullable: true })
slackAppConfigId?: string;

@FilterableField({ nullable: true })
slackChannelId?: string;
```

### 3. UpdateInput
**文件**: `backend/src/purfence/purfence-project-update.input.ts`
```typescript
@MaxLength(64)
@Field({ nullable: true })
slackAppConfigId?: string;

@MaxLength(128)
@Field({ nullable: true })
slackChannelId?: string;
```

### 4. API 工具 (Zod 验证)
**文件**: `backend/src/purfence/tools/purfence.tools.ts`
```typescript
.superRefine((value, ctx) => {
  const hasAppId = value.slackAppConfigId?.trim();
  const hasChannelId = value.slackChannelId?.trim();
  if (hasAppId && !hasChannelId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'slackChannelId is required when slackAppConfigId is provided',
      path: ['slackChannelId'],
    });
  }
  if (!hasAppId && hasChannelId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'slackAppConfigId is required when slackChannelId is provided',
      path: ['slackAppConfigId'],
    });
  }
})
```

### 5. 事件触发
**文件**: `backend/src/purfence/tools/tianfu.tools.ts`
- 在 `completeIssue` 中添加事件发射逻辑
- 从项目配置获取 Slack 配置并发射事件

### 6. 事件处理
**文件**: `backend/src/purfence/app-config/slack-runtime.service.ts`
- 添加 `purfence.issue-completed.stream-ended` 事件处理器
- 添加 `purfence.evaluation.stream-ended` 事件处理器
- 复用现有的 Slack 消息发送逻辑

## 前端修改

### 1. 项目详情页
**文件**: `frontend/src/pages/ProjectDetailPage.tsx`
- 新增 Slack 配置卡片
- 支持编辑和查看两种模式
- 下拉选择 Slack App
- 手动输入 Channel ID
- 表单验证（两个参数必须同时配置或同时为空）

### 2. 定时任务设置页
**文件**: `frontend/src/pages/ScheduledTaskSettingsPage.tsx`
- 修复验证逻辑（从必填改为可选）
- 添加帮助文本

### 3. GraphQL API
**文件**: `frontend/src/api/purfence.graphql.ts`
- 新增 `UPDATE_ONE_PURFENCE_PROJECT_MUTATION`
- 更新查询包含 `slackAppConfigId` 和 `slackChannelId`

## 验证规则

### 后端验证
- `slackAppConfigId`: 最大长度 64，可选
- `slackChannelId`: 最大长度 128，可选
- 交叉验证：两个参数必须同时配置或同时为空

### 前端验证
- 与后端保持一致
- 提供用户友好的错误提示

## 依赖项

### 已存在的基础设施
- `SlackRuntimeService`: Slack 消息发送服务
- `PurfenceSlackService`: Slack API 封装
- `CommonService.emit`: 事件发射机制
- `@OnEvent` 装饰器: 事件监听

### Slack App 配置
- 通过 AppConfig 管理 Slack App 凭证
- 支持 Bot Token 方式认证
- 需要 `chat:write` 权限

## 使用方式

### 配置项目 Slack 通知
1. 进入项目详情页
2. 点击 Slack 配置卡片的编辑按钮
3. 选择已配置的 Slack App
4. 输入目标 Channel ID
5. 保存配置

### 获取 Channel ID
- 在 Slack 频道右键选择「复制链接」
- 从链接中提取 Channel ID（格式如 `C0123456789`）

## 注意事项

1. **安全性**: 敏感信息不会记录到日志
2. **错误处理**: Slack 发送失败不会阻塞主流程
3. **幂等性**: 每次事件触发只发送一条消息
4. **可扩展性**: 事件驱动架构便于添加新的通知场景
