# Idea

## 需求描述（原文）

**标题**：修复 Slack 消息 thread_ts 使用逻辑

## Bug 描述

当前不管什么情况都传了 `thread_ts` 参数，导致所有消息都变成了 thread reply，消息都缩在消息列里。

## 正确逻辑

### 情况 1：正常使用 channel id 时
- **条件**：`!isChannelProcessing`（没有正在处理）
- **conversationId**：`channel`
- **Slack API 调用**：**不传** `thread_ts`
- **效果**：消息发到频道主线程

### 情况 2：正在处理中（新会话）时
- **条件**：`isChannelProcessing`（正在处理）
- **conversationId**：`thread_ts ?? ts`
- **Slack API 调用**：**传** `thread_ts`
- **效果**：消息发到 thread 里

## 代码示例

```typescript
// 当前（错误）：总是传 thread_ts
await client.chat.postMessage({
  channel,
  text,
  thread_ts: threadTs,  // ❌ 总是传
});

// 修复后（正确）：根据情况决定是否传
if (isChannelProcessing) {
  // 新会话 - 发到 thread
  await client.chat.postMessage({
    channel,
    text,
    thread_ts: threadTs,  // ✅ 传 thread_ts
  });
} else {
  // 正常 - 发到主线程
  await client.chat.postMessage({
    channel,
    text,
    // ❌ 不传 thread_ts
  });
}
```

## 验收标准

- ✅ 正常使用 channel id 时，消息发到频道主线程（不传 thread_ts）
- ✅ 正在处理中创建新会话时，消息发到 thread 里（传 thread_ts）
- ✅ 两种情况的消息都能正常显示，不缩在消息列里

## 优先级

**P0（高优先级）** - 影响用户体验，消息显示不正常
