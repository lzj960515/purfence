# Idea

## 需求描述（原文）

**标题**：增强 createScheduledTask 工具 - 支持 Slack 参数

## 功能需求

### 背景
当前 `createScheduledTask` 工具的 Slack App ID 和 Channel ID 只能从上下文中获取，无法通过参数指定。

### 新需求

#### 1. 添加可选参数
为 `createScheduledTask` 工具添加两个可选参数：
- `slackAppConfigId`: string (可选) - Slack App 配置 ID
- `slackChannelId`: string (可选) - Slack 频道 ID

#### 2. 参数优先级
```
传参参数 > 上下文参数
```

**优先级规则**：
- 如果传入了参数 → 使用传入的参数值（优先级最高）
- 如果没有传入参数 → 从上下文 (context) 中获取

#### 3. 逻辑示例

```typescript
// 伪代码
async createScheduledTask(params) {
  const { slackAppConfigId: paramSlackAppId, slackChannelId: paramChannelId } = params;
  
  // 优先使用传入的参数，如果没有则从上下文获取
  const slackAppConfigId = paramSlackAppId || context.get('slackAppConfigId');
  const slackChannelId = paramChannelId || context.get('slackChannelId');
  
  // 创建定时任务
  return this.scheduledTaskService.create({
    ...params,
    slackAppConfigId,
    slackChannelId,
  });
}
```

---

## 实现要点

### 1. 修改工具参数定义
```typescript
@Tool({
  name: 'createScheduledTask',
  description: '创建定时任务',
  parameters: z.object({
    name: z.string(),
    prompt: z.string(),
    kind: z.enum(['one_time', 'recurring']),
    runAt: z.string().optional(),
    cronExpr: z.string().optional(),
    // 新增参数
    slackAppConfigId: z.string().optional(),
    slackChannelId: z.string().optional(),
  }),
})
```

### 2. 参数合并逻辑
```typescript
async createScheduledTask(params: CreateScheduledTaskParams, options: ToolExecuteOptions) {
  const { slackAppConfigId: paramAppId, slackChannelId: paramChannelId, ...rest } = params;
  
  // 从上下文获取（作为后备）
  const contextAppId = options.context.get('slackAppConfigId');
  const contextChannelId = options.context.get('slackChannelId');
  
  // 参数优先级：传入参数 > 上下文
  const slackAppConfigId = paramAppId ?? contextAppId;
  const slackChannelId = paramChannelId ?? contextChannelId;
  
  // 创建任务
  return this.service.create({
    ...rest,
    slackAppConfigId,
    slackChannelId,
  });
}
```

### 3. 文档更新
更新工具的 description，说明：
- 这两个参数是可选的
- 如果不提供，会从上下文中获取
- 提供参数会覆盖上下文的值

---

## 涉及的文件

### 后端
- `backend/src/purfence/tools/purfence.tools.ts` - createScheduledTask 工具定义
- `backend/src/purfence/scheduled-task/purfence-scheduled-task.service.ts` - 服务层（可能需要调整）

### 前端
- 无需修改（工具调用自动支持新参数）

---

## 验收标准

- ✅ createScheduledTask 工具支持 slackAppConfigId 参数
- ✅ createScheduledTask 工具支持 slackChannelId 参数
- ✅ 两个参数都是可选的
- ✅ 传入参数时，使用传入的值
- ✅ 不传入参数时，从上下文获取
- ✅ 传入参数的优先级高于上下文
- ✅ 工具描述更新，说明参数用法
- ✅ 不影响现有功能（向后兼容）

---

## 优先级

**P1（中优先级）** - 增强功能灵活性

---

## 使用示例

### 示例 1：使用传入参数
```typescript
createScheduledTask({
  name: '每日提醒',
  prompt: '发送每日提醒',
  kind: 'recurring',
  cronExpr: '0 9 * * *',
  slackAppConfigId: 'app-123',  // 使用这个
  slackChannelId: 'C123456',     // 使用这个
});
```

### 示例 2：使用上下文参数
```typescript
// 上下文中有 slackAppConfigId 和 slackChannelId
createScheduledTask({
  name: '每日提醒',
  prompt: '发送每日提醒',
  kind: 'recurring',
  cronExpr: '0 9 * * *',
  // 不传参数，使用上下文的值
});
```

### 示例 3：混合使用
```typescript
// 上下文中有 slackAppConfigId
createScheduledTask({
  name: '每日提醒',
  prompt: '发送每日提醒',
  kind: 'recurring',
  cronExpr: '0 9 * * *',
  slackChannelId: 'C654321',  // 使用传入的频道
  // slackAppConfigId 使用上下文的值
});
```

---

## 技术要点

1. **参数可选性**: 使用 `z.string().optional()` 定义
2. **空值合并**: 使用 `??` 运算符处理 undefined/null
3. **向后兼容**: 不传参数时行为与之前一致
4. **类型安全**: TypeScript 类型定义完整
