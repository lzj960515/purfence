# Idea

## 需求描述（原文）

**标题**：修复 voltagent 2.6.0 升级导致的 ReadableStream 锁定错误

## Bug 描述

升级 voltagent 框架到 2.6.0 后，给 AI 发送消息时报错：
```
Invalid state: ReadableStream is locked
```

## 复现步骤
1. 启动 Purfence v0.2.10 或更高版本
2. 向 AI 发送任何消息
3. 立即报错，无法正常工作

## 问题原因

### 版本变更
- **升级前**: @voltagent/core 2.3.1 (正常工作)
- **升级后**: @voltagent/core 2.6.0 (报错)

### 错误分析
voltagent 2.3.1 → 2.6.0 的升级可能包含以下 breaking changes：
1. `streamText()` 返回的 `response.fullStream` 流处理机制变更
2. 底层 `ai` SDK 升级导致流消费方式改变
3. 对同一个流的多次消费限制更严格

### 问题代码位置
```typescript
// backend/libs/my-agent/src/my-agent.service.ts
async createStream(...) {
  const response = await myAgent
    .getAgent()
    .streamText(_message, generationOptions);
  return this.createErrorThrowingStream(response.fullStream); // ← 这里可能有问题
}
```

## 修复方案

### 方案 1: 降级到稳定版本（推荐）
降级回 2.3.1 版本，这是已知稳定的版本：
```bash
npm install @voltagent/core@2.3.1 @voltagent/server-hono@2.0.4
```

### 方案 2: 升级到 2.6.1（如果已修复）
检查 voltagent 2.6.1 是否已修复此问题：
```bash
npm install @voltagent/core@2.6.1
```

### 方案 3: 修改流处理方式（如果必须保留 2.6.0）
如果必须使用 2.6.0，需要修改流消费方式：
```typescript
async createStream(...) {
  const response = await myAgent
    .getAgent()
    .streamText(_message, generationOptions);
  
  // 先消费完流，再返回
  const streamParts = [];
  for await (const chunk of response.fullStream) {
    streamParts.push(chunk);
  }
  
  // 返回新的异步迭代器
  return this.createErrorThrowingStream(streamParts);
}
```

## 建议修复步骤

1. **先降级到 2.3.1** 验证问题是否消失
2. **如果降级后正常**，说明确实是 2.6.0 的问题
3. **尝试升级到 2.6.1** 看是否已修复
4. **如果都不行**，保持在 2.3.1 稳定版本

## 涉及的文件

- `package.json`
- `package-lock.json`
- 可能需要修改：`backend/libs/my-agent/src/my-agent.service.ts`

## 验收标准

- [ ] 降级/修复后 AI 消息可以正常发送
- [ ] 不再出现 "ReadableStream is locked" 错误
- [ ] 流式响应正常工作
- [ ] 其他功能不受影响

## 优先级

**P0（紧急）** - 核心功能完全不可用
