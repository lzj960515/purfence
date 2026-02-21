# Idea

## 需求描述（原文）

**标题**：优化 Slack 私信处理逻辑 - 支持并发多会话

## 功能需求

### 背景
当前 Slack 私信处理逻辑：如果正在处理中，会提示"正在处理"并拒绝新消息。

### 新需求

#### 1. 不拒绝，创建新会话
- 当正在处理中时，**不拒绝**新消息
- 为每条新消息创建**独立的会话**
- 使用消息的 **ts (timestamp)** 作为 **conversationId**

#### 2. Thread 回复机制
- 所有 AI 回复都作为 **thread reply**
- 使用 Slack 的 `thread_ts` 参数
- 所有回复跟在原消息后面

#### 3. 预先自动回复
- 在 AI 回复之前，先自动回复一条消息
- 消息内容：`"当前使用新会话中"`
- 这条消息也要在同一个 thread 里

---

## 实现要点

### 1. 会话管理
```typescript
// 之前
if (isProcessing) {
  return "正在处理中，请稍后...";
}

// 现在
if (isProcessing) {
  // 创建新会话
  const conversationId = messageTs; // 使用消息 ts 作为会话 ID
  // 处理新消息
}
```

### 2. Thread 回复
```typescript
// Slack API 调用时添加 thread_ts
await client.chat.postMessage({
  channel,
  text: "当前使用新会话中",
  thread_ts: messageTs, // 回复在 thread 里
});
```

### 3. 流程示意
```
用户消息 (ts: 1234567890.123456)
  ↓
检查正在处理中？
  ├─ 否 → 使用现有会话
  └─ 是 → 创建新会话
           conversationId = ts (1234567890.123456)
           ↓
         自动回复："当前使用新会话中" (thread_ts: ts)
           ↓
         AI 处理
           ↓
         AI 回复 (thread_ts: ts)
```

---

## 涉及的文件

### 后端
- `backend/src/purfence/app-config/slack-socket.service.ts` - Slack Socket Mode 处理
- `backend/src/purfence/app-config/slack-runtime.service.ts` - Slack 运行时
- 可能需要新的会话管理逻辑

### 核心改动
1. **移除"正在处理"的拒绝逻辑**
2. **支持多个并发会话**
3. **Thread 回复机制**（添加 `thread_ts` 参数）
4. **预先自动回复**（在 AI 回复前发送提示）

---

## 验收标准

- ✅ 正在处理中时，不拒绝新消息
- ✅ 每条新消息创建独立会话（conversationId = ts）
- ✅ 所有回复都在 thread 里（使用 thread_ts）
- ✅ AI 回复前，先自动回复"当前使用新会话中"
- ✅ 多个会话可以并发处理，互不影响
- ✅ 每个 thread 的对话上下文独立
- ✅ 不影响现有单会话的功能

---

## 优先级

**P0（高优先级）** - 提升用户体验，支持并发对话

---

## 技术要点

1. **Slack Thread 机制**
   - `thread_ts` 参数用于 thread 回复
   - thread 中的消息共享同一个 `thread_ts`

2. **会话隔离**
   - 不同 conversationId 的上下文完全独立
   - 使用 Memory 系统的按 conversationId 存储机制

3. **并发处理**
   - 使用 Map 或类似结构管理多个处理中的会话
   - 每个会话有独立的处理状态

---

## 相关文档

- Slack API: https://api.slack.com/methods/chat.postMessage
- Thread messaging: https://api.slack.com/docs/message-threading
