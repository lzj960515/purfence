# Idea

## 需求描述（原文）

**标题**：添加 Slack 消息推送功能

## 功能需求

### 背景
需要在多个场景下自动将 AI 对话的最后一条消息推送到 Slack 频道，包括：
1. 定时任务完成时
2. 项目 Issue 完成时
3. 评估流程完成时

### 核心机制

#### 1. 事件触发机制
当某个任务完成时：
- 创建新的 AI 对话并传入上下文
- 上下文中包含事件信息（Event）
- 事件包含：Slack App ID、Channel ID
- 事件触发后，取该对话的最后一条消息
- 发送到指定的 Slack 频道

#### 2. 定时任务（Scheduled Task）
**新增字段**：
- `slackAppId`: string - Slack App ID
- `slackChannelId`: string - Slack Channel ID

**流程**：
1. 定时任务触发 → 创建新 AI 对话
2. 传入上下文（包含 Event）
3. AI 对话完成 → 触发事件
4. 取最后一条消息
5. 发送到 Slack 频道（使用 slackAppId 和 slackChannelId）

#### 3. 项目（Project）
**新增字段**：
- `slackAppId`: string - Slack App ID
- `slackChannelId`: string - Slack Channel ID

**Issue 完成流程**：
1. Issue 完成 → 触发事件
2. 使用项目的 slackAppId 和 slackChannelId
3. 取该 Issue 对话的最后一条消息
4. 发送到 Slack 频道

#### 4. 评估流程（Evaluation）
**流程**：
1. 评估完成 → 触发事件
2. **复用定时任务的事件机制**
3. 上下文传入对应的 App ID 和 Channel ID
4. 取评估对话的最后一条消息
5. 发送到 Slack 频道

### 数据模型变更

#### ScheduledTask 表
```sql
ALTER TABLE tbl_scheduled_task 
ADD COLUMN slackAppId VARCHAR(255),
ADD COLUMN slackChannelId VARCHAR(255);
```

#### PurfenceProject 表
```sql
ALTER TABLE tbl_purfence_project 
ADD COLUMN slackAppId VARCHAR(255),
ADD COLUMN slackChannelId VARCHAR(255);
```

### API 变更

#### 1. 更新 createScheduledTask
```typescript
{
  name: string;
  prompt: string;
  kind: "one_time" | "recurring";
  runAt?: string;
  cronExpr?: string;
  slackAppId?: string;        // 新增
  slackChannelId?: string;    // 新增
}
```

#### 2. 更新 updateProject
```typescript
{
  projectId: string;
  name?: string;
  description?: string;
  slackAppId?: string;        // 新增
  slackChannelId?: string;    // 新增
}
```

#### 3. 紫微工具变更
**updateProject 工具**需要支持：
- 添加 `slackAppId` 参数
- 添加 `slackChannelId` 参数
- AI 可以通过工具直接修改这些配置

### 事件系统设计

#### Event Payload
```typescript
interface SlackNotificationEvent {
  type: 'slack_notification';
  appId: string;
  channelId: string;
  conversationId: string;  // AI 对话 ID
  trigger: 'scheduled_task' | 'issue_completion' | 'evaluation';
}
```

#### 事件处理流程
1. 任务完成 → 创建事件
2. 事件处理器：
   - 获取对话最后一条消息
   - 调用 Slack API 发送消息
   - 记录发送状态

### Slack 集成

#### 消息格式
```json
{
  "channel": "CHANNEL_ID",
  "text": "消息内容",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*[Purfence]* 任务完成通知"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "消息内容..."
      }
    }
  ]
}
```

#### Slack API 调用
```typescript
POST https://slack.com/api/chat.postMessage
Headers: {
  Authorization: Bearer xoxb-xxx,
  Content-Type: application/json
}
Body: { channel, text, blocks }
```

### 验收标准

- ✅ 定时任务可以配置 Slack App ID 和 Channel ID
- ✅ 定时任务完成后自动发送最后一条消息到 Slack
- ✅ 项目可以配置 Slack App ID 和 Channel ID
- ✅ 项目 Issue 完成后自动发送最后一条消息到 Slack
- ✅ 评估完成后自动发送最后一条消息到 Slack
- ✅ updateProject 工具支持修改 Slack 配置
- ✅ 事件系统正确触发和处理
- ✅ Slack 消息发送成功并有日志记录
- ✅ 支持消息格式化（使用 Block Kit）
- ✅ 错误处理完善（网络错误、API 错误等）

### 技术要点

1. **事件复用**：评估流程直接复用定时任务的事件机制
2. **上下文传递**：通过上下文传递 App ID 和 Channel ID
3. **消息提取**：从 AI 对话中获取最后一条消息
4. **错误处理**：Slack API 调用失败时的重试和日志
5. **权限验证**：确保 Slack App 有权限发送消息到指定频道

### 优先级

**P0（高优先级）**：核心功能，影响团队协作和通知机制

### 相关模块

- backend: 
  - scheduled-task.entity.ts
  - purfence-project.entity.ts
  - slack.service.ts (新增)
  - event-handler.service.ts
  - tools/purfence.tools.ts
- frontend:
  - 定时任务配置页面
  - 项目设置页面
