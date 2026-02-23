# Idea

## 需求描述（原文）

**标题**：删除 Issue 完成时的 Slack 消息推送事件

## 背景

当前系统在完成 Issue（需求）时会自动发送 Slack 消息推送事件。现在需要移除这个功能。

## 需要删除的内容

### 1. 事件触发代码
找到并删除调用 `completeIssue` 或相关完成逻辑时发送 Slack 事件的代码：

```typescript
// 类似这样的代码需要删除
await eventBus.publish('issue.completed', {
  issueId: issue.id,
  projectId: issue.projectId,
  // ...
});
```

### 2. 事件监听/处理代码
找到并删除对应的事件处理逻辑：

```typescript
// 类似这样的代码需要删除
eventBus.subscribe('issue.completed', async (event) => {
  await sendSlackNotification(event);
});
```

### 3. 相关服务/工具
- 如果该事件只用于 Slack 推送，整个事件定义可以删除
- 如果还有其他用途，只删除 Slack 相关的处理逻辑

## 涉及的文件（可能）

- `backend/src/purfence/issue/issue.service.ts` - 完成 Issue 的业务逻辑
- `backend/src/purfence/slack/slack-event.handler.ts` - Slack 事件处理器
- `backend/src/purfence/event-bus/` - 事件总线相关
- 其他包含 `issue.completed` 或类似事件名的文件

## 检查清单

- [ ] 找到 Issue 完成时触发事件的代码
- [ ] 删除事件触发代码
- [ ] 找到对应的事件监听/处理代码
- [ ] 删除事件处理代码
- [ ] 检查是否还有其他地方依赖该事件
- [ ] 测试验证：完成 Issue 后不再发送 Slack 消息
- [ ] 其他功能不受影响

## 注意事项

1. **不要删除其他 Slack 功能** - 只删除 Issue 完成的事件推送
2. **保留其他事件** - 如定时任务完成、评估完成等 Slack 推送保留
3. **确保没有遗留引用** - 删除后检查是否还有代码引用该事件

## 优先级

**P1（中优先级）** - 功能调整，减少不必要的消息推送
