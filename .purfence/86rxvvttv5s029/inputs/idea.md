# Idea

## 需求描述（原文）

**标题**：修复 Slack 私信并发会话功能 Bug

## Bug 描述

Slack 私信并发会话功能存在 3 个核心 Bug：

### Bug 1: 会话创建逻辑错误
- ❌ **当前**：始终创建新会话，不管是否在处理中
- ✅ **应该**：只有 `isProcessing=true` 时才创建新会话

### Bug 2: conversationId 赋值错误
- ❌ **当前**：用 `event.ts`（当前消息ts）
- ✅ **应该**：用 `event.thread_ts ?? event.ts`（线程标识）

### Bug 3: pre-reply 提示错误
- ❌ **当前**：始终发送"当前使用新会话中"
- ✅ **应该**：只在 `isProcessing=true` 时发送

---

## 问题代码位置

**文件**: `backend/src/purfence/app-config/slack-runtime.service.ts`

**第 213-229 行**:
```typescript
// ❌ 错误：始终用当前消息 ts
const conversationId = event.ts;
const threadTs = event.thread_ts ?? event.ts;

// ❌ 错误：直接判断是否存在会话就返回
if (this.activeSessions.has(conversationId)) {
  return;
}
```

**第 248-258 行**:
```typescript
// ❌ 错误：不论是否在处理中都发送
await app.client.chat.postMessage({
  channel: event.channel,
  text: '当前使用新会话中',
  thread_ts: threadTs,
});
```

---

## 修复方案

### 核心逻辑
```typescript
// ✅ 正确的 conversationId 逻辑
const conversationId = event.thread_ts ?? event.ts;
const threadTs = event.thread_ts ?? event.ts;

// ✅ 检查该线程是否正在处理中
const isProcessing = this.activeSessions.has(conversationId);

if (isProcessing) {
  // ✅ 正在处理中，创建新会话
  const newConversationId = `${conversationId}-${Date.now()}`;
  
  // ✅ 只有此时才发送提示
  await app.client.chat.postMessage({
    channel: event.channel,
    text: '当前使用新会话中',
    thread_ts: threadTs,
  });
  
  // 使用 newConversationId 创建会话并处理...
} else {
  // ✅ 没有正在处理，使用原有 conversationId
  // 不发送 pre-reply
  // 使用 conversationId 创建会话并处理...
}
```

---

## 预期行为

| 场景 | conversationId | 是否发送提示 |
|------|---------------|-------------|
| 第一条消息 | `ts` | ❌ 否 |
| 线程后续消息（无处理中） | `thread_ts` | ❌ 否 |
| 线程后续消息（正在处理中） | `thread_ts-{timestamp}` | ✅ 是 |

---

## 验收标准

- ✅ 第一条消息：使用 ts 作为 conversationId，不发送提示
- ✅ 线程后续消息（无处理中）：使用 thread_ts，不发送提示
- ✅ 线程后续消息（正在处理中）：创建新会话，发送提示
- ✅ 多个线程可以并发处理
- ✅ 每个线程内的对话上下文独立

---

## 优先级

**P0（高优先级）** - 核心功能Bug，影响用户体验
