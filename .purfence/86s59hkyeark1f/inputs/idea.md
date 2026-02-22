# Idea

## 需求描述（原文）

**标题**：修复 Slack 私信并发会话功能 Bug

## 问题描述

当前用 `activeSessions.has(conversationId)` 判断是否正在处理，但应该用 `activeChannels.has(channel)` 判断。

## 正确逻辑

### 1. 存储结构
用 `Set<string>` 存储正在处理的 channel：
```typescript
private activeChannels = new Set<string>();
```

### 2. 判断和处理逻辑
```typescript
const isChannelProcessing = this.activeChannels.has(event.channel);

if (!isChannelProcessing) {
  // 正常情况
  this.activeChannels.add(event.channel);
  const conversationId = event.channel; // 用 channel id
  // 处理消息...
  this.activeChannels.delete(event.channel);
} else {
  // 正在处理中
  const conversationId = event.thread_ts ?? event.ts;
  
  // 只有第一条消息才发提示
  if (!event.thread_ts) {
    await client.chat.postMessage({
      text: '当前使用新会话中',
      thread_ts: event.ts,
    });
  }
  // 处理消息...
}
```

## 关键改动

1. **移除** `activeSessions` Map
2. **改用** `activeChannels` Set
3. **判断方式**: 基于 channel 而不是 conversationId
4. **正常会话**: conversationId = channel
5. **新会话**: conversationId = thread_ts ?? ts
6. **发送提示**: 只在首条消息时发送（!thread_ts）

## 验收标准

- ✅ 同一 channel 的第一条消息正常处理（用 channel id）
- ✅ 第二条并发消息进入新会话（用 thread_ts ?? ts）
- ✅ 只在首条消息时发送提示
- ✅ 后续消息不重复发送提示
