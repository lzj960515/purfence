# Idea

## 需求描述（原文）

**标题**：Claude SDK conversation not found 自动重试

## 问题描述

Claude SDK 执行时出现错误：

```
[Nest] 56891  - 03/01/2026, 8:22:36 AM   ERROR [ClaudeAgentSdkService] [claude-agent-sdk] No conversation found with session ID: 1c8a6a9e-cd67-4d64-a8ee-160a42d6fed7
```

## 需求

### 1. 自动重试
当出现 "No conversation found" 错误时：
- 生成新的 conversationId
- 更新 execution 的 conversationId
- 使用新 conversationId 重试任务

### 2. 错误信息记录
- 目前错误只是在 logger 中打印
- 需要将错误信息添加到返回的结果中
- 包括：错误详情、是否重试、重试是否成功

## 验收标准

- [ ] "No conversation found" 错误时自动重试
- [ ] execution 的 conversationId 被更新
- [ ] 错误信息在返回结果中（不只是日志）
- [ ] 标记是否重试成功

## 优先级

**P0**
